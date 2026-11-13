import * as React from "react";
import { Alert, Box, Button, Skeleton, Snackbar, Stack, Tab, Tabs, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { STATUSES, statusLabel, updateRequest, useRequests, type Request, type Status } from "@/features/helpdesk/api";
import RequestCard from "@/features/helpdesk/RequestCard";

type Filter = "active" | Status;

export default function AdminHelpdesk() {
  const { items, error, loading } = useRequests("all");
  const [filter, setFilter] = React.useState<Filter>("active");
  const [toast, setToast] = React.useState("");

  const count = (f: Filter) => items?.filter((r) => (f === "active" ? r.status !== "resolved" : r.status === f)).length ?? 0;
  const shown = items?.filter((r) => (filter === "active" ? r.status !== "resolved" : r.status === filter)) ?? [];

  return (
    <Box sx={{ px: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Tabs value={filter} onChange={(_, v) => setFilter(v)} variant="scrollable" allowScrollButtonsMobile>
          <Tab value="active" label={`Active (${count("active")})`} />
          {STATUSES.map((s) => (
            <Tab key={s} value={s} label={`${statusLabel[s]} (${count(s)})`} />
          ))}
        </Tabs>

        {error && <Alert severity="error">{error}</Alert>}
        {loading && [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={140} />)}
        {items && shown.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            {filter === "active" ? "No open requests. Nice." : `No ${statusLabel[filter as Status].toLowerCase()} requests.`}
          </Typography>
        )}

        {shown.map((r) => (
          <RequestCard key={r.id} r={r} showFlat actions={<AdminActions r={r} onSaved={(msg) => setToast(msg)} />} />
        ))}
      </Stack>
      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast("")} message={toast} />
    </Box>
  );
}

function AdminActions({ r, onSaved }: { r: Request; onSaved: (msg: string) => void }) {
  const [status, setStatus] = React.useState<Status>(r.status);
  const [note, setNote] = React.useState(r.adminNote ?? "");
  const [busy, setBusy] = React.useState(false);
  const dirty = status !== r.status || note.trim() !== (r.adminNote ?? "");

  const save = async () => {
    setBusy(true);
    try {
      await updateRequest(r.id, { status, adminNote: note.trim() });
      onSaved(`Flat ${r.flatNo}: marked ${statusLabel[status].toLowerCase()}`);
    } catch {
      onSaved("Couldn’t save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={1.5}>
      <ToggleButtonGroup size="small" exclusive value={status} onChange={(_, v: Status | null) => v && setStatus(v)} aria-label="Status">
        {STATUSES.map((s) => (
          <ToggleButton key={s} value={s} sx={{ textTransform: "none", px: 1.5 }}>
            {statusLabel[s]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField size="small" label="Note for the resident" placeholder="e.g. Plumber visiting Saturday 11am" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button variant="contained" onClick={save} disabled={!dirty || busy} sx={{ flex: "none" }}>
          {busy ? "Saving…" : "Update"}
        </Button>
      </Stack>
    </Stack>
  );
}
