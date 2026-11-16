import { useMemo, useState } from 'react'
import { DAYS } from './api'
import { matches, scheduleText } from './helpers'
import { Toolbar } from './shared'
import { Avatar, Empty, Field, Icon, Modal, Skeleton, StatusBadge } from './ui'

const val = (v) => (v === null || v === undefined ? '' : v)

/* --------------------------------------------------------------- subjects */

export function SubjectsPage({ subjects, loading, openModal, goClasses }) {
  const [query, setQuery] = useState('')
  const list = useMemo(() => subjects.filter((s) => matches(`${s.name} ${s.code || ''}`, query)), [subjects, query])
  return (
    <section className="card">
      <Toolbar query={query} setQuery={setQuery} placeholder="Search subjects" />
      {loading ? <Skeleton /> : list.length ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Subject</th><th>Description</th><th>Classes</th><th>Students</th><th>Status</th><th /></tr></thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td><div className="cell"><span className="symbol"><Icon name="book" /></span><span><b>{s.name}</b><small>{s.code || '—'}</small></span></div></td>
                  <td className="muted-cell">{s.description || '—'}</td>
                  <td><button className="link" onClick={() => goClasses(s.id)}>{s.sections_count} {s.sections_count === 1 ? 'class' : 'classes'}</button></td>
                  <td>{s.students_count}</td>
                  <td><StatusBadge active={s.status === 'active'} /></td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openModal({ type: 'class', preset: { subject_id: s.id } })}>Add class</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openModal({ type: 'subject', item: s })}>Edit</button>
                      <button className="icon-btn" aria-label={`Delete ${s.name}`} title="Delete" onClick={() => openModal({ type: 'delete', role: 'subject', item: s })}><Icon name="trash" size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty icon="book" title={query ? 'No matching subjects' : 'No subjects yet'} text={query ? 'Try a different search.' : 'Subjects are what you teach — like Math, English or Art. Add one, then create classes for it.'} action={query ? null : () => openModal({ type: 'subject' })} actionLabel="Add subject" />}
    </section>
  )
}

export function SubjectForm({ subject, onClose, onSave }) {
  const [form, setForm] = useState({ name: val(subject?.name), code: val(subject?.code), description: val(subject?.description), status: subject?.status || 'active' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({})
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(''); setFields({})
    try { await onSave({ ...form, code: form.code || null, description: form.description || null }); onClose() } catch (err) { setError(err.message); setFields(err.fields || {}) } finally { setBusy(false) }
  }
  return (
    <Modal title={subject ? 'Edit subject' : 'Add a subject'} subtitle="A subject can have several classes (for example, Math — Beginners and Math — Advanced)." onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="grid-2">
          <Field label="Subject name" required error={fields.name?.[0]}><input name="name" value={form.name} onChange={change} required maxLength="255" placeholder="e.g. Mathematics" /></Field>
          <Field label="Code" error={fields.code?.[0]}><input name="code" value={form.code} onChange={change} maxLength="30" placeholder="e.g. MATH" /></Field>
        </div>
        <Field label="Description" error={fields.description?.[0]}><textarea name="description" rows="3" value={form.description} onChange={change} maxLength="2000" placeholder="What students learn in this subject" /></Field>
        {subject && <Field label="Status"><select name="status" value={form.status} onChange={change}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>}
        {error && <div className="alert alert-error" role="alert"><Icon name="alert" size={17} />{error}</div>}
        <div className="dialog-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : subject ? 'Save changes' : 'Create subject'}</button></div>
      </form>
    </Modal>
  )
}

/* ---------------------------------------------------------------- classes */

function Seats({ cls }) {
  const n = cls.students_count || 0
  if (!cls.capacity) return <span>{n} enrolled</span>
  const pct = Math.min(100, Math.round((n / cls.capacity) * 100))
  return (
    <span className="seats">
      <span className="seats-text">{n} / {cls.capacity}{n >= cls.capacity ? ' · Full' : ''}</span>
      <span className="progress" role="progressbar" aria-valuenow={n} aria-valuemax={cls.capacity}><i className={pct >= 100 ? 'full' : ''} style={{ width: `${pct}%` }} /></span>
    </span>
  )
}

export function ClassesPage({ classes, subjects, loading, openModal, subjectFilter, setSubjectFilter }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const list = useMemo(() => classes.filter((c) => (!subjectFilter || String(c.subject_id) === String(subjectFilter)) && (filter === 'all' || c.status === filter) && matches(`${c.name} ${c.subject?.name || ''} ${c.room || ''}`, query)), [classes, subjectFilter, filter, query])
  const filtered = query || filter !== 'all' || subjectFilter
  return (
    <section className="card">
      <Toolbar query={query} setQuery={setQuery} placeholder="Search classes" filter={filter} setFilter={setFilter}
        options={[['all', 'All', classes.length], ['active', 'Active', classes.filter((c) => c.status === 'active').length], ['inactive', 'Inactive', classes.filter((c) => c.status !== 'active').length]]}>
        <select className="select-inline" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} aria-label="Filter by subject">
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Toolbar>
      {loading ? <Skeleton /> : list.length ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Class</th><th>Schedule</th><th>Teacher</th><th>Enrollment</th><th>Status</th><th /></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => openModal({ type: 'classDetail', item: c })}>
                  <td><div className="cell"><span className="symbol"><Icon name="book" /></span><span><b>{c.name}</b><small>{c.subject?.name}{c.room ? ` · ${c.room}` : ''}</small></span></div></td>
                  <td className="muted-cell">{scheduleText(c) || '—'}</td>
                  <td>{c.teachers?.length ? c.teachers.map((t) => t.name).join(', ') : <span className="warn-text">No teacher</span>}</td>
                  <td><Seats cls={c} /></td>
                  <td><StatusBadge active={c.status === 'active'} /></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openModal({ type: 'enroll', item: c })}><Icon name="plus" size={15} />Enroll</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openModal({ type: 'class', item: c })}>Edit</button>
                      <button className="icon-btn" aria-label={`Delete ${c.name}`} title="Delete" onClick={() => openModal({ type: 'delete', role: 'class', item: c })}><Icon name="trash" size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty icon="book" title={filtered ? 'No matching classes' : 'No classes yet'} text={filtered ? 'Try a different search or filter.' : subjects.length ? 'Create a class for one of your subjects, assign a teacher and enroll students.' : 'Create a subject first, then add classes to it.'} action={filtered ? null : () => openModal({ type: subjects.length ? 'class' : 'subject' })} actionLabel={subjects.length ? 'Add class' : 'Add subject'} />}
    </section>
  )
}

