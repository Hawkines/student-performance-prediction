import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  User,
  Lock,
  Mail,
  Hash,
  BookOpen,
  Phone,
  Calendar,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FieldWrapper = ({ label, error, required, children, hint }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-white/70">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {hint && !error && (
      <p className="text-white/40 text-xs">{hint}</p>
    )}
    {error && (
      <p className="text-red-400 text-xs flex items-center gap-1">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);

const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-5">
    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-4.5 h-4.5 text-indigo-400" />
    </div>
    <div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {subtitle && (
        <p className="text-white/45 text-xs mt-0.5">{subtitle}</p>
      )}
    </div>
  </div>
);

// ─── Error code → user-friendly message ──────────────────────────────────────

const resolveApiError = (err) => {
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }
  const code = err?.response?.data?.error ?? err?.response?.data?.code ?? '';
  if (code === 'userid_taken') {
    return 'This User ID / Aadhaar Number is already registered.';
  }
  if (code === 'email_taken') {
    return 'This Email address is already registered.';
  }
  if (code === 'student_id_taken') {
    return 'This Student ID / USN is already registered.';
  }
  if (
    code === 'userid_or_email_or_student_id_taken' ||
    code === 'username_or_email_or_student_id_taken' ||
    code === 'user_exists' ||
    err?.response?.status === 409
  ) {
    return 'This User ID (Aadhaar Number), email, or student ID is already registered.';
  }
  if (
    code === 'required_fields_missing' ||
    err?.response?.status === 400
  ) {
    return 'Please fill in all required fields.';
  }
  return 'Unable to create student. Please try again.';
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AddStudent() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      student_id: '',
      full_name: '',
      department: '',
      semester: '',
      academic_year: '',
      phone: '',
      user_id: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setApiError(null);

      const userIdVal = (data.user_id || data.username || '').trim();
      const payload = {
        full_name: data.full_name.trim(),
        email: data.email.trim(),
        user_id: userIdVal,
        username: userIdVal,
        password: data.password,
        student_id: data.student_id.trim(),
        department: data.department.trim() || undefined,
        semester: data.semester ? Number(data.semester) : undefined,
        academic_year: data.academic_year.trim() || undefined,
        phone: data.phone.trim() || undefined,
      };

      const res = await api.post('/faculty/students', payload);
      const newId = res.data?.profile_id ?? res.data?.student?.profile_id;

      toast.success('Student registered successfully!');

      if (newId) {
        navigate(`/faculty/students/${newId}`);
      } else {
        navigate('/faculty/students');
      }
    } catch (err) {
      setApiError(resolveApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back + Title */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/50 hover:text-white/80 text-sm mb-5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Students
          </button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Add New Student</h1>
              <p className="text-white/50 text-sm">
                Enter student academic details first, then assign portal login credentials.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Workflow Guidance Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 space-y-2"
        >
          <div className="flex items-center gap-2 font-semibold text-indigo-300">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>Registration Workflow Overview</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px] text-white/70">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="font-semibold text-white block mb-0.5">1. Academic Info</span>
              Fill Student ID / USN, Full Name, Department & Semester.
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="font-semibold text-white block mb-0.5">2. Portal Login</span>
              Enter 12-digit Aadhaar Number (User ID) & student password.
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="font-semibold text-white block mb-0.5">3. Records & AI</span>
              Redirects to student profile to enter marks, attendance & AI predictions.
            </div>
          </div>
        </motion.div>

        {/* API Error Banner */}
        {apiError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="glass-card p-4 border border-red-500/30 flex items-center gap-3 text-red-400 shadow-lg shadow-red-500/10"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{apiError}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1 — Student Profile & Institutional Information (FIRST) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <SectionTitle
              icon={GraduationCap}
              title="1. Student Information"
              subtitle="Institutional identification and academic enrollment details."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <FieldWrapper
                label="Full Name"
                required
                error={errors.full_name?.message}
              >
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  <input
                    {...register('full_name', {
                      required: 'Full name is required.',
                    })}
                    type="text"
                    placeholder="e.g. RASOOL B"
                    className="input-field pl-10 w-full"
                  />
                </div>
              </FieldWrapper>

              {/* Student ID / USN */}
              <FieldWrapper
                label="Student ID / USN"
                required
                hint="University Seat Number (USN) or unique institutional identifier."
                error={errors.student_id?.message}
              >
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  <input
                    {...register('student_id', {
                      required: 'Student ID / USN is required.',
                    })}
                    type="text"
                    placeholder="e.g. U24E01CS078"
                    className="input-field pl-10 w-full uppercase"
                  />
                </div>
              </FieldWrapper>

              {/* Department */}
              <FieldWrapper label="Department" error={errors.department?.message}>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  <input
                    {...register('department')}
                    type="text"
                    placeholder="e.g. COMPUTER SCIENCE ENGG"
                    className="input-field pl-10 w-full"
                  />
                </div>
              </FieldWrapper>

              {/* Semester */}
              <FieldWrapper
                label="Semester"
                hint="1 to 8"
                error={errors.semester?.message}
              >
                <input
                  {...register('semester', {
                    min: { value: 1, message: 'Minimum semester is 1.' },
                    max: { value: 8, message: 'Maximum semester is 8.' },
                  })}
                  type="number"
                  min={1}
                  max={8}
                  placeholder="e.g. 5"
                  className="input-field w-full"
                />
              </FieldWrapper>

              {/* Academic Year */}
              <FieldWrapper
                label="Academic Year"
                hint="e.g. 2024-25"
                error={errors.academic_year?.message}
              >
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  <input
                    {...register('academic_year')}
                    type="text"
                    placeholder="e.g. 2024-25"
                    className="input-field pl-10 w-full"
                  />
                </div>
              </FieldWrapper>

              {/* Contact Phone */}
              <FieldWrapper
                label="Contact Phone"
                hint="Student or parent mobile number"
                error={errors.phone?.message}
              >
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder="e.g. 8971102471"
                    className="input-field pl-10 w-full"
                  />
                </div>
              </FieldWrapper>
            </div>
          </motion.div>

          {/* Section 2 — Portal Login Credentials (SECOND) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="glass-card p-6"
          >
            <SectionTitle
              icon={Lock}
              title="2. Portal Login Credentials"
              subtitle="Unique Aadhaar number and credentials for the student to sign in."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* User ID (Aadhaar Number) */}
              <FieldWrapper
                label="User ID (12-Digit Aadhaar Number)"
                required
                hint="Unique 12-digit Aadhaar number used by the student to log in."
                error={errors.user_id?.message}
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs font-mono font-semibold pointer-events-none">
                    UID
                  </span>
                  <input
                    {...register('user_id', {
                      required: '12-digit Aadhaar Number is required.',
                      minLength: {
                        value: 4,
                        message: 'User ID must be at least 4 digits.',
                      },
                    })}
                    type="text"
                    placeholder="e.g. 408823810533"
                    autoComplete="off"
                    className="input-field pl-12 w-full font-mono"
                  />
                </div>
              </FieldWrapper>

              {/* Student Email */}
              <FieldWrapper
                label="Student Email Address"
                required
                hint="Official or personal email address for communications."
                error={errors.email?.message}
              >
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  <input
                    {...register('email', {
                      required: 'Email address is required.',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email address.',
                      },
                    })}
                    type="email"
                    placeholder="e.g. rasool@gmail.com"
                    className="input-field pl-10 w-full"
                  />
                </div>
              </FieldWrapper>

              {/* Password */}
              <div className="sm:col-span-2">
                <FieldWrapper
                  label="Student Portal Password"
                  required
                  hint="Initial password for student account (minimum 6 characters)."
                  error={errors.password?.message}
                >
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <input
                      {...register('password', {
                        required: 'Password is required.',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters.',
                        },
                      })}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter minimum 6 characters"
                      autoComplete="new-password"
                      className="input-field pl-10 pr-10 w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </FieldWrapper>
              </div>
            </div>

            {/* Info Note */}
            <div className="mt-5 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-indigo-300/80 text-xs leading-relaxed">
                Official marks (attendance, 3 internal exam scores, assignments) will be configured
                immediately after creating the account on the{' '}
                <strong className="text-indigo-300">Student Profile & Academic Records</strong> page.
              </p>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="flex gap-3 justify-end items-center"
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating Student Profile…
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Student & Proceed
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
