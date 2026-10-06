import { motion } from 'framer-motion'

/**
 * Reusable progress bar component with animated fill
 */
export function ProgressBar({ value, max = 100, colorClass = 'from-indigo-500 to-purple-500', className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={`h-2 rounded-full bg-white/10 overflow-hidden ${className}`}>
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  )
}

/**
 * Circular probability indicator using SVG
 */
export function CircularProgress({ probability, size = 120, strokeWidth = 8, prediction }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = probability * 100
  const dashoffset = circumference - (pct / 100) * circumference
  const isPass = prediction === 'PASS'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isPass ? '#34d399' : '#f87171'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${isPass ? 'text-emerald-400' : 'text-red-400'}`}>
          {pct.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

/**
 * Loading skeleton pulse
 */
export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-white/10 rounded-xl ${className}`} />
  )
}

/**
 * Empty state component
 */
export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-10 flex flex-col items-center text-center gap-4"
    >
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
          <Icon className="w-8 h-8 text-white/30" />
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold text-white/80 mb-1">{title}</h3>
        <p className="text-sm text-white/40 max-w-xs">{message}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  )
}

/**
 * Error state component
 */
export function ErrorState({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-10 flex flex-col items-center text-center gap-4"
    >
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-red-400 mb-1">Something went wrong</h3>
        <p className="text-sm text-white/40">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-sm">
          Try Again
        </button>
      )}
    </motion.div>
  )
}

/**
 * Badge component
 */
export function Badge({ type = 'default', children, className = '' }) {
  const classes = {
    pass: 'badge-pass',
    fail: 'badge-fail',
    eligible: 'badge-eligible',
    warning: 'badge-warning',
    danger: 'badge-danger',
    default: 'bg-white/10 text-white/60 border border-white/20 px-3 py-1 rounded-full text-xs font-semibold',
  }
  return (
    <span className={`${classes[type] || classes.default} ${className}`}>
      {children}
    </span>
  )
}

/**
 * Stat card component
 */
export function StatCard({ icon: Icon, label, value, subValue, colorClass = 'from-indigo-500 to-purple-600', children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="glass-card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg`}>
          {Icon && <Icon className="w-5 h-5 text-white" />}
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      {subValue && <div className="text-xs text-white/40 mb-2">{subValue}</div>}
      <div className="text-sm text-white/60">{label}</div>
      {children}
    </motion.div>
  )
}

/**
 * Confirmation modal
 */
export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  if (!isOpen) return null
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card p-6 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-white/60 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          <button
            onClick={onConfirm}
            className={danger ? 'btn-danger' : 'btn-primary text-sm py-2 px-4'}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
