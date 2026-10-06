/**
 * Compute eligibility status from academic values.
 * Matches the backend logic exactly.
 */

export function computeAttendanceStatus(attendance) {
  if (attendance === null || attendance === undefined) return { status: 'unknown', eligible: null }
  if (attendance < 60) return { status: 'not_eligible', eligible: false, label: 'Not Eligible', color: 'danger' }
  if (attendance < 75) return { status: 'eligible_fine', eligible: true, label: 'Eligible (Fine Applicable)', color: 'warning' }
  return { status: 'eligible_no_fine', eligible: true, label: 'Eligible, No Fine', color: 'eligible' }
}

export function computeInternalStatus(internal_total) {
  if (internal_total === null || internal_total === undefined) return { eligible: null, label: 'Unknown' }
  const pass = internal_total >= 30
  return { eligible: pass, label: pass ? `Pass (${internal_total}/75)` : `Fail (${internal_total}/75 — min 30)`, color: pass ? 'eligible' : 'danger' }
}

export function computeAssignmentStatus(assignment_total) {
  if (assignment_total === null || assignment_total === undefined) return { eligible: null, label: 'Unknown' }
  const pass = assignment_total >= 12
  return { eligible: pass, label: pass ? `Pass (${assignment_total}/20)` : `Fail (${assignment_total}/20 — min 12)`, color: pass ? 'eligible' : 'danger' }
}

export function computeOverallEligibility(attendance, internal, assignment) {
  const a = computeAttendanceStatus(attendance)
  const i = computeInternalStatus(internal)
  const s = computeAssignmentStatus(assignment)
  if (a.eligible === null || i.eligible === null || s.eligible === null) return null
  return a.eligible && i.eligible && s.eligible
}

/** Format a probability (0-1) as percentage string */
export function formatProbability(prob) {
  if (prob === null || prob === undefined) return '—'
  return `${(prob * 100).toFixed(1)}%`
}

/** Get progress bar color class based on percentage and thresholds */
export function getProgressColor(value, max, minPass) {
  const pct = (value / max) * 100
  const passPct = (minPass / max) * 100
  if (pct < passPct * 0.8) return 'from-red-500 to-rose-500'
  if (pct < passPct) return 'from-amber-500 to-orange-500'
  return 'from-emerald-500 to-teal-500'
}

/** Get attendance specific progress color */
export function getAttendanceColor(attendance) {
  if (attendance < 60) return 'from-red-500 to-rose-500'
  if (attendance < 75) return 'from-amber-500 to-orange-500'
  return 'from-emerald-500 to-teal-500'
}

/** Friendly error messages */
export function getApiErrorMessage(error, context = 'request') {
  if (!error.response) {
    return "Couldn't connect to the service. Please check your connection and try again."
  }
  const status = error.response?.status
  const code = error.response?.data?.error

  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 403) return 'You do not have permission to perform this action.'
  if (status === 404) return 'The requested resource was not found.'
  if (status === 409) return 'This record already exists.'
  if (status === 422) return 'Please check the highlighted fields.'
  if (status >= 500) return 'Something went wrong on the server. Please try again.'

  return 'Something went wrong. Please try again.'
}
