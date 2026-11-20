import { useCallback, useEffect, useState } from 'react'
import { TeacherAnnouncements } from './Announcements'
import { AssignmentForm, AssignmentsPage, ReviewPage } from './Assignments'
import AttendancePage from './Attendance'
import { dueLabel, formatDateTime, getAll, request } from './api'
import { scheduleText } from './helpers'
import { PageHeader, Shell, Stat } from './shared'
import { Avatar, ConfirmDialog, Empty, Icon, Modal, Skeleton, Toast } from './ui'

const NAV = [
  ['dashboard', 'overview', 'Dashboard'],
  ['classes', 'book', 'My classes'],
  ['attendance', 'checkcircle', 'Attendance'],
  ['assignments', 'file', 'Assignments'],
]

function Dashboard({ data, loading, go, openReview }) {
  const n = (v) => (loading || v === undefined ? '—' : v)
  const c = data?.counts
  return (
    <>
      <div className="stats">
        <Stat icon="book" tone="indigo" label="Classes" value={n(c?.classes)} note="active classes" onClick={() => go('classes')} />
        <Stat icon="cap" tone="teal" label="Students" value={n(c?.students)} note="across your classes" onClick={() => go('classes')} />
        <Stat icon="file" tone={c?.to_review ? 'rose' : 'green'} label="To review" value={n(c?.to_review)} note="submissions waiting" onClick={() => go('assignments')} />
        <Stat icon="calendar" tone="amber" label="Open assignments" value={n(c?.open_assignments)} note="published, not yet due" onClick={() => go('assignments')} />
      </div>

      <div className="split">
        <section className="card">
          <header className="card-head"><div><h2>Today’s classes</h2><p>Take attendance right from here.</p></div></header>
          {loading ? <Skeleton rows={3} /> : data?.today.length ? (
            <ul className="mini-list pad">
              {data.today.map((cl) => (
                <li key={cl.id}>
                  <span className="time-chip">{cl.starts_at || '—'}</span>
                  <span className="grow"><b>{cl.name}</b><small>{cl.subject?.name}{cl.room ? ` · ${cl.room}` : ''} · {cl.students_count} students</small></span>
                  {cl.attendance_taken
                    ? <span className="badge badge-success"><i />Taken</span>
                    : <button className="btn btn-primary btn-sm" onClick={() => go('attendance', { classId: cl.id })}>Take attendance</button>}
                </li>
              ))}
            </ul>
          ) : <Empty icon="calendar" title="No classes scheduled today" text="You can still take attendance for any class from the Attendance page." action={null} />}
        </section>

        <section className="card">
          <header className="card-head"><div><h2>Waiting for review</h2><p>Submissions that still need a grade.</p></div></header>
          {loading ? <Skeleton rows={3} /> : data?.to_review.length ? (
            <ul className="todo">
              {data.to_review.map((a) => <li key={a.id}><span className="todo-dot"><Icon name="file" size={15} /></span><span><b>{a.title}</b><small className="block">{a.section}</small></span><button className="btn btn-primary btn-sm" onClick={() => openReview(a.id)}>Review {a.pending}</button></li>)}
            </ul>
          ) : <Empty icon="check" title="Nothing to review" text="New submissions will show up here." />}
        </section>
      </div>

      <section className="card">
        <header className="card-head"><div><h2>Upcoming deadlines</h2><p>Published assignments that are due soon.</p></div><button className="link" onClick={() => go('assignments')}>All assignments</button></header>
        {loading ? <Skeleton rows={2} /> : data?.upcoming.length ? (
          <ul className="mini-list pad">
            {data.upcoming.map((a) => (
              <li key={a.id}>
                <span className="symbol"><Icon name="file" /></span>
                <span className="grow"><b>{a.title}</b><small>{a.section} · {formatDateTime(a.due_at)} · {dueLabel(a.due_at)}</small></span>
                <span className="muted-cell">{a.submissions_count}/{a.students_count} submitted</span>
                <button className="btn btn-ghost btn-sm" onClick={() => openReview(a.id)}>Open</button>
              </li>
            ))}
          </ul>
        ) : <Empty icon="file" title="No upcoming deadlines" text="Create an assignment to get started." action={null} />}
      </section>
    </>
  )
}

