import * as React from 'react'
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import HistoryIcon from '@mui/icons-material/History'
import CampaignIcon from '@mui/icons-material/Campaign'
import PersonIcon from '@mui/icons-material/Person'
import { useLocation, useNavigate } from 'react-router-dom'
import { ContactEmergency } from '@mui/icons-material'

type TabValue = 'home' | 'dues' | 'dues-history' | 'notices' | 'contacts'

export default function BottomNav() {
  const nav = useNavigate()
  const loc = useLocation()

  const tabs = React.useMemo(() => ([
    { value: 'home' as const,         to: '/dashboard',     match: (p:string)=> p === '/dashboard' },
    { value: 'dues' as const,         to: '/dues',          match: (p:string)=> p === '/dues' || p.includes('/dues/') },
    { value: 'dues-history' as const, to: '/dues/history',  match: (p:string)=> p.startsWith('/dues/history') },
    { value: 'notices' as const,      to: '/notices',       match: (p:string)=> p.startsWith('/notices') },
    { value: 'contacts' as const,      to: '/contacts', match: (p:string)=> p.startsWith('/contacts') },
  ]), [])

  const active: TabValue =
    (tabs.find(t => t.match(loc.pathname))?.value) ?? 'home'

  return (
    <Paper sx={{ position:'fixed', bottom:0, left:0, right:0, display:{ xs:'block', md:'none' }, zIndex: 1200 }} elevation={3}>
      <BottomNavigation
        value={active}
        onChange={(_, newValue: TabValue) => {
          const t = tabs.find(x => x.value === newValue)
          if (t) nav(t.to)
        }}
        showLabels
      >
        <BottomNavigationAction value="home"         label="Home"    icon={<HomeIcon />} />
        <BottomNavigationAction value="dues"         label="Dues"    icon={<ReceiptLongIcon />} />
        <BottomNavigationAction value="dues-history" label="History" icon={<HistoryIcon />} />
        <BottomNavigationAction value="notices"      label="Notices" icon={<CampaignIcon />} />
        <BottomNavigationAction value="contacts"      label="Contacts" icon={<ContactEmergency />} />
      </BottomNavigation>
    </Paper>
  )
}