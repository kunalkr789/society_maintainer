import { Box, Card, CardContent, Typography, Button, Stack, Chip, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useApp } from '@/store'
import { useNavigate } from 'react-router-dom'
import { fmt } from '@/utils/date'
import * as React from 'react'

export default function Dues() {
  const { db, me, loadPayments } = useApp()
  const nav = useNavigate()

  // Ensure payments are loaded for all months (so we can compute paid/unpaid correctly)
  React.useEffect(() => {
    (async () => {
      for (const m of db.dues) {
        await loadPayments(m.id)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.dues.length])

  // Build a list of all months with my payment status
  const months = db.dues.map(m => {
    const pay = (db.payments[m.id] ?? []).find((p: any) => p.flatNo === me?.flatNo)
    const paidOn = pay?.updatedAt?.seconds
      ? new Date(pay.updatedAt.seconds * 1000).toLocaleString()
      : (pay?.updatedAt ? new Date(pay.updatedAt).toLocaleString() : null)

    return {
      id: m.id,
      amount: m.amount,
      dueDate: m.dueDate,
      paid: !!pay?.paid,
      verified: !!pay?.verified,
      refNo: pay?.refNo ?? null,
      paidOn,
    }
  })

  // Filter controls
  const [status, setStatus] = React.useState<'all' | 'unpaid' | 'paid' | 'verified'>('all')
  const filtered = months.filter(m => {
    if (status === 'unpaid') return !m.paid
    if (status === 'paid') return m.paid
    if (status === 'verified') return m.verified
    return true
  })

  const unpaid = months.filter(m => !m.paid)
  const hasAny = months.length > 0

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pb: 2 }}>
      {/* Outstanding Dues */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Outstanding Dues</Typography>
          {!hasAny ? (
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              No months available yet.
            </Typography>
          ) : unpaid.length === 0 ? (
            <Typography color="success.main" sx={{ mt: 1 }}>
              🎉 You're all caught up! No unpaid months.
            </Typography>
          ) : (
            <Stack spacing={1} sx={{ mt: 1 }}>
              {unpaid.map(m => (
                <Card key={m.id} variant="outlined">
                  <CardContent
                    sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
                  >
                    <Typography sx={{ flex: 1, fontWeight: 700 }}>{m.id}</Typography>
                    <Typography color="text.secondary">₹{m.amount}</Typography>
                    <Typography color="text.secondary">Due by {fmt(m.dueDate)}</Typography>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => nav(`/dues/${m.id}/mark-paid`)}
                    >
                      Mark Paid
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* All Months (with filter) */}
      <Card>
        <CardContent>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1, gap: 1, flexWrap: 'wrap' }}
          >
            <Typography variant="h6">All Months</Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={status}
              onChange={(_, v) => v && setStatus(v)}
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="unpaid">Unpaid</ToggleButton>
              <ToggleButton value="paid">Paid</ToggleButton>
              <ToggleButton value="verified">Verified</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {filtered.length === 0 ? (
            <Typography color="text.secondary">No months match the selected filter.</Typography>
          ) : (
            <Stack spacing={1}>
              {filtered.map(m => (
                <Card key={m.id} variant="outlined">
                  <CardContent
                    sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
                  >
                    <Typography sx={{ flex: 1, fontWeight: 700 }}>{m.id}</Typography>
                    <Typography color="text.secondary">₹{m.amount}</Typography>
                    <Typography color="text.secondary">Due {fmt(m.dueDate)}</Typography>

                    {m.paid ? (
                      <>
                        <Typography color="text.secondary">
                          Paid on {m.paidOn ?? '—'}
                        </Typography>
                        {m.verified ? (
                          <Chip size="small" color="success" label="Verified" />
                        ) : (
                          <Chip size="small" color="warning" label="Pending" />
                        )}
                      </>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => nav(`/dues/${m.id}/mark-paid`)}
                      >
                        Mark Paid
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}