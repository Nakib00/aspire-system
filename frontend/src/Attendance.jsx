import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatDate, request } from './api'
import { scheduleText } from './helpers'
import { Avatar, Empty, Icon, Skeleton } from './ui'

const OPTIONS = [['present', 'Present', 'P'], ['late', 'Late', 'L'], ['absent', 'Absent', 'A'], ['excused', 'Excused', 'E']]
const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const todayStr = () => localDate(new Date())
const shift = (date, days) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + days); return localDate(d) }

function Sheet({ classId, date, token, notify, onSaved }) {
  const [sheet, setSheet] = useState(null)
  const [marks, setMarks] = useState({})
  const [notes, setNotes] = useState({})
  const [openNote, setOpenNote] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const res = (await request(`/teacher/classes/${classId}/attendance?date=${date}`, { token })).data
      setSheet(res)
      setMarks(Object.fromEntries(res.students.filter((s) => s.status).map((s) => [s.id, s.status])))
      setNotes(Object.fromEntries(res.students.filter((s) => s.note).map((s) => [s.id, s.note])))
    } catch (err) { setError(err.message) }
  }, [classId, date, token])
  useEffect(() => { Promise.resolve().then(load) }, [load])

  const students = useMemo(() => sheet?.students || [], [sheet])
  const dirty = useMemo(() => students.some((s) => (marks[s.id] || null) !== s.status || (notes[s.id] || null) !== s.note), [students, marks, notes])
  const marked = students.filter((s) => marks[s.id]).length
  const tally = (k) => students.filter((s) => marks[s.id] === k).length

  async function save() {
    setBusy(true)
    try {
      const records = students.filter((s) => marks[s.id]).map((s) => ({ student_id: s.id, status: marks[s.id], note: notes[s.id] || null }))
      await request(`/teacher/classes/${classId}/attendance`, { token, method: 'PUT', body: { date, records } })
      notify(`Attendance saved for ${formatDate(date)}.`)
      await load()
      onSaved()
    } catch (err) { notify(err.message, 'error') } finally { setBusy(false) }
  }

  if (error) return <div className="alert alert-error" role="alert"><Icon name="alert" size={17} />{error}<button className="link" onClick={load}>Try again</button></div>
  if (!sheet) return <Skeleton rows={6} />
  if (!students.length) return <Empty icon="cap" title="No students in this class" text="Ask your center administrator to enroll students." />

  return (
    <>
      <div className="att-summary">
        <div className="att-tally">
          {OPTIONS.map(([k, label]) => <span key={k} className={`tally tally-${k}`}><b>{tally(k)}</b>{label}</span>)}
          <span className="tally"><b>{students.length - marked}</b>Not marked</span>
        </div>
        <div className="att-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setMarks(Object.fromEntries(students.map((s) => [s.id, 'present'])))}><Icon name="checkcircle" size={16} />Mark all present</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setMarks({})} disabled={!marked}>Clear</button>
        </div>
      </div>

      <ul className="att-list">
        {students.map((s) => (
          <li key={s.id} className={marks[s.id] ? `is-${marks[s.id]}` : ''}>
            <Avatar name={s.name} />
            <span className="grow"><b>{s.name}</b><small>{s.code}{s.grade_level ? ` · Grade ${s.grade_level}` : ''}</small></span>
            <div className="att-buttons" role="radiogroup" aria-label={`Attendance for ${s.name}`}>
              {OPTIONS.map(([k, label, short]) => (
                <button key={k} type="button" role="radio" aria-checked={marks[s.id] === k} className={`att-btn att-${k} ${marks[s.id] === k ? 'on' : ''}`} onClick={() => setMarks({ ...marks, [s.id]: marks[s.id] === k ? undefined : k })} title={label}><span>{label}</span><em>{short}</em></button>
              ))}
            </div>
            <button type="button" className={`icon-btn ${notes[s.id] ? 'has-note' : ''}`} aria-label={`Note for ${s.name}`} title="Add note" onClick={() => setOpenNote(openNote === s.id ? null : s.id)}><Icon name="edit" size={16} /></button>
            {(openNote === s.id || (notes[s.id] && openNote !== s.id)) && (
              <input className="att-note" value={notes[s.id] || ''} onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })} placeholder="Note (e.g. left early, sick)" maxLength="255" aria-label={`Note for ${s.name}`} />
            )}
          </li>
        ))}
      </ul>

      <div className="att-footer">
        <span className="muted-cell">{sheet.taken ? <><Icon name="check" size={15} /> Attendance already taken for this day — changes will update it.</> : 'Attendance hasn’t been taken for this day yet.'}</span>
        <button className="btn btn-primary" onClick={save} disabled={busy || !marked || !dirty}>{busy ? 'Saving…' : `Save attendance (${marked}/${students.length})`}</button>
      </div>
    </>
  )
}

