import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatDate, formatHours, formatRelative, getAll, request, DAYS } from './api'
import { AdminForm, CenterForm } from './Forms'
import { matches } from './helpers'
import { PageHeader, Shell, Stat, Toolbar } from './shared'
import { Avatar, ConfirmDialog, Empty, Icon, Modal, Skeleton, StatusBadge, Toast } from './ui'

const NAV = [
  ['overview', 'overview', 'Overview'],
  ['centers', 'centers', 'Centers'],
  ['admins', 'users', 'Center admins'],
]

const centerAddress = (c) => [c.address, c.city].filter(Boolean).join(', ')

function Overview({ centers, admins, loading, go, openModal }) {
  const activeCenters = centers.filter((c) => c.status === 'active')
  const capacity = centers.reduce((sum, c) => sum + (c.capacity || 0), 0)
  const withoutAdmin = activeCenters.filter((c) => !admins.some((a) => a.center_id === c.id && a.active))
  const unassigned = admins.filter((a) => !a.center_id)
  const disabled = admins.filter((a) => !a.active)
  const todo = [
    ...withoutAdmin.map((c) => ({ key: `c${c.id}`, text: <><b>{c.name}</b> has no active administrator</>, label: 'Assign admin', run: () => openModal({ type: 'admin' }) })),
    ...unassigned.map((a) => ({ key: `u${a.id}`, text: <><b>{a.name}</b> is not assigned to a center and cannot sign in</>, label: 'Assign center', run: () => openModal({ type: 'admin', item: a }) })),
    ...disabled.map((a) => ({ key: `d${a.id}`, text: <><b>{a.name}</b>’s account is inactive</>, label: 'Review', run: () => openModal({ type: 'admin', item: a }) })),
  ]
  const n = (v) => (loading ? '—' : v)

  return (
    <>
      <div className="stats">
        <Stat icon="centers" tone="indigo" label="Total centers" value={n(centers.length)} note={`${n(activeCenters.length)} active`} onClick={() => go('centers')} />
        <Stat icon="users" tone="teal" label="Center admins" value={n(admins.length)} note={`${n(admins.filter((a) => a.active && a.center_id).length)} active & assigned`} onClick={() => go('admins')} />
        <Stat icon="person" tone="amber" label="Total capacity" value={n(capacity.toLocaleString())} note="students across centers" onClick={() => go('centers')} />
        <Stat icon="alert" tone={todo.length ? 'rose' : 'green'} label="Needs attention" value={n(todo.length)} note={todo.length ? 'items to review' : 'all clear'} onClick={() => document.getElementById('attention')?.scrollIntoView({ behavior: 'smooth' })} />
      </div>

      <div className="split">
        <section className="card" id="attention">
          <header className="card-head"><div><h2>Needs attention</h2><p>Things that may block a center from running smoothly.</p></div></header>
          {loading ? <Skeleton rows={3} /> : todo.length ? (
            <ul className="todo">
              {todo.map((t) => (
                <li key={t.key}><span className="todo-dot"><Icon name="alert" size={15} /></span><span>{t.text}</span><button className="btn btn-ghost btn-sm" onClick={t.run}>{t.label}</button></li>
              ))}
            </ul>
          ) : <Empty icon="check" title="Everything looks good" text="Every active center has an administrator and all accounts are in order." />}
        </section>

        <section className="card">
          <header className="card-head"><div><h2>Centers</h2><p>Most recently added.</p></div><button className="link" onClick={() => go('centers')}>View all</button></header>
          {loading ? <Skeleton rows={4} /> : centers.length ? (
            <ul className="mini-list">
              {[...centers].sort((a, b) => b.id - a.id).slice(0, 5).map((c) => (
                <li key={c.id}>
                  <span className="symbol"><Icon name="centers" /></span>
                  <span className="grow"><b>{c.name}</b><small>{c.city || c.address}</small></span>
                  <StatusBadge active={c.status === 'active'} />
                </li>
              ))}
            </ul>
          ) : <Empty icon="centers" title="No centers yet" text="Add your first center to get started." action={() => openModal({ type: 'center' })} actionLabel="Add center" />}
        </section>
      </div>
    </>
  )
}

