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
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useApp } from "@/store";
import { exportMonthCsv } from "@/utils/csv";
import { db as fs } from "@/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  setDoc,
} from "firebase/firestore";
import { useAuth } from "@/auth/AuthProvider";
import { exportLedgerPdf } from "@/utils/pdf";

type Row = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  type: "Cr" | "Dr";
  particulars: string;
  instrument?: string;
  instNo?: string | null;
  debit: number;
  credit: number;
  source: "auto" | "manual";
};

type ManualForm = {
  id?: string;
  date: string;
  type: "Cr" | "Dr";
  particulars: string;
  instrument?: string;
  instNo?: string;
  amount: number;
};

export default function Ledger() {
  const { db, loadPayments } = useApp();
  const { claims } = useAuth();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const [monthId, setMonthId] = React.useState(db.dues[0]?.id ?? "");
  const [opening, setOpening] = React.useState<number>(0);
  const [openingInput, setOpeningInput] = React.useState<string>("0");
  const [savingOB, setSavingOB] = React.useState(false);
  const [toast, setToast] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Manual entries state
  const [manual, setManual] = React.useState<ManualForm[]>([]);
  const [dlgOpen, setDlgOpen] = React.useState(false);
  const [form, setForm] = React.useState<ManualForm>({
    date: new Date().toISOString().slice(0, 10),
    type: "Cr",
    particulars: "",
    instrument: "",
    instNo: "",
    amount: 0,
  });
  const [saving, setSaving] = React.useState(false);

  // Load payments, opening balance, and manual entries for selected month
  React.useEffect(() => {
    if (!monthId) return;
    (async () => {
      await loadPayments(monthId);
      // opening balance
      try {
        const snap = await getDoc(doc(fs, "settings", "finance"));
        const ob = snap.exists()
          ? (snap.data() as any)?.openingBalances?.[monthId] ?? 0
          : 0;
        const v = Number(ob) || 0;
        setOpening(v);
        setOpeningInput(String(v));
      } catch {
        setOpening(0);
        setOpeningInput("0");
      }
      // manual entries
      await loadManualEntries(monthId);
    })();
  }, [monthId, loadPayments]);

  async function loadManualEntries(mId: string) {
    const col = collection(fs, "ledger", mId, "entries");
    const snap = await getDocs(query(col, orderBy("date", "asc")));
    const rows: ManualForm[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));
    setManual(rows);
  }

  // Verified payments → credits
  const pays = (db.payments[monthId] ?? []).filter(
    (p: any) => p.paid && p.verified
  );
  const creditRows: Row[] = pays.map((p: any, idx: number) => ({
    id: `cr-${idx}-${p.flatNo}`,
    date: pickIsoDate(p.updatedAt),
    type: "Cr",
    particulars: `Maintenance - Flat ${p.flatNo}`,
    instrument: p.mode ?? (p.refNo ? "Online" : "Cash"),
    instNo: p.refNo ?? null,
    debit: 0,
    credit: Number(
      p.amount ?? db.dues.find((d: any) => d.id === monthId)?.amount ?? 0
    ),
    source: "auto",
  }));

  // Expenses in month → debits
  const expRows: Row[] = (db.expenses ?? [])
    .filter((e: any) => String(e.date ?? "").startsWith(monthId))
    .map((e: any) => ({
      id: `dr-${e.id}`,
      date: (e.date ?? "").slice(0, 10),
      type: "Dr",
      particulars: e.title + (e.category ? ` (${e.category})` : ""),
      instrument: e.mode ?? "Cash",
      instNo: e.instNo ?? null,
      debit: Number(e.amount ?? 0),
      credit: 0,
      source: "auto",
    }));

  // Manual entries
  const manualRows: Row[] = manual.map((m) => ({
    id: `mn-${m.id}`,
    date: m.date,
    type: m.type,
    particulars: m.particulars,
    instrument: m.instrument,
    instNo: m.instNo || null,
    debit: m.type === "Dr" ? Number(m.amount || 0) : 0,
    credit: m.type === "Cr" ? Number(m.amount || 0) : 0,
    source: "manual",
  }));

  // Merge + sort
  const rowsUnsorted: Row[] = [...creditRows, ...expRows, ...manualRows];
  const rows = rowsUnsorted.sort((a, b) => {
    if (a.date === b.date) {
      if (a.type === b.type) {
        if (a.source !== b.source) return a.source === "manual" ? -1 : 1;
        return a.particulars.localeCompare(b.particulars);
      }
      return a.type === "Cr" ? -1 : 1;
    }
    return a.date.localeCompare(b.date);
  });

  // Running balance
  let running = opening;
  const rowsWithBalance = rows.map((r) => {
    running = running + r.credit - r.debit;
    return { ...r, balance: running };
  });

  const totals = {
    opening,
    credits: rows.reduce((s, r) => s + r.credit, 0),
    debits: rows.reduce((s, r) => s + r.debit, 0),
    closing: opening + rows.reduce((s, r) => s + (r.credit - r.debit), 0),
  };

  // CSV
  const csv = [
    [
      "Month",
      "Date",
      "Type",
      "Particulars",
      "Instrument",
      "Inst No",
      "Debit",
      "Credit",
      "Balance",
      "Source",
    ],
    ...rowsWithBalance.map((r) => [
      monthId,
      r.date,
      r.type,
      r.particulars,
      r.instrument ?? "",
      r.instNo ?? "",
      String(r.debit),
      String(r.credit),
      String(r.balance),
      r.source,
    ]),
    [],
    ["Opening", String(totals.opening)],
    ["Total Credits", String(totals.credits)],
    ["Total Debits", String(totals.debits)],
    ["Closing", String(totals.closing)],
  ];

  // Opening balance save
  async function saveOpening() {
    if (claims?.role !== "admin") return;
    const val = Number(openingInput);
    if (Number.isNaN(val)) {
      setToast({ type: "error", text: "Enter a valid number" });
      return;
    }
    setSavingOB(true);
    try {
      await setDoc(
        doc(fs, "settings", "finance"),
        { openingBalances: { [monthId]: val } },
        { merge: true }
      );
      setOpening(val);
      setToast({ type: "success", text: "Opening balance updated" });
    } catch (e: any) {
      setToast({
        type: "error",
        text: e?.message ?? "Failed to save opening balance",
      });
    } finally {
      setSavingOB(false);
    }
  }

  // Manual handlers
  function openAdd() {
    setForm({
      date: new Date().toISOString().slice(0, 10),
      type: "Cr",
      particulars: "",
      instrument: "",
      instNo: "",
      amount: 0,
    });
    setDlgOpen(true);
  }
  function openEdit(r: Row) {
    if (r.source !== "manual") return;
    setForm({
      id: r.id.replace(/^mn-/, ""),
      date: r.date,
      type: r.type,
      particulars: r.particulars,
      instrument: r.instrument,
      instNo: r.instNo ?? "",
      amount: r.type === "Cr" ? r.credit : r.debit,
    });
    setDlgOpen(true);
  }
  async function saveManual() {
    if (!monthId) return;
    if (!form.particulars?.trim() || !form.date || !form.amount) return;
    setSaving(true);
    try {
      const col = collection(fs, "ledger", monthId, "entries");
      if (form.id) {
        await updateDoc(doc(fs, "ledger", monthId, "entries", form.id), {
          date: form.date,
          type: form.type,
          particulars: form.particulars.trim(),
          instrument: form.instrument || "",
          instNo: form.instNo || "",
          amount: Number(form.amount),
        });
      } else {
        await addDoc(col, {
          date: form.date,
          type: form.type,
          particulars: form.particulars.trim(),
          instrument: form.instrument || "",
          instNo: form.instNo || "",
          amount: Number(form.amount),
          createdAt: new Date().toISOString(),
        });
      }
      await loadManualEntries(monthId);
      setDlgOpen(false);
    } finally {
      setSaving(false);
    }
  }
  async function deleteManual(r: Row) {
    if (r.source !== "manual") return;
    const id = r.id.replace(/^mn-/, "");
    await deleteDoc(doc(fs, "ledger", monthId, "entries", id));
    await loadManualEntries(monthId);
  }

  return (
    <Box sx={{ px: { xs: 2, md: 3 } }}>
      {/* Header + Controls */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        useFlexGap
        flexWrap="wrap"
        sx={{ columnGap: { xs: 1, sm: 2 }, rowGap: { xs: 1 }, mb: 1 }}
      >
        <Typography variant="h6">Ledger</Typography>
        <Stack
          direction="row"
          useFlexGap
          flexWrap="wrap"
          sx={{ columnGap: { xs: 1, sm: 1.5 }, rowGap: { xs: 1 } }}
        >
          <TextField
            select
            size="small"
            label="Month"
            value={monthId}
            sx={{ minWidth: 160 }}
            onChange={(e) => setMonthId(e.target.value)}
          >
            {db.dues.map((m: any) => (
              <MenuItem key={m.id} value={m.id}>
                {m.id}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            onClick={() => exportMonthCsv(csv, `ledger-${monthId}.csv`)}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            onClick={() =>
              exportLedgerPdf(
                monthId,
                rowsWithBalance as any, // has balance added
                totals,
                {
                  societyName: "Your Society Name",
                  addressLine: "Your address (optional)",
                }
              )
            }
          >
            Export PDF
          </Button>
          <Button variant="contained" onClick={openAdd}>
            Add Manual Entry
          </Button>
        </Stack>
      </Stack>

      {/* Summary + Opening Balance editor */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            useFlexGap
            flexWrap="wrap"
            sx={{ columnGap: { xs: 2, md: 4 }, rowGap: { xs: 1.5 } }}
          >
            <Summary label="Opening Balance" value={opening} />
            <Summary label="Total Credits" value={totals.credits} />
            <Summary label="Total Debits" value={totals.debits} />
            <Summary label="Closing Balance" value={totals.closing} large />
          </Stack>

          {/* Editor (admins only) */}
          {claims?.role === "admin" && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              useFlexGap
              flexWrap="wrap"
              sx={{ mt: 2, columnGap: { xs: 1, sm: 1.5 }, rowGap: { xs: 1 } }}
            >
              <TextField
                size="small"
                label={`Opening Balance for ${monthId}`}
                value={openingInput}
                onChange={(e) => setOpeningInput(e.target.value)}
                type="number"
                sx={{ maxWidth: 260 }}
              />
              <Button
                variant="contained"
                onClick={saveOpening}
                disabled={savingOB}
              >
                {savingOB ? "Saving…" : "Save Opening Balance"}
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      {isXs ? (
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={1.25}>
              {rowsWithBalance.length === 0 && (
                <Typography color="text.secondary">
                  No ledger entries for {monthId} yet.
                </Typography>
              )}
              {rowsWithBalance.map((r) => (
                <Card key={r.id} variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Stack spacing={0.5}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography sx={{ fontWeight: 700 }}>
                          {formatHumanDate(r.date)}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            size="small"
                            color={r.type === "Cr" ? "success" : "error"}
                            label={r.type}
                          />
                          {r.source === "manual" && (
                            <Chip size="small" label="Manual" />
                          )}
                        </Stack>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {r.particulars}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {r.instrument ?? "—"}
                        {r.instNo ? ` • ${r.instNo}` : ""}
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                        <Typography variant="body2">
                          Debit: <b>₹{r.debit}</b>
                        </Typography>
                        <Typography variant="body2">
                          Credit: <b>₹{r.credit}</b>
                        </Typography>
                        <Typography variant="body2">
                          Bal: <b>₹{(r as any).balance}</b>
                        </Typography>
                      </Stack>
                      {r.source === "manual" && (
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Button
                            size="small"
                            onClick={() => openEdit(r)}
                            startIcon={<EditIcon />}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => deleteManual(r)}
                            startIcon={<DeleteIcon />}
                          >
                            Delete
                          </Button>
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ) : (
        // Desktop/Table
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ width: "100%", overflowX: "auto" }}>
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
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rowsWithBalance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <Typography color="text.secondary">
                          No ledger entries for {monthId} yet.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {rowsWithBalance.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>{formatHumanDate(r.date)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            size="small"
                            color={r.type === "Cr" ? "success" : "error"}
                            label={r.type}
                          />
                          {r.source === "manual" && (
                            <Chip size="small" label="Manual" />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>{r.particulars}</TableCell>
                      <TableCell>{r.instrument ?? "—"}</TableCell>
                      <TableCell>{r.instNo ?? "—"}</TableCell>
                      <TableCell align="right">₹{r.debit}</TableCell>
                      <TableCell align="right">₹{r.credit}</TableCell>
                      <TableCell align="right">₹{(r as any).balance}</TableCell>
                      <TableCell align="center">
                        {r.source === "manual" ? (
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="center"
                          >
                            <IconButton
                              size="small"
                              onClick={() => openEdit(r)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => deleteManual(r)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Manual Entry Dialog */}
      <Dialog
        open={dlgOpen}
        onClose={() => setDlgOpen(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isXs}
      >
        <DialogTitle>
          {form.id ? "Edit Manual Entry" : "Add Manual Entry"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              type="date"
              label="Date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Type"
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as "Cr" | "Dr" })
              }
            >
              <MenuItem value="Cr">Credit</MenuItem>
              <MenuItem value="Dr">Debit</MenuItem>
            </TextField>
            <TextField
              label="Particulars"
              value={form.particulars}
              onChange={(e) =>
                setForm({ ...form, particulars: e.target.value })
              }
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Instrument"
                value={form.instrument ?? ""}
                onChange={(e) =>
                  setForm({ ...form, instrument: e.target.value })
                }
              />
              <TextField
                label="Instrument No."
                value={form.instNo ?? ""}
                onChange={(e) => setForm({ ...form, instNo: e.target.value })}
              />
            </Stack>
            <TextField
              type="number"
              label="Amount (₹)"
              value={form.amount}
              onChange={(e) =>
                setForm({ ...form, amount: Number(e.target.value) })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveManual} disabled={saving}>
            {form.id ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={!!toast}
        autoHideDuration={2500}
        onClose={() => setToast(null)}
      >
        {toast ? (
          <Alert
            severity={toast.type}
            variant="filled"
            onClose={() => setToast(null)}
          >
            {toast.text}
          </Alert>
        ) : undefined}
      </Snackbar>
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
    <Stack spacing={0.25} sx={{ minWidth: { xs: "auto", sm: 180 } }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant={large ? "h5" : "h6"}>₹{value}</Typography>
    </Stack>
  );
}

function pickIsoDate(updatedAt: any): string {
  if (!updatedAt) return new Date().toISOString().slice(0, 10);
  if (updatedAt?.seconds)
    return new Date(updatedAt.seconds * 1000).toISOString().slice(0, 10);
  try {
    return new Date(updatedAt).toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}
function formatHumanDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}
