import { Box, Card, CardContent, Typography, Stack, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, DialogActions, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useApp } from '@/store'
import * as React from 'react'
import { computeBalance } from '@/utils/finance'
import { computeUnifiedBalance } from '@/utils/finance-unified'

type FormState = { id?:string, date: string, title: string, category?: string, amount: number, notes?: string }

export default function Finance() {
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))
  const { db, addExpense, updateExpense } = useApp()
  const { income, expenses, balance } = computeBalance(db.dues, db.payments, db.expenses)

  const [totals, setTotals] = React.useState({
    opening: 0, verifiedIncome: 0, manualCredits: 0, manualDebits: 0, expenses: 0, balance: 0
  })

  React.useEffect(() => {
    let alive = true
    ;(async () => {
      const t = await computeUnifiedBalance(db as any)
      if (alive) setTotals(t)
    })()
    return () => { alive = false }
  }, [db.dues, db.expenses, db.payments])

  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState<FormState>({ date: new Date().toISOString().slice(0,10), title: '', amount: 0 })

  const onSave = async () => {
    if (!form.title || !form.date || !form.amount) return
    if (form.id) await updateExpense(form.id, { ...form } as any)
    else await addExpense({ ...form } as any)
    setOpen(false); setForm({ date: new Date().toISOString().slice(0,10), title: '', amount: 0 })
  }

  const edit = (e:any) => { setForm({ ...e }); setOpen(true) }

  return (
    <Box sx={{ px:{ xs:2, md:3 }}}>
      <Stack spacing={2}>
        {/* Balance summary */}
        <Card>
          <CardContent sx={{ p:{ xs:2, md:3 } }}>
            <Typography variant="h6">Society Account</Typography>
            <Stack direction={{ xs:'column', sm:'row' }} useFlexGap flexWrap="wrap" sx={{ mt:1, columnGap:{ xs:2, md:4 }, rowGap:{ xs:1.5 } }}>
              <Summary label="Opening Balance" value={totals.opening} />
              <Summary label="Verified Income" value={totals.verifiedIncome} />
              <Summary label="Manual Credits" value={totals.manualCredits} />
              <Summary label="Expenses" value={totals.expenses} />
              <Summary label="Manual Debits" value={totals.manualDebits} />
              <Summary label="Current Balance" value={totals.balance} large />
            </Stack>
          </CardContent>
        </Card>

        {/* Expenses list */}
        <Card>
          <CardContent sx={{ p:{ xs:2, md:3 } }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb:1, gap:1, flexWrap:'wrap' }}>
              <Typography variant="h6">Expenses</Typography>
              <Button variant="contained" onClick={()=>setOpen(true)}>Add Expense</Button>
            </Stack>

            {/* Mobile Card List */}
            {isXs && (
              <Stack spacing={1.5} sx={{ mt:1 }}>
                {db.expenses.map((e:any)=>(
                  <Card key={e.id} variant="outlined">
                    <CardContent sx={{ p:2 }}>
                      <Stack spacing={0.5}>
                        <Typography sx={{ fontWeight:700 }}>{e.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{e.category ?? 'General'} • {new Date(e.date).toLocaleDateString()}</Typography>
                        <Typography variant="h6" sx={{ mt:0.5 }}>₹{e.amount}</Typography>
                        {e.notes && <Typography variant="body2" color="text.secondary">{e.notes}</Typography>}
                        <Button size="small" sx={{ mt:1 }} onClick={()=>edit(e)}>Edit</Button>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}

            {/* Desktop/Tablet Table */}
            {!isXs && (
              <Box sx={{ width:'100%', overflowX:'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ whiteSpace:'nowrap' }}>Date</TableCell>
                      <TableCell sx={{ whiteSpace:'nowrap' }}>Title</TableCell>
                      <TableCell sx={{ whiteSpace:'nowrap' }}>Category</TableCell>
                      <TableCell sx={{ whiteSpace:'nowrap' }}>Amount</TableCell>
                      <TableCell sx={{ whiteSpace:'nowrap' }}>Notes</TableCell>
                      <TableCell sx={{ whiteSpace:'nowrap' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {db.expenses.map((e:any)=>(
                      <TableRow key={e.id} hover>
                        <TableCell>{new Date(e.date).toLocaleDateString()}</TableCell>
                        <TableCell>{e.title}</TableCell>
                        <TableCell>{e.category ?? '—'}</TableCell>
                        <TableCell>₹{e.amount}</TableCell>
                        <TableCell sx={{ maxWidth: 420, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {e.notes ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Button size="small" onClick={()=>edit(e)}>Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* Add/Edit dialog */}
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="sm" fullScreen={isXs}>
        <DialogTitle>{form.id ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt:1 }}>
            <TextField type="date" label="Date" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} InputLabelProps={{ shrink:true }} />
            <TextField label="Title" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} />
            <TextField label="Category" value={form.category ?? ''} onChange={e=>setForm({...form, category: e.target.value})} />
            <TextField type="number" label="Amount (₹)" value={form.amount} onChange={e=>setForm({...form, amount: Number(e.target.value)})} />
            <TextField label="Notes" value={form.notes ?? ''} onChange={e=>setForm({...form, notes: e.target.value})} multiline minRows={3} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onSave}>{form.id ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function Summary({ label, value, large=false }: { label:string; value:number; large?:boolean }) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: { xs:'auto', sm:160 } }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant={large ? 'h5' : 'h6'}>₹{Number(value).toLocaleString('en-IN')}</Typography>
    </Stack>
  )
}