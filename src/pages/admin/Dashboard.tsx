import { Alert, Box, Button, Card, CardContent, Chip, Divider, Grid, LinearProgress, Skeleton, Stack, Typography } from "@mui/material";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import HomeWorkRoundedIcon from "@mui/icons-material/HomeWorkRounded";
import ReceiptRoundedIcon from "@mui/icons-material/ReceiptRounded";
import { WhatsApp } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/store";
import { useAllPayments } from "@/hooks/useAllPayments";
import StatCard from "@/components/StatCard";
import { FLATS, SOCIETY_NAME } from "@/config";
import { inr, monthLabel, shortDate } from "@/utils/format";
import { buildNoticeMessage, openWhatsAppShare } from "@/utils/whatsapp";

export default function AdminDashboard() {
  const { db } = useApp();
  const nav = useNavigate();
  const { ready, hasMonths } = useAllPayments();

  const months = db.dues.map((m) => {
    const pays = db.payments[m.id] ?? [];
    const paid = pays.filter((p) => p.paid);
    const verified = paid.filter((p) => p.verified);
    const unpaidFlats = FLATS.filter((f) => !paid.some((p) => p.flatNo === f));
    return { ...m, paid, verified, awaiting: paid.filter((p) => !p.verified), unpaidFlats };
  });

  const latest = months[0];
  const collected = latest ? latest.verified.reduce((s, p) => s + Number(p.amount ?? latest.amount), 0) : 0;
  const expected = latest ? latest.amount * FLATS.length : 0;
  const rate = latest ? Math.round((latest.paid.length / FLATS.length) * 100) : 0;
  const awaitingAll = months.flatMap((m) => m.awaiting.map((p) => ({ month: m.id, flat: p.flatNo, amount: p.amount ?? m.amount })));
  const behind = months.filter((m) => m.unpaidFlats.length > 0);
  const spent = latest ? db.expenses.filter((e) => String(e.date ?? "").startsWith(latest.id)).reduce((s, e) => s + Number(e.amount || 0), 0) : 0;
  const notice = db.notices[0];

  return (
    <Box sx={{ px: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="contained" startIcon={<AddCircleRoundedIcon />} onClick={() => nav("/admin/dues/create")}>
            Create month
          </Button>
          <Button startIcon={<CampaignRoundedIcon />} variant="outlined" onClick={() => nav("/admin/notices/add")}>
            Post notice
          </Button>
        </Stack>

        {!hasMonths ? (
          <Alert severity="info" action={<Button onClick={() => nav("/admin/dues/create")}>Create</Button>}>
            No maintenance months yet. Create the first one to start collecting.
          </Alert>
        ) : !ready ? (
          <Grid container spacing={2}>
            {[0, 1, 2, 3].map((i) => (
              <Grid item xs={6} lg={3} key={i}>
                <Skeleton variant="rounded" height={120} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <>
            <Box>
              <Typography variant="overline" color="text.secondary">
                {monthLabel(latest.id)} · due {shortDate(latest.dueDate)}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 0 }}>
                <Grid item xs={12} sm={6} lg={3}>
                  <StatCard
                    label="Flats paid"
                    value={`${latest.paid.length} / ${FLATS.length}`}
                    hint={`${rate}% of flats have paid ${monthLabel(latest.id)}`}
                    icon={<HomeWorkRoundedIcon />}
                    footer={<LinearProgress variant="determinate" value={rate} sx={{ height: 8, borderRadius: 4 }} aria-label="Collection progress" />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                  <StatCard label="Collected" value={inr(collected)} hint={`of ${inr(expected)}`} icon={<PaymentsRoundedIcon />} tone="success" />
                </Grid>
                <Grid item xs={6} sm={6} lg={3}>
                  <StatCard label="To verify" value={awaitingAll.length} hint="payments" icon={<HourglassTopRoundedIcon />} tone={awaitingAll.length ? "warning" : "success"} />
                </Grid>
                <Grid item xs={6} sm={6} lg={3}>
                  <StatCard label="Spent" value={inr(spent)} hint="expenses" icon={<ReceiptRoundedIcon />} tone="info" />
                </Grid>
              </Grid>
            </Box>

            {/* Needs attention */}
            <Card>
              <CardContent>
                <Typography variant="h6">Needs attention</Typography>
                {awaitingAll.length === 0 && behind.length === 0 ? (
                  <Typography color="success.main" sx={{ mt: 1 }}>
                    Everything’s settled. Every flat has paid and every payment is verified.
                  </Typography>
                ) : (
                  <Stack divider={<Divider flexItem />} sx={{ mt: 1 }}>
                    {awaitingAll.length > 0 && (
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ py: 1.5 }}>
                        <Box>
                          <Typography variant="subtitle2">{awaitingAll.length} payment{awaitingAll.length > 1 ? "s" : ""} waiting for verification</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {awaitingAll
                              .slice(0, 6)
                              .map((a) => `Flat ${a.flat} (${monthLabel(a.month)})`)
                              .join(", ")}
                            {awaitingAll.length > 6 ? "…" : ""}
                          </Typography>
                        </Box>
                        <Button variant="contained" color="warning" onClick={() => nav(`/admin/dues/${awaitingAll[0].month}/verify`)}>
                          Review
                        </Button>
                      </Stack>
                    )}
                    {behind.map((m) => (
                      <Stack key={m.id} direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ py: 1.5 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2">
                            {monthLabel(m.id)} · {m.unpaidFlats.length} flat{m.unpaidFlats.length > 1 ? "s" : ""} unpaid
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                            {m.unpaidFlats.map((f) => (
                              <Chip key={f} size="small" label={f} variant="outlined" />
                            ))}
                          </Stack>
                        </Box>
                        <Button variant="outlined" onClick={() => nav(`/admin/dues/${m.id}/verify`)}>
                          Open month
                        </Button>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Latest notice + share */}
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6">Latest notice</Typography>
              <Button size="small" onClick={() => nav("/notices")}>
                All notices
              </Button>
            </Stack>
            {notice ? (
              <>
                <Typography variant="subtitle1">{notice.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {notice.body}
                </Typography>
                <Button
                  sx={{ mt: 1.5 }}
                  startIcon={<WhatsApp />}
                  color="success"
                  variant="contained"
                  onClick={() => openWhatsAppShare(buildNoticeMessage({ societyName: SOCIETY_NAME, title: notice.title, body: notice.body }))}
                >
                  Share to WhatsApp
                </Button>
              </>
            ) : (
              <Typography color="text.secondary">No notices posted yet.</Typography>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
