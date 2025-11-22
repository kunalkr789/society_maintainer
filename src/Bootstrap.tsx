import * as React from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { useApp } from '@/store'

/**
 * Preloads Firestore data right after login.
 * - Always: dues, expenses, notices (for dashboards)
 * - Admins: profiles (needed for WhatsApp), plus payments for latest month
 * - Residents: payments for latest month (for their dashboard)
 */
export default function Bootstrap() {
  const { user, claims } = useAuth()
  const { db, loadDues, loadExpenses, loadNotices, loadProfiles, loadPayments } = useApp()

  const ranRef = React.useRef(false)

  React.useEffect(() => {
    if (!user) return
    if (ranRef.current) return
    ranRef.current = true

    ;(async () => {
      // Load global lists in parallel
      await Promise.allSettled([
        loadDues(),
        loadExpenses(),
        loadNotices(),
      ])

      // After dues are in state, pick the latest month (id desc in loadDues)
      const latestMonth = () => (db.dues && db.dues[0]?.id) || ''

      // Preload payments for current month (both roles benefit)
      const m = latestMonth()
      if (m) {
        await loadPayments(m)
      }

      // Admin-specific preload: profiles for WhatsApp sharing
      if (claims?.role === 'admin') {
        await loadProfiles()
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, claims?.role]) // db is intentionally not a dep to avoid re-running

  return null
}