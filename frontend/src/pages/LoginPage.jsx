import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Brain,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'faculty'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // If already authenticated, redirect directly to the respective portal
  useEffect(() => {
    if (user && user.role) {
      const target = user.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard';
      navigate(target, { replace: true });
    }
  }, [user, navigate]);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setAuthError(null);
    reset();
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const loginId = (data.user_id || data.username || '').trim();
      const loggedInUser = await login(loginId, data.password, selectedRole);

      toast.success(`Welcome back, ${loggedInUser.full_name || loggedInUser.user_id}!`);

      const target = loggedInUser.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard';
      navigate(target, { replace: true });
    } catch (err) {
      setIsLoading(false);
      if (err.response) {
        if (err.response.data?.message) {
          // Display the server message (neutral and secure, no role disclosure)
          setAuthError(err.response.data.message);
        } else if (err.response.status === 401) {
          const idType = selectedRole === 'student' ? 'USN / Aadhaar Number' : 'Username';
          setAuthError(`Invalid credentials. Please verify your ${idType} and password.`);
        } else {
          setAuthError('Something went wrong while processing your request. Please try again.');
        }
      } else if (err.request) {
        setAuthError("Couldn't connect to the service. Please check your connection and try again.");
      } else {
        setAuthError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(135deg, #0a081a 0%, #1a163a 50%, #15102a 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Header Branding */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3.5 shadow-xl shadow-indigo-500/20"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Student Performance{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(90deg, #818cf8, #c084fc)' }}
            >
              Prediction System
            </span>
          </h1>
          <p className="text-white/50 text-sm mt-1.5">
            College Deep Learning Performance & Eligibility Analytics
          </p>
        </div>

        {/* Role Selection Tabs (Student vs Faculty) */}
        <div className="grid grid-cols-2 p-1.5 mb-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => handleRoleChange('student')}
            className={`relative flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
              selectedRole === 'student'
                ? 'text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-lg">👨‍🎓</span>
            <span className="tracking-wide">STUDENT</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('faculty')}
            className={`relative flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
              selectedRole === 'faculty'
                ? 'text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-lg">👨‍🏫</span>
            <span className="tracking-wide">FACULTY</span>
          </button>
        </div>

        {/* Clean Glass Card */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-7 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Input Identifier: USN / Aadhaar for Student, Username for Faculty */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1.5">
                {selectedRole === 'student' ? 'USN / Aadhaar Number' : 'Username'}
              </label>
              <input
                type="text"
                autoComplete="username"
                className={`input-field w-full ${errors.user_id ? 'border-red-500/60 focus:border-red-500' : ''}`}
                {...register('user_id', {
                  required: selectedRole === 'student'
                    ? 'USN or Aadhaar Number is required'
                    : 'Username is required',
                })}
              />
              {errors.user_id && (
                <p className="mt-1 text-red-400 text-xs">{errors.user_id.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input-field w-full pr-10 ${errors.password ? 'border-red-500/60 focus:border-red-500' : ''}`}
                  {...register('password', { required: 'Password is required' })}
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

            {/* Error Message Display */}
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-300 text-sm">{authError}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
                selectedRole === 'student'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-indigo-500/25'
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-purple-500/25'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Credentials…
                </>
              ) : (
                <>
                  <span>Sign In as {selectedRole === 'student' ? 'Student' : 'Faculty'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer note & Faculty Registration Link */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-white/50">
            {selectedRole === 'student' ? (
              <p>
                Student accounts are created by faculty. Use your official USN or Aadhaar Number.
              </p>
            ) : (
              <p>
                First time faculty?{' '}
                <Link
                  to="/register-faculty"
                  className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2 transition-colors"
                >
                  Register Faculty Account
                </Link>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
