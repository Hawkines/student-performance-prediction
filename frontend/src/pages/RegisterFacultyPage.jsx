import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { GraduationCap, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function RegisterFacultyPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const passwordValue = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setSubmitError(null);
    try {
      const userIdVal = (data.user_id || data.username || '').trim();
      await api.post('/auth/register-faculty', {
        full_name: data.full_name,
        email: data.email,
        user_id: userIdVal,
        username: userIdVal,
        password: data.password,
      });
      toast.success('Account created! You can now sign in.');
      navigate('/login');
    } catch (err) {
      if (err.response?.data?.error === 'userid_or_email_taken' || err.response?.data?.error === 'username_or_email_taken') {
        setSubmitError('This User ID (Aadhaar Number) or email is already registered.');
      } else if (!err.response) {
        setSubmitError("Couldn't connect to the service. Please check your connection.");
      } else {
        setSubmitError('Unable to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Faculty{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(90deg, #818cf8, #c084fc)' }}
            >
              Registration
            </span>
          </h1>
          <p className="text-white/50 text-sm">Create your faculty account to get started</p>
        </div>

        {/* Glass Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <h2 className="text-white font-semibold text-lg mb-6">Create Account</h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="Dr. Jane Smith"
                autoComplete="name"
                className={`input-field w-full ${errors.full_name ? 'border-red-500/60 focus:border-red-500' : ''}`}
                {...register('full_name', { required: 'Full name is required' })}
              />
              {errors.full_name && (
                <p className="mt-1 text-red-400 text-xs">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                placeholder="faculty@university.edu"
                autoComplete="email"
                className={`input-field w-full ${errors.email ? 'border-red-500/60 focus:border-red-500' : ''}`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-red-400 text-xs">{errors.email.message}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1.5">Username</label>
              <input
                type="text"
                autoComplete="username"
                className={`input-field w-full ${errors.username ? 'border-red-500/60 focus:border-red-500' : ''}`}
                {...register('username', {
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Username must be at least 3 characters' },
                })}
              />
              {errors.username && (
                <p className="mt-1 text-red-400 text-xs">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  className={`input-field w-full pr-10 ${errors.password ? 'border-red-500/60 focus:border-red-500' : ''}`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-red-400 text-xs">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className={`input-field w-full pr-10 ${errors.confirm_password ? 'border-red-500/60 focus:border-red-500' : ''}`}
                  {...register('confirm_password', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === passwordValue || 'Passwords do not match',
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="mt-1 text-red-400 text-xs">{errors.confirm_password.message}</p>
              )}
            </div>

            {/* Submit Error */}
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-300 text-sm">{submitError}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full text-center flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-white/40 text-sm mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

