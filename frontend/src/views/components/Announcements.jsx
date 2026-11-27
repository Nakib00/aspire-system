/**
 * @file View layer: announcement feed and the teacher announcement composer.
 */
import { useCallback, useEffect, useState } from 'react'
import { formatDateTime } from '../../models/format'
import { getAll, request } from '../../models/api'
import { Empty, Modal, Skeleton } from './ui'

/**
 * Read-only list of announcements for parents and students.
 *
 * @param {{items: Array}} props
 */
export function AnnouncementFeed({ items }) {
  if (!items.length) return <Empty icon="book" title="No announcements yet" text="Class announcements will appear here." />
  return <ul className="mini-list pad">{items.map((item) => <li key={item.id}><div className="grow"><b>{item.pinned ? 'Pinned · ' : ''}{item.title || 'Announcement'}</b><small>{item.section?.name ? `${item.section.name} · ` : ''}{item.teacher?.name} · {formatDateTime(item.created_at)}</small><p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{item.body}</p></div></li>)}</ul>
}

/**
 * Drawer where a teacher reads and posts announcements for one class.
 *
 * @param {{cls: object, token: string, onClose: () => void}} props
 */
export function TeacherAnnouncements({ cls, token, onClose }) {
  const [items, setItems] = useState(null)
  const [editing, setEditing] = useState(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pinned, setPinned] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => { try { setItems(await getAll(`/teacher/classes/${cls.id}/announcements`, token)); setError('') } catch (err) { setError(err.message) } }, [cls.id, token])
  useEffect(() => { Promise.resolve().then(load) }, [load])
  const reset = () => { setEditing(null); setTitle(''); setBody(''); setPinned(false) }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('')
    try { await request(editing ? `/teacher/announcements/${editing.id}` : `/teacher/classes/${cls.id}/announcements`, { token, method: editing ? 'PATCH' : 'POST', body: { title: title.trim() || null, body: body.trim(), pinned } }); reset(); await load() } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  async function remove(item) {
    if (!window.confirm('Delete this announcement?')) return
    setBusy(true); setError('')
    try { await request(`/teacher/announcements/${item.id}`, { token, method: 'DELETE' }); if (editing?.id === item.id) reset(); await load() } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <Modal drawer title="Class announcements" subtitle={cls.name} onClose={onClose}><div className="drawer-body">
    <form className="stack-cards" onSubmit={save}>
      <label className="field"><span className="field-label">Title (optional)</span><input value={title} maxLength={255} onChange={(e) => setTitle(e.target.value)} /></label>
      <label className="field"><span className="field-label">Message</span><textarea value={body} maxLength={5000} rows={4} required onChange={(e) => setBody(e.target.value)} /></label>
      <label><input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pin announcement</label>
      <div><button className="btn btn-primary btn-sm" disabled={busy || !body.trim()}>{editing ? 'Save changes' : 'Post announcement'}</button>{editing && <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>Cancel edit</button>}</div>
    </form>
    {error && <p className="alert alert-error" role="alert">{error}</p>}
    {!items ? <Skeleton rows={3} /> : !items.length ? <Empty icon="book" title="No announcements yet" text="Post a message for students and parents." /> : <ul className="mini-list">{items.map((item) => <li key={item.id}><div className="grow"><b>{item.pinned ? 'Pinned · ' : ''}{item.title || 'Announcement'}</b><small>{item.teacher?.name} · {formatDateTime(item.created_at)}</small><p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{item.body}</p><button type="button" className="link" disabled={busy} onClick={() => { setEditing(item); setTitle(item.title || ''); setBody(item.body); setPinned(item.pinned) }}>Edit</button>{' · '}<button type="button" className="link" disabled={busy} onClick={() => remove(item)}>Delete</button></div></li>)}</ul>}
  </div></Modal>
}
