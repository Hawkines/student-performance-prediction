import os
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "database.db"

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Users table (students + faculty)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('student', 'faculty')),
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Student profiles
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS student_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            student_id TEXT UNIQUE NOT NULL,
            department TEXT,
            semester INTEGER,
            academic_year TEXT,
            phone TEXT,
            created_by_faculty_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by_faculty_id) REFERENCES users(id)
        )
    """)

    # Auto-migrate existing student_profiles table if created_by_faculty_id is missing
    profile_cols = [c[1] for c in cursor.execute("PRAGMA table_info(student_profiles)").fetchall()]
    if "created_by_faculty_id" not in profile_cols:
        cursor.execute("ALTER TABLE student_profiles ADD COLUMN created_by_faculty_id INTEGER REFERENCES users(id)")

    # Academic records (official, only faculty can write)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS academic_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_profile_id INTEGER NOT NULL UNIQUE,
            attendance REAL,
            internal_total REAL,
            assignment_total REAL,
            study_hours REAL,
            previous_performance REAL,
            updated_by INTEGER,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
            FOREIGN KEY (updated_by) REFERENCES users(id)
        )
    """)

    conn.commit()
    conn.close()
    print("[DB] Database initialized successfully.")
