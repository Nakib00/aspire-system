/**
 * @file View layer: Super Admin forms for centers and center administrators.
 */
import { useState } from 'react'
import { DAYS } from '../../models/domain'
import { Field, Icon, Modal } from '../components/ui'

const today = new Date().toISOString().slice(0, 10)
const val =(v) => (v === null || v === undefined ? '' : v)

/**
 * Create/edit center dialog with inline validation.
 *
 * @param {{center?: object, onClose: Function, onSave: Function}} props
 */
export function CenterForm({ center, onClose, onSave }) {
  const [form, setForm] = useState({
    name: val(center?.name), code: val(center?.code), address: val(center?.address), city: val(center?.city),
    postal_code: val(center?.postal_code), phone: val(center?.phone), email: val(center?.email),
    contact_person: val(center?.contact_person), contact_phone: val(center?.contact_phone),
    capacity: val(center?.capacity), established_on: val(center?.established_on),
    opens_at: val(center?.opens_at), closes_at: val(center?.closes_at),
    operating_days: center?.operating_days || [], notes: val(center?.notes), status: center?.status || 'active',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({})

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const toggleDay = (day) => setForm({ ...form, operating_days: form.operating_days.includes(day) ? form.operating_days.filter((d) => d !== day) : [...form.operating_days, day] })

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setFields({})
    const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]))
    payload.capacity = payload.capacity === null ? null : Number(payload.capacity)
    payload.operating_days = form.operating_days.length ? DAYS.map(([d]) => d).filter((d) => form.operating_days.includes(d)) : null
    if (!center && !payload.code) delete payload.code
    try {
      await onSave(payload)
      onClose()
    } catch (err) {
      setError(err.fields && Object.keys(err.fields).length ? 'Please fix the highlighted fields.' : err.message)
      setFields(err.fields || {})
    } finally {
      setBusy(false)
    }
  }
  const err = (name) => fields[name]?.[0]

  return (
    <Modal title={center ? 'Edit center' : 'Add a center'} subtitle="Keep the details accurate so admins and families can rely on them." onClose={onClose} wide>
      <form onSubmit={submit} className="form">
        <fieldset>
          <legend>Basic information</legend>
          <div className="grid-2">
            <Field label="Center name" required error={err('name')}><input name="name" value={form.name} onChange={change} placeholder="e.g. Dhanmondi Learning Center" required maxLength="255" /></Field>
            <Field label="Center code" error={err('code')} hint={center ? 'Unique identifier for this center.' : 'Leave blank to generate automatically.'}><input name="code" value={form.code} onChange={change} placeholder="e.g. DHN-01" maxLength="30" /></Field>
          </div>
          <div className="grid-2">
            <Field label="Status"><select name="status" value={form.status} onChange={change}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
            <Field label="Established" error={err('established_on')}><input type="date" name="established_on" value={form.established_on} onChange={change} max={today} /></Field>
          </div>
        </fieldset>

        <fieldset>
          <legend>Location</legend>
          <Field label="Street address" required error={err('address')}><input name="address" value={form.address} onChange={change} placeholder="House, road, area" required maxLength="255" /></Field>
          <div className="grid-2">
            <Field label="City" error={err('city')}><input name="city" value={form.city} onChange={change} placeholder="e.g. Dhaka" maxLength="255" /></Field>
            <Field label="Postal code" error={err('postal_code')}><input name="postal_code" value={form.postal_code} onChange={change} placeholder="e.g. 1205" maxLength="20" /></Field>
          </div>
        </fieldset>

        <fieldset>
          <legend>Contact</legend>
          <div className="grid-2">
            <Field label="Center phone" error={err('phone')}><input type="tel" name="phone" value={form.phone} onChange={change} placeholder="Main line" maxLength="40" /></Field>
            <Field label="Center email" error={err('email')}><input type="email" name="email" value={form.email} onChange={change} placeholder="center@example.com" maxLength="255" /></Field>
          </div>
          <div className="grid-2">
            <Field label="Contact person" error={err('contact_person')} hint="Who should we call for day-to-day matters?"><input name="contact_person" value={form.contact_person} onChange={change} placeholder="Full name" maxLength="255" /></Field>
            <Field label="Contact person phone" error={err('contact_phone')}><input type="tel" name="contact_phone" value={form.contact_phone} onChange={change} placeholder="Direct number" maxLength="40" /></Field>
          </div>
        </fieldset>

        <fieldset>
          <legend>Operations</legend>
          <div className="grid-3">
            <Field label="Student capacity" error={err('capacity')}><input type="number" min="1" max="100000" name="capacity" value={form.capacity} onChange={change} placeholder="e.g. 150" /></Field>
            <Field label="Opens at" error={err('opens_at')}><input type="time" name="opens_at" value={form.opens_at} onChange={change} /></Field>
            <Field label="Closes at" error={err('closes_at')}><input type="time" name="closes_at" value={form.closes_at} onChange={change} /></Field>
          </div>
          <div className="field">
            <span className="field-label">Operating days</span>
            <div className="chips" role="group" aria-label="Operating days">
              {DAYS.map(([key, label]) => (
                <button type="button" key={key} className={`chip ${form.operating_days.includes(key) ? 'chip-on' : ''}`} aria-pressed={form.operating_days.includes(key)} onClick={() => toggleDay(key)}>{label}</button>
              ))}
            </div>
          </div>
          <Field label="Internal notes" error={err('notes')} hint="Only visible to super admins."><textarea name="notes" rows="3" value={form.notes} onChange={change} maxLength="2000" placeholder="Anything useful to remember about this center" /></Field>
        </fieldset>

        {error && <div className="alert alert-error" role="alert"><Icon name="alert" size={17} />{error}</div>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : center ? 'Save changes' : 'Create center'}</button>
        </div>
      </form>
    </Modal>
  )
}

