import os
import secrets
from pathlib import Path
from datetime import timedelta

from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required,
    get_jwt_identity, get_jwt
)
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

# Load local environment variables from backend/.env when present.
load_dotenv(Path(__file__).parent / ".env")

import ml_engine
from database import init_db, get_db

app = Flask(__name__)

# ── Configuration ────────────────────────────────────────────────────────────
app.config["JWT_SECRET_KEY"] = os.environ.get(
    "JWT_SECRET_KEY", secrets.token_hex(32)
)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)
app.config["JWT_TOKEN_LOCATION"] = ["headers"]

CORS(app, origins=[
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:5174", "http://127.0.0.1:5174",
], supports_credentials=True)
jwt = JWTManager(app)


# ── Startup ──────────────────────────────────────────────────────────────────
with app.app_context():
    init_db()
    try:
        ml_engine.load_on_startup()
        print("[APP] ML model loaded successfully.")
    except Exception as e:
        print(f"[APP] WARNING: ML model failed to load: {e}")


# ── Helper: eligibility rules ────────────────────────────────────────────────
def compute_eligibility(attendance, internal_total, assignment_total):
    result = {}

    # Attendance
    if attendance is None:
        result["attendance_status"] = "unknown"
        result["attendance_eligible"] = None
    elif attendance < 60:
        result["attendance_status"] = "not_eligible"
        result["attendance_eligible"] = False
    elif attendance < 75:
        result["attendance_status"] = "eligible_fine"
        result["attendance_eligible"] = True
    else:
        result["attendance_status"] = "eligible_no_fine"
        result["attendance_eligible"] = True

    # Internal (3 exams x 25 = 75 total, min 30 required)
    if internal_total is None:
        result["internal_status"] = "unknown"
        result["internal_eligible"] = None
        result["internal_pass"] = None
    else:
        int_ok = float(internal_total) >= 30.0
        result["internal_eligible"] = int_ok
        result["internal_pass"] = int_ok
        result["internal_status"] = "pass" if int_ok else "fail"

    # Assignment (2 x 10 = 20 total, min 12 combined required)
    if assignment_total is None:
        result["assignment_status"] = "unknown"
        result["assignment_eligible"] = None
        result["assignment_pass"] = None
    else:
        ass_ok = float(assignment_total) >= 12.0
        result["assignment_eligible"] = ass_ok
        result["assignment_pass"] = ass_ok
        result["assignment_status"] = "pass" if ass_ok else "fail"

    # Overall SEE Eligibility (Attendance >= 60%, Internals >= 30, Assignments >= 12)
    eligibles = [result.get("attendance_eligible"), result.get("internal_eligible"),
                 result.get("assignment_eligible")]
    if None in eligibles:
        result["overall_eligible"] = None
        result["is_eligible"] = None
    else:
        overall = all(eligibles)
        result["overall_eligible"] = overall
        result["is_eligible"] = overall

    # SEE Exam Specific Details
    result["see_rules"] = {
        "attendance_eligible": result["attendance_eligible"],
        "internal_eligible": result["internal_eligible"],
        "assignment_eligible": result["assignment_eligible"],
        "overall_eligible": result["overall_eligible"],
        "exam_marks": 80,
        "scaled_marks": 100,
        "passing_marks": 34,
        "passing_rule": "Written 80 marks scaled to 100. Minimum 34/100 required to pass."
    }

    return result


