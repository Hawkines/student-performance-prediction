import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  AlertCircle,
  TrendingUp,
  GraduationCap,
  Eye,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: 'easeOut' },
  }),
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="glass-card p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-white/10 rounded w-32" />
      <div className="w-10 h-10 bg-white/10 rounded-xl" />
    </div>
    <div className="h-8 bg-white/10 rounded w-16" />
  </div>
);

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[...Array(7)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-white/10 rounded w-full" />
      </td>
    ))}
  </tr>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, gradient, index }) => (
  <motion.div
    custom={index}
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    className="glass-card p-6 flex items-center justify-between"
  >
    <div>
      <p className="text-sm text-white/60 font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
    </div>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </motion.div>
);

// ─── Prediction Badge ─────────────────────────────────────────────────────────

const PredictionBadge = ({ prediction }) => {
  if (prediction === null) return <span className="text-white/40 text-xs">Loading…</span>;
  if (prediction === 'N/A')
    return (
      <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/50 text-xs font-medium">
        N/A
      </span>
    );
  if (prediction === 'PASS')
    return (
      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
        PASS
      </span>
    );
  if (prediction === 'NOT ELIGIBLE')
    return (
      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/30">
        NOT ELIGIBLE
      </span>
    );
  return (
    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30">
      FAIL
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch predictions for students that have records
  const fetchPredictions = useCallback(async (students) => {
    const results = {};
    await Promise.allSettled(
      students.map(async (s) => {
        const hasRecords =
          s.attendance != null ||
          s.internal_total != null ||
          s.assignment_total != null;

        if (!hasRecords) {
          results[s.profile_id] = 'N/A';
          return;
        }
        try {
          const res = await api.get(`/faculty/predict/${s.profile_id}`);
          const finalStatus = res.data?.final_status ?? res.data?.prediction;
          results[s.profile_id] = finalStatus ?? 'N/A';
        } catch {
          results[s.profile_id] = 'N/A';
        }
      })
    );
    setPredictions((prev) => ({ ...prev, ...results }));
  }, []);

  // Initial data load
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsRes, studentsRes] = await Promise.all([
          api.get('/faculty/stats'),
          api.get('/faculty/students'),
        ]);

        if (cancelled) return;

        setStats(statsRes.data);

        const all = studentsRes.data?.students ?? [];
        setAllStudents(all);
        const first5 = all.slice(0, 5);
        setRecentStudents(first5);

        // Init predictions as null (loading) for those with records
        const initPred = {};
        first5.forEach((s) => {
          initPred[s.profile_id] = null;
        });
        setPredictions(initPred);

        fetchPredictions(first5);
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load dashboard data. Please try refreshing.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [fetchPredictions]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalStudents = stats?.total_students ?? 0;
  const withRecords = stats?.students_with_records ?? 0;
  const withoutRecords = totalStudents - withRecords;

  // Eligibility breakdown across all registered students
  const eligibleCount = allStudents.filter(
    (s) => s.overall_eligible === true && (s.attendance == null || s.attendance >= 75)
  ).length;

  const fineCount = allStudents.filter(
    (s) =>
      s.attendance != null &&
      s.attendance >= 60 &&
      s.attendance < 75 &&
      s.internal_total >= 30 &&
      s.assignment_total >= 12
  ).length;

  const notEligibleCount = allStudents.filter(
    (s) => s.overall_eligible === false && (s.attendance != null || s.internal_total != null)
  ).length;

  const pendingCount = withoutRecords;

  const statCards = [
    {
      label: 'Total Students',
      value: totalStudents,
      icon: Users,
      gradient: 'from-indigo-500 to-indigo-700',
    },
    {
      label: 'Students with Records',
      value: withRecords,
      icon: BookOpen,
      gradient: 'from-purple-500 to-purple-700',
    },
    {
      label: 'Pending Record Entry',
      value: withoutRecords,
      icon: AlertCircle,
      gradient: 'from-amber-500 to-amber-700',
    },
  ];

  // Filtered recent students
  const displayedRecent = recentStudents.filter((s) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return (
      (s.full_name && s.full_name.toLowerCase().includes(q)) ||
      (s.student_id && s.student_id.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q))
    );
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {getGreeting()},{' '}
              <span className="text-indigo-300">
                {user?.full_name ?? user?.username ?? 'Faculty'}
              </span>{' '}
              👋
            </h1>
            <p className="text-white/50 text-sm mt-0.5">
              Academic analytics overview and Semester End Examination (SEE) eligibility.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/faculty/students')}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Manage Data
        </button>
      </motion.div>

      {/* Error State */}
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading
          ? [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((card, i) => (
              <StatCard key={card.label} {...card} index={i} />
            ))}
      </div>

      {/* ── College Eligibility & SEE Readiness Summary ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.45 }}
        className="glass-card p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/10 gap-3">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Institutional SEE Examination Readiness
            </h2>
            <p className="text-white/45 text-xs mt-0.5">
              Current eligibility distribution based on VTU / Institutional Examination Regulations
            </p>
          </div>
          <button
            onClick={() => navigate('/faculty/students')}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
          >
            Open in Manage Data
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          {/* Card 1: Eligible */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-300">Eligible (No Fine)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{eligibleCount}</p>
            <p className="text-[11px] text-white/40 mt-1">Att: ≥75% | CIE: ≥30 | Assg: ≥12</p>
          </div>

          {/* Card 2: Fine Applicable */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-300">Eligible with Fine</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{fineCount}</p>
            <p className="text-[11px] text-white/40 mt-1">Att: 60–74% (Condonation)</p>
          </div>

          {/* Card 3: Not Eligible */}
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-red-300">Not Eligible for SEE</span>
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{notEligibleCount}</p>
            <p className="text-[11px] text-white/40 mt-1">Att: &lt;60% or CIE criteria not met</p>
          </div>

          {/* Card 4: Records Pending */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/60">Pending Record Entry</span>
              <BookOpen className="w-4 h-4 text-white/40" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{pendingCount}</p>
            <p className="text-[11px] text-white/40 mt-1">Awaiting marks & attendance</p>
          </div>
        </div>
      </motion.div>

      {/* Recent Students */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45 }}
        className="glass-card overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-white/10 gap-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Students</h2>
              <p className="text-white/40 text-xs">Recently monitored students under your department</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter recent list…"
                className="pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 w-44"
              />
            </div>
            <button
              onClick={() => navigate('/faculty/students')}
              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : displayedRecent.length === 0 ? (
          /* Empty State */
          <div className="py-16 flex flex-col items-center gap-4 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <Users className="w-8 h-8 text-white/30" />
            </div>
            <div>
              <p className="text-white/70 font-medium mb-1">
                {filterText ? 'No students match your filter.' : 'No students found.'}
              </p>
              <p className="text-white/40 text-sm">
                {filterText
                  ? 'Try adjusting your search query.'
                  : 'Manage or review students from the Manage Data tab.'}
              </p>
            </div>
            {filterText ? (
              <button
                onClick={() => setFilterText('')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium cursor-pointer transition-colors"
              >
                Clear Filter
              </button>
            ) : (
              <button
                onClick={() => navigate('/faculty/students')}
                className="btn-primary flex items-center gap-2 mt-2 cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Go to Manage Data
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {[
                    'Name',
                    'Student ID',
                    'Attendance',
                    'Internal',
                    'Assignment',
                    'Prediction',
                    'Action',
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
                {displayedRecent.map((student, idx) => (
                  <motion.tr
                    key={student.profile_id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.06 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-white font-medium">
                      {student.full_name}
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      {student.student_id ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {student.attendance != null
                        ? `${student.attendance}%`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {student.internal_total != null
                        ? `${student.internal_total}/75`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {student.assignment_total != null
                        ? `${student.assignment_total}/20`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <PredictionBadge
                        prediction={predictions[student.profile_id] ?? null}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          navigate(`/faculty/students/${student.profile_id}`)
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