function CentersPage({ centers, admins, loading, openModal }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const list = useMemo(() => centers.filter((c) => (filter === 'all' || c.status === filter) && matches(`${c.name} ${c.code || ''} ${c.address} ${c.city || ''} ${c.contact_person || ''}`, query)), [centers, filter, query])
  const count = (s) => centers.filter((c) => c.status === s).length
  const adminsOf = (c) => admins.filter((a) => a.center_id === c.id)

  return (
    <section className="card">
      <Toolbar query={query} setQuery={setQuery} placeholder="Search by name, code, city or contact" filter={filter} setFilter={setFilter} options={[['all', 'All', centers.length], ['active', 'Active', count('active')], ['inactive', 'Inactive', count('inactive')]]} />
      {loading ? <Skeleton /> : list.length ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Center</th><th>Location</th><th>Contact</th><th>Capacity</th><th>Admin</th><th>Status</th><th /></tr></thead>
            <tbody>
              {list.map((c) => {
                const owners = adminsOf(c)
                return (
                  <tr key={c.id} className="clickable" onClick={() => openModal({ type: 'detail', item: c })}>
                    <td><div className="cell"><span className="symbol"><Icon name="centers" /></span><span><b>{c.name}</b><small>{c.code || '—'}</small></span></div></td>
                    <td className="muted-cell">{centerAddress(c)}</td>
                    <td><span className="stack"><span>{c.contact_person || '—'}</span><small>{c.contact_phone || c.phone || ''}</small></span></td>
                    <td>{c.capacity ? c.capacity.toLocaleString() : '—'}</td>
                    <td>{owners.length ? owners.map((a) => a.name).join(', ') : <span className="warn-text">Unassigned</span>}</td>
                    <td><StatusBadge active={c.status === 'active'} /></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openModal({ type: 'center', item: c })}>Edit</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openModal({ type: 'status', item: c })}>{c.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : <Empty icon="centers" title={query || filter !== 'all' ? 'No matching centers' : 'No centers yet'} text={query || filter !== 'all' ? 'Try a different search or filter.' : 'Add your first center to get started.'} action={!query && filter === 'all' ? () => openModal({ type: 'center' }) : null} actionLabel="Add center" />}
    </section>
  )
}

function AdminsPage({ admins, loading, openModal }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const list = useMemo(() => admins.filter((a) => (filter === 'all' || (filter === 'active' ? a.active : !a.active)) && matches(`${a.name} ${a.email} ${a.designation || ''} ${a.center?.name || ''}`, query)), [admins, filter, query])

  return (
    <section className="card">
      <Toolbar query={query} setQuery={setQuery} placeholder="Search by name, email or center" filter={filter} setFilter={setFilter} options={[['all', 'All', admins.length], ['active', 'Active', admins.filter((a) => a.active).length], ['inactive', 'Inactive', admins.filter((a) => !a.active).length]]} />
      {loading ? <Skeleton /> : list.length ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Administrator</th><th>Contact</th><th>Center</th><th>Last sign-in</th><th>Status</th><th /></tr></thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td><div className="cell"><Avatar name={a.name} /><span><b>{a.name}</b><small>{a.designation || 'Center admin'}</small></span></div></td>
                  <td><span className="stack"><span>{a.email}</span><small>{a.phone || ''}</small></span></td>
                  <td>{a.center?.name || <span className="warn-text">Not assigned</span>}</td>
                  <td className="muted-cell">{formatRelative(a.last_login_at)}</td>
                  <td><StatusBadge active={a.active} /></td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openModal({ type: 'admin', item: a })}>Edit</button>
                      {a.center_id && <button className="btn btn-ghost btn-sm" onClick={() => openModal({ type: 'unassign', item: a })}>Unassign</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty icon="users" title={query || filter !== 'all' ? 'No matching administrators' : 'No administrators yet'} text={query || filter !== 'all' ? 'Try a different search or filter.' : 'Add an administrator and assign them to a center.'} action={!query && filter === 'all' ? () => openModal({ type: 'admin' }) : null} actionLabel="Add administrator" />}
    </section>
  )
}

function Detail({ label, icon, children }) {
  return <div className="detail"><Icon name={icon} /><div><small>{label}</small><span>{children || <em>Not provided</em>}</span></div></div>
}

function CenterDetail({ center, admins, onClose, onEdit, onAddAdmin }) {
  const days = center.operating_days?.length ? DAYS.filter(([d]) => center.operating_days.includes(d)).map(([, l]) => l).join(', ') : null
  const owners = admins.filter((a) => a.center_id === center.id)
  return (
    <Modal title={center.name} subtitle={center.code ? `Center code ${center.code}` : undefined} onClose={onClose} drawer>
      <div className="drawer-body">
        <div className="drawer-status"><StatusBadge active={center.status === 'active'} /><button className="btn btn-ghost btn-sm" onClick={onEdit}><Icon name="edit" size={15} />Edit details</button></div>

        <h3>Location & contact</h3>
        <Detail label="Address" icon="location">{centerAddress(center)}{center.postal_code ? ` ${center.postal_code}` : ''}</Detail>
        <Detail label="Center phone" icon="phone">{center.phone}</Detail>
        <Detail label="Center email" icon="mail">{center.email}</Detail>
        <Detail label="Contact person" icon="person">{center.contact_person && `${center.contact_person}${center.contact_phone ? ` · ${center.contact_phone}` : ''}`}</Detail>

        <h3>Operations</h3>
        <Detail label="Student capacity" icon="users">{center.capacity && `${center.capacity.toLocaleString()} students`}</Detail>
        <Detail label="Opening hours" icon="clock">{formatHours(center)}</Detail>
        <Detail label="Operating days" icon="calendar">{days}</Detail>
        <Detail label="Established" icon="calendar">{center.established_on && formatDate(center.established_on)}</Detail>

        <h3>Administrators <span className="count">{owners.length}</span></h3>
        {owners.length ? (
          <ul className="mini-list">
            {owners.map((a) => (
              <li key={a.id}><Avatar name={a.name} /><span className="grow"><b>{a.name}</b><small>{a.designation || a.email}</small></span><StatusBadge active={a.active} /></li>
            ))}
          </ul>
        ) : <div className="alert alert-info"><Icon name="alert" size={17} />No administrator assigned yet.<button className="link" onClick={onAddAdmin}>Add one</button></div>}

        {center.notes && <><h3>Internal notes</h3><p className="notes">{center.notes}</p></>}
        <p className="meta">Created {formatDate(center.created_at)} · Updated {formatDate(center.updated_at)}</p>
      </div>
    </Modal>
  )
}

export default function SuperAdminWorkspace({ session, onLogout }) {
  const [page, setPage] = useState('overview')
  const [centers, setCenters] = useState([])
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(null)
  const [working, setWorking] = useState(false)
  const token = session.token

  const refresh = useCallback(async () => {
    setError('')
    try {
      const [c, a] = await Promise.all([getAll('/centers', token), getAll('/center-admins', token)])
      setCenters(c)
      setAdmins(a)
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
  const go = setPage

  async function save(kind, data) {
    const base = kind === 'center' ? '/centers' : '/center-admins'
    const editing = modal.item
    await request(editing ? `${base}/${editing.id}` : base, { token, method: editing ? 'PATCH' : 'POST', body: data })
    setToast({ text: `${kind === 'center' ? 'Center' : 'Administrator'} ${editing ? 'updated' : 'created'}.` })
    await refresh()
  }

  async function confirm() {
    setWorking(true)
    try {
      if (modal.type === 'unassign') await request(`/center-admins/${modal.item.id}/center`, { token, method: 'DELETE' })
      else await request(`/centers/${modal.item.id}`, { token, method: 'PATCH', body: { status: modal.item.status === 'active' ? 'inactive' : 'active' } })
      setToast({ text: modal.type === 'unassign' ? 'Administrator unassigned.' : 'Center status updated.' })
      setModal(null)
      await refresh()
    } catch (err) {
      setToast({ type: 'error', text: err.message })
      setModal(null)
    } finally {
      setWorking(false)
    }
  }

  const titles = {
    overview: [`Welcome back, ${session.user.name.split(' ')[0]}`, 'A quick look at how your centers are doing today.'],
    centers: ['Centers', 'Manage every center’s details, contacts and status.'],
    admins: ['Center admins', 'Control who manages each center and their access.'],
  }
  const action = page === 'admins'
    ? <button className="btn btn-primary" onClick={() => setModal({ type: 'admin' })}><Icon name="plus" />Add administrator</button>
    : <button className="btn btn-primary" onClick={() => setModal({ type: 'center' })}><Icon name="plus" />Add center</button>
  const item = modal?.item

  return (
    <>
      <Shell nav={NAV} page={page} go={go} user={session.user} roleLabel="Super admin" onLogout={onLogout}>
        <PageHeader title={titles[page][0]} text={titles[page][1]} action={page === 'overview' ? null : action} />
        {error && <div className="alert alert-error" role="alert"><Icon name="alert" size={17} />{error}<button className="link" onClick={refresh}>Try again</button></div>}
        {page === 'overview' && <Overview centers={centers} admins={admins} loading={loading} go={go} openModal={setModal} />}
        {page === 'centers' && <CentersPage centers={centers} admins={admins} loading={loading} openModal={setModal} />}
        {page === 'admins' && <AdminsPage admins={admins} loading={loading} openModal={setModal} />}
      </Shell>

      {modal?.type === 'center' && <CenterForm center={item} onClose={closeModal} onSave={(d) => save('center', d)} />}
      {modal?.type === 'admin' && <AdminForm admin={item} centers={centers} onClose={closeModal} onSave={(d) => save('admin', d)} />}
      {modal?.type === 'detail' && <CenterDetail center={centers.find((c) => c.id === item.id) || item} admins={admins} onClose={closeModal} onEdit={() => setModal({ type: 'center', item })} onAddAdmin={() => setModal({ type: 'admin' })} />}
      {modal?.type === 'unassign' && <ConfirmDialog danger title="Unassign this administrator?" text={`${item.name} will be removed from ${item.center?.name || 'their center'}, signed out, and unable to sign in until reassigned.`} confirmLabel="Unassign" busy={working} onConfirm={confirm} onClose={closeModal} />}
      {modal?.type === 'status' && <ConfirmDialog danger={item.status === 'active'} title={`${item.status === 'active' ? 'Deactivate' : 'Activate'} ${item.name}?`} text={item.status === 'active' ? 'An inactive center cannot receive new administrators. You can reactivate it at any time.' : 'The center will be available for administrators again.'} confirmLabel={item.status === 'active' ? 'Deactivate' : 'Activate'} busy={working} onConfirm={confirm} onClose={closeModal} />}
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  )
}