function ClassesPage({ classes, loading, go, openModal }) {
  if (loading) return <section className="card"><Skeleton rows={4} /></section>
  if (!classes.length) return <section className="card"><Empty icon="book" title="No classes assigned yet" text="Your center administrator will assign you to classes." /></section>
  return (
    <div className="class-grid">
      {classes.map((c) => (
        <section className="card class-card" key={c.id}>
          <div className="class-card-top"><span className="symbol"><Icon name="book" /></span><div className="grow"><h3>{c.name}</h3><small>{c.subject?.name}</small></div><span className="badge badge-muted">{c.students_count} students</span></div>
          <div className="detail"><Icon name="clock" /><div><small>Schedule</small><span>{scheduleText(c) || <em>Not set</em>}</span></div></div>
          <div className="detail"><Icon name="location" /><div><small>Room</small><span>{c.room || <em>Not set</em>}</span></div></div>
          <div className="class-card-actions">
            <button className="btn btn-primary btn-sm" onClick={() => go('attendance', { classId: c.id })}><Icon name="checkcircle" size={15} />Attendance</button>
            <button className="btn btn-ghost btn-sm" onClick={() => openModal({ type: 'assignment', preset: { section_id: c.id } })}><Icon name="plus" size={15} />Assignment</button>
            <button className="btn btn-ghost btn-sm" onClick={() => openModal({ type: 'students', item: c })}>Students</button>
            <button className="btn btn-ghost btn-sm" onClick={() => openModal({ type: 'announcements', item: c })}>Announcements</button>
          </div>
        </section>
      ))}
    </div>
  )
}

function StudentsDrawer({ cls, token, onClose }) {
  const [students, setStudents] = useState(null)
  useEffect(() => { request(`/teacher/classes/${cls.id}`, { token }).then((r) => setStudents(r.data.students)).catch(() => setStudents([])) }, [cls.id, token])
  return (
    <Modal drawer title={cls.name} subtitle={`${cls.subject?.name || ''} · students`} onClose={onClose}>
      <div className="drawer-body">
        {!students ? <Skeleton rows={4} /> : students.length ? (
          <ul className="mini-list">{students.map((s) => <li key={s.id}><Avatar name={s.name} /><span className="grow"><b>{s.name}</b><small>{s.code}{s.grade_level ? ` · Grade ${s.grade_level}` : ''}</small></span></li>)}</ul>
        ) : <p className="muted-cell">No students enrolled yet.</p>}
      </div>
    </Modal>
  )
}