export function ClassForm({ cls, preset, subjects, teachers, onClose, onSave }) {
  const [form, setForm] = useState({
    subject_id: val(cls?.subject_id ?? preset?.subject_id), name: val(cls?.name), room: val(cls?.room), capacity: val(cls?.capacity),
    starts_at: val(cls?.starts_at), ends_at: val(cls?.ends_at), starts_on: val(cls?.starts_on), ends_on: val(cls?.ends_on),
    description: val(cls?.description), status: cls?.status || 'active',
  })
  const [days, setDays] = useState(cls?.days || [])
  const [teacherIds, setTeacherIds] = useState((cls?.teachers || []).map((t) => t.id))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({})
  const activeSubjects = subjects.filter((s) => s.status === 'active' || s.id === cls?.subject_id)
  const activeTeachers = teachers.filter((t) => t.active || teacherIds.includes(t.id))
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const err = (n) => fields[n]?.[0]
  const flip = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(''); setFields({})
    const payload = {
      ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])),
      subject_id: Number(form.subject_id), capacity: form.capacity === '' ? null : Number(form.capacity),
      days: days.length ? DAYS.map(([d]) => d).filter((d) => days.includes(d)) : null, teacher_ids: teacherIds,
    }
    if (!cls) delete payload.status
    try { await onSave(payload); onClose() } catch (er) { setError(er.message); setFields(er.fields || {}) } finally { setBusy(false) }
  }

  return (
    <Modal wide title={cls ? 'Edit class' : 'Add a class'} subtitle="A class is one scheduled group for a subject, with its own teacher and students." onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <fieldset>
          <legend>Class</legend>
          <div className="grid-2">
            <Field label="Subject" required error={err('subject_id')}>
              <select name="subject_id" value={form.subject_id} onChange={change} required><option value="">Select a subject</option>{activeSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            </Field>
            <Field label="Class name" required error={err('name')}><input name="name" value={form.name} onChange={change} required maxLength="255" placeholder="e.g. Grade 5 — Evening batch" /></Field>
          </div>
          <div className="grid-2">
            <Field label="Room" error={err('room')}><input name="room" value={form.room} onChange={change} maxLength="255" placeholder="e.g. Room 2" /></Field>
            <Field label="Seats (capacity)" error={err('capacity')} hint="Leave blank for no limit."><input type="number" min="1" name="capacity" value={form.capacity} onChange={change} placeholder="e.g. 20" /></Field>
          </div>
        </fieldset>

        <fieldset>
          <legend>Schedule</legend>
          <div className="field">
            <span className="field-label">Days</span>
            <div className="chips" role="group" aria-label="Class days">
              {DAYS.map(([k, l]) => <button type="button" key={k} className={`chip ${days.includes(k) ? 'chip-on' : ''}`} aria-pressed={days.includes(k)} onClick={() => flip(days, setDays, k)}>{l}</button>)}
            </div>
          </div>
          <div className="grid-2">
            <Field label="Starts at" error={err('starts_at')}><input type="time" name="starts_at" value={form.starts_at} onChange={change} /></Field>
            <Field label="Ends at" error={err('ends_at')}><input type="time" name="ends_at" value={form.ends_at} onChange={change} /></Field>
          </div>
          <div className="grid-2">
            <Field label="Term starts" error={err('starts_on')}><input type="date" name="starts_on" value={form.starts_on} onChange={change} /></Field>
            <Field label="Term ends" error={err('ends_on')}><input type="date" name="ends_on" value={form.ends_on} onChange={change} /></Field>
          </div>
        </fieldset>

        <fieldset>
          <legend>Teachers</legend>
          {activeTeachers.length ? (
            <div className="checklist" role="group" aria-label="Teachers">
              {activeTeachers.map((t) => <label key={t.id} className="check"><input type="checkbox" checked={teacherIds.includes(t.id)} onChange={() => flip(teacherIds, setTeacherIds, t.id)} /><span><b>{t.name}</b><small>{t.qualification || t.code}</small></span></label>)}
            </div>
          ) : <div className="alert alert-info"><Icon name="alert" size={17} />Add a teacher first, then assign them here.</div>}
        </fieldset>

        <fieldset>
          <legend>Other</legend>
          <Field label="Description" error={err('description')}><textarea name="description" rows="2" value={form.description} onChange={change} maxLength="2000" placeholder="Level, goals, materials needed" /></Field>
          {cls && <Field label="Status"><select name="status" value={form.status} onChange={change}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>}
        </fieldset>

        {error && <div className="alert alert-error" role="alert"><Icon name="alert" size={17} />{error}</div>}
        <div className="dialog-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : cls ? 'Save changes' : 'Create class'}</button></div>
      </form>
    </Modal>
  )
}

