import * as React from "react";
import { Alert, Box, Button, Card, CardActionArea, CardContent, Chip, Grid, Skeleton, Stack, Typography } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import ContactPhoneRoundedIcon from "@mui/icons-material/ContactPhoneRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/store";
import { useAllPayments } from "@/hooks/useAllPayments";
import StatCard from "@/components/StatCard";
import { daysUntil, inr, monthLabel, shortDate } from "@/utils/format";

type MonthStatus = { id: string; amount: number; dueDate: string; paid: boolean; verified: boolean; paidOn: unknown };

export default function Dashboard() {
  const { db, me } = useApp();
  const nav = useNavigate();
  const { ready, hasMonths } = useAllPayments();

  const months: MonthStatus[] = db.dues.map((m) => {
    const pay = (db.payments[m.id] ?? []).find((p) => p.flatNo === me?.flatNo);
    return { id: m.id, amount: m.amount, dueDate: m.dueDate, paid: !!pay?.paid, verified: !!pay?.verified, paidOn: pay?.updatedAt };
  });
  // oldest first, so residents clear the earliest dues first
  const unpaid = months.filter((m) => !m.paid).reverse();
  const awaiting = months.filter((m) => m.paid && !m.verified);
  const totalDue = unpaid.reduce((s, m) => s + Number(m.amount || 0), 0);
  const next = unpaid[0];
  const nextDays = next ? daysUntil(next.dueDate) : null;

  // society snapshot for the latest month (verified collections vs expenses)
  const latestId = db.dues[0]?.id;
  const latestAmount = db.dues[0]?.amount ?? 0;
  const collected = (db.payments[latestId] ?? []).filter((p) => p.paid && p.verified).reduce((s, p) => s + Number(p.amount ?? latestAmount), 0);
  const spent = db.expenses.filter((e) => String(e.date ?? "").startsWith(latestId ?? "—")).reduce((s, e) => s + Number(e.amount || 0), 0);

  const pinned = db.notices.find((n) => n.pinned) ?? db.notices[0];

  return (
    <Box sx={{ px: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        {/* What do I owe? */}
        {!hasMonths ? (
          <Alert severity="info">No maintenance months have been created yet.</Alert>
        ) : !ready ? (
          <Skeleton variant="rounded" height={148} />
        ) : unpaid.length === 0 ? (
          <Card sx={{ bgcolor: "success.main", color: "#fff", borderColor: "success.main" }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <CheckCircleRoundedIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">You’re all caught up</Typography>
                  <Typography sx={{ opacity: 0.9 }}>No maintenance dues pending for Flat {me?.flatNo}.</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ borderColor: nextDays !== null && nextDays < 0 ? "error.main" : "divider" }}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ sm: "center" }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Amount due · {unpaid.length} month{unpaid.length > 1 ? "s" : ""}
                  </Typography>
                  <Typography variant="h4" sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {inr(totalDue)}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                    {unpaid.map((m) => (
                      <Chip key={m.id} size="small" label={monthLabel(m.id)} variant="outlined" />
                    ))}
                  </Stack>
                  {nextDays !== null && (
                    <Typography variant="body2" sx={{ mt: 1.25 }} color={nextDays < 0 ? "error.main" : nextDays <= 3 ? "warning.main" : "text.secondary"}>
                      {nextDays < 0 ? `${monthLabel(next.id)} is overdue by ${-nextDays} day${nextDays === -1 ? "" : "s"}` : nextDays === 0 ? `${monthLabel(next.id)} is due today` : `${monthLabel(next.id)} is due on ${shortDate(next.dueDate)}`}
                    </Typography>
                  )}
                </Box>
                <Button variant="contained" size="large" onClick={() => nav(`/dues/${next.id}/mark-paid`)} sx={{ alignSelf: { xs: "stretch", sm: "center" } }}>
                  I’ve paid {monthLabel(next.id)}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {awaiting.length > 0 && (
          <Alert severity="info" variant="outlined">
            Waiting for the admin to verify your payment for {awaiting.map((m) => monthLabel(m.id)).join(", ")}.
          </Alert>
        )}

        {/* Latest notice */}
        {pinned && (
          <Card>
            <CardActionArea onClick={() => nav("/notices")}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <CampaignRoundedIcon color="secondary" />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle1" noWrap>
                        {pinned.title}
                      </Typography>
                      {pinned.pinned && <Chip size="small" label="Pinned" color="secondary" variant="outlined" />}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", mt: 0.25 }}>
                      {pinned.body}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        )}

        {/* Society this month */}
        {latestId && (
          <Box>
            <Typography variant="overline" color="text.secondary">
              Society · {monthLabel(latestId)}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={6}>
                <StatCard label="Collected" value={inr(collected)} hint="verified payments" tone="success" />
              </Grid>
              <Grid item xs={6}>
                <StatCard label="Spent" value={inr(spent)} hint="recorded expenses" tone="warning" />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Shortcuts */}
        <Grid container spacing={1.5}>
          {[
            { label: "My dues", to: "/dues", icon: <ReceiptLongRoundedIcon /> },
            { label: "Payment history", to: "/dues/history", icon: <HistoryRoundedIcon /> },
            { label: "Society ledger", to: "/ledger", icon: <MenuBookRoundedIcon /> },
            { label: "Contacts", to: "/contacts", icon: <ContactPhoneRoundedIcon /> },
          ].map((s) => (
            <Grid item xs={6} sm={3} key={s.to}>
              <Card>
                <CardActionArea onClick={() => nav(s.to)} sx={{ p: 2 }}>
                  <Stack spacing={1} alignItems="flex-start">
                    <Box sx={{ color: "primary.main" }}>{s.icon}</Box>
                    <Typography variant="subtitle2">{s.label}</Typography>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Box>
  );
}
