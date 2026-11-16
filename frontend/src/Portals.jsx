import { useCallback, useEffect, useState } from 'react'
import { request } from './api'
import { scheduleText } from './helpers'
import { PageHeader, Shell, Stat } from './shared'
import { Avatar, Empty, Icon, Skeleton } from './ui'

function usePortal(path, token, onLogout) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setError('')
    try { setData((await request(path, { token })).data) } catch (err) { if (err.status === 401) onLogout(false); else setError(err.message) }
  }, [path, token, onLogout])
  useEffect(() => { Promise.resolve().then(load) }, [load])
  return { data, error, load }
}

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

function ClassLine({ c }) {
  return (
    <li>
      <span className="symbol"><Icon name="book" /></span>
      <span className="grow"><b>{c.subject?.name || c.name}</b><small>{c.name}{c.room ? ` · ${c.room}` : ''}{c.teachers?.length ? ` · ${c.teachers.map((t) => t.name).join(', ')}` : ''}</small></span>
      <span className="muted-cell right">{scheduleText(c) || 'Schedule TBA'}</span>
    </li>
  )
}

export function ParentPortal({ session, onLogout }) {
  const { data, error, load } = usePortal('/portal/parent', session.token, onLogout)
  const children = data?.children || []
  return (
    <Shell nav={[['home', 'overview', 'My family']]} page="home" go={() => {}} user={session.user} roleLabel="Parent" centerName={session.user.center?.name} onLogout={onLogout}>
      <PageHeader title={`Hello, ${session.user.name.split(' ')[0]}`} text="Follow your children’s classes and schedules in one place." />
      {error && <div className="alert alert-error" role="alert"><Icon name="alert" size={17} />{error}<button className="link" onClick={load}>Try again</button></div>}
      <div className="stats stats-3">
        <Stat icon="cap" tone="indigo" label="Children" value={data ? children.length : '—'} note="linked to your account" onClick={() => {}} />
        <Stat icon="book" tone="green" label="Classes" value={data ? children.reduce((n, c) => n + c.student_sections.length, 0) : '—'} note="across all children" onClick={() => {}} />
        <Stat icon="person" tone="amber" label="Your ID" value={session.user.code || '—'} note="share with your center" onClick={() => {}} />
      </div>
      {!data ? <section className="card"><Skeleton rows={4} /></section> : children.length ? (
        <div className="split">
          <div className="stack-cards">
            {children.map((child) => (
              <section className="card" key={child.id}>
                <header className="card-head"><div className="cell"><Avatar name={child.name} /><div><h2>{child.name}</h2><p>{child.code}{child.grade_level ? ` · Grade ${child.grade_level}` : ''}{child.pivot?.relationship ? ` · ${child.pivot.relationship}` : ''}</p></div></div></header>
                {child.student_sections.length ? <ul className="mini-list">{child.student_sections.map((c) => <ClassLine key={c.id} c={c} />)}</ul> : <Empty icon="book" title="Not enrolled yet" text="Classes will appear here once your center enrolls this child." />}
              </section>
            ))}
          </div>
          <CenterCard center={data.profile.center} />
        </div>
      ) : <section className="card"><Empty icon="cap" title="No children linked yet" text="Ask your center administrator to link your children to your account." /></section>}
    </Shell>
  )
}

export function TeacherPortal({ session, onLogout }) {
  const { data, error, load } = usePortal('/portal/teacher', session.token, onLogout)
  const classes = data?.classes || []
  return (
    <Shell nav={[['home', 'overview', 'My classes']]} page="home" go={() => {}} user={session.user} roleLabel="Teacher" centerName={session.user.center?.name} onLogout={onLogout}>
      <PageHeader title={`Hello, ${session.user.name.split(' ')[0]}`} text="Your classes and the students in them." />
      {error && <div className="alert alert-error" role="alert"><Icon name="alert" size={17} />{error}<button className="link" onClick={load}>Try again</button></div>}
      <div className="stats stats-3">
        <Stat icon="book" tone="indigo" label="Classes" value={data ? classes.length : '—'} note="assigned to you" onClick={() => {}} />
        <Stat icon="cap" tone="teal" label="Students" value={data ? data.students_total : '—'} note="across your classes" onClick={() => {}} />
        <Stat icon="person" tone="amber" label="Your ID" value={session.user.code || '—'} note="teacher ID" onClick={() => {}} />
      </div>
      {!data ? <section className="card"><Skeleton rows={4} /></section> : classes.length ? (
        <div className="stack-cards">
          {classes.map((c) => (
            <section className="card" key={c.id}>
              <header className="card-head"><div><h2>{c.name}</h2><p>{c.subject?.name}{scheduleText(c) ? ` · ${scheduleText(c)}` : ''}{c.room ? ` · ${c.room}` : ''}</p></div><span className="badge badge-muted">{c.students_count} students</span></header>
              {c.students.length ? <ul className="chips-list">{c.students.map((s) => <li key={s.id}><Avatar name={s.name} size="sm" /><span><b>{s.name}</b><small>{s.code}</small></span></li>)}</ul> : <p className="muted-cell pad">No students enrolled yet.</p>}
            </section>
          ))}
        </div>
      ) : <section className="card"><Empty icon="book" title="No classes assigned yet" text="Your center administrator will assign you to classes." /></section>}
    </Shell>
  )
}