# ═══════════════════════════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.route("/api/auth/login", methods=["POST"])
def login():
    try:
        data = request.get_json(silent=True) or {}
        user_id_val = (data.get("user_id") or data.get("username") or "").strip()
        password = data.get("password") or ""
        expected_role = data.get("role")  # 'student' | 'faculty' from active portal tab

        if not user_id_val or not password:
            return jsonify({"error": "credentials_required"}), 400

        db = get_db()
        # Look up by username (Aadhaar or faculty username), student_id (USN), or email (case-insensitive)
        user = db.execute("""
            SELECT u.*, sp.student_id as usn
            FROM users u
            LEFT JOIN student_profiles sp ON sp.user_id = u.id
            WHERE LOWER(u.username) = LOWER(?) OR LOWER(sp.student_id) = LOWER(?) OR LOWER(u.email) = LOWER(?)
        """, (user_id_val, user_id_val, user_id_val)).fetchone()
        db.close()

        if not user or not check_password_hash(user["password_hash"], password):
            return jsonify({"error": "invalid_credentials"}), 401

        # Strict portal validation: prevent cross-portal login glitch without leaking role details
        if expected_role and user["role"] != expected_role:
            return jsonify({
                "error": "invalid_credentials",
                "message": "Invalid login credentials for the selected portal. Please verify your credentials or select the appropriate portal tab."
            }), 401

        additional_claims = {
            "role": user["role"],
            "full_name": user["full_name"],
            "user_id": user["username"],
        }
        token = create_access_token(
            identity=str(user["id"]),
            additional_claims=additional_claims
        )
        return jsonify({
            "token": token,
            "role": user["role"],
            "full_name": user["full_name"],
            "user_id": user["username"],
            "usn": user["usn"] if "usn" in user.keys() else None,
            "id": user["id"]
        }), 200

    except Exception:
        return jsonify({"error": "server_error"}), 500


@app.route("/api/auth/register-faculty", methods=["POST"])
def register_faculty():
    """Create a faculty account using User ID (Aadhaar Number)."""
    try:
        data = request.get_json(silent=True) or {}
        user_id_val = (data.get("user_id") or data.get("username") or "").strip()
        password = data.get("password") or ""
        full_name = (data.get("full_name") or "").strip()
        email = (data.get("email") or "").strip()

        if not all([user_id_val, password, full_name, email]):
            return jsonify({"error": "all_fields_required"}), 400

        if len(password) < 6:
            return jsonify({"error": "password_too_short"}), 400

        pw_hash = generate_password_hash(password)
        db = get_db()
        try:
            db.execute(
                "INSERT INTO users (username, password_hash, role, full_name, email) VALUES (?,?,?,?,?)",
                (user_id_val, pw_hash, "faculty", full_name, email)
            )
            db.commit()
        except Exception:
            db.close()
            return jsonify({"error": "username_or_email_taken", "message": "This username or email is already registered."}), 409
        db.close()
        return jsonify({"message": "Faculty account created"}), 201

    except Exception:
        return jsonify({"error": "server_error"}), 500


@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def get_me():
    try:
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        db = get_db()
        user = db.execute("SELECT id, username, role, full_name, email FROM users WHERE id=?",
                          (user_id,)).fetchone()
        db.close()
        if not user:
            return jsonify({"error": "not_found"}), 404
        return jsonify(dict(user)), 200
    except Exception:
        return jsonify({"error": "server_error"}), 500


# ═══════════════════════════════════════════════════════════════════════════
# FACULTY ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

def require_faculty():
    claims = get_jwt()
    if claims.get("role") != "faculty":
        return jsonify({"error": "forbidden"}), 403
    return None


@app.route("/api/faculty/students", methods=["GET"])
@jwt_required()
def list_students():
    err = require_faculty()
    if err:
        return err
    try:
        faculty_id = int(get_jwt_identity())
        search = request.args.get("search", "").strip()
        db = get_db()
        if search:
            rows = db.execute("""
                SELECT u.id as user_id, u.full_name, u.email, u.username,
                       sp.id as profile_id, sp.student_id, sp.department, sp.semester, sp.academic_year,
                       ar.attendance, ar.internal_total, ar.assignment_total,
                       ar.study_hours, ar.previous_performance
                FROM users u
                JOIN student_profiles sp ON sp.user_id = u.id
                LEFT JOIN academic_records ar ON ar.student_profile_id = sp.id
                WHERE u.role='student'
                  AND sp.created_by_faculty_id = ?
                  AND (u.full_name LIKE ? OR sp.student_id LIKE ? OR u.email LIKE ?)
                ORDER BY sp.student_id
            """, (faculty_id, f"%{search}%", f"%{search}%", f"%{search}%")).fetchall()
        else:
            rows = db.execute("""
                SELECT u.id as user_id, u.full_name, u.email, u.username,
                       sp.id as profile_id, sp.student_id, sp.department, sp.semester, sp.academic_year,
                       ar.attendance, ar.internal_total, ar.assignment_total,
                       ar.study_hours, ar.previous_performance
                FROM users u
                JOIN student_profiles sp ON sp.user_id = u.id
                LEFT JOIN academic_records ar ON ar.student_profile_id = sp.id
                WHERE u.role='student'
                  AND sp.created_by_faculty_id = ?
                ORDER BY sp.student_id
            """, (faculty_id,)).fetchall()
        db.close()

        students = []
        for r in rows:
            s = dict(r)
            el = compute_eligibility(s.get("attendance"), s.get("internal_total"), s.get("assignment_total"))
            s.update(el)
            students.append(s)

        return jsonify({"students": students}), 200
    except Exception as e:
        return jsonify({"error": "server_error"}), 500


