/**
 * @file View layer: low-level, stateless UI building blocks (icons, fields, dialogs, toasts).
 */
import { useEffect, useRef } from 'react'
import { initials } from '../../models/format'

const icons = {
  overview: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
  centers: <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6M9 11h.01M15 11h.01"/>,
  users: <><circle cx="9" cy="8" r="3.2"/><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5.2a3.2 3.2 0 0 1 0 5.6M18 14.5a5.5 5.5 0 0 1 3 4.5v1"/></>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></>,
  logout: <path d="M10 17v3H4V4h6v3M15 8l4 4-4 4M8 12h11"/>,
  close: <path d="M6 6l12 12M18 6 6 18"/>,
  edit: <path d="m4 20 4-1L19.5 7.5a2.1 2.1 0 0 0-3-3L5 16zM14.5 6.5l3 3"/>,
  check: <path d="m5 12.5 4.5 4.5L19 7"/>,
  location: <><path d="M20 10c0 5.5-8 11-8 11S4 15.5 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
  alert: <><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  shield: <><path d="M12 3 4 6v5c0 5 3.2 8 8 10 4.8-2 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/></>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  cap: <><path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v6"/></>,
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 7h6"/></>,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>,
  family: <><circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.3"/><path d="M2 20v-1a6 6 0 0 1 12 0v1M14.5 15a4.5 4.5 0 0 1 7.5 3.5V20"/></>,
  file: <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m21 16-5-5-8 8"/></>,
  video: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/></>,
  upload: <path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>,
  checkcircle: <><circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/></>,
  person: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></>,
}

/**
 * Inline SVG icon from the built-in set. Decorative, hidden from assistive technology.
 *
 * @param {{name: string, size?: number, className?: string}} props
 */
export function Icon({ name, size = 18, className = '' }) {
  return (
    <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}

/**
 * Product logo and name.
 *
 * @param {{inverse?: boolean}} props - `inverse` renders for dark backgrounds.
 */
export function Brand({ inverse = false }) {
  return (
    <div className={`brand ${inverse ? 'brand-inverse' : ''}`}>
      <span className="brand-mark"><Icon name="shield" size={18} /></span>
      <span className="brand-name">Aspire<small>After-school management</small></span>
    </div>
  )
}

/**
 * Circle with the initials of a person.
 *
 * @param {{name: string, size?: 'sm'|'md'|'lg'}} props
 */
export function Avatar({ name, size = 'md' }) {
  return <span className={`avatar avatar-${size}`} aria-hidden="true">{initials(name)}</span>
}

/**
 * Coloured badge for an active/inactive state. Uses text as well as colour (not colour alone).
 *
 * @param {{active: boolean, activeLabel?: string, inactiveLabel?: string}} props
 */
export function StatusBadge({ active, activeLabel = 'Active', inactiveLabel = 'Inactive' }) {
  return <span className={`badge ${active ? 'badge-success' : 'badge-muted'}`}><i />{active ? activeLabel : inactiveLabel}</span>
}

/**
 * Labelled form control wrapper showing a required marker, hint and validation error.
 *
 * @param {{label: string, hint?: string, error?: string, required?: boolean, className?: string, children: import('react').ReactNode}} props
 */
export function Field({ label, hint, error, required, children, className = '' }) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}{required && <b aria-hidden="true"> *</b>}</span>
      {children}
      {error ? <small className="field-error" role="alert">{error}</small> : hint && <small className="field-hint">{hint}</small>}
    </label>
  )
}

/**
 * Empty state: explains why a list is empty and, optionally, offers the next step.
 *
 * @param {{icon: string, title: string, text: string, action?: Function, actionLabel?: string}} props
 */
export function Empty({ icon, title, text, action, actionLabel }) {
  return (
    <div className="empty">
      <span className="empty-icon"><Icon name={icon} size={24} /></span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && <button className="btn btn-primary btn-sm" onClick={action}><Icon name="plus" size={16} />{actionLabel}</button>}
    </div>
  )
}

/**
 * Placeholder rows shown while data loads (system-status feedback).
 *
 * @param {{rows?: number}} props
 */
