/**
 * @file View layer + page controller for the Parent portal (also exports the shared AssignmentCard).
 */
import { useCallback, useEffect, useState } from 'react'
import { useToast } from '../../controllers/useToast'
import { AnnouncementFeed } from '../components/Announcements'
import AssignmentContent, { FilePreview } from '../components/AssignmentContent'
import { dueLabel, formatDateTime } from '../../models/format'
import { request } from '../../models/api'
import { scheduleText } from '../../models/domain'
import { PageHeader, Shell, Stat } from '../components/shared'
import { Avatar, Empty, Icon, Skeleton, Toast } from '../components/ui'

const NAV = [['home', 'overview', 'My family'], ['assignments', 'file', 'Assignments'], ['announcements', 'book', 'Announcements']]

/**
 * Contact card for the child's center.
 *
 * @param {{center: object}} props
 */
function CenterCard({ center }) {
  if (!center) return null
  return (
    <section className="card">
      <header className="card-head"><div><h2>{center.name}</h2><p>Your center’s contact details.</p></div></header>
      <div className="drawer-body">
        <div className="detail"><Icon name="location" /><div><small>Address</small><span>{[center.address, center.city].filter(Boolean).join(', ') || <em>Not provided</em>}</span></div></div>
        <div className="detail"><Icon name="phone" /><div><small>Phone</small><span>{center.phone || <em>Not provided</em>}</span></div></div>
        <div className="detail"><Icon name="mail" /><div><small>Email</small><span>{center.email || <em>Not provided</em>}</span></div></div>
      </div>
    </section>
  )
}

/**
 * One line describing a class a child attends.
 *
 * @param {{c: object}} props
 */
function ClassLine({ c }) {
  return (
    <li>
      <span className="symbol"><Icon name="book" /></span>
      <span className="grow"><b>{c.subject?.name || c.name}</b><small>{c.name}{c.room ? ` · ${c.room}` : ''}{c.teachers?.length ? ` · ${c.teachers.map((t) => t.name).join(', ')}` : ''}</small></span>
      <span className="muted-cell right">{scheduleText(c) || 'Schedule TBA'}</span>
    </li>
  )
}

/**
 * Present / late / absent counts for a child.
 *
 * @param {{attendance: object}} props
 */
function AttendanceChips({ attendance }) {
  const total = Object.values(attendance || {}).reduce((a, b) => a + b, 0)
  if (!total) return <p className="muted-cell pad-all">No attendance recorded in the last 60 days.</p>
  const counted = attendance.present + attendance.late + attendance.absent
  const rate = counted ? Math.round(((attendance.present + attendance.late) / counted) * 100) : null
  return (
    <div className="att-chips">
      <span className="tally tally-present"><b>{attendance.present}</b>Present</span>
      <span className="tally tally-late"><b>{attendance.late}</b>Late</span>
      <span className="tally tally-absent"><b>{attendance.absent}</b>Absent</span>
      <span className="tally tally-excused"><b>{attendance.excused}</b>Excused</span>
      {rate !== null && <span className="att-rate">{rate}% attendance · last 60 days</span>}
    </div>
  )
}

/**
 * Resolve the display status of an assignment for a student.
 *
 * @param {object} a - Assignment with the student's submission.
 * @returns {string}
 */
function statusOf(a) {
  if (a.grade) return ['success', `Graded · ${a.grade.marks}/${a.max_marks}`]
  if (a.submission) return [a.submission.status === 'late' ? 'warn' : 'info', a.locked ? 'Submitted · awaiting release' : a.submission.status === 'late' ? 'Submitted late' : 'Submitted']
  if (a.status === 'closed') return ['muted', 'Closed']
  return new Date(a.due_at) < new Date() ? ['warn', 'Overdue'] : ['muted', 'Not submitted']
}

/**
 * Assignment with its status; lets a student (or parent on their behalf) submit work.
 *
 * @param {{a: object, child: object, token: string, onChanged: Function, notify: Function, student?: boolean}} props
 */
export function AssignmentCard({ a, child, token, onChanged, notify, student = false }) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [tone, label] = statusOf(a)
  const canSubmit = a.status === 'published' && !a.locked

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const body = new FormData()
      if (file) body.append('file', file)
      if (text.trim()) body.append('text_answer', text.trim())
      await request(student ? `/portal/student/assignments/${a.id}/submission` : `/portal/parent/children/${child.id}/assignments/${a.id}/submission`, { token, method: 'POST', body })
      notify('Work submitted.'); setFile(null); setText(''); await onChanged()
    } catch (err) { notify(err.message, 'error') } finally { setBusy(false) }
  }

  return (
    <section className="card assignment-card">
      <button className="assignment-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="symbol"><Icon name="file" /></span>
        <span className="grow"><b>{a.title}</b><small>{a.section?.subject?.name || a.section?.name} · Due {formatDateTime(a.due_at)} · {dueLabel(a.due_at)}</small></span>
        <span className={`badge badge-${tone}`}><i />{label}</span>
        <Icon name="chevron" size={16} className={open ? 'turn' : ''} />
      </button>
      {open && (
        <div className="assignment-body">
          <AssignmentContent assignment={a} />

          {a.grade && (
            <div className="grade-card"><div><b>{a.grade.marks}<em> / {a.max_marks}</em></b><small>Teacher’s grade</small></div>{a.grade.feedback && <p>“{a.grade.feedback}”</p>}</div>
          )}

          {a.submission && (
            <div className="work">
              <div className="work-meta"><span><Icon name="clock" size={15} />Submitted {formatDateTime(a.submission.submitted_at)}</span></div>
              {a.submission.text_answer && <p className="answer">{a.submission.text_answer}</p>}
              <FilePreview url={a.submission.file_url} name={a.submission.original_name} />
            </div>
          )}

          {canSubmit ? (
            <form className="work work-empty" onSubmit={submit}>
              <h4>{a.submission ? 'Replace submission' : student ? 'Submit your work' : `Submit ${child.name.split(' ')[0]}’s work`}</h4>
              <label className="dropzone small"><Icon name="upload" size={18} /><span>{file ? file.name : 'Attach a photo or PDF of the work'}</span><input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt" onChange={(e) => setFile(e.target.files[0] || null)} /></label>
              <textarea rows="2" value={text} onChange={(e) => setText(e.target.value)} placeholder="Or type an answer" aria-label="Typed answer" />
              <button className="btn btn-primary btn-sm" disabled={busy || (!file && !text.trim())}>{busy ? 'Submitting…' : 'Submit work'}</button>
            </form>
          ) : a.locked ? <p className="muted-cell">This work has been graded, so it can’t be changed.</p> : a.status === 'closed' ? <p className="muted-cell">This assignment is closed for submissions.</p> : null}
        </div>
      )}
    </section>
  )
}