@app.route("/api/faculty/students", methods=["POST"])
@jwt_required()
def add_student():
    err = require_faculty()
    if err:
        return err
    try:
        faculty_id = int(get_jwt_identity())
        data = request.get_json(silent=True) or {}

        # Required fields (user_id represents Aadhaar Number)
        user_id_val = (data.get("user_id") or data.get("username") or "").strip()
        password = data.get("password") or ""
        full_name = (data.get("full_name") or "").strip()
        email = (data.get("email") or "").strip()
        student_id = (data.get("student_id") or "").strip()
        department = (data.get("department") or "").strip()
        semester = data.get("semester")
        academic_year = (data.get("academic_year") or "").strip()
        phone = (data.get("phone") or "").strip()

        if not all([user_id_val, password, full_name, email, student_id]):
            return jsonify({"error": "required_fields_missing",
                            "message": "User ID (Aadhaar Number), password, full_name, email, and student_id are required"}), 400
        if len(password) < 6:
            return jsonify({"error": "password_too_short"}), 400

        db = get_db()

        # Check specifically which field conflicts
        conflict_u = db.execute("SELECT username, email FROM users WHERE username = ? OR email = ?", (user_id_val, email)).fetchone()
        if conflict_u:
            if conflict_u["username"] == user_id_val:
                db.close()
                return jsonify({"error": "userid_taken", "message": f"This User ID / Aadhaar Number ({user_id_val}) is already registered."}), 409
            if conflict_u["email"] == email:
                db.close()
                return jsonify({"error": "email_taken", "message": f"This Email address ({email}) is already registered."}), 409

        conflict_sp = db.execute("SELECT student_id FROM student_profiles WHERE student_id = ?", (student_id,)).fetchone()
        if conflict_sp:
            db.close()
            return jsonify({"error": "student_id_taken", "message": f"This Student ID / USN ({student_id}) is already registered."}), 409

        pw_hash = generate_password_hash(password)
        try:
            cur = db.execute(
                "INSERT INTO users (username, password_hash, role, full_name, email) VALUES (?,?,?,?,?)",
                (user_id_val, pw_hash, "student", full_name, email)
            )
            new_user_id = cur.lastrowid
            sp_cur = db.execute(
                """INSERT INTO student_profiles
                   (user_id, student_id, department, semester, academic_year, phone, created_by_faculty_id)
                   VALUES (?,?,?,?,?,?,?)""",
                (new_user_id, student_id, department, semester, academic_year, phone, faculty_id)
            )
            new_profile_id = sp_cur.lastrowid
            db.commit()
        except sqlite3.IntegrityError as ie:
            db.rollback()
            db.close()
            err_msg = str(ie).lower()
            if "username" in err_msg:
                return jsonify({"error": "userid_taken", "message": f"This User ID / Aadhaar Number ({user_id_val}) is already registered."}), 409
            elif "email" in err_msg:
                return jsonify({"error": "email_taken", "message": f"This Email address ({email}) is already registered."}), 409
            elif "student_id" in err_msg:
                return jsonify({"error": "student_id_taken", "message": f"This Student ID / USN ({student_id}) is already registered."}), 409
            else:
                return jsonify({"error": "conflict", "message": "This User ID (Aadhaar Number), email, or student ID is already registered."}), 409
        except Exception as ex:
            db.rollback()
            db.close()
            print(f"[ERROR in add_student]: {ex}")
            return jsonify({"error": "server_error", "message": f"Failed to create student account: {str(ex)}"}), 500

        db.close()
        return jsonify({"message": "Student created successfully", "profile_id": new_profile_id}), 201
    except Exception:
        return jsonify({"error": "server_error"}), 500


