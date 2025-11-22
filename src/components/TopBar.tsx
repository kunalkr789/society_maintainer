import { AppBar, Toolbar, Typography, IconButton } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'

export default function TopBar() {
  const nav = useNavigate()
  const { profile } = useAuth()
  const loc = useLocation()
  const onAdmin = loc.pathname.startsWith('/admin')
  const title = profile?.role === "admin" ? 'Admin • Urmila Kunj' : `Urmila Kunj (Flat No. ${profile?.flatNo})`

  return (
    <AppBar position="fixed" color="primary" elevation={0}>
      <Toolbar>
        <Typography sx={{ flex: 1, fontWeight: 800 }}>{title}</Typography>
        <IconButton color="inherit" onClick={() => nav('/settings/profile')}>
          <PersonIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}