export default function TeacherWorkspace({ session, onLogout }) {
  const token = session.token
  const [page, setPage] = useState('dashboard')
  const [attendanceClass, setAttendanceClass] = useState(null)
  const [reviewId, setReviewId] = useState(null)
  const [classes, setClasses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(null)
  const [working, setWorking] = useState(false)

  const refresh = useCallback(async () => {
    setError('')
    try {
      const [c, a, d] = await Promise.all([getAll('/teacher/classes', token), getAll('/teacher/assignments', token), request('/teacher/dashboard', { token })])
      setClasses(c); setAssignments(a); setDashboard(d.data)
    } catch (err) {
      if (err.status === 401) { onLogout(false); return }
      setError(err.message)
    } finally { setLoading(false) }
  }, [token, onLogout])
  useEffect(() => { Promise.resolve().then(refresh) }, [refresh])

  const notify = useCallback((text, type) => setToast({ text, type }), [])
  const dismissToast = useCallback(() => setToast(null), [])
  const closeModal = useCallback(() => setModal(null), [])
  const go = (id, opts = {}) => { setPage(id); setReviewId(null); if (opts.classId) setAttendanceClass(opts.classId) }
  const openReview = (id) => { setPage('assignments'); setReviewId(id) }

  async function saveAssignment(payload, files, removed) {
    const editing = modal.item
    const res = await request(editing ? `/teacher/assignments/${editing.id}` : '/teacher/assignments', { token, method: editing ? 'PATCH' : 'POST', body: payload })
    const id = res.data.id
    try {
      for (const attachmentId of removed) await request(`/teacher/assignments/${id}/attachments/${attachmentId}`, { token, method: 'DELETE' })
      for (const file of files) { const body = new FormData(); body.append('file', file); await request(`/teacher/assignments/${id}/attachments`, { token, method: 'POST', body }) }
    } catch (err) {
      notify(`Saved, but a file failed: ${err.message}`, 'error'); await refresh(); return
    }
    notify(editing ? 'Assignment updated.' : payload.status === 'published' ? 'Assignment published.' : 'Draft saved.')
    await refresh()
  }

  async function removeAssignment() {
    setWorking(true)
    try { await request(`/teacher/assignments/${modal.item.id}`, { token, method: 'DELETE' }); notify('Assignment deleted.'); setModal(null); await refresh() } catch (err) { notify(err.message, 'error'); setModal(null) } finally { setWorking(false) }
  }

  const titles = {
    dashboard: [`Hello, ${session.user.name.split(' ')[0]}`, session.user.center ? `Here’s your day at ${session.user.center.name}.` : 'Here’s your day at a glance.'],
    classes: ['My classes', 'The classes you teach and who’s in them.'],
    attendance: ['Attendance', 'Take attendance in a few taps and see who’s showing up.'],
    assignments: ['Assignments', 'Create work, collect submissions, review and grade.'],
  }
  const reviewing = page === 'assignments' && reviewId
  const action = page === 'assignments' && !reviewing && <button className="btn btn-primary" onClick={() => setModal({ type: 'assignment' })} disabled={!classes.length}><Icon name="plus" />New assignment</button>

  return (
    <>
      <Shell nav={NAV} page={page} go={go} user={session.user} roleLabel="Teacher" centerName={session.user.center?.name} onLogout={onLogout}>
        {!reviewing && <PageHeader title={titles[page][0]} text={titles[page][1]} action={action || null} />}
        {error && <div className="alert alert-error" role="alert"><Icon name="alert" size={17} />{error}<button className="link" onClick={refresh}>Try again</button></div>}
        {page === 'dashboard' && <Dashboard data={dashboard} loading={loading} go={go} openReview={openReview} />}
        {page === 'classes' && <ClassesPage classes={classes} loading={loading} go={go} openModal={setModal} />}
        {page === 'attendance' && !loading && <AttendancePage classes={classes} initialClassId={attendanceClass} token={token} notify={notify} onSaved={refresh} />}
        {page === 'assignments' && !reviewing && <AssignmentsPage assignments={assignments} classes={classes} loading={loading} openModal={setModal} openReview={openReview} />}
        {reviewing && <ReviewPage key={reviewId} assignmentId={reviewId} token={token} onBack={() => setReviewId(null)} notify={notify} onChanged={refresh} />}
      </Shell>

      {modal?.type === 'assignment' && <AssignmentForm assignment={modal.item} preset={modal.preset} classes={classes} onClose={closeModal} onSave={saveAssignment} />}
      {modal?.type === 'students' && <StudentsDrawer cls={modal.item} token={token} onClose={closeModal} />}
      {modal?.type === 'announcements' && <TeacherAnnouncements cls={modal.item} token={token} onClose={closeModal} />}
      {modal?.type === 'deleteAssignment' && <ConfirmDialog danger busy={working} title={`Delete “${modal.item.title}”?`} text="This removes the assignment and its files. Assignments that already have submissions can’t be deleted — close them instead." confirmLabel="Delete" onConfirm={removeAssignment} onClose={closeModal} />}
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  )
}
