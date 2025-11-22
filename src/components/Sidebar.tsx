import { List, ListItemButton, ListItemText, Paper } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'

export default function Sidebar() {
  const nav = useNavigate()
  const loc = useLocation()
  const { claims } = useAuth()
  const isAdmin = claims?.role === 'admin'

  const residentItems = [
    ['Home','/'],
    ['Notices','/notices'],
    ['Dues','/dues'],
    ['Dues History','/dues/history'],
    // ['Complaints','/complaints'],
    ['Contacts','/contacts'],
  ]
  const adminItems = [
    ['Dashboard','/admin'],
    ['Create Month','/admin/dues/create'],
    ['Verify Payments','/admin/dues/'+new Date().toISOString().slice(0,7)+'/verify'],
    ['Dues History','/admin/dues/history'],
    ['Finance','/admin/finance'],
    ['Ledger','/admin/ledger'],
    ['Add Notice','/admin/notices/add'],
  ]

  const items = isAdmin ? adminItems : residentItems

  return (
    <Paper elevation={0} sx={{ width: 232, height:'100vh', borderRight: '1px solid #E4E7EC', display:{ xs:'none', md:'block' }, position:'fixed', top:64, left:0 }}>
      <List>
        {items.map(([label, path]) => (
          <ListItemButton key={path} selected={loc.pathname===path} onClick={() => nav(path)}>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  )
}
