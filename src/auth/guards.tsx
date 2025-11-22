import * as React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

function Splash() {
  return <div style={{display:'grid',placeItems:'center',minHeight:'60vh'}}>Loading…</div>
}

export function RequireAuth() {
  const { user, profile, loading } = useAuth()
  const loc = useLocation()

  // Still loading auth/profile → show splash
  if (loading) return <Splash />

  // Not signed in → go to login
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />

  // Force password change if flagged (except on the force-change page itself)
  if (profile?.requiresPasswordChange && loc.pathname !== '/first-login') {
    return <Navigate to="/first-login" replace />
  }

  return <Outlet />
}

export function RequireAdmin() {
  const { claims, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <Splash />
  if (claims?.role !== 'admin') return <Navigate to="/" replace state={{ from: loc.pathname }} />
  return <Outlet />
}

export function RequireResident() {
  const { claims, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <Splash />
  if (claims?.role !== 'resident') return <Navigate to="/" replace state={{ from: loc.pathname }} />
  return <Outlet />
}

/** Send the signed-in user to the correct home based on role */
export function RoleRedirect() {
  const { user, claims, loading, profile } = useAuth()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace />
  // If password change is required, route there first
  if (profile?.requiresPasswordChange) return <Navigate to="/first-login" replace />
  return claims?.role === 'admin'
    ? <Navigate to="/admin" replace />
    : <Navigate to="/dashboard" replace />
}