@app.route("/api/faculty/students/<int:profile_id>", methods=["GET"])
@jwt_required()
def get_student_detail_faculty(profile_id):
    err = require_faculty()
    if err:
        return err
    try:
        faculty_id = int(get_jwt_identity())
        db = get_db()
        row = db.execute("""
            SELECT u.id as user_id, u.full_name, u.email, u.username,
                   sp.id as profile_id, sp.student_id, sp.department, sp.semester,
                   sp.academic_year, sp.phone,
                   ar.attendance, ar.internal_total, ar.assignment_total,
                   ar.study_hours, ar.previous_performance, ar.updated_at
            FROM users u
            JOIN student_profiles sp ON sp.user_id = u.id
            LEFT JOIN academic_records ar ON ar.student_profile_id = sp.id
            WHERE sp.id = ? AND u.role='student' AND sp.created_by_faculty_id = ?
        """, (profile_id, faculty_id)).fetchone()
        db.close()
        if not row:
            return jsonify({"error": "not_found"}), 404
        s = dict(row)
        s.update(compute_eligibility(s.get("attendance"), s.get("internal_total"), s.get("assignment_total")))
        return jsonify(s), 200
    except Exception:
        return jsonify({"error": "server_error"}), 500


@app.route("/api/faculty/students/<int:profile_id>/academic", methods=["PUT"])
@jwt_required()
def update_academic_record(profile_id):
    err = require_faculty()
    if err:
        return err
    try:
        faculty_id = int(get_jwt_identity())
        data = request.get_json(silent=True) or {}

        # Validate
        errors = {}
        def parse_float(key, min_val, max_val, label):
            val = data.get(key)
            if val is None or str(val).strip() == "":
                return None, None
            try:
                v = float(val)
                if v < min_val or v > max_val:
                    errors[key] = f"{label} must be between {min_val} and {max_val}."
                    return None, True
                return v, None
            except (ValueError, TypeError):
                errors[key] = f"{label} must be a number."
                return None, True

        attendance, e1 = parse_float("attendance", 0, 100, "Attendance")
        internal_total, e2 = parse_float("internal_total", 0, 75, "Internal Total")
        assignment_total, e3 = parse_float("assignment_total", 0, 20, "Assignment Total")
        study_hours, e4 = parse_float("study_hours", 0, 24, "Study Hours")
        previous_performance, e5 = parse_float("previous_performance", 0, 100, "Previous Performance")

        if errors:
            return jsonify({"error": "validation_error", "fields": errors}), 422

        db = get_db()
        # Check profile exists
        sp = db.execute("SELECT id FROM student_profiles WHERE id=?", (profile_id,)).fetchone()
        if not sp:
            db.close()
            return jsonify({"error": "not_found"}), 404

        existing = db.execute(
            "SELECT id FROM academic_records WHERE student_profile_id=?", (profile_id,)
        ).fetchone()

        if existing:
            db.execute("""
                UPDATE academic_records
                SET attendance=?, internal_total=?, assignment_total=?,
                    study_hours=?, previous_performance=?,
                    updated_by=?, updated_at=CURRENT_TIMESTAMP
                WHERE student_profile_id=?
            """, (attendance, internal_total, assignment_total,
                  study_hours, previous_performance, faculty_id, profile_id))
        else:
            db.execute("""
                INSERT INTO academic_records
                (student_profile_id, attendance, internal_total, assignment_total,
                 study_hours, previous_performance, updated_by)
                VALUES (?,?,?,?,?,?,?)
            """, (profile_id, attendance, internal_total, assignment_total,
                  study_hours, previous_performance, faculty_id))

        db.commit()
        db.close()
        return jsonify({"message": "Academic record updated successfully"}), 200
    except Exception:
        return jsonify({"error": "server_error"}), 500


