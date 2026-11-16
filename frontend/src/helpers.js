import { DAYS } from './api'

export const matches = (text, query) => text.toLowerCase().includes(query.trim().toLowerCase())

export const ROLE_META = {
  student: { label: 'Student', plural: 'Students', icon: 'cap', path: 'students' },
  parent: { label: 'Parent', plural: 'Parents', icon: 'family', path: 'parents' },
  teacher: { label: 'Teacher', plural: 'Teachers', icon: 'person', path: 'teachers' },
}

export const scheduleText = (c) => [
  c.days?.length ? DAYS.filter(([d]) => c.days.includes(d)).map(([, l]) => l).join(' ') : null,
  c.starts_at && c.ends_at ? `${c.starts_at}–${c.ends_at}` : null,
].filter(Boolean).join(' · ')

export const guardianPayload = (g) => (g.mode === 'existing'
  ? { parent_id: Number(g.parent_id), relationship: g.relationship || null }
  : { name: g.name, email: g.email, phone: g.phone || null, password: g.password, relationship: g.relationship || null })
