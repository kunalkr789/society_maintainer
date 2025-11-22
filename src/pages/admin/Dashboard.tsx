import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/store";
import { db as fs } from "@/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { fmt } from "@/utils/date";
import NoticeBanner from "@/components/NoticeBanner";
import { WhatsApp } from "@mui/icons-material";
import { buildNoticeMessage, openWhatsAppShare } from "@/utils/whatsapp";

export default function AdminDashboard() {
  const { db, loadPayments } = useApp();
  const nav = useNavigate();
  const [flats, setFlats] = React.useState<string[]>([
    "101",
    "102",
    "103",
    "104",
    "201",
    "202",
    "203",
    "204",
    "301",
    "302",
    "303",
    "304",
    "401",
    "402",
  ]);

  // // Load flats once (settings/core.flats -> profiles fallback)
  // React.useEffect(() => {
  //   (async () => {
  //     // settings/core.flats
  //     const s = await getDoc(doc(fs, 'settings', 'core'))
  //     const settingsFlats = s.exists() ? ((s.data() as any).flats as string[] | undefined) : undefined
  //     if (settingsFlats?.length) {
  //       setFlats([...settingsFlats].sort())
  //       return
  //     }
  //     // profiles fallback
  //     const qy = query(collection(fs, 'profiles'), where('role','==','resident'))
  //     const snap = await getDocs(qy)
  //     const list = snap.docs.map(d => (d.data() as any).flatNo as string).filter(Boolean).sort()
  //     setFlats(list)
  //   })()
  // }, [])

  // Ensure payments are loaded for all months we will display
  React.useEffect(() => {
    (async () => {
      for (const m of db.dues) {
        await loadPayments(m.id);
      }
    })();
  }, [db.dues.length]);

  const latest = db.notices?.[0];

  // Build per-month status
  const months = db.dues.map((m) => {
    const pays = db.payments[m.id] ?? [];
    const paidCount = pays.filter((p: any) => p.paid).length;
    const total = flats.length || pays.length; // if flats unknown, fallback to available payments
    const unpaid = Math.max(total - paidCount, 0);
    return {
      id: m.id,
      amount: m.amount,
      dueDate: m.dueDate,
      paidCount,
      total,
      unpaid,
    };
  });

  const withUnpaid = months.filter((m) => m.unpaid > 0);

  return (
    <Box sx={{ px: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        {/* Summary card */}
        <Card>
          <CardContent>
            <Typography variant="h6">Admin Overview</Typography>
            <Typography color="text.secondary">
              {withUnpaid.length > 0
                ? `${withUnpaid.length} month(s) have pending payments.`
                : "All months fully paid. 🎉"}
            </Typography>
            <Stack
              direction="row"
              useFlexGap
              flexWrap="wrap"
              sx={{
                columnGap: { xs: 1, sm: 2, md: 3 }, // horizontal
                rowGap: { xs: 1, sm: 1.5, md: 2 }, // vertical
              }}
            >
              <Button
                sx={{ m: 1 }}
                variant="contained"
                onClick={() => nav("/admin/dues/create")}
              >
                Create Month
              </Button>
              <Button
                sx={{ m: 1 }}
                variant="outlined"
                onClick={() => nav("/admin/dues/history")}
              >
                Dues History
              </Button>
              <Button
                sx={{ m: 1 }}
                variant="outlined"
                onClick={() => nav("/admin/finance")}
              >
                Finance
              </Button>
            </Stack>
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
                accent="secondary" // distinct color for resident
              />
            )}
            {/* NEW: Share to WhatsApp Group */}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button
                startIcon={<WhatsApp />}
                color="success"
                variant="contained"
                onClick={() => {
                  const msg = buildNoticeMessage({
                    societyName: "Urmila Kunj",
                    title: latest.title,
                    body: latest.body,
                  });
                  openWhatsAppShare(msg);
                }}
              >
                Share to WhatsApp Group
              </Button>
              <Button
                sx={{ width: "fit-content", mt: 1 }}
                variant="text"
                onClick={() => nav("/admin/notices/add")}
              >
                View All Notices
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* List all due months with pending flats */}
        <Card>
          <CardContent>
            <Typography variant="h6">Months with Pending Payments</Typography>
            {withUnpaid.length === 0 ? (
              <Typography sx={{ mt: 1 }} color="success.main">
                No pending payments across months.
              </Typography>
            ) : (
              <Stack spacing={1} sx={{ mt: 1 }}>
                {withUnpaid.map((m) => (
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
                      <Typography color="text.secondary">
                        ₹{m.amount}
                      </Typography>
                      <Typography color="text.secondary">
                        Due {fmt(m.dueDate)}
                      </Typography>
                      <Chip
                        size="small"
                        color="warning"
                        label={`Pending: ${m.unpaid}`}
                      />
                      <Chip
                        size="small"
                        label={`Paid: ${m.paidCount}/${m.total || "—"}`}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => nav(`/admin/dues/${m.id}/verify`)}
                      >
                        Verify Payments
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* (Optional) show fully-paid months briefly */}
        {months.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6">Fully Paid Months</Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {months
                  .filter((m) => m.unpaid === 0)
                  .slice(0, 4)
                  .map((m) => (
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
                        <Typography color="text.secondary">
                          ₹{m.amount}
                        </Typography>
                        <Typography color="success.main">
                          All flats paid
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => nav("/admin/dues/history")}
                        >
                          See History
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