@app.route("/api/faculty/students/<int:profile_id>", methods=["PUT"])
@jwt_required()
def update_student_profile(profile_id):
    err = require_faculty()
    if err:
        return err
    try:
        data = request.get_json(silent=True) or {}
        full_name = (data.get("full_name") or "").strip()
        department = (data.get("department") or "").strip()
        semester = data.get("semester")
        academic_year = (data.get("academic_year") or "").strip()
        phone = (data.get("phone") or "").strip()

        db = get_db()
        sp = db.execute("SELECT user_id FROM student_profiles WHERE id=?", (profile_id,)).fetchone()
        if not sp:
            db.close()
            return jsonify({"error": "not_found"}), 404

        if full_name:
            db.execute("UPDATE users SET full_name=? WHERE id=?", (full_name, sp["user_id"]))
        db.execute("""
            UPDATE student_profiles
            SET department=?, semester=?, academic_year=?, phone=?
            WHERE id=?
        """, (department or None, semester or None, academic_year or None, phone or None, profile_id))
        db.commit()
        db.close()
        return jsonify({"message": "Profile updated"}), 200
    except Exception:
        return jsonify({"error": "server_error"}), 500


@app.route("/api/faculty/students/<int:profile_id>/academic", methods=["DELETE"])
@jwt_required()
def delete_student_academic_records(profile_id):
    """Deletes ONLY the academic records for a student, keeping the student account and credentials intact."""
    err = require_faculty()
    if err:
        return err
    try:
        faculty_id = int(get_jwt_identity())
        db = get_db()
        sp = db.execute(
            "SELECT id FROM student_profiles WHERE id=? AND created_by_faculty_id=?",
            (profile_id, faculty_id)
        ).fetchone()
        if not sp:
            db.close()
            return jsonify({"error": "not_found", "message": "Student not found or unauthorized."}), 404

        db.execute("DELETE FROM academic_records WHERE student_profile_id=?", (profile_id,))
        db.commit()
        db.close()
        return jsonify({"message": "Academic records cleared successfully"}), 200
    except Exception:
        return jsonify({"error": "server_error"}), 500


@app.route("/api/faculty/students/<int:profile_id>", methods=["DELETE"])
@jwt_required()
def delete_student(profile_id):
    """Deletes the ENTIRE student account (login credentials, profile, and all records)."""
    err = require_faculty()
    if err:
        return err
    try:
        faculty_id = int(get_jwt_identity())
        db = get_db()
        sp = db.execute(
            "SELECT user_id FROM student_profiles WHERE id=? AND created_by_faculty_id=?",
            (profile_id, faculty_id)
        ).fetchone()
        if not sp:
            db.close()
            return jsonify({"error": "not_found", "message": "Student not found or unauthorized."}), 404

        # Explicitly delete all associated rows across tables to avoid orphaned unique constraints
        db.execute("DELETE FROM academic_records WHERE student_profile_id=?", (profile_id,))
        db.execute("DELETE FROM student_profiles WHERE id=?", (profile_id,))
        db.execute("DELETE FROM users WHERE id=?", (sp["user_id"],))
        db.commit()
        db.close()
        return jsonify({"message": "Student account deleted successfully"}), 200
    except Exception:
        return jsonify({"error": "server_error"}), 500


@app.route("/api/faculty/predict/<int:profile_id>", methods=["GET"])
@jwt_required()
def faculty_predict_student(profile_id):
    err = require_faculty()
    if err:
        return err
    try:
        db = get_db()
        ar = db.execute("""
            SELECT ar.attendance, ar.internal_total, ar.assignment_total,
                   ar.study_hours, ar.previous_performance
            FROM academic_records ar
            WHERE ar.student_profile_id=?
        """, (profile_id,)).fetchone()
        db.close()

        if not ar:
            return jsonify({"error": "no_academic_records"}), 404

        r = dict(ar)
        if any(v is None for v in r.values()):
            return jsonify({"error": "incomplete_records"}), 422

        model_prediction, prob = ml_engine.predict(
            r["attendance"], r["internal_total"], r["assignment_total"],
            r["study_hours"], r["previous_performance"]
        )

        elig = compute_eligibility(r["attendance"], r["internal_total"], r["assignment_total"])
        college_eligible = elig.get("overall_eligible", False)

        if not college_eligible:
            final_status = "NOT ELIGIBLE"
        else:
            final_status = model_prediction  # "PASS" or "FAIL" from DL model

        return jsonify({
            "model_prediction": model_prediction,
            "model_probability": float(prob),
            "prediction": model_prediction,          # backward compat
            "probability": float(prob),              # backward compat
            "attendance_eligible": elig["attendance_eligible"],
            "internal_eligible": elig["internal_eligible"],
            "assignment_eligible": elig["assignment_eligible"],
            "college_eligible": college_eligible,
            "attendance_status": elig["attendance_status"],
            "internal_pass": elig.get("internal_pass"),
            "assignment_pass": elig.get("assignment_pass"),
            "final_status": final_status,
            "eligibility": elig
        }), 200
    except Exception:
        return jsonify({"error": "server_error"}), 500


