import { useCallback, useState } from 'react'
import './App.css'
import './teacher.css'
import { request } from './api'
import CenterAdminWorkspace from './CenterAdmin'
import Login from './Login'
import { ParentPortal } from './Portals'
import StudentPortal from './Student'
import SuperAdminWorkspace from './SuperAdmin'
import TeacherWorkspace from './Teacher'

const WORKSPACES = {
  super_admin: SuperAdminWorkspace,
  center_admin: CenterAdminWorkspace,
  teacher: TeacherWorkspace,
  parent: ParentPortal,
  student: StudentPortal,
}

export default function App() {
  const [session, setSession] = useState(() => { try { return JSON.parse(sessionStorage.getItem('aspire_session') || 'null') } catch { return null } })
  const login = (data) => {
    sessionStorage.setItem('aspire_session', JSON.stringify({ token: data.token, user: data.user }))
    setSession({ token: data.token, user: data.user })
  }
  const logout = useCallback(async (notifyServer = true) => {
    const current = sessionStorage.getItem('aspire_session')
    if (notifyServer && current) {
      try { await request('/logout', { method: 'POST', token: JSON.parse(current).token }) } catch { /* clear locally even if the server is unreachable */ }
    }
    sessionStorage.removeItem('aspire_session')
    setSession(null)
  }, [])

  const Workspace = session && WORKSPACES[session.user.role]
  return Workspace ? <Workspace session={session} onLogout={logout} /> : <Login onLogin={login} />
}
