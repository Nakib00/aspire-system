import { useCallback, useState } from 'react'

/**
 * Controller hook for transient feedback messages ("toasts").
 *
 * Supports Nielsen heuristic #1 (visibility of system status): every workspace
 * reports the outcome of an action through the same mechanism.
 *
 * @returns {{
 *   toast: ({ text: string, type?: 'success' | 'error' } | null),
 *   notify: (text: string, type?: 'success' | 'error') => void,
 *   dismiss: () => void
 * }} The current toast plus stable callbacks to show and hide it.
 */
export function useToast() {
  const [toast, setToast] = useState(null)
  const notify = useCallback((text, type) => setToast({ text, type }), [])
  const dismiss = useCallback(() => setToast(null), [])
  return { toast, notify, dismiss }
}