@app.route("/api/faculty/stats", methods=["GET"])
@jwt_required()
def faculty_stats():
    err = require_faculty()
    if err:
        return err
    try:
        faculty_id = int(get_jwt_identity())
        db = get_db()
        total = db.execute(
            "SELECT COUNT(*) as c FROM student_profiles WHERE created_by_faculty_id=?",
            (faculty_id,)
        ).fetchone()["c"]
        with_records = db.execute("""
            SELECT COUNT(*) as c FROM academic_records ar
            JOIN student_profiles sp ON sp.id = ar.student_profile_id
            WHERE sp.created_by_faculty_id=? AND ar.attendance IS NOT NULL
        """, (faculty_id,)).fetchone()["c"]
        db.close()
        return jsonify({"total_students": total, "students_with_records": with_records}), 200
    except Exception:
        return jsonify({"error": "server_error"}), 500


# ═══════════════════════════════════════════════════════════════════════════
# STUDENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.route("/api/student/profile", methods=["GET"])
@jwt_required()
def student_profile():
    try:
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        if claims.get("role") != "student":
            return jsonify({"error": "forbidden"}), 403

        db = get_db()
        row = db.execute("""
            SELECT u.id as user_id, u.full_name, u.email, u.username,
                   sp.id as profile_id, sp.student_id, sp.department,
                   sp.semester, sp.academic_year, sp.phone,
                   ar.attendance, ar.internal_total, ar.assignment_total,
                   ar.study_hours, ar.previous_performance, ar.updated_at
            FROM users u
            JOIN student_profiles sp ON sp.user_id = u.id
            LEFT JOIN academic_records ar ON ar.student_profile_id = sp.id
            WHERE u.id = ?
        """, (user_id,)).fetchone()
        db.close()

        if not row:
            return jsonify({"error": "profile_not_found"}), 404

        s = dict(row)
        eligibility = compute_eligibility(s.get("attendance"), s.get("internal_total"), s.get("assignment_total"))

        # Build nested academic_records — null if attendance is null (no records added yet)
        has_records = s.get("attendance") is not None or s.get("internal_total") is not None
        academic_records = None
        if has_records:
            academic_records = {
                "attendance": s.get("attendance"),
                "internal_total": s.get("internal_total"),
                "assignment_total": s.get("assignment_total"),
                "study_hours": s.get("study_hours"),
                "previous_performance": s.get("previous_performance"),
                "updated_at": s.get("updated_at"),
            }

        profile = {
            "user_id": s.get("user_id"),
            "full_name": s.get("full_name"),
            "email": s.get("email"),
            "username": s.get("username"),
            "profile_id": s.get("profile_id"),
            "student_id": s.get("student_id"),
            "department": s.get("department"),
            "semester": s.get("semester"),
            "academic_year": s.get("academic_year"),
            "phone": s.get("phone"),
        }

        return jsonify({
            "profile": profile,
            "academic_records": academic_records,
            "eligibility": eligibility,
            # Also keep flat fields for backward compatibility
            **s,
            **eligibility,
        }), 200
    except Exception:
        return jsonify({"error": "server_error"}), 500


