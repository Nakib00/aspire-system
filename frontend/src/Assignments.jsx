import { useCallback, useEffect, useMemo, useState } from 'react'
import AssignmentContent, { FilePreview, YouTubeEmbed } from './AssignmentContent'
import { dueLabel, fileSize, formatDateTime, request, toLocalInput } from './api'
import { matches } from './helpers'
import { Toolbar } from './shared'
import { Avatar, Empty, Field, Icon, Modal, Skeleton } from './ui'

const STATUS = { draft: ['Draft', 'muted'], published: ['Published', 'success'], closed: ['Closed', 'warn'] }
const STATE = { missing: ['Missing', 'muted'], submitted: ['To review', 'info'], late: ['Late · to review', 'warn'], graded: ['Graded', 'success'] }
const YT = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/

const defaultDue = () => toLocalInput(new Date(Date.now() + 7 * 86400000).setHours(17, 0, 0, 0))

export const Pill =({ map, value }) => <span className={`badge badge-${map[value][1]}`}><i />{map[value][0]}</span>
export const StatusPill = ({ value }) => <Pill map={STATUS} value={value} />

/* ------------------------------------------------------------------ list */

export function AssignmentsPage({ assignments, classes, loading, openModal, openReview }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [classId, setClassId] = useState('')
  const list = useMemo(() => assignments.filter((a) => (filter === 'all' || a.status === filter) && (!classId || String(a.section_id) === classId) && matches(`${a.title} ${a.section?.name || ''}`, query)), [assignments, filter, classId, query])
  const count = (s) => assignments.filter((a) => a.status === s).length
  const filtered = query || filter !== 'all' || classId

  return (
    <section className="card">
      <Toolbar query={query} setQuery={setQuery} placeholder="Search assignments" filter={filter} setFilter={setFilter}
        options={[['all', 'All', assignments.length], ['published', 'Published', count('published')], ['draft', 'Drafts', count('draft')], ['closed', 'Closed', count('closed')]]}>
        <select className="select-inline" value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Filter by class">
          <option value="">All classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Toolbar>
      {loading ? <Skeleton /> : list.length ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Assignment</th><th>Due</th><th>Submitted</th><th>Graded</th><th>Status</th><th /></tr></thead>
            <tbody>
              {list.map((a) => {
                const overdue = a.status === 'published' && new Date(a.due_at) < new Date()
                return (
                  <tr key={a.id} className="clickable" onClick={() => openReview(a.id)}>
                    <td><div className="cell"><span className="symbol"><Icon name="file" /></span><span><b>{a.title}</b><small>{a.section?.name}{a.section?.subject ? ` · ${a.section.subject.name}` : ''}</small></span></div></td>
                    <td><span className="stack"><span>{formatDateTime(a.due_at)}</span><small className={overdue ? 'warn-text' : ''}>{dueLabel(a.due_at)}</small></span></td>
                    <td><Meter value={a.submissions_count} total={a.students_count} /></td>
                    <td><Meter value={a.graded_count} total={a.submissions_count} tone="green" /></td>
                    <td><StatusPill value={a.status} /></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="actions">
                        <button className="btn btn-primary btn-sm" onClick={() => openReview(a.id)}>Review</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openModal({ type: 'assignment', item: a })}>Edit</button>
                        <button className="icon-btn" aria-label={`Delete ${a.title}`} title="Delete" onClick={() => openModal({ type: 'deleteAssignment', item: a })}><Icon name="trash" size={17} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : <Empty icon="file" title={filtered ? 'No matching assignments' : 'No assignments yet'} text={filtered ? 'Try a different search or filter.' : 'Create an assignment with instructions, sample questions, PDFs, images or a YouTube video.'} action={filtered || !classes.length ? null : () => openModal({ type: 'assignment' })} actionLabel="New assignment" />}
    </section>
  )
}

function Meter({ value = 0, total = 0, tone }) {
  const pct = total ? Math.min(100, Math.round((value / total) * 100)) : 0
  return (
    <span className="seats">
      <span className="seats-text">{value} / {total}</span>
      <span className="progress"><i className={tone === 'green' ? 'ok' : ''} style={{ width: `${pct}%` }} /></span>
    </span>
  )
}

/* ------------------------------------------------------------------ form */

export function AssignmentForm({ assignment, preset, classes, onClose, onSave }) {
  const editing = Boolean(assignment)
  const [form, setForm] = useState({
    section_id: String(assignment?.section_id ?? preset?.section_id ?? (classes.length === 1 ? classes[0].id : '')),
    title: assignment?.title || '', instructions: assignment?.instructions || '',
    due_at: toLocalInput(assignment?.due_at) || defaultDue(),
    max_marks: assignment?.max_marks ?? 100, youtube_url: assignment?.youtube_url || '', status: assignment?.status || 'draft',
  })
  const [questions, setQuestions] = useState(assignment?.questions?.length ? assignment.questions.map((q) => ({ text: q.text, marks: q.marks ?? '' })) : [])
  const [files, setFiles] = useState([])
  const [removed, setRemoved] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({})
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const err = (n) => fields[n]?.[0]
  const videoId = form.youtube_url.match(YT)?.[1]
  const existing = (assignment?.attachments || []).filter((f) => !removed.includes(f.id))
  const marksTotal = questions.reduce((n, q) => n + (Number(q.marks) || 0), 0)

  const addFiles = (e) => {
    const picked = [...e.target.files]
    e.target.value = ''
    const ok = picked.filter((f) => /\.(pdf|png|jpe?g|webp)$/i.test(f.name) && f.size <= 10 * 1024 * 1024)
    if (ok.length !== picked.length) setError('Only PDF, PNG, JPG or WEBP files up to 10 MB can be attached.')
    else setError('')
    setFiles((prev) => [...prev, ...ok].slice(0, 8 - existing.length))
  }

  async function submit(status) {
    setBusy(true); setError(''); setFields({})
    const payload = {
      title: form.title, instructions: form.instructions, due_at: new Date(form.due_at).toISOString(), max_marks: Number(form.max_marks) || 100,
      youtube_url: form.youtube_url.trim() || null, status,
      questions: questions.filter((q) => q.text.trim()).map((q) => ({ text: q.text.trim(), marks: q.marks === '' ? null : Number(q.marks) })),
      ...(editing ? {} : { section_id: Number(form.section_id) }),
    }
    try { await onSave(payload, files, removed); onClose() } catch (e) { setError(e.message); setFields(e.fields || {}) } finally { setBusy(false) }
  }

  return (
    <Modal wide title={editing ? 'Edit assignment' : 'New assignment'} subtitle="Add instructions, sample questions, files or a video. Students’ families see it once it’s published." onClose={onClose}>
      <form className="form" onSubmit={(e) => { e.preventDefault(); submit(form.status === 'draft' && !editing ? 'published' : form.status) }}>
        <fieldset>
          <legend>Basics</legend>
          <div className="grid-2">
            <Field label="Class" required error={err('section_id')}>
              <select name="section_id" value={form.section_id} onChange={change} required disabled={editing}><option value="">Select a class</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.subject ? ` · ${c.subject.name}` : ''}</option>)}</select>
            </Field>
            <Field label="Title" required error={err('title')}><input name="title" value={form.title} onChange={change} required maxLength="255" placeholder="e.g. Fractions worksheet 1" /></Field>
          </div>
          <Field label="Instructions" required error={err('instructions')}><textarea name="instructions" rows="4" value={form.instructions} onChange={change} required maxLength="10000" placeholder="What should students do? How should they submit?" /></Field>
          <div className="grid-3">
            <Field label="Due" required error={err('due_at')}><input type="datetime-local" name="due_at" value={form.due_at} onChange={change} required /></Field>
            <Field label="Total marks" error={err('max_marks')}><input type="number" min="1" max="1000" name="max_marks" value={form.max_marks} onChange={change} /></Field>
            {editing && <Field label="Status"><select name="status" value={form.status} onChange={change}><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option></select></Field>}
          </div>
        </fieldset>

        <fieldset>
          <legend>Sample questions</legend>
          {questions.map((q, i) => (
            <div className="question-row" key={i}>
              <span className="q-num">{i + 1}</span>
              <input value={q.text} onChange={(e) => setQuestions(questions.map((x, n) => (n === i ? { ...x, text: e.target.value } : x)))} placeholder="Write a question" maxLength="1000" aria-label={`Question ${i + 1}`} />
              <input className="q-marks" type="number" min="0" step="0.5" value={q.marks} onChange={(e) => setQuestions(questions.map((x, n) => (n === i ? { ...x, marks: e.target.value } : x)))} placeholder="Marks" aria-label={`Marks for question ${i + 1}`} />
              <button type="button" className="icon-btn" aria-label={`Remove question ${i + 1}`} onClick={() => setQuestions(questions.filter((_, n) => n !== i))}><Icon name="close" size={16} /></button>
            </div>
          ))}
          {err('questions.0.text') && <small className="field-error">{err('questions.0.text')}</small>}
          <div className="row-between">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQuestions([...questions, { text: '', marks: '' }])} disabled={questions.length >= 30}><Icon name="plus" size={15} />Add question</button>
            {marksTotal > 0 && <small className={`field-hint ${marksTotal !== Number(form.max_marks) ? 'warn-text' : ''}`}>Questions total {marksTotal} of {form.max_marks} marks</small>}
          </div>
        </fieldset>

        <fieldset>
          <legend>Materials</legend>
          <Field label="YouTube video link" error={err('youtube_url')} hint="Optional — shown as an embedded video.">
            <input type="url" name="youtube_url" value={form.youtube_url} onChange={change} placeholder="https://www.youtube.com/watch?v=…" />
          </Field>
          {form.youtube_url && (videoId ? <YouTubeEmbed id={videoId} title="Video preview" /> : <small className="field-error">That doesn’t look like a YouTube link yet.</small>)}

          <div className="field">
            <span className="field-label">PDFs and images</span>
            <label className="dropzone">
              <Icon name="upload" size={22} /><span><b>Choose files</b> — PDF, PNG, JPG or WEBP, up to 10 MB each</span>
              <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*" onChange={addFiles} />
            </label>
            {(existing.length > 0 || files.length > 0) && (
              <ul className="file-list">
                {existing.map((f) => <li key={f.id}><Icon name={f.kind === 'pdf' ? 'file' : 'image'} size={17} /><a href={f.url} target="_blank" rel="noreferrer">{f.original_name}</a><small>{fileSize(f.size)}</small><button type="button" className="icon-btn" aria-label={`Remove ${f.original_name}`} onClick={() => setRemoved([...removed, f.id])}><Icon name="close" size={15} /></button></li>)}
                {files.map((f, i) => <li key={`${f.name}${i}`}><Icon name={/pdf$/i.test(f.name) ? 'file' : 'image'} size={17} /><span>{f.name}</span><small>{fileSize(f.size)} · new</small><button type="button" className="icon-btn" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, n) => n !== i))}><Icon name="close" size={15} /></button></li>)}
              </ul>
            )}
          </div>
        </fieldset>

        {error && <div className="alert alert-error" role="alert"><Icon name="alert" size={17} />{error}</div>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          {editing
            ? <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
            : <><button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { if (document.querySelector('.form').reportValidity()) submit('draft') }}>Save as draft</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Publishing…' : 'Publish'}</button></>}
        </div>
      </form>
    </Modal>
  )
}