/**
 * Parent portal: progress, attendance, assignments and announcements for each child.
 *
 * @param {{session: {token: string, user: object}, onLogout: Function}} props
 */
export function ParentPortal({ session, onLogout }) {
  const token = session.token
  const [page, setPage] = useState('home')
  const [data, setData] = useState(null)
  const [work, setWork] = useState({})
  const [announcements, setAnnouncements] = useState([])
  const [error, setError] = useState('')
  const { toast, notify, dismiss } = useToast()

  const load = useCallback(async () => {
    setError('')
    try {
      const res = (await request('/portal/parent', { token })).data
      setData(res)
      setAnnouncements((await request('/portal/announcements', { token })).data)
      const lists = await Promise.all(res.children.map((c) => request(`/portal/parent/children/${c.id}/assignments`, { token }).then((r) => [c.id, r.data])))
      setWork(Object.fromEntries(lists))
    } catch (err) { if (err.status === 401) onLogout(false); else setError(err.message) }
  }, [token, onLogout])
  useEffect(() => { Promise.resolve().then(load) }, [load])

  const children = data?.children || []
  const all = Object.values(work).flat()
  const todo = all.filter((a) => a.status === 'published' && !a.submission && new Date(a.due_at) > new Date()).length

  return (
    <>
      <Shell nav={NAV} page={page} go={setPage} user={session.user} roleLabel="Parent" centerName={session.user.center?.name} onLogout={onLogout}>
        <PageHeader title={page === 'home' ? `Hello, ${session.user.name.split(' ')[0]}` : page === 'announcements' ? 'Announcements' : 'Assignments'} text={page === 'home' ? 'Follow your children’s classes, attendance and schedules in one place.' : page === 'announcements' ? 'Updates from your children’s classes.' : 'See homework, submit work and read your teacher’s feedback.'} />
        {error && <div className="alert alert-error" role="alert"><Icon name="alert" size={17} />{error}<button className="link" onClick={load}>Try again</button></div>}
        <div className="stats stats-3">
          <Stat icon="cap" tone="indigo" label="Children" value={data ? children.length : '—'} note="linked to your account" onClick={() => setPage('home')} />
          <Stat icon="file" tone={todo ? 'amber' : 'green'} label="To do" value={data ? todo : '—'} note="assignments not yet submitted" onClick={() => setPage('assignments')} />
          <Stat icon="person" tone="teal" label="Your ID" value={session.user.code || '—'} note="share with your center" onClick={() => setPage('home')} />
        </div>

        {!data ? <section className="card"><Skeleton rows={4} /></section> : !children.length ? (
          <section className="card"><Empty icon="cap" title="No children linked yet" text="Ask your center administrator to link your children to your account." /></section>
        ) : page === 'announcements' ? <section className="card"><AnnouncementFeed items={announcements} /></section> : page === 'home' ? (
          <div className="split">
            <div className="stack-cards">
              {children.map((child) => (
                <section className="card" key={child.id}>
                  <header className="card-head"><div className="cell"><Avatar name={child.name} /><div><h2>{child.name}</h2><p>{child.code}{child.grade_level ? ` · Grade ${child.grade_level}` : ''}{child.pivot?.relationship ? ` · ${child.pivot.relationship}` : ''}</p></div></div></header>
                  <AttendanceChips attendance={child.attendance} />
                  {child.student_sections.length ? <ul className="mini-list">{child.student_sections.map((c) => <ClassLine key={c.id} c={c} />)}</ul> : <Empty icon="book" title="Not enrolled yet" text="Classes will appear here once your center enrolls this child." />}
                </section>
              ))}
            </div>
            <CenterCard center={data.profile.center} />
          </div>
        ) : (
          <div className="stack-cards">
            {children.map((child) => (
              <div key={child.id} className="child-block">
                <h3 className="block-title"><Avatar name={child.name} size="sm" />{child.name}</h3>
                {(work[child.id] || []).length ? (work[child.id] || []).map((a) => <AssignmentCard key={a.id} a={a} child={child} token={token} onChanged={load} notify={notify} />)
                  : <section className="card"><Empty icon="file" title="No assignments yet" text={`Assignments from ${child.name.split(' ')[0]}’s teachers will appear here.`} /></section>}
              </div>
            ))}
          </div>
        )}
      </Shell>
      <Toast toast={toast} onDismiss={dismiss} />
    </>
  )
}

