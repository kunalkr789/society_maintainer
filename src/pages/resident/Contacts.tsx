import { Call } from '@mui/icons-material'
import { Box, Card, CardContent, Typography, Stack, Button } from '@mui/material'
const contacts = [
  { id:'ct1', name:'Security', role:'Security Guard', phone:'+919852818677' },
  { id:'ct2', name:'Plumber', role:'Plumber', phone:'+9198xxxxxx22' }
]
export default function Contacts() {
  return (
    <Box sx={{ px:{ xs:2, md:3 }}}>
      <Stack spacing={2}>
        {contacts.map(c => (
          <Card key={c.id}>
            <CardContent sx={{ display:'flex', alignItems:'center', gap:2 }}>
              <Typography sx={{ flex:1 }}>{c.name} • {c.role}</Typography>
              <Button href={`tel:${c.phone}`}><Call /></Button>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
