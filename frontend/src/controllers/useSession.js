import { useCallback, useState } from 'react'
import { request } from '../models/api'

const STORAGE_KEY = 'aspire_session'

/** Read the persisted session, tolerating missing or corrupt storage. */
function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

/**
 * Controller hook that owns authentication state for the whole application.
 *
 * The session (API token + user) lives in `sessionStorage`, so it survives a
 * page refresh but not a closed tab.
 *
 * @returns {{
 *   session: ({ token: string, user: object } | null),
 *   login: (data: { token: string, user: object }) => void,
 *   logout: (notifyServer?: boolean) => Promise<void>
 * }} The active session and the actions that change it.
 */
export function useSession() {
  const [session, setSession] = useState(readSession)

  /** Store a freshly issued token and user returned by `POST /login`. */
  const login = useCallback((data) => {
    const next = { token: data.token, user: data.user }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSession(next)
  }, [])

  /**
   * End the session. The server is told first (to revoke the token) but the
   * local session is cleared even when the server cannot be reached.
   */
  const logout = useCallback(async (notifyServer = true) => {
    const current = readSession()
    if (notifyServer && current) {
      try {
        await request('/logout', { method: 'POST', token: current.token })
      } catch {
        /* clear locally even if the server is unreachable */
      }
    }
    sessionStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }, [])

  return { session, login, logout }
}
