/**
 * @file View layer + page controller for the Student portal.
 */
import { useCallback, useEffect, useState } from 'react'
import { useToast } from '../../controllers/useToast'
import { AnnouncementFeed } from '../components/Announcements'
import { dueLabel, formatDate, formatDateTime } from '../../models/format'
import { request } from '../../models/api'
import { scheduleText } from '../../models/domain'
import { AssignmentCard } from './Portals'
import { PageHeader, Shell, Stat } from '../components/shared'
import { Empty, Icon, Skeleton, Toast } from '../components/ui'

const NAV = [['overview', 'overview', 'Dashboard'], ['classes', 'book', 'My classes'], ['assignments', 'file', 'Assignments'], ['results', 'checkcircle', 'Results'], ['attendance', 'calendar', 'Attendance'], ['announcements', 'mail', 'Announcements']]
const percent = (value) => value == null ? '—' : `${value}%`
const subjectName = (subject) => typeof subject === 'string' ? subject : subject?.name

/**
 * Attendance totals and percentage for a student.
 *
 * @param {{data: object}} props
 */
function AttendanceSummary({ data }) {
  return <div className="att-chips">{['present', 'late', 'absent', 'excused'].map((status) => <span className={`tally tally-${status}`} key={status}><b>{data[status]}</b>{status}</span>)}<span className="att-rate">{percent(data.rate)} attendance</span></div>
}

/**
 * List of assignment cards for the signed-in student.
 *
 * @param {{items: Array, token: string, user: object, reload: Function, notify: Function}} props
 */
function WorkList({ items, token, user, reload, notify }) {
  if (!items.length) return <section className="card"><Empty icon="file" title="No assignments yet" text="Your teachers’ assignments will appear here." /></section>
  return <div className="stack-cards">{items.map((a) => <AssignmentCard key={a.id} a={a} child={user} token={token} student onChanged={reload} notify={notify} />)}</div>
}

/**
 * Student portal: classes, assignments, grades and announcements.
 *
 * @param {{session: {token: string, user: object}, onLogout: Function}} props
 */