/* ---------------------------------------------------------------- review */

const QUICK_FEEDBACK = ['Great work!', 'Good effort — check your answers again.', 'Please add more detail.', 'Please redo and resubmit.']

function GradePanel({ row, assignment, onSave, onRemove, onAddWork, busy }) {
  const max = assignment.max_marks
  const [marks, setMarks] = useState(row.grade ? String(row.grade.marks) : '')
  const [feedback, setFeedback] = useState(row.grade?.feedback || '')
  const [published, setPublished] = useState(row.grade?.published ?? true)
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const sub = row.submission
  const value = marks === '' ? null : Number(marks)
  const invalid = value !== null && (Number.isNaN(value) || value < 0 || value > max)
  const submitWork = (e) => { e.preventDefault(); onAddWork(file, text) }

  return (
    <div className="grade-panel">
      <div className="grade-head">
        <Avatar name={row.student.name} />
        <div><h3>{row.student.name}</h3><small>{row.student.code}{row.student.grade_level ? ` · Grade ${row.student.grade_level}` : ''}</small></div>
        <Pill map={STATE} value={row.state} />
      </div>

      {sub ? (
        <div className="work">
          <div className="work-meta">
            <span><Icon name="clock" size={15} />Submitted {formatDateTime(sub.submitted_at)}{sub.status === 'late' ? ' · late' : ''}</span>
            {sub.submitted_by_name && <span><Icon name="person" size={15} />by {sub.submitted_by_name}</span>}
          </div>
          {sub.text_answer && <p className="answer">{sub.text_answer}</p>}
          <FilePreview url={sub.file_url} name={sub.original_name} />
        </div>
      ) : (
        <form className="work work-empty" onSubmit={submitWork}>
          <p><b>No work submitted yet.</b> If the student handed in a paper or photo, you can add it for them.</p>
          <label className="dropzone small"><Icon name="upload" size={18} /><span>{file ? file.name : 'Attach a photo or PDF'}</span><input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt" onChange={(e) => setFile(e.target.files[0] || null)} /></label>
          <textarea rows="2" value={text} onChange={(e) => setText(e.target.value)} placeholder="Or type the student’s answer" aria-label="Typed answer" />
          <button className="btn btn-ghost btn-sm" disabled={busy || (!file && !text.trim())}>Add work for {row.student.name.split(' ')[0]}</button>
        </form>
      )}

      {sub && (
        <form className="grading" onSubmit={(e) => { e.preventDefault(); onSave({ marks: value, feedback, published }, false) }}>
          <div className="marks-row">
            <Field label="Marks" className="marks-field"><div className="marks-input"><input type="number" min="0" max={max} step="0.5" value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="0" required aria-invalid={invalid} /><span>/ {max}</span></div></Field>
            <div className="quick-marks" role="group" aria-label="Quick marks">
              {[1, 0.9, 0.75, 0.5].map((p) => <button type="button" key={p} onClick={() => setMarks(String(Math.round(max * p * 2) / 2))}>{Math.round(p * 100)}%</button>)}
            </div>
            {value !== null && !invalid && <span className="pct">{Math.round((value / max) * 100)}%</span>}
          </div>
          {invalid && <small className="field-error">Enter a mark between 0 and {max}.</small>}
          <Field label="Feedback for the family"><textarea rows="3" value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength="2000" placeholder="What went well? What should they work on?" /></Field>
          <div className="chips">{QUICK_FEEDBACK.map((t) => <button type="button" key={t} className="chip" onClick={() => setFeedback((f) => (f ? `${f} ${t}` : t))}>{t}</button>)}</div>
          <label className="check-inline"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />Release grade to parents</label>
          <div className="grade-actions">
            {row.grade && <button type="button" className="btn btn-ghost btn-sm" onClick={onRemove} disabled={busy}>Remove grade</button>}
            <span className="grow" />
            <button className="btn btn-ghost" disabled={busy || invalid || value === null}>Save</button>
            <button type="button" className="btn btn-primary" disabled={busy || invalid || value === null} onClick={() => onSave({ marks: value, feedback, published }, true)}>Save &amp; next <Icon name="arrow" size={16} /></button>
          </div>
        </form>
      )}
    </div>
  )
}

