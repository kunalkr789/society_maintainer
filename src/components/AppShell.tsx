import * as React from 'react'
import {
  Box,
  Container,
  Toolbar,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { Outlet, useLocation } from 'react-router-dom'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import AdminBottomNav from './AdminBottomNav'
import BackButton from '@/components/BackButton'

export default function AppShell() {
  const loc = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // Admin or resident area?
  const onAdmin = loc.pathname.startsWith('/admin')

  // Back button should be hidden only on exact dashboard-like roots
  const NO_BACK_EXACT = ['/', '/dashboard', '/admin']
  const showBack = !NO_BACK_EXACT.includes(loc.pathname)

  // Title based on your App.tsx routes
  const title = React.useMemo(() => {
    const p = loc.pathname

    // Admin area
    if (p === '/admin') return 'Admin Dashboard'
    if (p.startsWith('/admin/dues/') && p.endsWith('/verify')) return 'Verify Payments'
    if (p === '/admin/dues/create') return 'Create Month'
    if (p === '/admin/dues/history') return 'Dues History'
    if (p === '/admin/finance') return 'Finance'
    if (p === '/admin/notices/add') return 'Add Notice'
    if (p === '/admin/ledger') return 'Ledger'

    // Shared / resident
    if (p === '/dashboard') return 'Dashboard'
    if (p === '/dues') return 'Dues'
    if (p === '/dues/history') return 'Dues History'
    if (p.startsWith('/dues/') && p.endsWith('/mark-paid')) return 'Mark Paid'
    if (p === '/notices') return 'Notices'
    if (p === '/contacts') return 'Contacts'
    if (p === '/settings/profile') return 'My Profile'
    if (p === '/ledger') return 'Ledger'

    return ''
  }, [loc.pathname])

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top bar always */}
      <TopBar />

      {/* Desktop sidebar (kept fixed, starting below TopBar) */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'fixed', top: 64, left: 0 }}>
        <Sidebar />
      </Box>

      {/* Main content column */}
      <Box sx={{ flex: 1, width: '100%' }}>
        {/* Offset for TopBar height */}
        <Toolbar />

        <Container sx={{ pb: 10, pt: 2 }} maxWidth="lg" disableGutters>
          {/* Back + Title row (below TopBar) */}
          {(showBack || title) && (
            <Box sx={{ pl: { md: 30 }, pr: { xs: 2, md: 3 }, mb: 1 }}>
              <Stack pl={3} direction="row" alignItems="center" spacing={1}>
                {showBack && <BackButton />}
                {title ? (
                  <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 700 }}>
                    {title}
                  </Typography>
                ) : null}
              </Stack>
            </Box>
          )}

          {/* Routed page content */}
          <Box sx={{ pl: { md: 30 }, pr: { xs: 2, md: 3 } }}>
            <Outlet />
          </Box>
        </Container>
      </Box>

      {/* Mobile bottom navs */}
      {onAdmin ? <AdminBottomNav /> : <BottomNav />}
    </Box>
  )
}