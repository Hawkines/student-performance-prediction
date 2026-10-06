import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  User,
  RefreshCw,
  Brain,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="glass-card p-5 animate-pulse space-y-3">
      <div className="h-4 bg-white/10 rounded w-1/2" />
      <div className="h-8 bg-white/10 rounded w-3/4" />
      <div className="h-2 bg-white/10 rounded w-full" />
    </div>
  );
}

function ProgressBar({ value, max = 100, colorClass }) {
  const pct = clamp((value / max) * 100, 0, 100);
  return (
    <div className="w-full bg-white/10 rounded-full h-2 mt-2">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-2 rounded-full ${colorClass}`}
      />
    </div>
  );
}

function Badge({ children, color }) {
  const colors = {
    green: 'bg-green-500/20 text-green-400 border border-green-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    red: 'bg-red-500/20 text-red-400 border border-red-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors[color] || colors.blue}`}>
      {children}
    </span>
  );
}

// ─── Academic Performance Cards ───────────────────────────────────────────────

function AttendanceCard({ value }) {
  const pct = parseFloat(value) || 0;
  const colorClass =
    pct >= 75 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
  const badgeColor = pct >= 75 ? 'green' : pct >= 60 ? 'amber' : 'red';
  const badgeLabel =
    pct >= 75 ? 'Good Standing' : pct >= 60 ? 'At Risk' : 'Critical';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/50 uppercase tracking-widest font-semibold">
          Attendance
        </span>
        <Clock size={16} className="text-white/40" />
      </div>
      <div className="text-3xl font-bold text-white mt-1">{pct.toFixed(1)}%</div>
      <ProgressBar value={pct} max={100} colorClass={colorClass} />
      <div className="mt-2 flex justify-end">
        <Badge color={badgeColor}>{badgeLabel}</Badge>
      </div>
    </motion.div>
  );
}

function InternalMarksCard({ value }) {
  const v = parseFloat(value) || 0;
  const colorClass = v >= 30 ? 'bg-green-500' : 'bg-red-500';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/50 uppercase tracking-widest font-semibold">
          Internal Marks
        </span>
        <BookOpen size={16} className="text-white/40" />
      </div>
      <div className="text-3xl font-bold text-white mt-1">
        {v}
        <span className="text-base font-normal text-white/40">/75</span>
      </div>
      <ProgressBar value={v} max={75} colorClass={colorClass} />
      <div className="mt-2 flex justify-end">
        <Badge color={v >= 30 ? 'green' : 'red'}>
          {v >= 30 ? 'Pass' : 'Fail'}
        </Badge>
      </div>
    </motion.div>
  );
}

function AssignmentsCard({ value }) {
  const v = parseFloat(value) || 0;
  const colorClass = v >= 12 ? 'bg-green-500' : 'bg-red-500';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/50 uppercase tracking-widest font-semibold">
          Assignments
        </span>
        <Award size={16} className="text-white/40" />
      </div>
      <div className="text-3xl font-bold text-white mt-1">
        {v}
        <span className="text-base font-normal text-white/40">/20</span>
      </div>
      <ProgressBar value={v} max={20} colorClass={colorClass} />
      <div className="mt-2 flex justify-end">
        <Badge color={v >= 12 ? 'green' : 'red'}>
          {v >= 12 ? 'Pass' : 'Fail'}
        </Badge>
      </div>
    </motion.div>
  );
}

function PreviousPerformanceCard({ value }) {
  const v = parseFloat(value) || 0;
  const colorClass =
    v >= 60 ? 'bg-green-500' : v >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/50 uppercase tracking-widest font-semibold">
          Previous Performance
        </span>
        <TrendingUp size={16} className="text-white/40" />
      </div>
      <div className="text-3xl font-bold text-white mt-1">
        {v}
        <span className="text-base font-normal text-white/40">/100</span>
      </div>
      <ProgressBar value={v} max={100} colorClass={colorClass} />
      <div className="mt-2 flex justify-end">
        <Badge color={v >= 60 ? 'green' : v >= 40 ? 'amber' : 'red'}>
          {v >= 60 ? 'Good' : v >= 40 ? 'Average' : 'Low'}
        </Badge>
      </div>
    </motion.div>
  );
}

// ─── Eligibility Section ──────────────────────────────────────────────────────

function attendanceBadgeProps(status) {
  switch (status) {
    case 'eligible_no_fine':
      return { label: 'Eligible, No Fine', color: 'green' };
    case 'eligible_fine':
      return { label: 'Eligible (Fine Applicable)', color: 'amber' };
    default:
      return { label: 'Not Eligible', color: 'red' };
  }
}

