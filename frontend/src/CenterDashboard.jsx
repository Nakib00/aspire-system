import { Stat } from './shared'
import { Avatar, Empty, Icon, Skeleton } from './ui'

const DAY_NAMES = { sat: 'Saturday', sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday' }

export default function CenterDashboard({ data, loading, go, openModal }) {
  const c = data?.counts
  const a = data?.attention
  const n = (v) => (loading || v === undefined ? '—' : v)
  const todo = a ? [
    a.students_without_guardian > 0 && { key: 'g', text: <><b>{a.students_without_guardian}</b> {a.students_without_guardian === 1 ? 'student has' : 'students have'} no parent or guardian linked</>, label: 'Review students', run: () => go('students') },
    a.students_not_enrolled > 0 && { key: 'e', text: <><b>{a.students_not_enrolled}</b> {a.students_not_enrolled === 1 ? 'student is' : 'students are'} not enrolled in any class</>, label: 'Open classes', run: () => go('classes') },
    a.classes_without_teacher > 0 && { key: 't', text: <><b>{a.classes_without_teacher}</b> active {a.classes_without_teacher === 1 ? 'class has' : 'classes have'} no teacher</>, label: 'Assign teachers', run: () => go('classes') },
    a.full_classes > 0 && { key: 'f', text: <><b>{a.full_classes}</b> {a.full_classes === 1 ? 'class is' : 'classes are'} full</>, label: 'View classes', run: () => go('classes') },
  ].filter(Boolean) : []
  const max = Math.max(1, ...(data?.enrollment_by_subject || []).map((s) => Number(s.students)))

  return (
    <>
      <div className="stats">
        <Stat icon="cap" tone="indigo" label="Students" value={n(c?.students)} note="active students" onClick={() => go('students')} />
        <Stat icon="family" tone="teal" label="Parents" value={n(c?.parents)} note="with a dashboard login" onClick={() => go('parents')} />
        <Stat icon="person" tone="amber" label="Teachers" value={n(c?.teachers)} note="active teachers" onClick={() => go('teachers')} />
        <Stat icon="book" tone="green" label="Classes" value={n(c?.classes)} note={`across ${n(c?.subjects)} subjects`} onClick={() => go('classes')} />
      </div>

      <div className="split">
        <section className="card">
          <header className="card-head"><div><h2>Today’s classes</h2><p>{data ? DAY_NAMES[data.today.day] : 'Today'}’s schedule.</p></div><button className="link" onClick={() => go('classes')}>All classes</button></header>
          {loading ? <Skeleton rows={3} /> : data?.today.classes.length ? (
            <ul className="mini-list pad">
              {data.today.classes.map((cl) => (
                <li key={cl.id}>
                  <span className="time-chip">{cl.starts_at || '—'}</span>
                  <span className="grow"><b>{cl.name}</b><small>{cl.subject?.name}{cl.teachers?.length ? ` · ${cl.teachers.map((t) => t.name).join(', ')}` : ''}{cl.room ? ` · ${cl.room}` : ''}</small></span>
                  <span className="muted-cell">{cl.students_count} students</span>
                </li>
              ))}
            </ul>
          ) : <Empty icon="calendar" title="No classes today" text="Classes scheduled for today will show up here." />}
        </section>

        <section className="card">
          <header className="card-head"><div><h2>Needs attention</h2><p>Gaps to close so everything runs smoothly.</p></div></header>
          {loading ? <Skeleton rows={3} /> : todo.length ? (
            <ul className="todo">{todo.map((t) => <li key={t.key}><span className="todo-dot"><Icon name="alert" size={15} /></span><span>{t.text}</span><button className="btn btn-ghost btn-sm" onClick={t.run}>{t.label}</button></li>)}</ul>
          ) : <Empty icon="check" title="All caught up" text="Every student has a guardian and a class, and every class has a teacher." />}
        </section>
      </div>

      <div className="split">
        <section className="card">
          <header className="card-head"><div><h2>Enrollment by subject</h2><p>Students enrolled in each subject.</p></div></header>
          {loading ? <Skeleton rows={3} /> : data?.enrollment_by_subject.length ? (
            <ul className="bars">
              {data.enrollment_by_subject.map((s) => (
                <li key={s.name}><span>{s.name}</span><span className="bar"><i style={{ width: `${(Number(s.students) / max) * 100}%` }} /></span><b>{s.students}</b></li>
              ))}
            </ul>
          ) : <Empty icon="book" title="No subjects yet" text="Create subjects and classes to see enrollment here." action={() => openModal({ type: 'subject' })} actionLabel="Add subject" />}
        </section>

        <section className="card">
          <header className="card-head"><div><h2>Quick add</h2><p>Common tasks in one click.</p></div></header>
          <div className="quick">
            <button onClick={() => openModal({ type: 'person', role: 'student' })}><span className="stat-icon tone-indigo"><Icon name="cap" /></span><span><b>Add student</b><small>With parents or guardians</small></span></button>
            <button onClick={() => openModal({ type: 'person', role: 'teacher' })}><span className="stat-icon tone-amber"><Icon name="person" /></span><span><b>Add teacher</b><small>Gets a login</small></span></button>
            <button onClick={() => openModal({ type: 'subject' })}><span className="stat-icon tone-green"><Icon name="book" /></span><span><b>Add subject</b><small>Math, English, Art…</small></span></button>
            <button onClick={() => openModal({ type: 'class' })}><span className="stat-icon tone-teal"><Icon name="calendar" /></span><span><b>Add class</b><small>Schedule and enroll</small></span></button>
          </div>
          {data?.recent_students.length > 0 && (
            <>
              <h3 className="sub-head">Recently added students</h3>
              <ul className="mini-list pad">{data.recent_students.map((s) => <li key={s.id}><Avatar name={s.name} /><span className="grow"><b>{s.name}</b><small>{s.code}{s.grade_level ? ` · Grade ${s.grade_level}` : ''}</small></span></li>)}</ul>
            </>
          )}
        </section>
      </div>
    </>
  )
}
