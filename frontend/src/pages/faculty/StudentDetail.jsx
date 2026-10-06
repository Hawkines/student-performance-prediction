import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BookOpen,
  User,
  ChevronDown,
  ChevronUp,
  Trash2,
  ShieldAlert,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonBlock = ({ className = '' }) => (
  <div className={`bg-white/10 rounded-xl animate-pulse ${className}`} />
);

const DetailSkeleton = () => (
  <div className="space-y-6">
    <SkeletonBlock className="h-28 w-full" />
    <SkeletonBlock className="h-52 w-full" />
    <SkeletonBlock className="h-40 w-full" />
    <SkeletonBlock className="h-40 w-full" />
  </div>
);

// ─── Eligibility Card ─────────────────────────────────────────────────────────

const EligRow = ({ label, value, eligible }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
    <span className="text-white/60 text-sm">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-white text-sm font-medium">{value ?? '—'}</span>
      {eligible === true && <CheckCircle className="w-4 h-4 text-emerald-400" />}
      {eligible === false && <XCircle className="w-4 h-4 text-red-400" />}
    </div>
  </div>
);

// ─── Inline Number Input ──────────────────────────────────────────────────────

const NumField = ({ label, name, value, onChange, min, max, suffix, error }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-medium text-white/55">{label}</label>
    <div className="relative">
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="input-field w-full pr-14 text-sm"
        placeholder="—"
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
    {error && (
      <p className="text-red-400 text-xs flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Academic form
  const [acadForm, setAcadForm] = useState({
    attendance: '',
    internal_total: '',
    assignment_total: '',
    study_hours: '',
    previous_performance: '',
  });
  const [acadErrors, setAcadErrors] = useState({});
  const [acadSaving, setAcadSaving] = useState(false);

  // Profile edit accordion
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    department: '',
    semester: '',
    academic_year: '',
    phone: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Deletion modals state
  const [clearRecordsModal, setClearRecordsModal] = useState(false);
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);
  const [clearingRecords, setClearingRecords]     = useState(false);
  const [deletingAccount, setDeletingAccount]     = useState(false);
  const [deleteAuthorityConfirmed, setDeleteAuthorityConfirmed] = useState(false);

  // ── Fetch student ──────────────────────────────────────────────────────────
  const fetchStudent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/faculty/students/${id}`);
      const s = res.data?.student ?? res.data;
      setStudent(s);

      // Pre-fill academic form
      setAcadForm({
        attendance: s.attendance ?? '',
        internal_total: s.internal_total ?? '',
        assignment_total: s.assignment_total ?? '',
        study_hours: s.study_hours ?? '',
        previous_performance: s.previous_performance ?? '',
      });

      // Pre-fill profile form
      setProfileForm({
        full_name: s.full_name ?? '',
        department: s.department ?? '',
        semester: s.semester ?? '',
        academic_year: s.academic_year ?? '',
        phone: s.phone ?? '',
      });
    } catch {
      setError('Failed to load student data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  // ── Academic form handlers ─────────────────────────────────────────────────
  const handleAcadChange = (name, val) => {
    setAcadForm((prev) => ({ ...prev, [name]: val }));
    setAcadErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateAcad = () => {
    const errs = {};
    const { attendance, internal_total, assignment_total, study_hours, previous_performance } =
      acadForm;

    if (attendance !== '' && (Number(attendance) < 0 || Number(attendance) > 100))
      errs.attendance = 'Must be between 0 and 100.';
    if (internal_total !== '' && (Number(internal_total) < 0 || Number(internal_total) > 75))
      errs.internal_total = 'Must be between 0 and 75.';
    if (assignment_total !== '' && (Number(assignment_total) < 0 || Number(assignment_total) > 20))
      errs.assignment_total = 'Must be between 0 and 20.';
    if (study_hours !== '' && (Number(study_hours) < 0 || Number(study_hours) > 24))
      errs.study_hours = 'Must be between 0 and 24.';
    if (
      previous_performance !== '' &&
      (Number(previous_performance) < 0 || Number(previous_performance) > 100)
    )
      errs.previous_performance = 'Must be between 0 and 100.';

    return errs;
  };

  const handleAcadSave = async () => {
    const errs = validateAcad();
    if (Object.keys(errs).length > 0) {
      setAcadErrors(errs);
      return;
    }

    try {
      setAcadSaving(true);
      const payload = {};
      Object.entries(acadForm).forEach(([k, v]) => {
        if (v !== '') payload[k] = Number(v);
      });

      await api.put(`/faculty/students/${id}/academic`, payload);
      toast.success('Academic records updated successfully.');
      await fetchStudent();
      // fetchStudent calls fetchPrediction internally if records exist
    } catch (err) {
      const fieldErrors = err?.response?.data?.field_errors;
      if (fieldErrors) {
        setAcadErrors(fieldErrors);
      } else {
        toast.error('Failed to update academic records. Please try again.');
      }
    } finally {
      setAcadSaving(false);
    }
  };

  // ── Profile form handlers ──────────────────────────────────────────────────
  const handleProfileChange = (k, v) => {
    setProfileForm((prev) => ({ ...prev, [k]: v }));
  };

  const handleProfileSave = async () => {
    try {
      setProfileSaving(true);
      const payload = {
        full_name: profileForm.full_name.trim() || undefined,
        department: profileForm.department.trim() || undefined,
        semester: profileForm.semester ? Number(profileForm.semester) : undefined,
        academic_year: profileForm.academic_year.trim() || undefined,
        phone: profileForm.phone.trim() || undefined,
      };
      await api.put(`/faculty/students/${id}`, payload);
      toast.success('Profile updated successfully.');
      await fetchStudent();
      setProfileOpen(false);
    } catch {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Clear academic records handler ─────────────────────────────────────────
  const handleClearRecords = async () => {
    try {
      setClearingRecords(true);
      await api.delete(`/faculty/students/${id}/academic`);
      toast.success(`Academic records cleared. ${student?.full_name}'s account remains active.`);
      setClearRecordsModal(false);
      setAcadForm({
        attendance: '',
        internal_total: '',
        assignment_total: '',
        study_hours: '',
        previous_performance: '',
      });
      await fetchStudent();
    } catch {
      toast.error('Failed to clear academic records. Please try again.');
    } finally {
      setClearingRecords(false);
    }
  };

  // ── Delete entire student account handler ──────────────────────────────────
  const handleDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      await api.delete(`/faculty/students/${id}`);
      toast.success(`Student account for ${student?.full_name} deleted.`);
      navigate('/faculty/students', { replace: true });
    } catch {
      toast.error('Failed to delete student account. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  // ── Has records check ──────────────────────────────────────────────────────
  const hasRecords = student &&
    (student.attendance != null ||
      student.internal_total != null ||
      student.assignment_total != null);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/faculty/students')}
          className="flex items-center gap-2 text-white/50 hover:text-white/80 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </button>

        {loading ? (
          <DetailSkeleton />
        ) : error ? (
          <div className="glass-card p-6 flex items-center gap-3 text-red-400 border border-red-500/30">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <>
            {/* ── Header Card ───────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-xl font-bold text-white">
                        {student.full_name}
                      </h1>
                      {student.student_id && (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-semibold">
                          ID: {student.student_id}
                        </span>
                      )}
                      {student.phone && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          Phone: {student.phone}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-white/50 text-sm">
                      {student.department && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          {student.department}
                        </span>
                      )}
                      {student.semester && (
                        <span>Semester {student.semester}</span>
                      )}
                      {student.academic_year && (
                        <span>AY {student.academic_year}</span>
                      )}
                      {student.email && (
                        <span className="text-white/35">{student.email}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start flex-wrap">
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit Profile
                    {profileOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => setDeleteAccountModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs sm:text-sm font-medium border border-red-500/25 transition-all cursor-pointer"
                    title="Delete entire student account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Account
                  </button>
                </div>
              </div>

              {/* ── Profile Edit Accordion ─────────────────────────────── */}
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    key="profile-form"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 pt-5 border-t border-white/10">
                      <h4 className="text-sm font-semibold text-white/70 mb-4">
                        Edit Profile Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-white/55">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={profileForm.full_name}
                            onChange={(e) =>
                              handleProfileChange('full_name', e.target.value)
                            }
                            className="input-field w-full text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-white/55">
                            Department
                          </label>
                          <input
                            type="text"
                            value={profileForm.department}
                            onChange={(e) =>
                              handleProfileChange('department', e.target.value)
                            }
                            className="input-field w-full text-sm"
                            placeholder="e.g. Computer Science"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-white/55">
                            Semester
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={8}
                            value={profileForm.semester}
                            onChange={(e) =>
                              handleProfileChange('semester', e.target.value)
                            }
                            className="input-field w-full text-sm"
                            placeholder="1–8"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-white/55">
                            Academic Year
                          </label>
                          <input
                            type="text"
                            value={profileForm.academic_year}
                            onChange={(e) =>
                              handleProfileChange('academic_year', e.target.value)
                            }
                            className="input-field w-full text-sm"
                            placeholder="e.g. 2024-25"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-white/55">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) =>
                              handleProfileChange('phone', e.target.value)
                            }
                            className="input-field w-full text-sm"
                            placeholder="+91 98765 43210"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-5 justify-end">
                        <button
                          onClick={() => setProfileOpen(false)}
                          disabled={profileSaving}
                          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/60 text-sm transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleProfileSave}
                          disabled={profileSaving}
                          className="btn-primary flex items-center gap-2 disabled:opacity-60"
                        >
                          {profileSaving ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              Saving…
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              Save Profile
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── Main Grid ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Academic Records (Read-only view) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <BookOpen className="w-4.5 h-4.5 text-purple-400" />
                    <h2 className="text-base font-semibold text-white">
                      Official Academic Records
                    </h2>
                    <div className="ml-auto flex items-center gap-2">
                      {hasRecords && (
                        <button
                          onClick={() => setClearRecordsModal(true)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all cursor-pointer"
                          title="Clear academic marks only (keeps student account and credentials)"
                        >
                          <Trash2 className="w-3 h-3 text-amber-400" />
                          Clear Marks Only
                        </button>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium border border-purple-500/30">
                        Faculty Only
                      </span>
                    </div>
                  </div>

                  {!hasRecords ? (
                    <div className="py-8 text-center text-white/35 text-sm">
                      No records added yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      <EligRow
                        label="Attendance"
                        value={
                          student.attendance != null
                            ? `${student.attendance}%`
                            : null
                        }
                        eligible={student.attendance_eligible}
                      />
                      <EligRow
                        label="Internal Total"
                        value={
                          student.internal_total != null
                            ? `${student.internal_total} / 75`
                            : null
                        }
                        eligible={student.internal_eligible}
                      />
                      <EligRow
                        label="Assignment Total"
                        value={
                          student.assignment_total != null
                            ? `${student.assignment_total} / 20`
                            : null
                        }
                        eligible={student.assignment_eligible}
                      />
                      {student.study_hours != null && (
                        <EligRow
                          label="Study Hours / day"
                          value={`${student.study_hours} hrs`}
                        />
                      )}
                      {student.previous_performance != null && (
                        <EligRow
                          label="Previous Performance"
                          value={`${student.previous_performance} / 100`}
                        />
                      )}
                    </div>
                  )}
                </motion.div>

                {/* Eligibility Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="glass-card p-6"
                >
                  <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    {student.overall_eligible === true ? (
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                    ) : student.overall_eligible === false ? (
                      <XCircle className="w-4.5 h-4.5 text-red-400" />
                    ) : (
                      <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />
                    )}
                    Overall Eligibility
                  </h2>

                  {student.overall_eligible === null ||
                  student.overall_eligible === undefined ? (
                    <p className="text-white/40 text-sm">
                      No eligibility data available yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div
                        className={`p-4 rounded-xl border ${
                          student.overall_eligible
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                        }`}
                      >
                        <p
                          className={`text-lg font-bold ${
                            student.overall_eligible
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          {student.overall_eligible
                            ? '✓ Eligible for Examination'
                            : '✗ Not Eligible for Examination'}
                        </p>
                        <p className="text-white/45 text-xs mt-1">
                          Based on attendance, internal marks, and assignment
                          scores.
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          {
                            label: 'Attendance',
                            ok: student.attendance_eligible,
                          },
                          {
                            label: 'Internal',
                            ok: student.internal_eligible,
                          },
                          {
                            label: 'Assignment',
                            ok: student.assignment_eligible,
                          },
                        ].map(({ label, ok }) => (
                          <div
                            key={label}
                            className={`p-2.5 rounded-lg text-xs font-medium ${
                              ok === true
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : ok === false
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-white/5 text-white/35'
                            }`}
                          >
                            <div className="mb-0.5">
                              {ok === true ? '✓' : ok === false ? '✗' : '—'}
                            </div>
                            {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Edit Academic Records Form */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="glass-card p-6"
                >
                  <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <Edit className="w-4.5 h-4.5 text-indigo-400" />
                    Edit Academic Records
                  </h2>

                  <div className="grid grid-cols-1 gap-4">
                    <NumField
                      label="Attendance (%)"
                      name="attendance"
                      value={acadForm.attendance}
                      onChange={handleAcadChange}
                      min={0}
                      max={100}
                      suffix="%"
                      error={acadErrors.attendance}
                    />
                    <NumField
                      label="Internal Total"
                      name="internal_total"
                      value={acadForm.internal_total}
                      onChange={handleAcadChange}
                      min={0}
                      max={75}
                      suffix="/75"
                      error={acadErrors.internal_total}
                    />
                    <NumField
                      label="Assignment Total"
                      name="assignment_total"
                      value={acadForm.assignment_total}
                      onChange={handleAcadChange}
                      min={0}
                      max={20}
                      suffix="/20"
                      error={acadErrors.assignment_total}
                    />
                    <NumField
                      label="Study Hours / day"
                      name="study_hours"
                      value={acadForm.study_hours}
                      onChange={handleAcadChange}
                      min={0}
                      max={24}
                      suffix="hrs"
                      error={acadErrors.study_hours}
                    />
                    <NumField
                      label="Previous Performance"
                      name="previous_performance"
                      value={acadForm.previous_performance}
                      onChange={handleAcadChange}
                      min={0}
                      max={100}
                      suffix="/100"
                      error={acadErrors.previous_performance}
                    />
                  </div>

                  <button
                    onClick={handleAcadSave}
                    disabled={acadSaving}
                    className="btn-primary w-full mt-5 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {acadSaving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Academic Records
                      </>
                    )}
                  </button>
                </motion.div>
              </div>
            </div>

          </>
        )}
      </div>

      {/* ── Clear Academic Records Modal ── */}
      <AnimatePresence>
        {clearRecordsModal && (
          <motion.div
            key="clear-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              key="clear-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glass-card p-6 max-w-md w-full border border-amber-500/30"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Clear Academic Records Only?
                  </h3>
                  <p className="text-white/60 text-xs leading-relaxed">
                    This will wipe all official attendance, internal marks, and assignment scores for{' '}
                    <strong className="text-white">{student?.full_name}</strong>.
                  </p>
                  <p className="text-emerald-400/90 text-xs mt-2 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                    ✓ The student's account and login credentials will <strong>remain active</strong>.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end items-center mt-5 pt-3 border-t border-white/10">
                <button
                  onClick={() => setClearRecordsModal(false)}
                  disabled={clearingRecords}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearRecords}
                  disabled={clearingRecords}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {clearingRecords ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                      Clearing…
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear Records Only
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Entire Student Account Modal ── */}
      <AnimatePresence>
        {deleteAccountModal && (
          <motion.div
            key="delete-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              key="delete-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glass-card p-6 max-w-md w-full border border-red-500/30"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0 text-red-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Delete Entire Student Account?
                  </h3>
                  <p className="text-white/60 text-xs leading-relaxed">
                    Are you sure you want to permanently delete{' '}
                    <strong className="text-white">{student?.full_name}</strong> (ID: {student?.student_id})?
                  </p>
                  <p className="text-red-400/90 text-xs mt-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    ⚠️ This permanently removes their login credentials, profile, and all data. This action <strong>cannot be undone</strong>.
                  </p>
                </div>
              </div>

              {/* Interactive Institutional Authority Notice */}
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs space-y-2 mb-4">
                <div className="flex items-start gap-2 text-red-300 font-semibold">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                  <span>Institutional Authority Required</span>
                </div>
                <p className="text-white/70 leading-relaxed text-[11px]">
                  Permanent removal of a student identity and academic history is strictly restricted to
                  <strong className="text-white"> Department Heads / Higher Institutional Authorities</strong>.
                  Individual faculty members must have formal administrative clearance to permanently delete this student from the university database.
                </p>
                <label className="flex items-start gap-2.5 pt-2 border-t border-red-500/20 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={deleteAuthorityConfirmed}
                    onChange={(e) => setDeleteAuthorityConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-red-500/40 text-red-600 focus:ring-red-500/30 accent-red-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-white/90 font-medium">
                    I confirm that I have official administrative authority / clearance to permanently delete this student account.
                  </span>
                </label>
              </div>

              <div className="flex gap-3 justify-end items-center mt-5 pt-3 border-t border-white/10">
                <button
                  onClick={() => {
                    setDeleteAccountModal(false);
                    setDeleteAuthorityConfirmed(false);
                  }}
                  disabled={deletingAccount}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || !deleteAuthorityConfirmed}
                  className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-red-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title={!deleteAuthorityConfirmed ? 'Please confirm institutional authority above' : 'Delete permanently'}
                >
                  {deletingAccount ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Deleting Account…
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

