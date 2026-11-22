/**
 * @file Model layer: domain constants and pure helpers shared by several views.
 */
/** Days of the week a class or center can operate, as `[apiCode, label]` pairs (the week starts on Saturday). */
export const DAYS = [
  ['sat', 'Sat'], ['sun', 'Sun'], ['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'], ['fri', 'Fri'],
]

/**
 * Case-insensitive substring test used by every search box.
 *
 * @param {string} text - Text to search in.
 * @param {string} query - Raw text typed by the user.
 * @returns {boolean}
 */
export const matches = (text, query) => text.toLowerCase().includes(query.trim().toLowerCase())

/** Display metadata (labels, icon, API path segment) for the roles a Center Admin manages. */
export const ROLE_META = {
  student: { label: 'Student', plural: 'Students', icon: 'cap', path: 'students' },
  parent: { label: 'Parent', plural: 'Parents', icon: 'family', path: 'parents' },
  teacher: { label: 'Teacher', plural: 'Teachers', icon: 'person', path: 'teachers' },
}

/**
 * Describe a class schedule, e.g. `Sat Mon · 16:00–17:30`.
 *
 * @param {{days?: string[], starts_at?: string, ends_at?: string}} c
 * @returns {string} Empty when nothing is scheduled.
 */
export const scheduleText = (c) => [
  c.days?.length ? DAYS.filter(([d]) => c.days.includes(d)).map(([, l]) => l).join(' ') : null,
  c.starts_at && c.ends_at ? `${c.starts_at}–${c.ends_at}` : null,
].filter(Boolean).join(' · ')

/**
 * Build the API payload for a guardian form (link an existing parent or create a new one).
 *
 * @param {object} g - Guardian form state; `g.mode` is `existing` or `new`.
 * @returns {object}
 */
export const guardianPayload = (g) => (g.mode === 'existing'
  ? { parent_id: Number(g.parent_id), relationship: g.relationship || null }
  : { name: g.name, email: g.email, phone: g.phone || null, password: g.password, relationship: g.relationship || null })
