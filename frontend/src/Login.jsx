import { useState } from 'react'
import { request } from './api'
import { Brand, Icon } from './ui'

const currentYear = new Date().getFullYear()

const highlights = [
  ['centers', 'Every center in one place', 'Profiles, contacts, capacity and opening hours, always up to date.'],
  ['users', 'One place for everyone', 'Students, parents and teachers each get the right view of the center.'],
  ['shield', 'Secure by default', 'Role-based access with instant sign-out when an account changes.'],
]

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await request('/login', { method: 'POST', body: { email, password } })
      onLogin(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <aside className="login-aside">
        <Brand inverse />
        <div className="login-pitch">
          <h1>Run every after-school center with confidence.</h1>
          <p>One calm workspace to set up centers, assign administrators and keep everything running smoothly.</p>
          <ul>
            {highlights.map(([icon, title, text]) => (
              <li key={title}>
                <span><Icon name={icon} size={18} /></span>
                <div><b>{title}</b><small>{text}</small></div>
              </li>
            ))}
          </ul>
        </div>
        <small className="login-legal">© {currentYear} Aspire</small>
      </aside>

      <main className="login-main">
        <div className="login-mobile-brand"><Brand /></div>
        <form className="login-card" onSubmit={submit} noValidate={false}>
          <h2>Sign in</h2>
          <p>Use the account your center gave you to continue.</p>

          <label className="field">
            <span className="field-label">Email address</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="username" required autoFocus />
          </label>

          <label className="field">
            <span className="field-label">Password</span>
            <div className="input-affix">
              <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
              <button type="button" onClick={() => setShow(!show)} aria-pressed={show}>{show ? 'Hide' : 'Show'}</button>
            </div>
          </label>

          {error && <div className="alert alert-error" role="alert"><Icon name="alert" size={17} />{error}</div>}

          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}{!busy && <Icon name="arrow" size={17} />}</button>
          <p className="login-help">Forgot your password? Ask your center administrator to reset it.</p>
        </form>
      </main>
    </div>
  )
}
