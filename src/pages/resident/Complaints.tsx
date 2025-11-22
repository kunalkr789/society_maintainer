import { Box, Card, CardContent, Typography, Chip, Fab, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
// Placeholder list until complaints are wired to Firestore
const sample = [{ id:'c1', title:'Leak in kitchen', desc:'Pipe dripping', status:'open'}] as const

export default function Complaints() {
  return (
    <Box sx={{ px:{ xs:2, md:3 }, pb:8 }}>
      <Stack spacing={2}>
        {sample.map(c => (
          <Card key={c.id}>
            <CardContent>
              <Typography variant="h6" sx={{ mb:0.5 }}>{c.title}</Typography>
              <Typography color="text.secondary" sx={{ mb:1 }}>{c.desc}</Typography>
              <Chip size="small" label={String(c.status).toUpperCase()} />
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Fab color="secondary" sx={{ position:'fixed', bottom:80, right:16 }}>
        <AddIcon />
      </Fab>
    </Box>
  )
}
