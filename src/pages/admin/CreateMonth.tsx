import { Box, Card, CardContent, Typography, TextField, Button, Stack } from '@mui/material'
import { useApp } from '@/store'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { monthIdOf } from '@/utils/date'

export default function CreateMonth() {
  const { createMonth } = useApp()
  const nav = useNavigate()
  const [id, setId] = useState(monthIdOf())
  const [amount, setAmount] = useState(1500)
  const [due, setDue] = useState(new Date(Date.now()+7*864e5).toISOString().slice(0,10))

  return (
    <Box sx={{ px:{ xs:2, md:3 }}}>
      <Card>
        <CardContent>
          <Typography variant="h6">Create Maintenance Month</Typography>
          <Stack spacing={2} sx={{ mt:1 }}>
            <TextField label="Month (YYYY-MM)" value={id} onChange={e=>setId(e.target.value)} />
            <TextField label="Amount (₹)" value={amount} onChange={e=>setAmount(Number(e.target.value))} />
            <TextField label="Due Date" type="date" value={due} onChange={e=>setDue(e.target.value)} InputLabelProps={{ shrink:true }} />
            <Button variant="contained" onClick={() => { createMonth({ id, amount, dueDate: new Date(due).toISOString() }); nav('/admin') }}>
              Create
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
