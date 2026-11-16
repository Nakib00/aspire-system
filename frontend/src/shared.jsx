import { useState } from 'react'
import { Avatar, Brand, Icon } from './ui'

export function PageHeader({ title, text, action }) {
  return (
    <div className="page-header">
      <div><h1>{title}</h1><p>{text}</p></div>
      {action}
    </div>
  )
}

export function Stat({ icon, label, value, note, tone, onClick }) {
  return (
    <button className="stat" onClick={onClick}>
      <span className={`stat-icon tone-${tone}`}><Icon name={icon} /></span>
      <span className="stat-body"><small>{label}</small><strong>{value}</strong><em>{note}</em></span>
      <Icon name="chevron" size={16} className="stat-go" />
    </button>
  )
}

export function Toolbar({ query, setQuery, placeholder, filter, setFilter, options, children }) {
  return (
    <div className="toolbar">
      <div className="search"><Icon name="search" /><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} aria-label={placeholder} /></div>
      {children}
      {options && (
        <div className="segmented" role="group" aria-label="Filter by status">
          {options.map(([value, label, count]) => (
            <button key={value} className={filter === value ? 'on' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}<span>{count}</span></button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Sidebar + top bar used by every role. `nav` is a list of [id, icon, label] or { section } headings. */
export function Shell({ nav, page, go, user, roleLabel, centerName, onLogout, children }) {
  const [menu, setMenu] = useState(false)
  const items = nav.filter((n) => Array.isArray(n))
  const current = items.find(([id]) => id === page)
  const pick = (id) => { go(id); setMenu(false) }
  return (
    <div className="shell">
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <div className="sidebar-top"><Brand inverse /><button className="icon-btn only-mobile" onClick={() => setMenu(false)} aria-label="Close menu"><Icon name="close" /></button></div>
        {centerName && <div className="sidebar-center"><small>Center</small><b>{centerName}</b></div>}
        <nav aria-label="Main">
          {nav.map((n) => Array.isArray(n)
            ? <button key={n[0]} className={`nav ${page === n[0] ? 'on' : ''}`} aria-current={page === n[0] ? 'page' : undefined} onClick={() => pick(n[0])}><Icon name={n[1]} />{n[2]}</button>
            : <div className="nav-section" key={n.section}>{n.section}</div>)}
        </nav>
        <div className="sidebar-user">
          <Avatar name={user.name} />
          <span><b>{user.name}</b><small>{roleLabel}</small></span>
          <button className="icon-btn" onClick={() => onLogout(true)} title="Sign out" aria-label="Sign out"><Icon name="logout" /></button>
        </div>
      </aside>
      {menu && <div className="scrim" onClick={() => setMenu(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="icon-btn only-mobile" onClick={() => setMenu(true)} aria-label="Open menu"><Icon name="menu" /></button>
          <nav className="crumbs" aria-label="Breadcrumb"><span>{roleLabel}</span><Icon name="chevron" size={14} /><b>{current?.[2]}</b></nav>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