export default function StudentPortal({ session, onLogout }) {
  const [page, setPage] = useState('overview')
  const [result, setResult] = useState(null)
  const [classId, setClassId] = useState(null)
  const [error, setError] = useState('')
  const { toast, notify, dismiss } = useToast()
  const [revision, setRevision] = useState(0)
  const token = session.token
  const reload = useCallback(() => setRevision((n) => n + 1), [])
  const go = (next) => { setClassId(null); setPage(next) }
  const path = page === 'announcements' ? '/portal/announcements' : page === 'classes' && classId ? `/portal/student/classes/${classId}` : `/portal/student/${page}`
  const requestKey = `${path}:${revision}`
  const data = result?.key === requestKey ? result.data : null
  const currentError = result?.key === requestKey ? error : ''
  useEffect(() => {
    let active = true
    request(path, { token }).then((response) => {
      if (active) { setError(''); setResult({ key: requestKey, data: response.data }) }
    }).catch((err) => {
      if (!active) return
      if (err.status === 401) onLogout(false)
      else { setError(err.message); setResult({ key: requestKey, data: null }) }
    })
    return () => { active = false }
  }, [path, requestKey, token, onLogout])
  const titles = { overview: ['My dashboard', 'Your learning at a glance.'], classes: ['My classes', 'Your teachers, schedule and class updates.'], assignments: ['Assignments', 'Review your work and submit answers.'], results: ['Results', 'Grades and feedback released by your teachers.'], attendance: ['Attendance', 'Your attendance by class.'], announcements: ['Announcements', 'Updates from your teachers.'] }
  return <><Shell nav={NAV} page={page} go={go} user={session.user} roleLabel="Student" centerName={session.user.center?.name} onLogout={onLogout}>
    <PageHeader title={titles[page][0]} text={titles[page][1]} action={<button className="btn btn-ghost" onClick={reload}>Refresh</button>} />
    {currentError && <div className="alert alert-error" role="alert">{currentError}<button className="link" onClick={reload}>Try again</button></div>}
    {!data && !currentError && <section className="card"><Skeleton rows={4} /></section>}
    {data && page === 'overview' && <>
      <div className="stats"><Stat icon="book" tone="indigo" label="Classes" value={data.stats.classes} note="your classes" onClick={() => go('classes')} /><Stat icon="file" tone="amber" label="To do" value={data.stats.todo} note={`${data.stats.missing} overdue`} onClick={() => go('assignments')} /><Stat icon="calendar" tone="teal" label="Attendance" value={percent(data.stats.attendance_rate)} note="overall" onClick={() => go('attendance')} /><Stat icon="checkcircle" tone="green" label="Average" value={percent(data.stats.average_percent)} note="released results" onClick={() => go('results')} /></div>
      <div className="split"><section className="card"><header className="card-head"><h2>Due soon</h2><button className="link" onClick={() => go('assignments')}>All assignments</button></header>{data.due_soon.length ? <ul className="mini-list pad">{data.due_soon.map((a) => <li key={a.id}><span className="grow"><b>{a.title}</b><small>{a.section} · {formatDateTime(a.due_at)} · {dueLabel(a.due_at)}</small></span></li>)}</ul> : <Empty icon="file" title="Nothing due soon" text="New assignments will appear here." />}</section><section className="card"><header className="card-head"><h2>Recent announcements</h2><button className="link" onClick={() => go('announcements')}>View all</button></header><AnnouncementFeed items={data.announcements} /></section></div>
      {data.missing.length > 0 && <section className="card"><header className="card-head"><h2>Overdue work</h2></header><ul className="mini-list pad">{data.missing.map((a) => <li key={a.id}><span className="grow"><b>{a.title}</b><small>{a.section} · {dueLabel(a.due_at)}</small></span><button className="link" onClick={() => go('assignments')}>Open assignments</button></li>)}</ul></section>}
    </>}
    {data && page === 'announcements' && <section className="card"><AnnouncementFeed items={data} /></section>}
    {data && page === 'assignments' && <WorkList items={data} token={token} user={session.user} reload={reload} notify={notify} />}
    {data && page === 'classes' && !classId && (data.length ? <div className="class-grid">{data.map((c) => <section className="card class-card" key={c.id}><div className="class-card-top"><span className="symbol"><Icon name="book" /></span><div className="grow"><h3>{c.name}</h3><small>{subjectName(c.subject)}</small></div></div><p>{c.teachers?.map((t) => t.name).join(', ') || 'Teacher not assigned'}</p><p className="muted-cell">{scheduleText(c) || 'Schedule TBA'}{c.room ? ` · ${c.room}` : ''}</p><p className="muted-cell">{c.todo_count} open assignments · {percent(c.attendance_rate)} attendance</p><div className="class-card-actions"><button className="btn btn-primary btn-sm" onClick={() => setClassId(c.id)}>Open class</button></div></section>)}</div> : <section className="card"><Empty icon="book" title="No classes yet" text="Your classes will appear when you are enrolled." /></section>)}
    {data && page === 'classes' && classId && <div className="stack-cards"><button className="btn btn-ghost btn-sm" onClick={() => setClassId(null)}>← All classes</button><section className="card"><header className="card-head"><div><h2>{data.class.name}</h2><p>{subjectName(data.class.subject)} · {scheduleText(data.class) || 'Schedule TBA'}{data.class.room ? ` · ${data.class.room}` : ''}</p><p>{data.class.teachers?.map((t) => t.name).join(', ')}</p></div></header><AttendanceSummary data={data.attendance} /></section><section className="card"><header className="card-head"><h2>Class announcements</h2></header><AnnouncementFeed items={data.announcements} /></section><h3>Class assignments</h3><WorkList items={data.assignments} token={token} user={session.user} reload={reload} notify={notify} /></div>}
    {data && page === 'results' && <div className="stack-cards"><section className="card"><header className="card-head"><div><h2>Overall average: {percent(data.average)}</h2><p>Only published grades are shown.</p></div></header>{data.results.length ? <ul className="mini-list pad">{data.results.map((r) => <li key={r.id}><span className="grow"><b>{r.title}</b><small>{r.section} · {r.marks}/{r.max_marks} · {percent(r.percent)}{r.feedback ? ` · ${r.feedback}` : ''}</small></span></li>)}</ul> : <Empty icon="checkcircle" title="No released results yet" text="Grades and feedback will appear here once your teachers publish them." />}</section></div>}
    {data && page === 'attendance' && <div className="stack-cards"><section className="card"><header className="card-head"><h2>Overall attendance</h2></header><AttendanceSummary data={data.overall} /></section>{data.classes.map((c) => <section className="card" key={c.id}><header className="card-head"><div><h2>{c.name}</h2><p>{c.subject}</p></div></header><AttendanceSummary data={c} />{c.records.length ? <ul className="mini-list pad">{c.records.map((r, i) => <li key={`${r.date}-${i}`}><span className="grow"><b>{formatDate(r.date)}</b><small>{r.note}</small></span><span className="badge badge-muted">{r.status}</span></li>)}</ul> : <p className="muted-cell pad-all">No attendance recorded.</p>}</section>)}</div>}
  </Shell><Toast toast={toast} onDismiss={dismiss} /></>
}
