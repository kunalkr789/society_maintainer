import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { useApp } from "@/store";
import { exportMonthCsv } from "@/utils/csv";
import { buildDueReminderMessage, waLink } from "@/utils/whatsapp";

export default function DuesHistory() {
  const { db: appdb, loadPayments } = useApp();

  // Active month
  const [monthId, setMonthId] = React.useState(appdb.dues[0]?.id ?? "");

  // Filter
  const [status, setStatus] = React.useState<"all" | "paid" | "unpaid" | "verified">("all");

  // Fallback static flats (used only if profiles not present)
  const [fallbackFlats] = React.useState<string[]>([
    "101","102","103","104","201","202","203","204","301","302","303","304","401","402",
  ]);

  // Ensure we have payments for selected month
  React.useEffect(() => {
    if (monthId) loadPayments(monthId);
  }, [monthId, loadPayments]);

  // Build definitive flats list:
  // Prefer profiles (so ALL 14 show even if never paid), else fallback.
  const profileFlats = (appdb as any).profiles?.length
    ? (appdb as any).profiles
        .filter((p: any) => p.role === "resident" && p.flatNo)
        .map((p: any) => String(p.flatNo))
    : null;

  const flats = (profileFlats ?? fallbackFlats).slice().sort((a: string, b: string) => {
    const na = parseInt(a, 10), nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  // Lookup resident names/phones if available
  const nameByFlat: Record<string, string | undefined> = {};
  const phoneByFlat: Record<string, string | undefined> = {};
  ((appdb as any).profiles ?? []).forEach((p: any) => {
    if (p.flatNo) {
      nameByFlat[String(p.flatNo)] = p.name;
      phoneByFlat[String(p.flatNo)] = p.phone;
    }
  });

  // Data for the selected month
  const pays = appdb.payments[monthId] ?? [];
  const payMap = new Map(pays.map((p: any) => [String(p.flatNo), p]));
  const monthObj = appdb.dues.find((m) => m.id === monthId);
  const amount = monthObj?.amount ?? 0;

  // Build the table rows from the definitive flats list
  const rowsAll = appdb.dues.length > 0
    ? flats.map((flatNo: any) => {
        const p = payMap.get(flatNo);
        const paidOn = p?.updatedAt?.seconds
          ? new Date(p.updatedAt.seconds * 1000).toLocaleString()
          : p?.updatedAt
          ? new Date(p.updatedAt).toLocaleString()
          : "—";
        return {
          flatNo,
          amount,                                     // dues amount for the month
          paidOn,
          paid: !!p?.paid,
          verified: !!p?.verified,
          refNo: p?.refNo ?? "—",
          paymentAmt: Number(p?.amount ?? amount),    // for totals
          phone: phoneByFlat[flatNo],
          name: nameByFlat[flatNo],
        };
      })
    : [];

  // Apply filter
  const rows = rowsAll.filter((r: any) => {
    if (status === "paid") return r.paid;
    if (status === "unpaid") return !r.paid;
    if (status === "verified") return r.verified;
    return true;
  });

  // Totals (use actual amounts; verified for transparency)
  const totals = {
    total: rowsAll.length,
    paid: rowsAll.filter((r: any) => r.paid).length,
    verified: rowsAll.filter((r: any) => r.verified).length,
    pending: rowsAll.filter((r: any) => !r.paid).length,
    collected: rowsAll
      .filter((r: any) => r.paid && r.verified)
      .reduce((s: any, r: any) => s + Number(r.paymentAmt || 0), 0),
  };

  // CSV build
  const csvRows = rowsAll.map((r: any) => [
    monthId,
    r.flatNo,
    String(amount),
    r.paid ? "Yes" : "No",
    r.verified ? "Yes" : "No",
    r.refNo,
    r.paidOn,
  ]);

  // --- WhatsApp helpers ---
  function remind(flatNo: string) {
    const r = rowsAll.find((x: any) => x.flatNo === flatNo);
    const msg = buildDueReminderMessage({
      societyName: "Your Society Name",
      monthId,
      amount,
      dueDate: monthObj?.dueDate,
      flatNo,
      residentName: r?.name,
      // upi: 'society@upi', // optional: fill if you have it
      note: "Please include flat no. in the payment note.",
    });
    const href = waLink(r?.phone ?? "", msg);
    window.open(href, "_blank");
  }

  function remindAllUnpaid() {
    const targets = rowsAll.filter((r: any) => !r.paid || (r.paid && !r.verified));
    if (targets.length === 0) return;
    targets.forEach((r: any, i: any) => setTimeout(() => remind(r.flatNo), i * 250));
  }

  return (
    <Box sx={{ px: { xs: 2, md: 3 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1, gap: 2, flexWrap: "wrap" }}
      >
        <Typography variant="h6">Dues History (All Flats)</Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <TextField
            select
            size="small"
            label="Month"
            value={monthId}
            onChange={(e) => setMonthId(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            {appdb.dues.map((m: any) => (
              <MenuItem key={m.id} value={m.id}>
                {m.id}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="unpaid">Unpaid</MenuItem>
            <MenuItem value="verified">Verified</MenuItem>
          </TextField>

          <Button
            variant="outlined"
            onClick={() =>
              exportMonthCsv(
                [
                  ["Month", "Flat", "Amount", "Paid", "Verified", "RefNo", "PaidOn"],
                  ...csvRows,
                ],
                `dues-${monthId}.csv`
              )
            }
          >
            Export CSV
          </Button>

          {/* NEW: Bulk WhatsApp remind */}
          {/* <Button
            variant="contained"
            color="success"
            startIcon={<WhatsAppIcon />}
            onClick={remindAllUnpaid}
          >
            Remind all unpaid (this month)
          </Button> */}
        </Stack>
      </Stack>

      <Card>
        <CardContent>
          <Stack
            direction="row"
            useFlexGap
            flexWrap="wrap"
            sx={{
              columnGap: { xs: 1, sm: 2, md: 3 },
              rowGap: { xs: 1, sm: 1.5, md: 2 },
              mb: 1,
            }}
          >
            <Stat label="Flats" value={totals.total} />
            <Stat label="Paid" value={totals.paid} />
            <Stat label="Verified" value={totals.verified} />
            <Stat label="Pending" value={totals.pending} />
            <Stat label="Collected (verified)" value={`₹${totals.collected.toLocaleString("en-IN")}`} />
          </Stack>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Flat</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Paid On</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Verified</TableCell>
                <TableCell>Ref No</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r: any) => (
                <TableRow key={r.flatNo}>
                  <TableCell>
                    <Stack spacing={0.25}>
                      <Typography sx={{ fontWeight: 600 }}>{r.flatNo}</Typography>
                      {nameByFlat[r.flatNo] && (
                        <Typography variant="caption" color="text.secondary">
                          {nameByFlat[r.flatNo]}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>₹{amount}</TableCell>
                  <TableCell>{r.paidOn}</TableCell>
                  <TableCell>
                    {r.paid ? (
                      <Chip size="small" color="warning" label="Paid" />
                    ) : (
                      "Unpaid"
                    )}
                  </TableCell>
                  <TableCell>
                    {r.verified ? (
                      <Chip size="small" color="success" label="Verified" />
                    ) : (
                      "No"
                    )}
                  </TableCell>
                  <TableCell>{r.refNo}</TableCell>
                  <TableCell align="center">
                    {/* NEW: Per-row WhatsApp remind (only show if unpaid or pending) */}
                    {(!r.paid || (r.paid && !r.verified)) && (
                      <Tooltip title={`Remind ${r.flatNo} for ${monthId}`}>
                        <span>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => remind(r.flatNo)}
                          >
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: 120 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6">{value}</Typography>
    </Stack>
  );
}