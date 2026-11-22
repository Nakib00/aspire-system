const apiBase = import.meta.env.VITE_API_URL || '/api/v1'

export async function request(path, { token, method = 'GET', body } = {}) {
  let response
  try {
    response = await fetch(`${apiBase}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
    })
  } catch {
    throw new Error('Unable to reach the server. Check that the backend is running and try again.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data.errors ? Object.values(data.errors).flat().join(' ') : data.message
    const error = new Error(message || 'Something went wrong. Please try again.')
    error.status = response.status
    error.fields = data.errors || {}
    throw error
  }
  return data
}

export async function getAll(path, token) {
  const items = []
  let page = 1
  let last = 1
  while (page <= last) {
    const result = await request(`${path}?page=${page}`, { token })
    items.push(...result.data)
    last = result.last_page || 1
    page += 1
  }
  return items
}

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'A'

export const DAYS = [
  ['sat', 'Sat'], ['sun', 'Sun'], ['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'], ['fri', 'Fri'],
]

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

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

export function formatHours(center) {
  if (!center.opens_at || !center.closes_at) return null
  return `${center.opens_at} – ${center.closes_at}`
}

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

export const toLocalInput = (value) => {
  if (!value) return ''
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const fileSize = (bytes = 0) => (bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)
export const isImageName = (name = '') => /\.(png|jpe?g|webp|gif)$/i.test(name)
export const isPdfName = (name = '') => /\.pdf$/i.test(name)