export function ClassDetail({ cls, detail, onClose, onEdit, onEnroll, onUnenroll }) {
  const students = detail?.students || []
  return (
    <Modal drawer title={cls.name} subtitle={cls.subject?.name} onClose={onClose}>
      <div className="drawer-body">
        <div className="drawer-status"><StatusBadge active={cls.status === 'active'} /><button className="btn btn-ghost btn-sm" onClick={onEdit}><Icon name="edit" size={15} />Edit class</button></div>
        <div className="detail"><Icon name="calendar" /><div><small>Schedule</small><span>{scheduleText(cls) || <em>Not set</em>}</span></div></div>
        <div className="detail"><Icon name="location" /><div><small>Room</small><span>{cls.room || <em>Not set</em>}</span></div></div>
        <div className="detail"><Icon name="person" /><div><small>Teachers</small><span>{cls.teachers?.length ? cls.teachers.map((t) => t.name).join(', ') : <em>No teacher assigned</em>}</span></div></div>
        <div className="detail"><Icon name="users" /><div><small>Seats</small><span><Seats cls={cls} /></span></div></div>
        {cls.description && <p className="notes">{cls.description}</p>}

        <h3>Students <span className="count">{students.length}</span></h3>
        <button className="btn btn-primary btn-sm add-row" onClick={onEnroll}><Icon name="plus" size={15} />Enroll students</button>
        {!detail ? <Skeleton rows={3} /> : students.length ? (
          <ul className="mini-list">
            {students.map((s) => (
              <li key={s.id}><Avatar name={s.name} /><span className="grow"><b>{s.name}</b><small>{s.code}{s.grade_level ? ` · Grade ${s.grade_level}` : ''}</small></span><button className="icon-btn" aria-label={`Remove ${s.name} from class`} title="Remove from class" onClick={() => onUnenroll(s)}><Icon name="close" size={16} /></button></li>
            ))}
          </ul>
        ) : <p className="muted-cell">No students enrolled yet.</p>}
      </div>
    </Modal>
  )
}

export function EnrollDialog({ cls, students, onClose, onSave }) {
  const enrolled = useMemo(() => new Set((cls.students || []).map((s) => s.id)), [cls])
  const eligible = students.filter((s) => s.active && !enrolled.has(s.id))
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const left = cls.capacity ? Math.max(0, cls.capacity - (cls.students_count || 0)) : null
  const list = eligible.filter((s) => matches(`${s.name} ${s.code || ''} ${s.grade_level || ''}`, query))
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  async function submit() {
    setBusy(true); setError('')
    try { await onSave(picked); onClose() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={`Enroll students in ${cls.name}`} subtitle={`${cls.subject?.name || ''}${left !== null ? ` · ${left} seat${left === 1 ? '' : 's'} left` : ''}`} onClose={onClose}>
      <div className="form">
        <div className="search"><Icon name="search" /><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search students" aria-label="Search students" /></div>
        {eligible.length ? (
          <div className="checklist tall" role="group" aria-label="Students">
            {list.map((s) => <label key={s.id} className="check"><input type="checkbox" checked={picked.includes(s.id)} onChange={() => toggle(s.id)} /><span><b>{s.name}</b><small>{s.code}{s.grade_level ? ` · Grade ${s.grade_level}` : ''}</small></span></label>)}
            {!list.length && <p className="muted-cell">No students match your search.</p>}
          </div>
        ) : <div className="alert alert-info"><Icon name="alert" size={17} />Every active student is already in this class.</div>}
        {error && <div className="alert alert-error" role="alert"><Icon name="alert" size={17} />{error}</div>}
        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy || !picked.length} onClick={submit}>{busy ? 'Enrolling…' : `Enroll ${picked.length || ''} student${picked.length === 1 ? '' : 's'}`}</button>
        </div>
      </div>
    </Modal>
  )
}
