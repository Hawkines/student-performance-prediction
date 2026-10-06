import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Eye,
  Trash2,
  X,
  AlertCircle,
  Users,
  BookOpen,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EligibilityBadge = ({ eligible, attendance, internal, assignment }) => {
  if (eligible === null || eligible === undefined)
    return (
      <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/40 text-xs">
        No Records
      </span>
    );

  const isFine =
    attendance != null &&
    attendance >= 60 &&
    attendance < 75 &&
    (internal == null || internal >= 30) &&
    (assignment == null || assignment >= 12);

  if (isFine) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
        Eligible (Fine)
      </span>
    );
  }

  return eligible ? (
    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
      Eligible
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30">
      Not Eligible
    </span>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-white/5">
    {[...Array(8)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-white/10 rounded w-full" />
      </td>
    ))}
  </tr>
);

// ─── Delete & Manage Modal with Institutional Notice ──────────────────────────

const DeleteModal = ({
  student,
  onClearRecords,
  onDeleteAccount,
  onCancel,
  clearingRecords,
  deletingAccount,
}) => {
  const [selectedAction, setSelectedAction] = useState(null); // 'records' | 'account' | null
  const [authorityConfirmed, setAuthorityConfirmed] = useState(false);

  useEffect(() => {
    setSelectedAction(null);
    setAuthorityConfirmed(false);
  }, [student]);

  if (!student) return null;

  const hasRecords =
    student.attendance != null ||
    student.internal_total != null ||
    student.assignment_total != null;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      >
        <motion.div
          key="modal"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="glass-card p-6 max-w-lg w-full border border-white/15"
        >
          {/* Header */}
          <div className="flex items-start gap-4 mb-5 pb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0 text-red-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-0.5">
                Manage Student Record / Account
              </h3>
              <p className="text-white/60 text-xs">
                Choose whether to reset academic marks or permanently remove the student account.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white font-medium text-xs">
                  {student.full_name}
                </span>
                <span className="text-white/40 text-xs font-mono">
                  ID: {student.student_id ?? student.profile_id}
                </span>
              </div>
            </div>
          </div>

          {/* Two Distinct Choices */}
          <div className="space-y-3 mb-6">
            {/* Option 1: Clear Academic Records Only */}
            <div
              onClick={() => setSelectedAction('records')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedAction === 'records'
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  id="action-records"
                  name="deleteAction"
                  checked={selectedAction === 'records'}
                  onChange={() => setSelectedAction('records')}
                  className="mt-1 accent-amber-500"
                />
                <label htmlFor="action-records" className="cursor-pointer flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                      <BookOpen size={15} />
                      Clear Academic Records Only
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">
                      Account Kept
                    </span>
                  </div>
                  <p className="text-white/50 text-xs mt-1.5 leading-relaxed">
                    Wipes official marks, attendance, and study stats. The student{' '}
                    <strong className="text-white/80">keeps their login account</strong> and can still sign in, but their record will reset to "No Records Yet".
                  </p>
                  {!hasRecords && (
                    <p className="text-amber-400/80 text-[11px] mt-1 italic">
                      Note: This student currently has no recorded marks to clear.
                    </p>
                  )}
                </label>
              </div>
            </div>

            {/* Option 2: Delete Entire Student Account */}
            <div
              onClick={() => setSelectedAction('account')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedAction === 'account'
                  ? 'bg-red-500/15 border-red-500/50 shadow-md shadow-red-500/10'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  id="action-account"
                  name="deleteAction"
                  checked={selectedAction === 'account'}
                  onChange={() => setSelectedAction('account')}
                  className="mt-1 accent-red-500"
                />
                <label htmlFor="action-account" className="cursor-pointer flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-red-400 flex items-center gap-2">
                      <Trash2 size={15} />
                      Delete Entire Student Account
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
                      Permanent Deletion
                    </span>
                  </div>
                  <p className="text-white/50 text-xs mt-1.5 leading-relaxed">
                    Completely deletes login credentials, profile data, and all records.{' '}
                    <strong className="text-red-300">Cannot be undone.</strong>
                  </p>
                </label>
              </div>
            </div>

            {/* Interactive Institutional Authority Notice */}
            {selectedAction === 'account' && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs space-y-2 mt-2"
              >
                <div className="flex items-start gap-2 text-red-300 font-semibold">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                  <span>Institutional Authority Notice</span>
                </div>
                <p className="text-white/70 leading-relaxed text-[11px]">
                  Permanent student account removal is reserved for{' '}
                  <strong className="text-white">Department Heads / Institutional Administration</strong>.
                  Individual faculty members must have formal administrative clearance to permanently delete a student from the institution database.
                </p>
                <label className="flex items-start gap-2.5 pt-2 border-t border-red-500/20 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={authorityConfirmed}
                    onChange={(e) => setAuthorityConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-red-500/40 text-red-600 focus:ring-red-500/30 accent-red-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-white/90 font-medium">
                    I confirm that I have official administrative authority / clearance to permanently delete this student account.
                  </span>
                </label>
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end items-center pt-3 border-t border-white/10">
            <button
              onClick={onCancel}
              disabled={clearingRecords || deletingAccount}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>

            {selectedAction === 'records' && (
              <button
                onClick={() => onClearRecords(student)}
                disabled={clearingRecords || !hasRecords}
                className="px-4 py-2 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-black text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {clearingRecords ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                    Clearing Records…
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    Clear Records Only
                  </>
                )}
              </button>
            )}

            {selectedAction === 'account' && (
              <button
                onClick={() => onDeleteAccount(student)}
                disabled={deletingAccount || !authorityConfirmed}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-red-500/20 cursor-pointer"
                title={!authorityConfirmed ? 'Please confirm institutional authority above' : 'Delete student account permanently'}
              >
                {deletingAccount ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Deleting Account…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </>
                )}
              </button>
            )}

            {!selectedAction && (
              <button
                disabled
                className="px-4 py-2 rounded-xl bg-white/5 text-white/30 text-sm font-medium cursor-not-allowed"
              >
                Select an option
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentsList() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eligibilityFilter, setEligibilityFilter] = useState('ALL'); // 'ALL' | 'ELIGIBLE' | 'FINE' | 'NOT_ELIGIBLE' | 'PENDING'
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [clearingRecords, setClearingRecords] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const debounceRef = useRef(null);
  const currentQuery = useRef('');

  // Fetch students (called on mount + debounced search)
  const fetchStudents = useCallback(async (query = '') => {
    currentQuery.current = query;
    try {
      setLoading(true);
      setError(null);
      const params = query.trim() ? { search: query.trim() } : {};
      const res = await api.get('/faculty/students', { params });
      if (currentQuery.current === query) {
        setStudents(res.data?.students ?? []);
      }
    } catch {
      if (currentQuery.current === query) {
        setError('Failed to load students. Please try again.');
      }
    } finally {
      if (currentQuery.current === query) {
        setLoading(false);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStudents('');
  }, [fetchStudents]);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchStudents(search);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search, fetchStudents]);

  // Clear ONLY academic records (keep student account)
  const handleClearRecords = async (student) => {
    if (!student) return;
    try {
      setClearingRecords(true);
      await api.delete(`/faculty/students/${student.profile_id}/academic`);
      toast.success(`Academic records cleared for ${student.full_name}. Student account remains active.`);
      setDeleteTarget(null);
      fetchStudents(currentQuery.current);
    } catch {
      toast.error('Failed to clear academic records. Please try again.');
    } finally {
      setClearingRecords(false);
    }
  };

  // Delete ENTIRE student account
  const handleDeleteAccount = async (student) => {
    if (!student) return;
    try {
      setDeletingAccount(true);
      await api.delete(`/faculty/students/${student.profile_id}`);
      toast.success(`Student ${student.full_name} and account removed.`);
      setDeleteTarget(null);
      fetchStudents(currentQuery.current);
    } catch {
      toast.error('Failed to remove student. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  // ── Counts for filter tabs ──
  const counts = {
    all: students.length,
    eligible: students.filter(
      (s) => s.overall_eligible === true && (s.attendance == null || s.attendance >= 75)
    ).length,
    fine: students.filter(
      (s) =>
        s.attendance != null &&
        s.attendance >= 60 &&
        s.attendance < 75 &&
        s.internal_total >= 30 &&
        s.assignment_total >= 12
    ).length,
    notEligible: students.filter(
      (s) => s.overall_eligible === false && (s.attendance != null || s.internal_total != null)
    ).length,
    pending: students.filter(
      (s) => s.attendance == null || s.internal_total == null
    ).length,
  };

  // ── Filtered list ──
  const displayedStudents = students.filter((s) => {
    if (eligibilityFilter === 'ALL') return true;
    const hasRecords = s.attendance != null && s.internal_total != null;
    if (eligibilityFilter === 'PENDING') return !hasRecords;
    if (eligibilityFilter === 'FINE') {
      return (
        hasRecords &&
        s.attendance >= 60 &&
        s.attendance < 75 &&
        s.internal_total >= 30 &&
        s.assignment_total >= 12
      );
    }
    if (eligibilityFilter === 'ELIGIBLE') {
      return s.overall_eligible === true && (s.attendance == null || s.attendance >= 75);
    }
    if (eligibilityFilter === 'NOT_ELIGIBLE') {
      return hasRecords && s.overall_eligible === false;
    }
    return true;
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <DeleteModal
        student={deleteTarget}
        onClearRecords={handleClearRecords}
        onDeleteAccount={handleDeleteAccount}
        onCancel={() => setDeleteTarget(null)}
        clearingRecords={clearingRecords}
        deletingAccount={deletingAccount}
      />

      <div className="min-h-screen p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="w-6 h-6 text-indigo-400" />
              Manage Student Data
            </h1>
            <p className="text-white/50 text-sm mt-0.5">
              Review and manage academic records, SEE eligibility, and account profiles.
            </p>
          </div>

          <button
            onClick={() => fetchStudents(search)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-sm font-medium transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
            title="Refresh student records from server"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, USN / ID, or email…"
            className="input-field pl-10 pr-10 w-full"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>

        {/* ── Eligibility Filter Tabs ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setEligibilityFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              eligibilityFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
            }`}
          >
            All Students ({counts.all})
          </button>

          <button
            onClick={() => setEligibilityFilter('ELIGIBLE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              eligibilityFilter === 'ELIGIBLE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-white/5 hover:bg-white/10 text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 size={13} />
            Eligible ({counts.eligible})
          </button>

          <button
            onClick={() => setEligibilityFilter('FINE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              eligibilityFilter === 'FINE'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-white/5 hover:bg-white/10 text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <AlertTriangle size={13} />
            Fine Applicable ({counts.fine})
          </button>

          <button
            onClick={() => setEligibilityFilter('NOT_ELIGIBLE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              eligibilityFilter === 'NOT_ELIGIBLE'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-white/5 hover:bg-white/10 text-red-400/80 hover:text-red-300'
            }`}
          >
            <XCircle size={13} />
            Not Eligible ({counts.notEligible})
          </button>

          <button
            onClick={() => setEligibilityFilter('PENDING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              eligibilityFilter === 'PENDING'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'
            }`}
          >
            <BookOpen size={13} />
            Pending Records ({counts.pending})
          </button>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-4 border border-red-500/30 flex items-center gap-3 text-red-400"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        {/* Table Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-white/10">
                  {[
                    'Student ID / USN',
                    'Name',
                    'Department',
                    'Attendance',
                    'Internal',
                    'Assignments',
                    'SEE Eligibility',
                    'Actions',
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-white/50 font-medium text-xs uppercase tracking-wide"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
                ) : displayedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-white/40">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-8 h-8 text-white/20" />
                        <p className="text-white/60 font-medium">
                          {search
                            ? `No students match "${search}"`
                            : eligibilityFilter !== 'ALL'
                            ? `No students in "${eligibilityFilter.toLowerCase().replace('_', ' ')}" category`
                            : 'No students found.'}
                        </p>
                        {(search || eligibilityFilter !== 'ALL') && (
                          <button
                            onClick={() => {
                              setSearch('');
                              setEligibilityFilter('ALL');
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 text-xs font-medium cursor-pointer"
                          >
                            Reset Search & Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedStudents.map((student, idx) => (
                    <motion.tr
                      key={student.profile_id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-white/70 font-mono text-xs font-medium">
                        {student.student_id ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">
                        {student.full_name}
                      </td>
                      <td className="px-4 py-3 text-white/60 hidden sm:table-cell">
                        {student.department ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-white/70">
                        {student.attendance != null
                          ? `${student.attendance}%`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-white/70 hidden md:table-cell">
                        {student.internal_total != null
                          ? `${student.internal_total}/75`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-white/70 hidden md:table-cell">
                        {student.assignment_total != null
                          ? `${student.assignment_total}/20`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <EligibilityBadge
                          eligible={student.overall_eligible}
                          attendance={student.attendance}
                          internal={student.internal_total}
                          assignment={student.assignment_total}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/faculty/students/${student.profile_id}`
                              )
                            }
                            title="View student academic profile & records"
                            className="w-8 h-8 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(student)}
                            title="Manage / remove student"
                            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!loading && students.length > 0 && (
            <div className="px-4 py-3 border-t border-white/5 text-white/35 text-xs flex items-center justify-between">
              <span>
                Showing {displayedStudents.length} of {students.length} student{students.length !== 1 ? 's' : ''}
              </span>
              {eligibilityFilter !== 'ALL' && (
                <span className="text-indigo-400">
                  Filtered by: {eligibilityFilter.replace('_', ' ')}
                </span>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
