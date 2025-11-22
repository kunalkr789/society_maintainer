import { Box, Card, CardContent, Typography, TextField, Button, Stack } from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '@/store'
import { useState } from 'react'

export default function MarkPaid() {
  const { monthId } = useParams()
  const { db, me, markPaid } = useApp()
  const nav = useNavigate()
  const [refNo, setRefNo] = useState('')
  const month = db.dues.find(d => d.id === monthId)

  if (!month) return <Typography sx={{ p:2 }}>Month not found.</Typography>

  return (
    <Box sx={{ px:{ xs:2, md:3 }}}>
      <Card>
        <CardContent>
          <Typography variant="h6">Mark Paid • {month.id}</Typography>
          <Stack spacing={2} sx={{ mt:1 }}>
            <TextField label="UPI Reference No." value={refNo} onChange={e=>setRefNo(e.target.value)} />
            <Button variant="contained" onClick={() => { markPaid(month.id, me!.flatNo, refNo); nav('/dues') }}>
              Submit
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