function Report({ classId, token }) {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let live = true
    const from = shift(todayStr(), -(days - 1))
    request(`/teacher/classes/${classId}/attendance/report?from=${from}&to=${todayStr()}`, { token }).then((r) => { if (live) { setData(r.data); setError('') } }).catch((e) => { if (live) setError(e.message) })
    return () => { live = false }
  }, [classId, days, token])
  if (error) return <div className="alert alert-error" role="alert"><Icon name="alert" size={17} />{error}</div>
  if (!data) return <Skeleton rows={5} />
  const max = Math.max(1, ...data.sessions.map((s) => s.present + s.late + s.absent + s.excused))

  return (
    <div className="report">
      <div className="segmented" role="group" aria-label="Report range">
        {[[7, '7 days'], [30, '30 days'], [90, '90 days']].map(([d, l]) => <button key={d} className={days === d ? 'on' : ''} aria-pressed={days === d} onClick={() => { setData(null); setDays(d) }}>{l}</button>)}
      </div>
      {data.sessions.length ? (
        <>
          <div className="spark" role="img" aria-label="Attendance per class day">
            {data.sessions.map((s) => {
              const total = s.present + s.late + s.absent + s.excused
              return (
                <div key={s.date} className="spark-col" title={`${formatDate(s.date)}: ${s.present} present, ${s.late} late, ${s.absent} absent, ${s.excused} excused`}>
                  <div className="spark-bar" style={{ height: `${(total / max) * 100}%` }}>
                    <i className="seg-present" style={{ flex: s.present }} /><i className="seg-late" style={{ flex: s.late }} /><i className="seg-excused" style={{ flex: s.excused }} /><i className="seg-absent" style={{ flex: s.absent }} />
                  </div>
                  <small>{new Date(`${s.date}T12:00:00`).getDate()}</small>
                </div>
              )
            })}
          </div>
          <div className="table-wrap">
            <table className="compact">
              <thead><tr><th>Student</th><th>Present</th><th>Late</th><th>Absent</th><th>Excused</th><th>Attendance rate</th></tr></thead>
              <tbody>
                {[...data.students].sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101)).map((s) => (
                  <tr key={s.id}>
                    <td><div className="cell"><Avatar name={s.name} size="sm" /><span><b>{s.name}</b><small>{s.code}</small></span></div></td>
                    <td>{s.present}</td><td>{s.late}</td><td>{s.absent}</td><td>{s.excused}</td>
                    <td>{s.rate === null ? <span className="muted-cell">—</span> : <span className="seats"><span className="seats-text">{s.rate}%</span><span className="progress"><i className={s.rate < 75 ? 'full' : 'ok'} style={{ width: `${s.rate}%` }} /></span></span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : <Empty icon="calendar" title="No attendance yet" text="Once you take attendance, trends and student rates will show up here." />}
    </div>
  )
}

export default function AttendancePage({ classes, initialClassId, token, notify, onSaved }) {
  const [classId, setClassId] = useState(String(initialClassId || classes[0]?.id || ''))
  const [date, setDate] = useState(todayStr())
  const [tab, setTab] = useState('take')
  const cls = classes.find((c) => String(c.id) === classId)
  const today = todayStr()

  if (!classes.length) return <section className="card"><Empty icon="calendar" title="No classes yet" text="You’ll be able to take attendance once a class is assigned to you." /></section>
  return (
    <section className="card">
      <div className="toolbar">
        <select className="select-inline grow-select" value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Class">
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.subject ? ` · ${c.subject.name}` : ''}</option>)}
        </select>
        {tab === 'take' && (
          <div className="date-nav">
            <button className="icon-btn" aria-label="Previous day" onClick={() => setDate(shift(date, -1))}><Icon name="chevron" size={16} className="flip" /></button>
            <input type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Date" />
            <button className="icon-btn" aria-label="Next day" disabled={date >= today} onClick={() => setDate(shift(date, 1))}><Icon name="chevron" size={16} /></button>
            {date !== today && <button className="btn btn-ghost btn-sm" onClick={() => setDate(today)}>Today</button>}
          </div>
        )}
        <div className="segmented" role="tablist">
          <button role="tab" aria-selected={tab === 'take'} className={tab === 'take' ? 'on' : ''} onClick={() => setTab('take')}>Take attendance</button>
          <button role="tab" aria-selected={tab === 'report'} className={tab === 'report' ? 'on' : ''} onClick={() => setTab('report')}>Report</button>
        </div>
      </div>
      {cls && <p className="class-line">{scheduleText(cls) || 'No schedule set'}{cls.room ? ` · ${cls.room}` : ''} · {cls.students_count} students</p>}
      <div className="att-body">
        {tab === 'take' ? <Sheet key={`${classId}-${date}`} classId={classId} date={date} token={token} notify={notify} onSaved={onSaved} /> : <Report key={classId} classId={classId} token={token} />}
      </div>
    </section>
  )
}
