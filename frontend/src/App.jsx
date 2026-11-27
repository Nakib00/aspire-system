import './views/styles/App.css'
import './views/styles/teacher.css'
import { useSession } from './controllers/useSession'
import CenterAdminWorkspace from './views/pages/CenterAdmin'
import Login from './views/pages/Login'
import { ParentPortal } from './views/pages/Portals'
import StudentPortal from './views/pages/Student'
import SuperAdminWorkspace from './views/pages/SuperAdmin'
import TeacherWorkspace from './views/pages/Teacher'

/** Maps a user's role (as returned by the API) to the workspace view they see. */
const WORKSPACES = {
  super_admin: SuperAdminWorkspace,
  center_admin: CenterAdminWorkspace,
  teacher: TeacherWorkspace,
  parent: ParentPortal,
  student: StudentPortal,
}

/**
 * Application root and front controller.
 *
 * Decides, from the authentication state held by {@link useSession}, whether to
 * show the sign-in view or the workspace that matches the signed-in role.
 */
export default function App() {
  const { session, login, logout } = useSession()
  const Workspace = session && WORKSPACES[session.user.role]
  return Workspace ? <Workspace session={session} onLogout={logout} /> : <Login onLogin={login} />
}