/**
 * Create/edit center administrator dialog.
 *
 * @param {{admin?: object, centers: Array, onClose: Function, onSave: Function}} props
 */
export function AdminForm({ admin, centers, onClose, onSave }) {
  const [form, setForm] = useState({
    name: val(admin?.name), email: val(admin?.email), phone: val(admin?.phone), designation: val(admin?.designation),
    password: '', center_id: admin?.center_id ? String(admin.center_id) : '', active: admin?.active ?? true,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({})
  const [show, setShow] = useState(false)
  const activeCenters = centers.filter((c) => c.status === 'active')
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const err = (name) => fields[name]?.[0]

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setFields({})
    const data = {
      name: form.name, email: form.email, phone: form.phone || null, designation: form.designation || null,
      ...(form.password ? { password: form.password } : {}),
      ...(form.center_id && (!admin || String(admin.center_id) !== form.center_id) ? { center_id: Number(form.center_id) } : {}),
      ...(admin ? { active: form.active === true || form.active === 'true' } : {}),
    }
    try {
      await onSave(data)
      onClose()
    } catch (e) {
      setError(e.fields && Object.keys(e.fields).length ? 'Please fix the highlighted fields.' : e.message)
      setFields(e.fields || {})
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={admin ? 'Edit administrator' : 'Add an administrator'} subtitle="Administrators manage a single center day to day." onClose={onClose}>
      <form onSubmit={submit} className="form">
        <div className="grid-2">
          <Field label="Full name" required error={err('name')}><input name="name" value={form.name} onChange={change} placeholder="Administrator name" required /></Field>
          <Field label="Designation" error={err('designation')}><input name="designation" value={form.designation} onChange={change} placeholder="e.g. Center manager" /></Field>
        </div>
        <div className="grid-2">
          <Field label="Email address" required error={err('email')} hint="Used to sign in."><input name="email" type="email" value={form.email} onChange={change} placeholder="name@example.com" required /></Field>
          <Field label="Phone" error={err('phone')}><input name="phone" type="tel" value={form.phone} onChange={change} placeholder="Mobile number" /></Field>
        </div>
        <Field label={admin ? 'New password' : 'Password'} required={!admin} error={err('password')} hint={admin ? 'Leave blank to keep the current password. Changing it signs the admin out everywhere.' : 'At least 8 characters.'}>
          <div className="input-affix">
            <input name="password" type={show ? 'text' : 'password'} value={form.password} onChange={change} minLength="8" required={!admin} autoComplete="new-password" placeholder={admin ? 'Unchanged' : 'Create a password'} />
            <button type="button" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
          </div>
        </Field>
        <div className="grid-2">
          <Field label="Assigned center" required={!admin} error={err('center_id')}>
            <select name="center_id" value={form.center_id} onChange={change} required={!admin}>
              <option value="" disabled={Boolean(admin?.center_id)}>{admin ? 'No center assigned' : 'Select a center'}</option>
              {admin?.center_id && !activeCenters.some((c) => c.id === admin.center_id) && <option value={admin.center_id}>{admin.center?.name || 'Current center'} (inactive)</option>}
              {activeCenters.map((c) => <option key={c.id} value={c.id}>{c.name}{c.code ? ` · ${c.code}` : ''}</option>)}
            </select>
          </Field>
          {admin && <Field label="Account status"><select name="active" value={String(form.active)} onChange={change}><option value="true">Active</option><option value="false">Inactive</option></select></Field>}
        </div>
        {!admin && !activeCenters.length && <div className="alert alert-info"><Icon name="alert" size={17} />Create an active center before adding an administrator.</div>}
        {error && <div className="alert alert-error" role="alert"><Icon name="alert" size={17} />{error}</div>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy || (!admin && !activeCenters.length)}>{busy ? 'Saving…' : admin ? 'Save changes' : 'Create account'}</button>
        </div>
      </form>
    </Modal>
  )
}