function EligibilitySection({ eligibility, records }) {
  const r = records || {};
  const att = parseFloat(r?.Attendance ?? r?.attendance ?? 0);
  const intVal = parseFloat(r?.Internal_Total ?? r?.internal_total ?? 0);
  const assVal = parseFloat(r?.Assignment_Total ?? r?.assignment_total ?? 0);

  const attEligible = att >= 60;
  const attBadge = att >= 75
    ? { label: 'Eligible, No Fine', color: 'green' }
    : att >= 60
    ? { label: 'Eligible (Fine Applicable)', color: 'amber' }
    : { label: 'Not Eligible', color: 'red' };

  const internalPass = intVal >= 30;
  const assignPass = assVal >= 12;
  const isEligible = attEligible && internalPass && assignPass;

  return (
    <div className="space-y-6">
      {/* ── College Eligibility Status ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Award size={20} className="text-purple-400" />
          College Eligibility Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {/* Attendance */}
          <div className="flex flex-col items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 text-sm font-medium">
              <Clock size={15} />
              Attendance ({att}%)
            </div>
            <Badge color={attBadge.color}>{attBadge.label}</Badge>
            <span className="text-[10px] text-white/40">Min 60% (60-74% with condonation fine)</span>
          </div>

          {/* Internals */}
          <div className="flex flex-col items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 text-sm font-medium">
              <BookOpen size={15} />
              Internals ({intVal}/75)
            </div>
            <div className="flex items-center gap-1.5">
              {internalPass ? (
                <CheckCircle size={16} className="text-green-400" />
              ) : (
                <XCircle size={16} className="text-red-400" />
              )}
              <span className={`text-sm font-semibold ${internalPass ? 'text-green-400' : 'text-red-400'}`}>
                {internalPass ? 'Pass (≥30/75)' : 'Fail (<30/75)'}
              </span>
            </div>
            <span className="text-[10px] text-white/40">3 internal exams combined</span>
          </div>

          {/* Assignments */}
          <div className="flex flex-col items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 text-sm font-medium">
              <Award size={15} />
              Assignments ({assVal}/20)
            </div>
            <div className="flex items-center gap-1.5">
              {assignPass ? (
                <CheckCircle size={16} className="text-green-400" />
              ) : (
                <XCircle size={16} className="text-red-400" />
              )}
              <span className={`text-sm font-semibold ${assignPass ? 'text-green-400' : 'text-red-400'}`}>
                {assignPass ? 'Pass (≥12/20)' : 'Fail (<12/20)'}
              </span>
            </div>
            <span className="text-[10px] text-white/40">Combined total ≥ 12/20</span>
          </div>
        </div>

        {/* Overall banner */}
        <div
          className={`rounded-xl p-4 flex items-center gap-3 ${
            isEligible
              ? 'bg-green-500/15 border border-green-500/30'
              : 'bg-red-500/15 border border-red-500/30'
          }`}
        >
          {isEligible ? (
            <CheckCircle size={22} className="text-green-400 shrink-0" />
          ) : (
            <XCircle size={22} className="text-red-400 shrink-0" />
          )}
          <div>
            <p
              className={`font-bold text-base ${isEligible ? 'text-green-400' : 'text-red-400'}`}
            >
              {isEligible
                ? 'You are eligible to appear for the semester examinations.'
                : 'You are NOT currently eligible to appear for the examinations.'}
            </p>
            {!isEligible && (
              <p className="text-white/50 text-xs mt-0.5">
                Ensure attendance is ≥ 60%, internals ≥ 30/75, and assignments ≥ 12/20.
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── SEPARATE DEDICATED SECTION: SEE (Semester End Examination) Rules & Eligibility ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-lg">
              📝
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Semester End Examination (SEE) Status & Regulations</h2>
              <p className="text-xs text-white/50">Official College Regulations for Hall Ticket Issuance & Exam Passing</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            isEligible
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          }`}>
            {isEligible ? 'Hall Ticket Granted' : 'Hall Ticket Withheld'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Eligibility checklist */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              1. SEE Hall Ticket Criteria Checklist:
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white/60">• Attendance (≥ 60% required):</span>
                <span className={attEligible ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                  {att}% ({attBadge.label})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">• Internal Marks (≥ 30/75 required):</span>
                <span className={internalPass ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                  {intVal}/75 ({internalPass ? 'Satisfied' : 'Not Met'})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">• Assignments (Combined ≥ 12/20):</span>
                <span className={assignPass ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                  {assVal}/20 ({assignPass ? 'Satisfied' : 'Not Met'})
                </span>
              </div>
            </div>
          </div>

          {/* Exam passing rules */}
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/20 space-y-2.5">
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
              2. Semester End Exam (SEE) Passing Rules:
            </p>
            <div className="space-y-1.5 text-xs text-white/70">
              <p>• Written Theory Exam: <strong>80 marks</strong></p>
              <p>• Scaled to: <strong>100 marks</strong></p>
              <p>• Minimum Passing Score: <strong>≥ 34 / 100</strong></p>
              <p className="text-[11px] text-white/40 pt-1 border-t border-white/10">
                Scoring &lt; 34/100 in the converted SEE examination results in a Course Fail.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Circular SVG Progress ────────────────────────────────────────────────────

function CircularProgress({ probability }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (probability / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg width="112" height="112" className="-rotate-90">
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="8"
        />
        <motion.circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="url(#probGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
        <defs>
          <linearGradient id="probGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <span className="text-xl font-bold text-white">{probability.toFixed(1)}%</span>
        <span className="block text-[10px] text-white/40 leading-tight">confidence</span>
      </div>
    </div>
  );
}

// ─── AI Prediction Card ───────────────────────────────────────────────────────

function AIPredictionCard({ prediction }) {
  const modelIsPass = prediction?.model_prediction === 'PASS';
  const finalIsPass = prediction?.final_status === 'PASS';
  const finalIsFail = prediction?.final_status === 'FAIL';
  const finalNotEligible = prediction?.final_status === 'NOT ELIGIBLE';
  const probability = parseFloat(prediction?.model_probability ?? prediction?.probability ?? 0) * 100;

  const attStatus = prediction?.attendance_status;
  const attLabel =
    attStatus === 'eligible_no_fine'
      ? 'Eligible, No Fine'
      : attStatus === 'eligible_fine'
      ? 'Eligible (Fine Applicable)'
      : 'Not Eligible';
  const attColor =
    attStatus === 'eligible_no_fine'
      ? 'text-green-400'
      : attStatus === 'eligible_fine'
      ? 'text-amber-400'
      : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="space-y-4"
    >
      {/* ── Section 1: AI MODEL PREDICTION ── */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className={`absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl opacity-20 ${
              modelIsPass ? 'bg-green-400' : 'bg-red-400'
            }`}
          />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Brain size={20} className="text-purple-400" />
            <h2 className="text-lg font-semibold text-white">AI Model Prediction</h2>
          </div>
          <p className="text-white/40 text-xs mb-5">Powered by trained Deep Learning model</p>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div
              className={`text-5xl font-extrabold tracking-tight px-6 py-3 rounded-2xl ${
                modelIsPass
                  ? 'text-green-400 bg-green-400/10 border border-green-500/30'
                  : 'text-red-400 bg-red-400/10 border border-red-500/30'
              }`}
            >
              {prediction?.model_prediction}
            </div>
            <CircularProgress probability={probability} />
            <div className="text-center sm:text-left">
              <p className="text-white/50 text-sm">Probability</p>
              <p className="text-2xl font-bold text-white">{probability.toFixed(1)}%</p>
              <p className="text-white/30 text-xs mt-1">model confidence</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: COLLEGE ELIGIBILITY CHECK ── */}
      <div className="glass-card p-5 space-y-3">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">
          College Eligibility Check
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {/* Attendance */}
          <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-white/5 border border-white/5">
            <span className="text-white/40 text-xs">Attendance</span>
            <div className="flex items-center gap-1.5">
              {prediction?.attendance_eligible ? (
                <CheckCircle size={13} className={attStatus === 'eligible_no_fine' ? 'text-green-400' : 'text-amber-400'} />
              ) : (
                <XCircle size={13} className="text-red-400" />
              )}
              <span className={`font-semibold ${attColor}`}>{attLabel}</span>
            </div>
            <span className="text-[10px] text-white/30">Min 60% (60–74% with fine)</span>
          </div>
          {/* Internals */}
          <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-white/5 border border-white/5">
            <span className="text-white/40 text-xs">Internals (/75)</span>
            <div className="flex items-center gap-1.5">
              {prediction?.internal_pass ? (
                <CheckCircle size={13} className="text-green-400" />
              ) : (
                <XCircle size={13} className="text-red-400" />
              )}
              <span className={`font-semibold ${prediction?.internal_pass ? 'text-green-400' : 'text-red-400'}`}>
                {prediction?.internal_pass ? 'Pass (≥30/75)' : 'Fail (<30/75)'}
              </span>
            </div>
            <span className="text-[10px] text-white/30">3 Exams × 25 marks</span>
          </div>
          {/* Assignments */}
          <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-white/5 border border-white/5">
            <span className="text-white/40 text-xs">Assignments (/20)</span>
            <div className="flex items-center gap-1.5">
              {prediction?.assignment_pass ? (
                <CheckCircle size={13} className="text-green-400" />
              ) : (
                <XCircle size={13} className="text-red-400" />
              )}
              <span className={`font-semibold ${prediction?.assignment_pass ? 'text-green-400' : 'text-red-400'}`}>
                {prediction?.assignment_pass ? 'Pass (≥12/20)' : 'Fail (<12/20)'}
              </span>
            </div>
            <span className="text-[10px] text-white/30">Combined Total ≥ 12/20</span>
          </div>
        </div>
        {/* Overall SEE banner */}
        <div
          className={`rounded-lg px-3.5 py-2.5 flex items-center justify-between text-sm font-semibold ${
            prediction?.college_eligible
              ? 'bg-green-500/10 border border-green-500/25 text-green-400'
              : 'bg-red-500/10 border border-red-500/25 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {prediction?.college_eligible ? <CheckCircle size={16} /> : <XCircle size={16} />}
            <span>
              {prediction?.college_eligible
                ? 'Eligible for Semester End Examination (SEE)'
                : 'Not Eligible for Semester End Examination (SEE)'}
            </span>
          </div>
          <span className="text-xs opacity-75">
            {prediction?.college_eligible ? 'Hall Ticket Granted' : 'Criteria Not Met'}
          </span>
        </div>
      </div>

      {/* ── Section 3: FINAL SYSTEM STATUS ── */}
      <div
        className={`glass-card p-6 relative overflow-hidden border-2 ${
          finalIsPass
            ? 'border-green-500/40'
            : finalIsFail
            ? 'border-red-500/40'
            : 'border-orange-500/40'
        }`}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            className={`absolute inset-0 opacity-5 rounded-2xl ${
              finalIsPass ? 'bg-green-400' : finalIsFail ? 'bg-red-400' : 'bg-orange-400'
            }`}
          />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
              finalIsPass
                ? 'bg-green-500/20 border border-green-500/40'
                : finalIsFail
                ? 'bg-red-500/20 border border-red-500/40'
                : 'bg-orange-500/20 border border-orange-500/40'
            }`}
          >
            {finalIsPass ? (
              <CheckCircle size={28} className="text-green-400" />
            ) : (
              <XCircle size={28} className={finalIsFail ? 'text-red-400' : 'text-orange-400'} />
            )}
          </div>
          <div className="text-center sm:text-left">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">
              Final System Status
            </p>
            <p
              className={`text-4xl font-extrabold tracking-tight ${
                finalIsPass ? 'text-green-400' : finalIsFail ? 'text-red-400' : 'text-orange-400'
              }`}
            >
              {prediction?.final_status}
            </p>
            <p className="text-white/40 text-xs mt-1 max-w-xs">
              {finalIsPass
                ? 'AI model predicts PASS and all college eligibility criteria are met.'
                : finalIsFail
                ? 'AI model predicts FAIL. Consider improving your academic performance.'
                : 'One or more college eligibility criteria are not met. Final result overridden by college rules.'}
            </p>
          </div>
        </div>
        <p className="text-white/25 text-xs mt-5 leading-relaxed border-t border-white/10 pt-4">
          ⚠️ This prediction is based on your current academic data using a trained neural network.
          It is <span className="font-semibold">not a guarantee</span> of your final result.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Study Info Card ──────────────────────────────────────────────────────────

function StudyInfoCard({ studyHours }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-6 flex items-center gap-5"
    >
      <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
        <Clock size={24} className="text-blue-400" />
      </div>
      <div>
        <p className="text-white/50 text-sm font-medium">Daily Study Hours</p>
        <p className="text-3xl font-bold text-white mt-0.5">
          {parseFloat(studyHours || 0).toFixed(1)}
          <span className="text-base font-normal text-white/40 ml-1">hrs/day</span>
        </p>
        <p className="text-white/30 text-xs mt-1">
          {parseFloat(studyHours) >= 4
            ? '✅ Great dedication!'
            : parseFloat(studyHours) >= 2
            ? '⚡ Good effort, keep it up!'
            : '📚 Consider increasing study time.'}
        </p>
      </div>
    </motion.div>
  );
}

// ─── No Records Empty State ───────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-10 flex flex-col items-center text-center gap-4"
    >
      <div className="w-16 h-16 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
        <AlertCircle size={32} className="text-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-white">No Records Yet</h3>
      <p className="text-white/50 text-sm max-w-sm leading-relaxed">
        Your faculty member has not added your academic information yet. Please check back later
        or contact your department.
      </p>
    </motion.div>
  );
}

// ─── Skeleton Loading ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="glass-card p-6 animate-pulse flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/10 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-white/10 rounded w-1/3" />
          <div className="h-4 bg-white/10 rounded w-1/4" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-20 bg-white/10 rounded-full" />
            <div className="h-5 w-24 bg-white/10 rounded-full" />
            <div className="h-5 w-20 bg-white/10 rounded-full" />
          </div>
        </div>
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* Other skeletons */}
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-10 flex flex-col items-center text-center gap-4"
    >
      <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
        <AlertCircle size={32} className="text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-white">Something went wrong</h3>
      <p className="text-white/50 text-sm max-w-sm">{message}</p>
      <button
        onClick={onRetry}
        className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
      >
        <RefreshCw size={15} />
        Try Again
      </button>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [predictionError, setPredictionError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setPredictionError(false);
    try {
      const profileRes = await api.get('/student/profile');
      const data = profileRes.data;

      // API now returns nested { profile, academic_records, eligibility }
      // with flat fields also included for backward compatibility
      setProfile(data.profile ?? data);
      // academic_records is null when faculty hasn't added records yet
      const rec = data.academic_records ?? null;
      setRecords(rec);
      setEligibility(data.eligibility ?? null);

      // Only fetch prediction if records actually exist (non-null)
      if (rec !== null) {
        try {
          const predRes = await api.get('/student/predict');
          setPrediction(predRes.data);
        } catch {
          setPredictionError(true);
        }
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Failed to load your dashboard. Please check your connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const name = profile?.full_name || user?.full_name || profile?.name || user?.name || 'Student';
  const studentId = profile?.student_id || profile?.id || '—';
  const department = profile?.department || '—';
  const semester = profile?.semester || profile?.current_semester || '—';

  const r = records || {};
  const attendance     = r.attendance     ?? r.Attendance     ?? null;
  const internalTotal  = r.internal_total ?? r.Internal_Total ?? null;
  const assignmentTotal = r.assignment_total ?? r.Assignment_Total ?? null;
  const prevPerf       = r.previous_performance ?? r.Previous_Performance ?? null;
  const studyHours     = r.study_hours    ?? r.Study_Hours    ?? null;

  // hasRecords is true only when the API returned a non-null academic_records object
  const hasRecords = records !== null && records !== undefined;

  return (
    <div className="space-y-6">
      {/* ── Header Section ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-lg">
            {getInitials(name)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white/50 text-sm">
              {getGreeting()},
            </p>
            <h1 className="text-2xl font-bold text-white truncate">{name}!</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <User size={13} />
                <span>Roll / ID: {studentId}</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                Aadhaar (User ID): {user?.user_id || profile?.username || '—'}
              </span>
              <Badge color="purple">{department}</Badge>
              <Badge color="blue">Semester {semester}</Badge>
            </div>
          </div>

          <button
            onClick={fetchData}
            title="Refresh"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </motion.div>

      {/* ── Records or Empty State ── */}
      <AnimatePresence mode="wait">
        {hasRecords ? (
          <motion.div
            key="has-records"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Academic Performance Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AttendanceCard value={attendance} />
              <InternalMarksCard value={internalTotal} />
              <AssignmentsCard value={assignmentTotal} />
              <PreviousPerformanceCard value={prevPerf} />
            </div>

            {/* Eligibility Section */}
            <EligibilitySection eligibility={eligibility} records={records} />

            {/* AI Prediction Card */}
            {prediction && !predictionError ? (
              <AIPredictionCard prediction={prediction} />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="glass-card p-6 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Brain size={20} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">AI Prediction Unavailable</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    AI prediction requires complete academic records.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Study Info Card */}
            {studyHours !== null && <StudyInfoCard studyHours={studyHours} />}
          </motion.div>
        ) : (
          <motion.div key="no-records" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EmptyState />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

