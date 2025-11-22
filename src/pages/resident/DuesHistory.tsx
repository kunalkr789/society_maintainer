import * as React from 'react'
import { Box, Card, CardContent, Typography, Stack, Table, TableHead, TableRow, TableCell, TableBody, ToggleButton, ToggleButtonGroup, Button, Chip } from '@mui/material'
import { useApp } from '@/store'
import { exportMonthCsv } from '@/utils/csv'

export default function DuesHistoryResident() {
  const { db, me, loadPayments } = useApp()
  const [status, setStatus] = React.useState<'all'|'paid'|'unpaid'|'verified'>('all')

  // Load payments for all months (for my flat)
  React.useEffect(() => {
    (async () => {
      for (const m of db.dues) {
        await loadPayments(m.id)
      }
    })()
  }, [db.dues.length]) // re-run if month list changes

  const rowsAll = db.dues.map(m => {
    const p = (db.payments[m.id] ?? []).find((x:any) => x.flatNo === me?.flatNo)
    const paidOn = p?.updatedAt?.seconds ? new Date(p.updatedAt.seconds*1000).toLocaleString() :
                  (p?.updatedAt ? new Date(p.updatedAt).toLocaleString() : '—')
    return {
      monthId: m.id,
      amount: m.amount,
      flatNo: me?.flatNo ?? '',
      paid: !!p?.paid,
      verified: !!p?.verified,
      paidOn
    }
  })

  const rows = rowsAll.filter(r => {
    if (status==='paid') return r.paid
    if (status==='unpaid') return !r.paid
    if (status==='verified') return r.verified
    return true
  })

  const csv = [['Month','Flat','Amount','Paid On','Paid','Verified'], ...rowsAll.map(r => [
    r.monthId, r.flatNo, String(r.amount), r.paidOn, r.paid ? 'Yes' : 'No', r.verified ? 'Yes' : 'No'
  ])]

  return (
    <Box sx={{ px:{ xs:2, md:3 }}}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb:1 }}>
        <Typography variant="h6">My Dues History</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <ToggleButtonGroup size="small" exclusive value={status} onChange={(_,v)=>v&&setStatus(v)}>
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="paid">Paid</ToggleButton>
            <ToggleButton value="unpaid">Unpaid</ToggleButton>
            <ToggleButton value="verified">Verified</ToggleButton>
          </ToggleButtonGroup>
          <Button size="small" variant="outlined" onClick={()=>exportMonthCsv(csv, 'my-dues-history.csv')}>Export CSV</Button>
        </Stack>
      </Stack>

      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Month</TableCell>
                <TableCell>Flat</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Paid On</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Verified</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.monthId}>
                  <TableCell>{r.monthId}</TableCell>
                  <TableCell>{r.flatNo}</TableCell>
                  <TableCell>₹{r.amount}</TableCell>
                  <TableCell>{r.paidOn}</TableCell>
                  <TableCell>{r.paid ? <Chip size="small" color="warning" label="Paid" /> : 'Unpaid'}</TableCell>
                  <TableCell>{r.verified ? <Chip size="small" color="success" label="Verified" /> : 'No'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}
