import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/store";
import { fmt } from "@/utils/date";
import NoticeBanner from "@/components/NoticeBanner";

export default function Dashboard() {
  const { db, me, loadPayments } = useApp();
  const nav = useNavigate();

  // Latest month (dues ordered desc via store)
  const monthId = db.dues?.[0]?.id;

  // Ensure we have this month's payments for summary
  React.useEffect(() => {
    if (monthId) loadPayments(monthId);
  }, [monthId, loadPayments]);

  // Resident's per-month list with payment status
  const months = db.dues.map((m) => {
    const pay = (db.payments[m.id] ?? []).find(
      (p: any) => p.flatNo === me?.flatNo
    );
    return {
      id: m.id,
      amount: m.amount,
      dueDate: m.dueDate,
      paid: !!pay?.paid,
      verified: !!pay?.verified,
      refNo: pay?.refNo ?? null,
      paidOn: pay?.updatedAt?.seconds
        ? new Date(pay.updatedAt.seconds * 1000).toLocaleString()
        : pay?.updatedAt
        ? new Date(pay.updatedAt).toLocaleString()
        : null,
    };
  });

  const unpaid = months.filter((m) => !m.paid);
  const paid = months.filter((m) => m.paid);

  // --- FIXED: Resident summary (read-only) ---
  // Use month dues amount as fallback if payment.amount is missing.
  // Toggle this to true if you want to count paid-but-unverified too.
  const INCLUDE_UNVERIFIED = false;

  const monthObj = db.dues.find((d) => d.id === monthId);
  const perPaymentAmount = (p: any) =>
    Number(p?.amount ?? monthObj?.amount ?? 0);

  const paymentsThisMonth = (db.payments[monthId] ?? []).filter((p: any) =>
    INCLUDE_UNVERIFIED ? p.paid : p.paid && p.verified
  );

  const totalCollections = paymentsThisMonth.reduce(
    (sum: number, p: any) => sum + perPaymentAmount(p),
    0
  );

  const monthExpenses = (db.expenses ?? [])
    .filter((e: any) => String(e.date ?? "").startsWith(monthId || ""))
    .reduce((sum: number, e: any) => sum + Number(e.amount ?? 0), 0);

  // Balance here = collections - expenses (resident view)
  const balance = totalCollections - monthExpenses;

  const latest = db.notices?.[0];

  return (
    <Box sx={{ px: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>

        {/* Outstanding Dues (all unpaid months) */}
        <Card>
          <CardContent>
            <Typography variant="h6">Outstanding Dues</Typography>
            {unpaid.length === 0 ? (
              <Typography color="success.main" sx={{ mt: 1 }}>
                🎉 You're all caught up! No unpaid months.
              </Typography>
            ) : (
              <Stack spacing={1} sx={{ mt: 1 }}>
                {unpaid.map((m) => (
                  <Card key={m.id} variant="outlined">
                    <CardContent
                      sx={{
                        display: "flex",
                        gap: 2,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography sx={{ flex: 1, fontWeight: 700 }}>
                        {m.id}
                      </Typography>
                      <Typography color="text.secondary">₹{m.amount}</Typography>
                      <Typography color="text.secondary">
                        Due by {fmt(m.dueDate)}
                      </Typography>
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

        {/* Latest Notice */}
        <Card>
          <CardContent>
            {latest && (
              <NoticeBanner
                title={latest.title}
                body={latest.body}
                createdAt={latest.createdAt}
                accent="secondary"
              />
            )}
            <Button
              sx={{ width: "fit-content", mt: 1 }}
              variant="text"
              onClick={() => nav("/notices")}
            >
              View All Notices
            </Button>
          </CardContent>
        </Card>

        {/* Recently Paid (last few) */}
        {paid.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6">Recently Paid</Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {paid.slice(0, 4).map((m) => (
                  <Card key={m.id} variant="outlined">
                    <CardContent
                      sx={{
                        display: "flex",
                        gap: 2,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography sx={{ flex: 1, fontWeight: 700 }}>
                        {m.id}
                      </Typography>
                      <Typography color="text.secondary">₹{m.amount}</Typography>
                      <Typography color="text.secondary">
                        Paid on {m.paidOn ?? "—"}
                      </Typography>
                      {m.verified ? (
                        <Chip size="small" color="success" label="Verified" />
                      ) : (
                        <Chip size="small" color="warning" label="Pending" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* === Monthly Summary (read-only) === */}
        <Card>
          <CardContent>
            <Typography variant="h6">This Month at a Glance</Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              useFlexGap
              flexWrap="wrap"
              sx={{ columnGap: { xs: 2, md: 4 }, rowGap: { xs: 1.5 }, mt: 1 }}
            >
              <Summary
                label="This month’s total collections"
                value={totalCollections}
              />
              <Summary
                label="This month’s total expenses"
                value={monthExpenses}
              />
              {/* <Summary
                label="Balance (collections − expenses)"
                value={balance}
                large
              /> */}
            </Stack>

            <Stack direction="row" sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={() => nav("/ledger")}>
                View full ledger
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent>
            <Typography variant="h6">Quick Actions</Typography>
            <Stack
              direction="row"
              useFlexGap
              flexWrap="wrap"
              sx={{
                columnGap: { xs: 1, sm: 2, md: 3 },
                rowGap: { xs: 1, sm: 1.5, md: 2 },
              }}
            >
              <Button sx={{ m: 1 }} variant="outlined" onClick={() => nav("/dues")}>
                Dues
              </Button>
              <Button
                sx={{ m: 1 }}
                variant="outlined"
                onClick={() => nav("/dues/history")}
              >
                Dues History
              </Button>
              <Button
                sx={{ m: 1 }}
                variant="outlined"
                onClick={() => nav("/contacts")}
              >
                Contacts
              </Button>
              <Button
                sx={{ m: 1 }}
                variant="outlined"
                onClick={() => nav("/settings/profile")}
              >
                My Profile
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

function Summary({
  label,
  value,
  large = false,
}: {
  label: string;
  value: number;
  large?: boolean;
}) {
  return (
    <Stack spacing={0.25} sx={{ minWidth: { xs: "auto", sm: 220 } }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant={large ? "h5" : "h6"}>
        ₹{Number(value).toLocaleString("en-IN")}
      </Typography>
    </Stack>
  );
}