/**
 * @file Model layer: pure presentation formatters (dates, sizes, labels).
 */
export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'A'

/**
 * Format a date as e.g. `Nov 22, 2026`; an em dash when missing or invalid.
 *
 * @param {string|number|Date} value
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Describe a past moment relative to now ("5 min ago"); older than 30 days falls back to a date.
 *
 * @param {string|null} value - ISO timestamp of the last sign-in.
 * @returns {string}
 */
export function formatRelative(value) {
  if (!value) return 'Never signed in'
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  return days < 30 ? `${days} day${days > 1 ? 's' : ''} ago` : formatDate(value)
}

/**
 * Opening hours of a center as `opens – closes`, or `null` when either is missing.
 *
 * @param {{opens_at?: string, closes_at?: string}} center
 * @returns {string|null}
 */
export function formatHours(center) {
  if (!center.opens_at || !center.closes_at) return null
  return `${center.opens_at} – ${center.closes_at}`
}

/**
 * Format a timestamp as e.g. `Nov 22, 3:30 PM`; an em dash when missing or invalid.
 *
 * @param {string|number|Date} value
 * @returns {string}
 */
export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/** "in 3 days", "due today", "2 days overdue" for a due date. */
export function dueLabel(value) {
  if (!value) return ''
  const days = Math.round((new Date(value).getTime() - Date.now()) / 86400000)
  if (days === 0) return 'Due today'
  return days > 0 ? `Due in ${days} day${days > 1 ? 's' : ''}` : `${-days} day${days < -1 ? 's' : ''} overdue`
}

/**
 * Convert a date into the `YYYY-MM-DDTHH:mm` string a `datetime-local` input expects.
 *
 * @param {string|number|Date} value
 * @returns {string}
 */
export const toLocalInput = (value) => {
  if (!value) return ''
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Format a byte count as KB or MB.
 *
 * @param {number} [bytes=0]
 * @returns {string}
 */
export const fileSize = (bytes = 0) => (bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)
/**
 * Whether a file name has an image extension.
 *
 * @param {string} [name]
 * @returns {boolean}
 */
export const isImageName = (name = '') => /\.(png|jpe?g|webp|gif)$/i.test(name)
/**
 * Whether a file name has a `.pdf` extension.
 *
 * @param {string} [name]
 * @returns {boolean}
 */
export const isPdfName = (name = '') => /\.pdf$/i.test(name)
