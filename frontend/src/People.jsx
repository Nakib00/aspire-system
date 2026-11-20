import { useMemo, useState } from 'react'
import { formatDate, formatRelative } from './api'
import { ROLE_META, guardianPayload, matches, scheduleText } from './helpers'
import { Toolbar } from './shared'
import { Avatar, Empty, Field, Icon, Modal, Skeleton, StatusBadge } from './ui'

const val = (v) => (v === null || v === undefined ? '' : v)
const names = (list) => (list?.length ? list.map((p) => p.name).join(', ') : null)
const today = new Date().toISOString().slice(0, 10)

/* ------------------------------------------------------------------ list */

export function PeoplePage({ role, items, loading, openModal }) {
  const meta = ROLE_META[role]
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const list = useMemo(() => items.filter((p) => (filter === 'all' || (filter === 'active' ? p.active : !p.active)) && matches(`${p.name} ${p.code || ''} ${p.email || ''} ${p.phone || ''} ${p.grade_level || ''}`, query)), [items, filter, query])
  const filtered = query || filter !== 'all'
  const add = () => openModal({ type: 'person', role })

  const head = {
    student: ['Student', 'Grade & school', 'Guardians', 'Classes', 'Status'],
    parent: ['Parent', 'Contact', 'Children', 'Last sign-in', 'Status'],
    teacher: ['Teacher', 'Contact', 'Qualification', 'Classes', 'Status'],
  }[role]

  const cells = (p) => ({
    student: [
      <span key="a" className="stack"><span>{p.grade_level ? `Grade ${p.grade_level}` : '—'}</span><small>{p.school_name || ''}</small></span>,
      names(p.parents) || <span key="b" className="warn-text">No guardian</span>,
      p.student_sections?.length || 0,
    ],
    parent: [
      <span key="a" className="stack"><span>{p.email}</span><small>{p.phone || ''}</small></span>,
      names(p.children) || <span key="b" className="warn-text">No children linked</span>,
      <span key="c" className="muted-cell">{formatRelative(p.last_login_at)}</span>,
    ],
    teacher: [
      <span key="a" className="stack"><span>{p.email}</span><small>{p.phone || ''}</small></span>,
      p.qualification || '—',
      p.teacher_sections?.length || 0,
    ],
  }[role])

  return (
    <section className="card">
      <Toolbar query={query} setQuery={setQuery} placeholder={`Search ${meta.plural.toLowerCase()} by name, ID or contact`} filter={filter} setFilter={setFilter}
        options={[['all', 'All', items.length], ['active', 'Active', items.filter((p) => p.active).length], ['inactive', 'Inactive', items.filter((p) => !p.active).length]]} />
      {loading ? <Skeleton /> : list.length ? (
        <div className="table-wrap">
          <table>
            <thead><tr>{head.slice(0, -1).map((h) => <th key={h}>{h}</th>)}<th>Status</th><th /></tr></thead>
            <tbody>
              {list.map((p) => {
                const c = cells(p)
                return (
                  <tr key={p.id} className="clickable" onClick={() => openModal({ type: 'detail', role, item: p })}>
                    <td><div className="cell"><Avatar name={p.name} /><span><b>{p.name}</b><small>{p.code}</small></span></div></td>
                    {c.map((x, i) => <td key={i}>{x}</td>)}
                    <td><StatusBadge active={p.active} /></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openModal({ type: 'person', role, item: p })}>Edit</button>
                        <button className="icon-btn" aria-label={`Delete ${p.name}`} title="Delete" onClick={() => openModal({ type: 'delete', role, item: p })}><Icon name="trash" size={17} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : <Empty icon={meta.icon} title={filtered ? `No matching ${meta.plural.toLowerCase()}` : `No ${meta.plural.toLowerCase()} yet`} text={filtered ? 'Try a different search or filter.' : `Add your first ${meta.label.toLowerCase()} to get started.`} action={filtered ? null : add} actionLabel={`Add ${meta.label.toLowerCase()}`} />}
    </section>
  )
}

/* ------------------------------------------------------------------ form */

const blankGuardian = () => ({ mode: 'new', parent_id: '', relationship: '', name: '', email: '', phone: '', password: '' })

export function GuardianFields({ value, onChange, parents, onRemove }) {
  const set = (k, v) => onChange({ ...value, [k]: v })
  return (
    <div className="guardian-box">
      <div className="guardian-top">
        <div className="segmented" role="group" aria-label="Guardian type">
          <button type="button" className={value.mode === 'new' ? 'on' : ''} onClick={() => set('mode', 'new')}>New parent</button>
          <button type="button" className={value.mode === 'existing' ? 'on' : ''} onClick={() => set('mode', 'existing')}>Existing parent</button>
        </div>
        {onRemove && <button type="button" className="link" onClick={onRemove}>Remove</button>}
      </div>
      {value.mode === 'existing' ? (
        <div className="grid-2">
          <Field label="Parent" required><select value={value.parent_id} onChange={(e) => set('parent_id', e.target.value)} required><option value="">Select a parent</option>{parents.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.code}</option>)}</select></Field>
          <Field label="Relationship"><input value={value.relationship} onChange={(e) => set('relationship', e.target.value)} placeholder="e.g. Mother" maxLength="40" /></Field>
        </div>
      ) : (
        <>
          <div className="grid-2">
            <Field label="Full name" required><input value={value.name} onChange={(e) => set('name', e.target.value)} placeholder="Parent name" required /></Field>
            <Field label="Relationship"><input value={value.relationship} onChange={(e) => set('relationship', e.target.value)} placeholder="e.g. Father" maxLength="40" /></Field>
          </div>
          <div className="grid-2">
            <Field label="Email (login)" required><input type="email" value={value.email} onChange={(e) => set('email', e.target.value)} placeholder="parent@example.com" required /></Field>
            <Field label="Phone"><input type="tel" value={value.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Mobile number" /></Field>
          </div>
          <Field label="Password" required hint="The parent uses this with their email to open the parent dashboard."><input type="text" value={value.password} onChange={(e) => set('password', e.target.value)} minLength="8" placeholder="At least 8 characters" autoComplete="off" required /></Field>
        </>
      )}
    </div>
  )
}

export function PersonForm({ role, person, students, parents, onClose, onSave }) {
  const meta = ROLE_META[role]
  const [form, setForm] = useState({
    name: val(person?.name), email: role === 'student' && person?.email?.endsWith('@students.aspire.local') ? '' : val(person?.email), phone: val(person?.phone), gender: val(person?.gender),
    date_of_birth: val(person?.date_of_birth), address: val(person?.address), notes: val(person?.notes), password: '',
    school_name: val(person?.school_name), grade_level: val(person?.grade_level), qualification: val(person?.qualification), joined_on: val(person?.joined_on),
    active: person?.active ?? true,
  })
  const [childIds, setChildIds] = useState(() => (person?.children || []).map((c) => c.id))
  const [guardians, setGuardians] = useState([])
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({})
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const err = (n) => fields[n]?.[0]

  async function submit(event) {
    event.preventDefault()
    setBusy(true); setError(''); setFields({})
    const payload = {
      name: form.name, phone: form.phone || null, gender: form.gender || null, date_of_birth: form.date_of_birth || null,
      address: form.address || null, notes: form.notes || null, ...(person ? { active: form.active === true || form.active === 'true' } : {}),
    }
    if (role !== 'student') { payload.email = form.email; if (form.password) payload.password = form.password }
    if (role === 'student') {
      payload.school_name = form.school_name || null; payload.grade_level = form.grade_level || null
      if (form.email) payload.email = form.email
      if (form.password) payload.password = form.password
      if (!person) payload.guardians = guardians.filter((g) => (g.mode === 'existing' ? g.parent_id : g.name || g.email)).map(guardianPayload)
    }
    if (role === 'teacher') { payload.qualification = form.qualification || null; payload.joined_on = form.joined_on || null }
    if (role === 'parent') payload.student_ids = childIds
    try { await onSave(payload); onClose() } catch (e) { setError(e.message); setFields(e.fields || {}) } finally { setBusy(false) }
  }

  const toggleChild = (id) => setChildIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  const setGuardian = (i, g) => setGuardians((list) => list.map((x, n) => (n === i ? g : x)))

  return (
    <Modal wide title={person ? `Edit ${meta.label.toLowerCase()}` : `Add a ${meta.label.toLowerCase()}`} subtitle={person ? person.code : role === 'student' ? 'Add the student and their parents or guardians in one go.' : role === 'parent' ? 'Parents get their own login and dashboard.' : 'Teachers get a login and can see their classes.'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <fieldset>
          <legend>Personal details</legend>
          <div className="grid-2">
            <Field label="Full name" required error={err('name')}><input name="name" value={form.name} onChange={change} required maxLength="255" placeholder={`${meta.label} name`} /></Field>
            <Field label="Gender" error={err('gender')}><select name="gender" value={form.gender} onChange={change}><option value="">Not specified</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></Field>
          </div>
          <div className="grid-2">
            <Field label="Date of birth" error={err('date_of_birth')}><input type="date" name="date_of_birth" value={form.date_of_birth} onChange={change} max={today} /></Field>
            <Field label="Phone" error={err('phone')}><input type="tel" name="phone" value={form.phone} onChange={change} placeholder="Mobile number" maxLength="40" /></Field>
          </div>
          <Field label="Address" error={err('address')}><input name="address" value={form.address} onChange={change} placeholder="House, road, area" maxLength="255" /></Field>
        </fieldset>

        {role === 'student' && (
          <fieldset>
            <legend>School</legend>
            <div className="grid-2">
              <Field label="Grade / class level" error={err('grade_level')}><input name="grade_level" value={form.grade_level} onChange={change} placeholder="e.g. 5" maxLength="40" /></Field>
              <Field label="School name" error={err('school_name')}><input name="school_name" value={form.school_name} onChange={change} placeholder="Day school they attend" maxLength="255" /></Field>
            </div>
          </fieldset>
        )}

        {role === 'student' && <fieldset><legend>Student sign-in (optional)</legend><Field label="Email" error={err('email')} hint="Add an email and password to let the student sign in."><input type="email" name="email" value={form.email} onChange={change} placeholder="student@example.com" required={Boolean(form.password && !person)} /></Field><Field label={person ? 'New password' : 'Password'} error={err('password')} hint="At least 8 characters. Leave blank to keep the existing password."><input type="password" name="password" value={form.password} onChange={change} minLength="8" autoComplete="new-password" required={Boolean(form.email && (!person || person.email?.endsWith('@students.aspire.local')))} /></Field></fieldset>}

        {role === 'teacher' && (
          <fieldset>
            <legend>Professional</legend>
            <div className="grid-2">
              <Field label="Qualification" error={err('qualification')}><input name="qualification" value={form.qualification} onChange={change} placeholder="e.g. BSc in Mathematics" maxLength="255" /></Field>
              <Field label="Joined on" error={err('joined_on')}><input type="date" name="joined_on" value={form.joined_on} onChange={change} /></Field>
            </div>
          </fieldset>
        )}

        {role !== 'student' && (
          <fieldset>
            <legend>Sign-in account</legend>
            <Field label="Email" required error={err('email')} hint="Used to sign in."><input type="email" name="email" value={form.email} onChange={change} required placeholder="name@example.com" /></Field>
            <Field label={person ? 'New password' : 'Password'} required={!person} error={err('password')} hint={person ? 'Leave blank to keep the current password.' : 'At least 8 characters.'}>
              <div className="input-affix">
                <input type={show ? 'text' : 'password'} name="password" value={form.password} onChange={change} minLength="8" required={!person} autoComplete="new-password" placeholder={person ? 'Unchanged' : 'Create a password'} />
                <button type="button" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
              </div>
            </Field>
          </fieldset>
        )}

        {role === 'parent' && (
          <fieldset>
            <legend>Children</legend>
            {students.length ? (
              <div className="checklist" role="group" aria-label="Children">
                {students.map((s) => (
                  <label key={s.id} className="check"><input type="checkbox" checked={childIds.includes(s.id)} onChange={() => toggleChild(s.id)} /><span><b>{s.name}</b><small>{s.code}{s.grade_level ? ` · Grade ${s.grade_level}` : ''}</small></span></label>
                ))}
              </div>
            ) : <div className="alert alert-info"><Icon name="alert" size={17} />Add students first, then link them here.</div>}
          </fieldset>
        )}

        {role === 'student' && !person && (
          <fieldset>
            <legend>Parents & guardians</legend>
            {guardians.map((g, i) => <GuardianFields key={i} value={g} parents={parents} onChange={(v) => setGuardian(i, v)} onRemove={() => setGuardians((l) => l.filter((_, n) => n !== i))} />)}
            {guardians.length < 4 && <button type="button" className="btn btn-ghost btn-sm add-row" onClick={() => setGuardians([...guardians, { ...blankGuardian(), mode: parents.length && guardians.length ? 'existing' : 'new' }])}><Icon name="plus" size={15} />{guardians.length ? 'Add another guardian' : 'Add a parent or guardian'}</button>}
            {!guardians.length && <small className="field-hint">Optional now — you can also link guardians later from the student’s profile.</small>}
          </fieldset>
        )}

        <fieldset>
          <legend>Other</legend>
          {person && <Field label="Account status"><select name="active" value={String(form.active)} onChange={change}><option value="true">Active</option><option value="false">Inactive</option></select></Field>}
          <Field label="Internal notes" error={err('notes')} hint="Only visible to center admins."><textarea name="notes" rows="3" value={form.notes} onChange={change} maxLength="2000" placeholder="Allergies, pick-up instructions, anything worth remembering" /></Field>
        </fieldset>

        {error && <div className="alert alert-error" role="alert"><Icon name="alert" size={17} />{error}</div>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : person ? 'Save changes' : `Create ${meta.label.toLowerCase()}`}</button>
        </div>
      </form>
    </Modal>
  )
}

/** Link another parent to an existing student. */
export function GuardianDialog({ student, parents, onClose, onSave }) {
  const linked = new Set((student.parents || []).map((p) => p.id))
  const available = parents.filter((p) => !linked.has(p.id))
  const [g, setG] = useState({ ...blankGuardian(), mode: available.length ? 'existing' : 'new' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('')
    try { await onSave(guardianPayload(g)); onClose() } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return (
    <Modal title="Add a guardian" subtitle={`Link a parent to ${student.name}.`} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <GuardianFields value={g} onChange={setG} parents={available} />
        {error && <div className="alert alert-error" role="alert"><Icon name="alert" size={17} />{error}</div>}
        <div className="dialog-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Add guardian'}</button></div>
      </form>
    </Modal>
  )
}

/* ---------------------------------------------------------------- detail */

function Detail({ label, icon, children }) {
  return <div className="detail"><Icon name={icon} /><div><small>{label}</small><span>{children || <em>Not provided</em>}</span></div></div>
}

export function PersonDetail({ role, person, onClose, onEdit, onOpen, onAddGuardian, onRemoveGuardian }) {
  const meta = ROLE_META[role]
  const classes = role === 'student' ? person.student_sections : role === 'teacher' ? person.teacher_sections : []
  return (
    <Modal drawer title={person.name} subtitle={`${meta.label} · ${person.code || ''}`} onClose={onClose}>
      <div className="drawer-body">
        <div className="drawer-status"><StatusBadge active={person.active} /><button className="btn btn-ghost btn-sm" onClick={onEdit}><Icon name="edit" size={15} />Edit details</button></div>

        <h3>Details</h3>
        {role !== 'student' && <Detail label="Email (login)" icon="mail">{person.email}</Detail>}
        <Detail label="Phone" icon="phone">{person.phone}</Detail>
        <Detail label="Date of birth" icon="calendar">{person.date_of_birth && formatDate(person.date_of_birth)}</Detail>
        <Detail label="Address" icon="location">{person.address}</Detail>
        {role === 'student' && <Detail label="Grade & school" icon="cap">{(person.grade_level || person.school_name) && `${person.grade_level ? `Grade ${person.grade_level}` : ''}${person.school_name ? ` · ${person.school_name}` : ''}`}</Detail>}
        {role === 'teacher' && <Detail label="Qualification" icon="cap">{person.qualification}</Detail>}
        {role === 'teacher' && <Detail label="Joined" icon="calendar">{person.joined_on && formatDate(person.joined_on)}</Detail>}
        {role !== 'student' && <Detail label="Last sign-in" icon="clock">{formatRelative(person.last_login_at)}</Detail>}

        {role === 'student' && (
          <>
            <h3>Parents & guardians <span className="count">{person.parents?.length || 0}</span></h3>
            {person.parents?.length ? (
              <ul className="mini-list">
                {person.parents.map((p) => (
                  <li key={p.id}>
                    <Avatar name={p.name} />
                    <button className="grow linklike" onClick={() => onOpen('parent', p.id)}><b>{p.name}</b><small>{[p.pivot?.relationship, p.phone || p.email].filter(Boolean).join(' · ')}</small></button>
                    <button className="icon-btn" aria-label={`Remove ${p.name}`} title="Unlink" onClick={() => onRemoveGuardian(p)}><Icon name="close" size={16} /></button>
                  </li>
                ))}
              </ul>
            ) : <div className="alert alert-info"><Icon name="alert" size={17} />No guardian linked yet.</div>}
            <button className="btn btn-ghost btn-sm add-row" onClick={onAddGuardian}><Icon name="plus" size={15} />Add guardian</button>
          </>
        )}

        {role === 'parent' && (
          <>
            <h3>Children <span className="count">{person.children?.length || 0}</span></h3>
            {person.children?.length ? (
              <ul className="mini-list">{person.children.map((c) => (
                <li key={c.id}><Avatar name={c.name} /><button className="grow linklike" onClick={() => onOpen('student', c.id)}><b>{c.name}</b><small>{c.code}{c.pivot?.relationship ? ` · ${c.pivot.relationship}` : ''}</small></button></li>
              ))}</ul>
            ) : <div className="alert alert-info"><Icon name="alert" size={17} />No children linked yet. Edit this parent to link students.</div>}
          </>
        )}

        {role !== 'parent' && (
          <>
            <h3>{role === 'student' ? 'Enrolled classes' : 'Classes taught'} <span className="count">{classes?.length || 0}</span></h3>
            {classes?.length ? (
              <ul className="mini-list">{classes.map((c) => (
                <li key={c.id}><span className="symbol"><Icon name="book" /></span><span className="grow"><b>{c.name}</b><small>{c.subject?.name}{scheduleText(c) ? ` · ${scheduleText(c)}` : ''}</small></span></li>
              ))}</ul>
            ) : <p className="muted-cell">{role === 'student' ? 'Not enrolled in any class yet. Enroll from the Classes page.' : 'Not assigned to any class yet.'}</p>}
          </>
        )}

        {person.notes && <><h3>Internal notes</h3><p className="notes">{person.notes}</p></>}
        <p className="meta">Added {formatDate(person.created_at)}</p>
      </div>
    </Modal>
  )
}
