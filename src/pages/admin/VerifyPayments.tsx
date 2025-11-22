/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Button,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { useApp } from "@/store";
import { db as fs } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";

export default function VerifyPayments() {
  const { monthId } = useParams();
  const { db, loadPayments } = useApp() as any;

  // Selected month
  const [id, setId] = React.useState<string>(monthId ?? db.dues?.[0]?.id ?? "");

  // Ensure payments for selected month are loaded
  React.useEffect(() => {
    if (id) loadPayments(id);
  }, [id, loadPayments]);

  // Month data
  const pays: any[] = id ? db.payments?.[id] ?? [] : [];
  const monthObj = (db.dues ?? []).find((m: any) => m.id === id);
  const baseAmount: number = Number(monthObj?.amount ?? 0);

  // All flats: profiles → payments → fallback
  const profiles: any[] = (db as any).profiles ?? [];
  const profileFlats = profiles
    .filter((p) => p.role === "resident" && p.flatNo)
    .map((p) => String(p.flatNo));

  const paymentFlats = Array.from(new Set(pays.map((p) => String(p.flatNo))));
  const fallbackFlats = [
    "101","102","103","104","201","202","203","204",
    "301","302","303","304","401","402",
  ];

  const allFlats = Array.from(new Set([...profileFlats, ...paymentFlats, ...fallbackFlats]))
    .sort((a, b) => {
      const na = parseInt(a, 10), nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });

  // Status lookup from payments
  const statusByFlat: Record<string, { paid: boolean; verified: boolean; paidOn: string }> = {};
  for (const flat of allFlats) {
    const p = pays.find((x) => String(x.flatNo) === flat);
    const paidOn = p?.updatedAt?.seconds
      ? new Date(p.updatedAt.seconds * 1000).toLocaleString()
      : p?.updatedAt
      ? new Date(p.updatedAt).toLocaleString()
      : "—";
    statusByFlat[flat] = { paid: !!p?.paid, verified: !!p?.verified, paidOn };
  }

  async function verify(flatNo: string) {
    if (!id) return;
    const ref = doc(fs, "payments", id, "flats", flatNo);
    const snap = await getDoc(ref);
    await setDoc(
      ref,
      {
        flatNo,
        amount: baseAmount,   // default amount of the month
        refNo: null,          // default
        mode: "Cash",         // default
        paid: true,
        verified: true,
        updatedAt: serverTimestamp(),
        ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
      },
      { merge: true }
    );
    await loadPayments(id);
  }

  async function unverify(flatNo: string) {
    if (!id) return;
    const ref = doc(fs, "payments", id, "flats", flatNo);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        verified: false,
        updatedAt: serverTimestamp(),
      });
    } else {
      // create a stub if none exists (keeps consistent record)
      await setDoc(ref, {
        flatNo,
        amount: baseAmount,
        refNo: null,
        mode: "Cash",
        paid: true,           // keep as paid; adjust to false if your policy differs
        verified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await loadPayments(id);
  }

  return (
    <Box sx={{ px: { xs: 2, md: 3 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2, gap: 2, flexWrap: "wrap" }}
      >
        <Typography variant="h6">Verify Payments</Typography>
        <TextField
          select
          size="small"
          label="Month"
          value={id}
          onChange={(e) => setId(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          {(db.dues ?? []).map((m: any) => (
            <MenuItem key={m.id} value={m.id}>
              {m.id}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 90 }}>Flat</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Amount (₹)</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Paid On</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>Status</TableCell>
                  <TableCell sx={{ minWidth: 180 }} align="center">
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {allFlats.map((flat) => {
                  const st = statusByFlat[flat] ?? { paid: false, verified: false, paidOn: "—" };
                  return (
                    <TableRow key={flat} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700 }}>{flat}</Typography>
                      </TableCell>

                      <TableCell>₹{baseAmount}</TableCell>

                      <TableCell>{st.paidOn}</TableCell>

                      <TableCell>
                        {st.verified ? (
                          <Chip size="small" color="success" label="Verified" />
                        ) : st.paid ? (
                          <Chip size="small" color="warning" label="Paid (pending)" />
                        ) : (
                          <Chip size="small" label="Unpaid" />
                        )}
                      </TableCell>

                      <TableCell align="center">
                        {!st.verified ? (
                          <Button size="small" variant="contained" onClick={() => verify(flat)}>
                            Verify
                          </Button>
                        ) : (
                          <Button size="small" variant="outlined" color="warning" onClick={() => unverify(flat)}>
                            Unverify
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>

          {/* Mobile hint */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: { xs: "block", sm: "none" } }}>
            Tip: Swipe horizontally to see all columns.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}