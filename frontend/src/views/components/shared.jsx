/**
 * @file View layer: page-level layout components shared by every role workspace.
 */
import { useEffect, useRef, useState } from 'react'
import { Avatar, Brand, HelpDialog, Icon } from './ui'

/**
 * Page title with a one-line explanation and an optional primary action.
 *
 * @param {{title: string, text: string, action?: import('react').ReactNode}} props
 */
export function PageHeader({ title, text, action }) {
  return (
    <div className="page-header">
      <div><h1>{title}</h1><p>{text}</p></div>
      {action}
    </div>
  )
}

/**
 * Clickable summary tile used on dashboards.
 *
 * @param {{icon: string, label: string, value: string|number, note: string, tone: string, onClick: () => void}} props
 */
export function Stat({ icon, label, value, note, tone, onClick }) {
  return (
    <button className="stat" onClick={onClick}>
      <span className={`stat-icon tone-${tone}`}><Icon name={icon} /></span>
      <span className="stat-body"><small>{label}</small><strong>{value}</strong><em>{note}</em></span>
      <Icon name="chevron" size={16} className="stat-go" />
    </button>
  )
}

/**
 * Search box plus optional status filter shared by list pages.
 *
 * @param {{query: string, setQuery: Function, placeholder: string, filter?: string, setFilter?: Function, options?: Array<[string, string, number]>, children?: import('react').ReactNode}} props
 */
export function Toolbar({ query, setQuery, placeholder, filter, setFilter, options, children }) {
  const input = useRef(null)
  useEffect(() => {
    const onKey = (event) => {
      const tag = event.target.tagName
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        event.preventDefault()
        input.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div className="toolbar">
      <div className="search"><Icon name="search" /><input ref={input} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} aria-label={`${placeholder} (press / to focus)`} /></div>
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
  const [help, setHelp] = useState(false)
  const items = nav.filter((n) => Array.isArray(n))
  const current = items.find(([id]) => id === page)
  const pick = (id) => { go(id); setMenu(false) }
  // Visibility of system status: the browser tab always names the current page.
  useEffect(() => { document.title = current ? `${current[2]} · ${roleLabel} · Aspire` : 'Aspire' }, [current, roleLabel])
  return (
    <div className="shell">
      <a className="skip-link" href="#content">Skip to main content</a>
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <div className="sidebar-top"><Brand inverse /><button className="icon-btn only-mobile" onClick={() => setMenu(false)} aria-label="Close menu"><Icon name="close" /></button></div>
        {centerName && <div className="sidebar-center"><small>Center</small><b>{centerName}</b></div>}
        <nav aria-label="Main">
          {nav.map((n) => Array.isArray(n)
            ? <button key={n[0]} className={`nav ${page === n[0] ? 'on' : ''}`} aria-current={page === n[0] ? 'page' : undefined} onClick={() => pick(n[0])}><Icon name={n[1]} />{n[2]}</button>
            : <div className="nav-section" key={n.section}>{n.section}</div>)}
        </nav>
        <button className="nav nav-help" onClick={() => setHelp(true)}><Icon name="help" />Help &amp; shortcuts</button>
        <div className="sidebar-user">
          <Avatar name={user.name} />
          <span><b>{user.name}</b><small>{roleLabel}</small></span>
          <button className="icon-btn" onClick={() => onLogout(true)} title="Sign out" aria-label="Sign out"><Icon name="logout" /></button>
        </div>
      </aside>
      {menu && <div className="scrim" onClick={() => setMenu(false)} />}
      {help && <HelpDialog roleLabel={roleLabel} onClose={() => setHelp(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="icon-btn only-mobile" onClick={() => setMenu(true)} aria-label="Open menu"><Icon name="menu" /></button>
          <nav className="crumbs" aria-label="Breadcrumb"><span>{roleLabel}</span><Icon name="chevron" size={14} /><b>{current?.[2]}</b></nav>
        </header>
        <main className="content" id="content" tabIndex={-1}>{children}</main>
      </div>
    </div>
  )
}
