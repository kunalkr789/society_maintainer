import * as React from 'react'
import {
  Box, Card, CardContent, Typography, Stack, TextField, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, Chip
} from '@mui/material'
import { useApp } from '@/store'
import { db as fs } from '@/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

type Row = {
  id: string
  date: string
  type: 'Cr' | 'Dr'
  particulars: string
  instrument?: string
  instNo?: string | null
  debit: number
  credit: number
  balance: number
}

export default function ResidentLedger() {
  const { db, loadPayments } = useApp()
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))

  const [monthId, setMonthId] = React.useState(db.dues[0]?.id ?? '')
  const [opening, setOpening] = React.useState<number>(0)

  React.useEffect(() => {
    if (!monthId) return
    ;(async () => {
      await loadPayments(monthId)
      try {
        const snap = await getDoc(doc(fs, 'settings', 'finance'))
        const ob = snap.exists() ? (snap.data() as any)?.openingBalances?.[monthId] ?? 0 : 0
        setOpening(Number(ob) || 0)
      } catch { setOpening(0) }
    })()
  }, [monthId, loadPayments])

  // Build rows: verified payments (Cr) + expenses (Dr) for selected month
  const pays = (db.payments[monthId] ?? []).filter(p => p.paid && p.verified)
  const cr: Row[] = pays.map((p, i) => ({
    id: `cr-${i}-${p.flatNo}`,
    date: isoFromAny(p.updatedAt),
    type: 'Cr',
    particulars: `Maintenance - Flat ${p.flatNo}`,
    instrument: p.mode ?? (p.refNo ? 'Online' : 'Cash'),
    instNo: p.refNo ?? null,
    debit: 0,
    credit: Number(p.amount ?? 0),
    balance: 0
  }))
  const dr: Row[] = (db.expenses ?? [])
    .filter(e => String(e.date ?? '').startsWith(monthId))
    .map((e: any) => ({
      id: `dr-${e.id}`,
      date: (e.date ?? '').slice(0,10),
      type: 'Dr',
      particulars: e.title + (e.category ? ` (${e.category})` : ''),
      instrument: e.mode ?? 'Cash',
      instNo: e.instNo ?? null,
      debit: Number(e.amount ?? 0),
      credit: 0,
      balance: 0
    }))

  const rows = [...cr, ...dr].sort((a,b) => a.date === b.date
    ? (a.type === b.type ? a.particulars.localeCompare(b.particulars) : (a.type === 'Cr' ? -1 : 1))
    : a.date.localeCompare(b.date))

  let running = opening
  const withBal = rows.map(r => {
    running = running + r.credit - r.debit
    return { ...r, balance: running }
  })

  const totals = {
    opening,
    credits: rows.reduce((s, r) => s + r.credit, 0),
    debits: rows.reduce((s, r) => s + r.debit, 0),
    closing: opening + rows.reduce((s, r) => s + (r.credit - r.debit), 0),
  }

  return (
    <Box sx={{ px: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }} flexWrap="wrap">
        <Typography variant="h6">Ledger (Read-only)</Typography>
        <TextField
          select size="small" label="Month" value={monthId} onChange={e => setMonthId(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          {db.dues.map(m => <MenuItem key={m.id} value={m.id}>{m.id}</MenuItem>)}
        </TextField>
      </Stack>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} useFlexGap flexWrap="wrap" sx={{ columnGap: { xs: 2, md: 4 }, rowGap: { xs: 1.5 } }}>
            <Summary label="Opening Balance" value={totals.opening} />
            <Summary label="Total Credits" value={totals.credits} />
            <Summary label="Total Debits" value={totals.debits} />
            <Summary label="Closing Balance" value={totals.closing} large />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {isXs ? (
            <Stack spacing={1.25}>
              {withBal.map(r => (
                <Card key={r.id} variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Stack spacing={0.5}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography sx={{ fontWeight: 700 }}>{humanDate(r.date)}</Typography>
                        <Chip size="small" color={r.type === 'Cr' ? 'success' : 'error'} label={r.type} />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">{r.particulars}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {r.instrument ?? '—'}{r.instNo ? ` • ${r.instNo}` : ''}
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                        <Typography variant="body2">Debit: <b>₹{r.debit}</b></Typography>
                        <Typography variant="body2">Credit: <b>₹{r.credit}</b></Typography>
                        <Typography variant="body2">Bal: <b>₹{r.balance}</b></Typography>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Particulars</TableCell>
                    <TableCell>Instrument</TableCell>
                    <TableCell>Inst. No</TableCell>
                    <TableCell align="right">Debit (₹)</TableCell>
                    <TableCell align="right">Credit (₹)</TableCell>
                    <TableCell align="right">Balance (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {withBal.map(r => (
                    <TableRow key={r.id} hover>
                      <TableCell>{humanDate(r.date)}</TableCell>
                      <TableCell><Chip size="small" color={r.type === 'Cr' ? 'success' : 'error'} label={r.type} /></TableCell>
                      <TableCell>{r.particulars}</TableCell>
                      <TableCell>{r.instrument ?? '—'}</TableCell>
                      <TableCell>{r.instNo ?? '—'}</TableCell>
                      <TableCell align="right">₹{r.debit}</TableCell>
                      <TableCell align="right">₹{r.credit}</TableCell>
                      <TableCell align="right">₹{r.balance}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

function Summary({ label, value, large=false }: { label:string; value:number; large?:boolean }) {
  return (
    <Stack spacing={0.25} sx={{ minWidth: { xs: 'auto', sm: 180 } }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant={large ? 'h5' : 'h6'}>₹{Number(value).toLocaleString('en-IN')}</Typography>
    </Stack>
  )
}

function isoFromAny(ts: any): string {
  if (!ts) return new Date().toISOString().slice(0,10)
  if (ts?.seconds) return new Date(ts.seconds * 1000).toISOString().slice(0,10)
  try { return new Date(ts).toISOString().slice(0,10) } catch { return new Date().toISOString().slice(0,10) }
}
function humanDate(iso: string) {
  try { return new Date(iso).toLocaleDateString() } catch { return iso }
}