export function Skeleton({ rows = 5 }) {
  return <div className="skeleton-list" aria-busy="true" aria-label="Loading">{Array.from({ length: rows }, (_, i) => <div className="skeleton-row" key={i}><span /><span /><span /></div>)}</div>
}

/**
 * Accessible dialog behaviour: focus the first field, trap Tab, close on Escape, lock page scroll and restore focus on unmount.
 *
 * @param {() => void} onClose
 * @returns {import('react').RefObject<HTMLElement>} Ref to attach to the dialog element.
 */
function useDialog(onClose) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose })
  useEffect(() => {
    const previous = document.activeElement
    const node = ref.current
    const focusable = () => node.querySelectorAll('button:not([disabled]),input:not([disabled]),select,textarea,a[href]')
    const firstField = node.querySelector('input,select,textarea')
    ;(firstField || focusable()[0])?.focus()
    function onKey(event) {
      if (event.key === 'Escape') closeRef.current()
      if (event.key === 'Tab') {
        const items = [...focusable()]
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; previous?.focus?.() }
  }, [])
  return ref
}

/**
 * Modal dialog or side drawer.
 *
 * @param {{title: string, subtitle?: string, onClose: () => void, wide?: boolean, drawer?: boolean, children: import('react').ReactNode}} props
 */
export function Modal({ title, subtitle, onClose, children, wide = false, drawer = false }) {
  const ref = useDialog(onClose)
  return (
    <div className={`overlay ${drawer ? 'overlay-drawer' : ''}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <section ref={ref} className={`dialog ${wide ? 'dialog-wide' : ''} ${drawer ? 'dialog-drawer' : ''}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <header className="dialog-header">
          <div><h2 id="dialog-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </header>
        {children}
      </section>
    </div>
  )
}

/**
 * Confirmation step for destructive or hard-to-undo actions (error prevention).
 *
 * @param {{title: string, text: string, confirmLabel: string, danger?: boolean, busy?: boolean, onConfirm: () => void, onClose: () => void}} props
 */
export function ConfirmDialog({ title, text, confirmLabel, danger = false, busy, onConfirm, onClose }) {
  return (
    <Modal title={title} subtitle={text} onClose={onClose}>
      <div className="dialog-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</button>
      </div>
    </Modal>
  )
}

/**
 * Help dialog (Nielsen heuristic #10: help and documentation).
 * Explains the keyboard shortcuts and how to recover from common problems.
 *
 * @param {{roleLabel: string, onClose: () => void}} props
 */
export function HelpDialog({ roleLabel, onClose }) {
  return (
    <Modal title="Help" subtitle={`Quick tips for the ${roleLabel} workspace.`} onClose={onClose}>
      <div className="help">
        <h3>Keyboard shortcuts</h3>
        <ul>
          <li><kbd>/</kbd> Jump to the search box</li>
          <li><kbd>Esc</kbd> Close a dialog or panel without saving</li>
          <li><kbd>Tab</kbd> Move between fields and buttons</li>
        </ul>
        <h3>Good to know</h3>
        <ul>
          <li>Fields marked <b>*</b> are required. Problems are shown next to the field.</li>
          <li>Destructive actions ask for confirmation before anything is deleted.</li>
          <li>If a page fails to load, use <b>Try again</b>. Your data is not lost.</li>
          <li>Forgot your password? Ask your center administrator to reset it.</li>
        </ul>
      </div>
      <div className="dialog-actions"><button className="btn btn-primary" onClick={onClose}>Got it</button></div>
    </Modal>
  )
}

/**
 * Auto-dismissing message reporting the result of an action. Announced politely to screen readers.
 *
 * @param {{toast: ({text: string, type?: 'success'|'error'}|null), onDismiss: () => void}} props
 */
export function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(onDismiss, 4500)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])
  if (!toast) return null
  return (
    <div className={`toast toast-${toast.type || 'success'}`} role={toast.type === 'error' ? 'alert' : 'status'}>
      <Icon name={toast.type === 'error' ? 'alert' : 'check'} size={17} />{toast.text}
      <button onClick={onDismiss} aria-label="Dismiss"><Icon name="close" size={15} /></button>
    </div>
  )
}