@app.route("/api/student/predict", methods=["GET"])
@jwt_required()
def student_predict():
    """Predict using the student's official academic records."""
    try:
        user_id = int(get_jwt_identity())
        claims = get_jwt()
        if claims.get("role") != "student":
            return jsonify({"error": "forbidden"}), 403

        db = get_db()
        ar = db.execute("""
            SELECT ar.attendance, ar.internal_total, ar.assignment_total,
                   ar.study_hours, ar.previous_performance
            FROM users u
            JOIN student_profiles sp ON sp.user_id = u.id
            JOIN academic_records ar ON ar.student_profile_id = sp.id
            WHERE u.id = ?
        """, (user_id,)).fetchone()
        db.close()

        if not ar:
            return jsonify({"error": "no_academic_records"}), 404

        r = dict(ar)
        if any(v is None for v in r.values()):
            return jsonify({"error": "incomplete_records"}), 422

        label, prob = ml_engine.predict(
            r["attendance"], r["internal_total"], r["assignment_total"],
            r["study_hours"], r["previous_performance"]
        )

        elig = compute_eligibility(r["attendance"], r["internal_total"], r["assignment_total"])
        college_eligible = elig.get("overall_eligible", False)

        if not college_eligible:
            final_status = "NOT ELIGIBLE"
        else:
            final_status = label  # "PASS" or "FAIL" from DL model

        return jsonify({
            "model_prediction": label,
            "model_probability": float(prob),
            "prediction": label,          # backward compat
            "probability": float(prob),   # backward compat
            "attendance_eligible": elig["attendance_eligible"],
            "internal_eligible": elig["internal_eligible"],
            "assignment_eligible": elig["assignment_eligible"],
            "college_eligible": college_eligible,
            "attendance_status": elig["attendance_status"],
            "internal_pass": elig.get("internal_pass"),
            "assignment_pass": elig.get("assignment_pass"),
            "final_status": final_status,
            "eligibility": elig
        }), 200
    except Exception:
        return jsonify({"error": "server_error"}), 500


# ═══════════════════════════════════════════════════════════════════════════
# SHARED PREDICT ENDPOINT (What-If)
# ═══════════════════════════════════════════════════════════════════════════

@app.route("/api/predict", methods=["POST"])
@jwt_required()
def predict_whatif():
    """What-If prediction — does NOT modify any academic records."""
    try:
        data = request.get_json(silent=True) or {}

        errors = {}

        def parse_field(key, min_val, max_val, label, required=True):
            val = data.get(key)
            if val is None or str(val).strip() == "":
                if required:
                    errors[key] = f"{label} is required."
                return None
            try:
                v = float(val)
            except (ValueError, TypeError):
                errors[key] = f"{label} must be a number."
                return None
            if v < min_val or v > max_val:
                errors[key] = f"{label} must be between {min_val} and {max_val}."
                return None
            return v

        attendance = parse_field("Attendance", 0, 100, "Attendance must be between 0% and 100%.")
        internal_total = parse_field("Internal_Total", 0, 75, "Internal marks cannot exceed 75.")
        assignment_total = parse_field("Assignment_Total", 0, 20, "Assignment marks cannot exceed 20.")
        study_hours = parse_field("Study_Hours", 0, 24, "Study Hours must be between 0 and 24.")
        previous_performance = parse_field("Previous_Performance", 0, 100, "Previous Performance must be between 0 and 100.")

        if errors:
            return jsonify({"error": "validation_error", "fields": errors}), 422

        label, prob = ml_engine.predict(
            attendance, internal_total, assignment_total,
            study_hours, previous_performance
        )

        elig = compute_eligibility(attendance, internal_total, assignment_total)
        college_eligible = elig.get("overall_eligible", False)

        if not college_eligible:
            final_status = "NOT ELIGIBLE"
        else:
            final_status = label  # "PASS" or "FAIL" from DL model

        return jsonify({
            "model_prediction": label,
            "model_probability": float(prob),
            "prediction": label,          # backward compat
            "probability": float(prob),   # backward compat
            "attendance_eligible": elig["attendance_eligible"],
            "internal_eligible": elig["internal_eligible"],
            "assignment_eligible": elig["assignment_eligible"],
            "college_eligible": college_eligible,
            "attendance_status": elig["attendance_status"],
            "internal_pass": elig.get("internal_pass"),
            "assignment_pass": elig.get("assignment_pass"),
            "final_status": final_status,
            "eligibility": elig
        }), 200

    except Exception:
        return jsonify({"error": "server_error"}), 500


# ═══════════════════════════════════════════════════════════════════════════
# HEALTH
# ═══════════════════════════════════════════════════════════════════════════

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")