export function ReviewPage({ assignmentId, token, onBack, notify, onChanged }) {
  const [data, setData] = useState(null)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [showBrief, setShowBrief] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const base = `/teacher/assignments/${assignmentId}`

  const load = useCallback(async (pick) => {
    try {
      const res = (await request(`${base}/submissions`, { token })).data
      setData(res)
      setSelected((cur) => cur ?? pick ?? res.rows.find((r) => ['submitted', 'late'].includes(r.state))?.student.id ?? res.rows[0]?.student.id ?? null)
    } catch (err) { setError(err.message) }
  }, [base, token])
  useEffect(() => { Promise.resolve().then(() => load()) }, [load])

  const rows = data?.rows || []
  const row = rows.find((r) => r.student.id === selected)
  const subId = row?.submission?.id
  const opened = row?.submission?.opened_at
  useEffect(() => { if (subId && !opened) request(`/teacher/submissions/${subId}`, { token }).catch(() => {}) }, [subId, opened, token])

  const visible = rows.filter((r) => filter === 'all' || (filter === 'review' ? ['submitted', 'late'].includes(r.state) : r.state === filter))
  const counts = { all: rows.length, review: rows.filter((r) => ['submitted', 'late'].includes(r.state)).length, graded: rows.filter((r) => r.state === 'graded').length, missing: rows.filter((r) => r.state === 'missing').length }

  async function act(fn, message) {
    setBusy(true)
    try { await fn(); await load(); onChanged(); if (message) notify(message) } catch (err) { notify(err.message, 'error') } finally { setBusy(false) }
  }

  function save(grade, next) {
    const order = rows.findIndex((r) => r.student.id === selected)
    const after = [...rows.slice(order + 1), ...rows.slice(0, order)].find((r) => ['submitted', 'late'].includes(r.state))
    return act(async () => {
      await request(`/teacher/submissions/${subId}/grade`, { token, method: 'PUT', body: grade })
      if (next) setSelected(after ? after.student.id : selected)
    }, next && !after ? 'All caught up — nothing left to review.' : 'Grade saved.')
  }

  const addWork = (file, text) => act(async () => {
    const body = new FormData()
    if (file) body.append('file', file)
    if (text.trim()) body.append('text_answer', text.trim())
    await request(`${base}/students/${selected}/submission`, { token, method: 'POST', body })
  }, 'Work added.')

  if (error) return <div className="alert alert-error" role="alert"><Icon name="alert" size={17} />{error}<button className="link" onClick={onBack}>Back</button></div>
  if (!data) return <section className="card"><Skeleton rows={6} /></section>
  const a = data.assignment
  const s = data.stats

  return (
    <>
      <div className="review-top">
        <button className="btn btn-ghost btn-sm" onClick={onBack}><Icon name="arrow" size={15} className="flip" />All assignments</button>
        <div className="grow"><h2>{a.title}</h2><small>{a.section?.name} · Due {formatDateTime(a.due_at)} · {a.max_marks} marks · <StatusPill value={a.status} /></small></div>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowBrief(!showBrief)}>{showBrief ? 'Hide' : 'View'} assignment</button>
        <button className="btn btn-ghost btn-sm" disabled={busy || s.graded === 0} onClick={() => act(() => request(`${base}/grades/publish`, { token, method: 'POST' }), 'All grades released to parents.')}>Release all grades</button>
      </div>

      <div className="review-stats">
        <div><b>{s.submitted}<em>/{s.total}</em></b><small>Submitted</small></div>
        <div><b>{s.to_review}</b><small>To review</small></div>
        <div><b>{s.graded}</b><small>Graded</small></div>
        <div><b>{s.missing}</b><small>Missing</small></div>
        <div><b>{s.average ?? '—'}<em>{s.average !== null ? `/${a.max_marks}` : ''}</em></b><small>Average</small></div>
      </div>

      {showBrief && <section className="card brief"><AssignmentContent assignment={a} /></section>}

      <div className="review">
        <section className="card roster">
          <div className="roster-filter segmented" role="group" aria-label="Filter students">
            {[['all', 'All'], ['review', 'To review'], ['graded', 'Graded'], ['missing', 'Missing']].map(([k, l]) => <button key={k} className={filter === k ? 'on' : ''} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}<span>{counts[k]}</span></button>)}
          </div>
          {visible.length ? (
            <ul className="roster-list">
              {visible.map((r) => (
                <li key={r.student.id}>
                  <button className={r.student.id === selected ? 'on' : ''} onClick={() => setSelected(r.student.id)}>
                    <Avatar name={r.student.name} size="sm" />
                    <span className="grow"><b>{r.student.name}</b><small>{r.state === 'graded' ? `${r.grade.marks} / ${a.max_marks}` : STATE[r.state][0]}</small></span>
                    <i className={`dot dot-${r.state}`} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : <p className="muted-cell pad-all">No students in this view.</p>}
        </section>

        <section className="card">
          {row ? <GradePanel key={`${row.student.id}-${row.state}-${row.grade?.updated_at || ''}-${row.submission?.submitted_at || ''}`} row={row} assignment={a} busy={busy} onSave={save}
            onRemove={() => act(() => request(`/teacher/submissions/${subId}/grade`, { token, method: 'DELETE' }), 'Grade removed.')} onAddWork={addWork} /> : <Empty icon="cap" title="No students" text="Enroll students in this class to start collecting work." />}
        </section>
      </div>
    </>
  )
}
