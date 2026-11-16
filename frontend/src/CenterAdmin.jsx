import { useCallback, useEffect, useState } from 'react'
import { ClassDetail, ClassForm, ClassesPage, EnrollDialog, SubjectForm, SubjectsPage } from './Academics'
import { getAll, request } from './api'
import CenterDashboard from './CenterDashboard'
import { ROLE_META } from './helpers'
import { GuardianDialog, PeoplePage, PersonDetail, PersonForm } from './People'
import { PageHeader, Shell } from './shared'
import { ConfirmDialog, Icon, Toast } from './ui'

const NAV = [
  ['dashboard', 'overview', 'Dashboard'],
  { section: 'People' },
  ['students', 'cap', 'Students'],
  ['parents', 'family', 'Parents'],
  ['teachers', 'person', 'Teachers'],
  { section: 'Academics' },
  ['subjects', 'book', 'Subjects'],
  ['classes', 'calendar', 'Classes'],
]

const PATHS = { student: 'students', parent: 'parents', teacher: 'teachers', subject: 'subjects', class: 'classes' }
const LABELS = { student: 'Student', parent: 'Parent', teacher: 'Teacher', subject: 'Subject', class: 'Class' }

export default function CenterAdminWorkspace({ session, onLogout }) {
  const token = session.token
  const [page, setPage] = useState('dashboard')
  const [data, setData] = useState({ students: [], parents: [], teachers: [], subjects: [], classes: [] })
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(null)
  const [working, setWorking] = useState(false)
  const [classDetail, setClassDetail] = useState(null)
  const [subjectFilter, setSubjectFilter] = useState('')

  const refresh = useCallback(async () => {
    setError('')
    try {
      const [students, parents, teachers, subjects, classes, dash] = await Promise.all([
        getAll('/center/students', token), getAll('/center/parents', token), getAll('/center/teachers', token),
        getAll('/center/subjects', token), getAll('/center/classes', token), request('/center/dashboard', { token }),
      ])
      setData({ students, parents, teachers, subjects, classes })
      setDashboard(dash.data)
    } catch (err) {
      if (err.status === 401) { onLogout(false); return }
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, onLogout])

  useEffect(() => { Promise.resolve().then(refresh) }, [refresh])
  const dismissToast = useCallback(() => setToast(null), [])
  const closeModal = useCallback(() => setModal(null), [])
  const notify = (text, type) => setToast({ text, type })

  const classId = modal && (modal.type === 'classDetail' || modal.type === 'enroll') ? modal.item.id : null
  useEffect(() => {
    if (!classId) return undefined
    let live = true
    request(`/center/classes/${classId}`, { token }).then((res) => { if (live) setClassDetail(res.data) }).catch(() => {})
    return () => { live = false }
  }, [classId, token])

  async function save(path, body) {
    const editing = modal.item
    await request(`/center/${path}${editing ? `/${editing.id}` : ''}`, { token, method: editing ? 'PATCH' : 'POST', body })
    notify(`${editing ? 'Changes saved' : 'Created successfully'}.`)
    await refresh()
  }

  async function remove() {
    setWorking(true)
    try {
      await request(`/center/${PATHS[modal.role]}/${modal.item.id}`, { token, method: 'DELETE' })
      notify(`${LABELS[modal.role]} deleted.`)
      setModal(null)
      await refresh()
    } catch (err) {
      notify(err.message, 'error')
      setModal(null)
    } finally {
      setWorking(false)
    }
  }

  async function mutate(path, options, message) {
    try {
      const res = await request(`/center/${path}`, { token, ...options })
      notify(message)
      await refresh()
      return res
    } catch (err) {
      notify(err.message, 'error')
      throw err
    }
  }

  const find = (role, id) => data[PATHS[role]].find((x) => x.id === id)
  const openPerson = (role, id) => { const item = find(role, id); if (item) setModal({ type: 'detail', role, item }) }
  const live = (role, item) => find(role, item.id) || item

  const titles = {
    dashboard: [`Welcome back, ${session.user.name.split(' ')[0]}`, session.user.center ? `Here’s how ${session.user.center.name} is doing today.` : 'Here’s how your center is doing today.'],
    students: ['Students', 'Everyone enrolled at your center and who looks after them.'],
    parents: ['Parents', 'Parents have their own login and dashboard to follow their children.'],
    teachers: ['Teachers', 'Your teaching staff and the classes they run.'],
    subjects: ['Subjects', 'What you teach. Each subject can have several classes.'],
    classes: ['Classes', 'Scheduled groups for a subject — assign a teacher and enroll students.'],
  }
  const addAction = {
    students: { type: 'person', role: 'student', label: 'Add student' },
    parents: { type: 'person', role: 'parent', label: 'Add parent' },
    teachers: { type: 'person', role: 'teacher', label: 'Add teacher' },
    subjects: { type: 'subject', label: 'Add subject' },
    classes: { type: 'class', label: 'Add class' },
  }[page]
  const roleOfPage = { students: 'student', parents: 'parent', teachers: 'teacher' }[page]
  const item = modal?.item
  const detailClass = classDetail && item && classDetail.id === item.id ? classDetail : null

  return (
    <>
      <Shell nav={NAV} page={page} go={setPage} user={session.user} roleLabel="Center admin" centerName={session.user.center?.name} onLogout={onLogout}>
        <PageHeader title={titles[page][0]} text={titles[page][1]} action={addAction && <button className="btn btn-primary" onClick={() => setModal(addAction)}><Icon name="plus" />{addAction.label}</button>} />
        {error && <div className="alert alert-error" role="alert"><Icon name="alert" size={17} />{error}<button className="link" onClick={refresh}>Try again</button></div>}
        {page === 'dashboard' && <CenterDashboard data={dashboard} loading={loading} go={setPage} openModal={setModal} />}
        {roleOfPage && <PeoplePage key={roleOfPage} role={roleOfPage} items={data[PATHS[roleOfPage]]} loading={loading} openModal={setModal} />}
        {page === 'subjects' && <SubjectsPage subjects={data.subjects} loading={loading} openModal={setModal} goClasses={(id) => { setSubjectFilter(String(id)); setPage('classes') }} />}
        {page === 'classes' && <ClassesPage classes={data.classes} subjects={data.subjects} loading={loading} openModal={setModal} subjectFilter={subjectFilter} setSubjectFilter={setSubjectFilter} />}
      </Shell>

      {modal?.type === 'person' && <PersonForm role={modal.role} person={item} students={data.students.filter((s) => s.active)} parents={data.parents} onClose={closeModal} onSave={(body) => save(ROLE_META[modal.role].path, body)} />}
      {modal?.type === 'detail' && (
        <PersonDetail role={modal.role} person={live(modal.role, item)} onClose={closeModal} onOpen={openPerson}
          onEdit={() => setModal({ type: 'person', role: modal.role, item: live(modal.role, item) })}
          onAddGuardian={() => setModal({ type: 'guardian', item: live('student', item) })}
          onRemoveGuardian={(p) => mutate(`students/${item.id}/guardians/${p.id}`, { method: 'DELETE' }, `${p.name} unlinked from ${item.name}.`).catch(() => {})} />
      )}
      {modal?.type === 'guardian' && <GuardianDialog student={live('student', item)} parents={data.parents} onClose={() => setModal({ type: 'detail', role: 'student', item })} onSave={(body) => mutate(`students/${item.id}/guardians`, { method: 'POST', body }, 'Guardian added.')} />}
      {modal?.type === 'subject' && <SubjectForm subject={item} onClose={closeModal} onSave={(body) => save('subjects', body)} />}
      {modal?.type === 'class' && <ClassForm cls={item} preset={modal.preset} subjects={data.subjects} teachers={data.teachers} onClose={closeModal} onSave={(body) => save('classes', body)} />}
      {modal?.type === 'classDetail' && (
        <ClassDetail cls={live('class', item)} detail={detailClass} onClose={closeModal} onEdit={() => setModal({ type: 'class', item: live('class', item) })} onEnroll={() => setModal({ type: 'enroll', item })}
          onUnenroll={(s) => mutate(`classes/${item.id}/students/${s.id}`, { method: 'DELETE' }, `${s.name} removed from class.`).then((res) => setClassDetail(res.data)).catch(() => {})} />
      )}
      {modal?.type === 'enroll' && detailClass && (
        <EnrollDialog cls={{ ...live('class', item), students: detailClass.students }} students={data.students} onClose={closeModal}
          onSave={async (ids) => { const res = await mutate(`classes/${item.id}/students`, { method: 'POST', body: { student_ids: ids } }, 'Students enrolled.'); setClassDetail(res.data) }} />
      )}
      {modal?.type === 'delete' && (
        <ConfirmDialog danger busy={working} title={`Delete ${modal.item.name}?`} confirmLabel="Delete" onConfirm={remove} onClose={closeModal}
          text={{ student: 'This removes the student, their class enrollments and links to parents. Parent accounts are kept.', parent: 'This removes the parent account and their dashboard access. Students are kept.', teacher: 'This removes the teacher account and unassigns them from classes.', subject: 'Subjects with classes can’t be deleted — mark them inactive instead.', class: 'This removes the class and its student enrollments.' }[modal.role]} />
      )}
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  )
}
