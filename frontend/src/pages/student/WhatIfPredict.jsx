import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// ─── Circular SVG Progress ────────────────────────────────────────────────────

function CircularProgress({ probability, isPass }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const safePct = clamp(probability, 0, 100);
  const offset = circumference - (safePct / 100) * circumference;
  const strokeColor = isPass ? '#4ade80' : '#f87171';

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg width="128" height="128" className="-rotate-90">
        <circle
          cx="64" cy="64" r={radius}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8"
        />
        <motion.circle
          cx="64" cy="64" r={radius}
          fill="none" stroke={strokeColor} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-xl font-bold text-white">{safePct.toFixed(1)}%</span>
        <span className="block text-[10px] text-white/40 leading-tight">confidence</span>
      </div>
    </div>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────────

function FormField({ label, hint, name, register, errors, min, max, step = 'any' }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-white/80">
        {label}
        <span className="ml-2 text-xs text-white/35 font-normal">{hint}</span>
      </label>
      <input
        type="number"
        step={step}
        {...register(name, {
          required: 'This field is required',
          min: { value: min, message: `Minimum value is ${min}` },
          max: { value: max, message: `Maximum value is ${max}` },
          valueAsNumber: true,
        })}
        className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border text-white text-sm
          focus:outline-none focus:ring-2 transition-all
          ${errors?.[name]
            ? 'border-red-500/60 focus:ring-red-500/30'
            : 'border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20'
          }`}
        placeholder={`${min} – ${max}`}
      />
      <AnimatePresence>
        {errors?.[name] && (
          <motion.p
            key="err"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-red-400 text-xs mt-0.5"
          >
            {errors[name].message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Input Summary ────────────────────────────────────────────────────────────

function InputSummary({ inputs }) {
  if (!inputs) return null;
  const items = [
    { label: 'Attendance',    value: `${inputs.Attendance ?? 0}%` },
    { label: 'Internal',      value: `${inputs.Internal_Total ?? 0}/75` },
    { label: 'Assignment',    value: `${inputs.Assignment_Total ?? 0}/20` },
    { label: 'Study Hrs/day', value: `${inputs.Study_Hours ?? 0} hrs` },
    { label: 'Prev. Perf.',   value: `${inputs.Previous_Performance ?? 0}/100` },
  ];
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">
        Simulation Inputs
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {items.map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-white/30 text-[10px] leading-tight mb-0.5">{label}</p>
            <p className="text-white font-bold text-sm">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Eligibility Check ────────────────────────────────────────────────────────

function EligibilityCheck({ result, inputs }) {
  // Safely read all fields with fallbacks
  const attStatus    = result?.attendance_status ?? 'not_eligible';
  const attEligible  = result?.attendance_eligible ?? false;
  const intOk        = result?.internal_pass ?? false;
  const assOk        = result?.assignment_pass ?? false;
  const colEligible  = result?.college_eligible ?? false;

  const attLabel =
    attStatus === 'eligible_no_fine'
      ? 'Eligible, No Fine'
      : attStatus === 'eligible_fine'
      ? 'Eligible (Fine Applicable)'
      : 'Not Eligible';
  const attColor =
    attStatus === 'eligible_no_fine' ? 'text-green-400'
    : attStatus === 'eligible_fine'  ? 'text-amber-400'
    : 'text-red-400';

  const attPct = Number(inputs?.Attendance ?? 0);
  const intVal = Number(inputs?.Internal_Total ?? 0);
  const assVal = Number(inputs?.Assignment_Total ?? 0);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">
        College Eligibility Check
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        {/* Attendance */}
        <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-white/5 border border-white/5">
          <span className="text-white/40 text-xs">Attendance ({attPct}%)</span>
          <div className="flex items-center gap-1.5">
            {attEligible
              ? <CheckCircle size={13} className={attStatus === 'eligible_no_fine' ? 'text-green-400' : 'text-amber-400'} />
              : <XCircle    size={13} className="text-red-400" />
            }
            <span className={`font-semibold ${attColor}`}>{attLabel}</span>
          </div>
          <span className="text-[10px] text-white/30">Min: 60% (60–74% with fine)</span>
        </div>

        {/* Internals */}
        <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-white/5 border border-white/5">
          <span className="text-white/40 text-xs">Internals ({intVal}/75)</span>
          <div className="flex items-center gap-1.5">
            {intOk ? <CheckCircle size={13} className="text-green-400" />
                   : <XCircle    size={13} className="text-red-400" />}
            <span className={`font-semibold ${intOk ? 'text-green-400' : 'text-red-400'}`}>
              {intOk ? 'Pass (≥30/75)' : 'Fail (<30/75)'}
            </span>
          </div>
          <span className="text-[10px] text-white/30">3 Exams × 25 marks</span>
        </div>

        {/* Assignments */}
        <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-white/5 border border-white/5">
          <span className="text-white/40 text-xs">Assignments ({assVal}/20)</span>
          <div className="flex items-center gap-1.5">
            {assOk ? <CheckCircle size={13} className="text-green-400" />
                   : <XCircle    size={13} className="text-red-400" />}
            <span className={`font-semibold ${assOk ? 'text-green-400' : 'text-red-400'}`}>
              {assOk ? 'Pass (≥12/20)' : 'Fail (<12/20)'}
            </span>
          </div>
          <span className="text-[10px] text-white/30">Combined Total ≥ 12/20</span>
        </div>
      </div>

      {/* Overall SEE banner */}
      <div className={`rounded-lg px-3.5 py-2.5 flex items-center justify-between text-sm font-semibold ${
        colEligible
          ? 'bg-green-500/10 border border-green-500/25 text-green-400'
          : 'bg-red-500/10 border border-red-500/25 text-red-400'
      }`}>
        <div className="flex items-center gap-2">
          {colEligible ? <CheckCircle size={16} /> : <XCircle size={16} />}
          <span>
            {colEligible
              ? 'Overall: Eligible for Semester End Examination (SEE)'
              : 'Overall: Not Eligible for Semester End Examination (SEE)'}
          </span>
        </div>
        <span className="text-xs opacity-75">
          {colEligible ? 'Hall Ticket Granted' : 'Criteria Not Met'}
        </span>
      </div>

      {/* SEE passing info */}
      <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-xs text-white/70">
        <p className="font-semibold text-indigo-300 mb-1">📝 Semester End Examination (SEE) Passing Rules:</p>
        <p className="leading-relaxed">
          Written theory paper is for <strong>80 marks</strong>, converted to{' '}
          <strong>100 marks</strong>. Minimum score of{' '}
          <strong>≥ 34 / 100</strong> required to pass the SEE examination.
        </p>
      </div>
    </div>
  );
}

// ─── Result Section ───────────────────────────────────────────────────────────

function ResultSection({ result, inputs }) {
  if (!result) return null;

  // Safely read all fields — backward compatible with old API response too
  const modelPrediction = result.model_prediction ?? result.prediction ?? '—';
  const modelIsPass     = modelPrediction === 'PASS';
  const rawProb         = result.model_probability ?? result.probability ?? 0;
  const probability     = clamp(parseFloat(rawProb) * 100, 0, 100);
  const finalStatus     = result.final_status ?? modelPrediction;
  const finalIsPass     = finalStatus === 'PASS';
  const finalIsFail     = finalStatus === 'FAIL';

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-4"
    >
      {/* ── Section 1: AI MODEL PREDICTION ── */}
      <div className="glass-card p-5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-15 ${modelIsPass ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>
        <div className="relative z-10">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
            <Brain size={13} className="text-purple-400" />
            AI Model Prediction
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14 }}
              className={`text-4xl font-extrabold tracking-tight px-6 py-2.5 rounded-2xl ${
                modelIsPass
                  ? 'text-green-400 bg-green-400/10 border border-green-500/30'
                  : 'text-red-400 bg-red-400/10 border border-red-500/30'
              }`}
            >
              {modelPrediction}
            </motion.div>
            <CircularProgress probability={probability} isPass={modelIsPass} />
            <div className="text-center sm:text-left">
              <p className="text-white/50 text-sm">Model Probability</p>
              <p className="text-2xl font-bold text-white">{probability.toFixed(1)}%</p>
              <p className="text-white/30 text-xs mt-1">neural network confidence</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: COLLEGE ELIGIBILITY CHECK ── */}
      <div className="glass-card p-5">
        <EligibilityCheck result={result} inputs={inputs} />
      </div>

      {/* ── Section 3: FINAL SYSTEM STATUS ── */}
      <div className={`glass-card p-5 relative overflow-hidden border-2 ${
        finalIsPass ? 'border-green-500/40'
        : finalIsFail ? 'border-red-500/40'
        : 'border-orange-500/40'
      }`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute inset-0 opacity-5 rounded-2xl ${
            finalIsPass ? 'bg-green-400' : finalIsFail ? 'bg-red-400' : 'bg-orange-400'
          }`} />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
            finalIsPass ? 'bg-green-500/20 border border-green-500/40'
            : finalIsFail ? 'bg-red-500/20 border border-red-500/40'
            : 'bg-orange-500/20 border border-orange-500/40'
          }`}>
            {finalIsPass
              ? <CheckCircle size={28} className="text-green-400" />
              : <XCircle    size={28} className={finalIsFail ? 'text-red-400' : 'text-orange-400'} />
            }
          </div>
          <div className="text-center sm:text-left">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">
              Final System Status
            </p>
            <p className={`text-3xl font-extrabold tracking-tight ${
              finalIsPass ? 'text-green-400' : finalIsFail ? 'text-red-400' : 'text-orange-400'
            }`}>
              {finalStatus}
            </p>
            <p className="text-white/40 text-xs mt-1">
              {finalIsPass
                ? 'AI model predicts PASS and all college eligibility criteria are met.'
                : finalIsFail
                ? 'AI model predicts FAIL. Consider improving your academic performance.'
                : 'One or more college eligibility criteria are not met. Final result overridden by college rules.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Input Summary ── */}
      <InputSummary inputs={inputs} />

      {/* Disclaimer */}
      <p className="text-white/25 text-xs leading-relaxed border-t border-white/10 pt-3">
        🧠 This prediction uses your actual trained deep learning model. Simulation values do{' '}
        <span className="font-semibold">not</span> affect your official academic record.
      </p>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WhatIfPredict() {
  const [result, setResult]         = useState(null);
  const [lastInputs, setLastInputs] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError]     = useState(null);

  const formTopRef = useRef(null);
  const resultRef  = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ mode: 'onTouched' });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setResult(null);
    setApiError(null);

    const payload = {
      Attendance:           parseFloat(data.Attendance),
      Internal_Total:       parseFloat(data.Internal_Total),
      Assignment_Total:     parseFloat(data.Assignment_Total),
      Study_Hours:          parseFloat(data.Study_Hours),
      Previous_Performance: parseFloat(data.Previous_Performance),
    };

    try {
      // Realistic DL inference delay (800ms) so model calculation is noticeable and engaging
      const [res] = await Promise.all([
        api.post('/predict', payload),
        new Promise((resolve) => setTimeout(resolve, 800)),
      ]);

      if (!res?.data) throw new Error('Empty response from server.');
      setResult(res.data);
      setLastInputs(payload);

      // Smoothly swipe / scroll down directly to the generated result section!
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 422) {
        toast.error('Validation failed. Please check your inputs.');
      } else if (status >= 500) {
        toast.error('Server error. Please try again later.');
        setApiError('The prediction server returned an error. Please try again.');
      } else if (!err?.response) {
        toast.error('Network error. Please check your connection and make sure the backend is running.');
        setApiError('Could not reach the prediction server. Is the backend running on port 5000?');
      } else {
        toast.error(err?.response?.data?.message || 'An unexpected error occurred.');
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    // 1. Clear all 5 form input values so they completely vanish
    reset({
      Attendance: '',
      Internal_Total: '',
      Assignment_Total: '',
      Study_Hours: '',
      Previous_Performance: '',
    });
    // 2. Clear previous generated prediction results and errors
    setResult(null);
    setLastInputs(null);
    setApiError(null);
    toast.success('Simulation cleared. Ready for new inputs.');
    // 3. Smoothly scroll back to the top of the form
    setTimeout(() => {
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div ref={formTopRef} />

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
            <FlaskConical size={22} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI What-If Prediction</h1>
            <p className="text-white/40 text-sm mt-1 leading-relaxed">
              Explore how different academic scenarios affect your predicted result. Changes here
              do <span className="font-semibold text-white/60">NOT</span> modify your official records.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Warning Banner ── */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30"
      >
        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-amber-300 text-sm leading-relaxed">
          <span className="font-semibold">Simulation Only:</span> These values are for simulation
          only and will not affect your official academic record.
        </p>
      </motion.div>

      {/* ── Form Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField label="Attendance"          hint="(%)"       name="Attendance"           register={register} errors={errors} min={0}  max={100} step="0.1" />
          <FormField label="Internal Total"      hint="(/75)"     name="Internal_Total"       register={register} errors={errors} min={0}  max={75}  step="0.5" />
          <FormField label="Assignment Total"    hint="(/20)"     name="Assignment_Total"     register={register} errors={errors} min={0}  max={20}  step="0.5" />
          <FormField label="Study Hours / Day"   hint="(0–24 hrs)" name="Study_Hours"         register={register} errors={errors} min={0}  max={24}  step="0.5" />
          <FormField label="Previous Performance" hint="(/100)"   name="Previous_Performance" register={register} errors={errors} min={0}  max={100} step="0.5" />

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                isSubmitting
                  ? 'bg-purple-600/40 text-white/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 active:scale-[0.98] cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <><Loader2 size={17} className="animate-spin" /> Deep Learning Inference Running…</>
              ) : (
                <><Brain size={17} /> Predict Result</>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* ── Submitting Inference State ── */}
      {isSubmitting && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass-card p-6 flex items-center justify-center gap-4 border border-purple-500/30 text-center"
        >
          <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin" />
            <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Running Deep Learning Model…</p>
            <p className="text-xs text-white/50">Evaluating 17 features &amp; calculating eligibility</p>
          </div>
        </motion.div>
      )}

      {/* ── API Error State ── */}
      {apiError && !result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 px-4 py-4 rounded-xl bg-red-500/10 border border-red-500/30"
        >
          <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm leading-relaxed">{apiError}</p>
        </motion.div>
      )}

      {/* ── Result Section (Auto-scrolled into view on generation) ── */}
      <div ref={resultRef} className="scroll-mt-6">
        <AnimatePresence mode="wait">
          {result && lastInputs && (
            <ResultSection key="result" result={result} inputs={lastInputs} />
          )}
        </AnimatePresence>
      </div>

      {/* ── Reset / Refresh Action Button ── */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center pt-2 pb-6"
        >
          <motion.button
            onClick={handleReset}
            whileHover={{ scale: 1.04, boxShadow: '0 0 25px rgba(168, 85, 247, 0.35)' }}
            whileTap={{ scale: 0.96 }}
            className="group flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-sm font-semibold border border-white/15 hover:border-purple-500/50 shadow-md transition-all duration-200 cursor-pointer"
            title="Clear all inputs and results to start fresh"
          >
            <RefreshCw size={16} className="text-purple-400 transition-transform duration-500 group-hover:rotate-180" />
            <span>Reset Inputs &amp; Clear Result</span>
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
