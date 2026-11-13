import * as React from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Fab, MenuItem, Skeleton, Snackbar, Stack, TextField, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import { useApp } from "@/store";
import { CATEGORIES, createRequest, useRequests, type Category } from "@/features/helpdesk/api";
import RequestCard from "@/features/helpdesk/RequestCard";

export default function Helpdesk() {
  const { me } = useApp();
  const { items, error, loading } = useRequests(me ? { uid: me.uid } : null);
  const [open, setOpen] = React.useState(false);
  const [toast, setToast] = React.useState("");

  const openCount = items?.filter((r) => r.status !== "resolved").length ?? 0;

  return (
    <Box sx={{ px: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Typography color="text.secondary">{items?.length ? `${openCount} open · ${items.length - openCount} resolved` : "Report a problem in the building and track it here."}</Typography>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)} sx={{ display: { xs: "none", sm: "inline-flex" }, flex: "none" }}>
            New request
          </Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {loading && [0, 1].map((i) => <Skeleton key={i} variant="rounded" height={110} />)}

        {items?.length === 0 && (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 6, textAlign: "center" }}>
            <SupportAgentRoundedIcon sx={{ fontSize: 48, color: "text.disabled" }} />
            <Typography variant="subtitle1">No requests yet</Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 360 }}>
              Leaking pipe, lift trouble, a light out on the stairs? Raise a request and the admin will update you here.
            </Typography>
            <Button variant="outlined" onClick={() => setOpen(true)}>
              Raise a request
            </Button>
          </Stack>
        )}

        {items?.map((r) => <RequestCard key={r.id} r={r} />)}
      </Stack>

      <Fab color="primary" aria-label="New request" onClick={() => setOpen(true)} sx={{ position: "fixed", right: 16, bottom: "calc(80px + env(safe-area-inset-bottom))", display: { xs: "flex", sm: "none" } }}>
        <AddRoundedIcon />
      </Fab>

      {me && (
        <NewRequestDialog
          open={open}
          onClose={() => setOpen(false)}
          onCreated={() => {
            setOpen(false);
            setToast("Request sent. The admin has been notified.");
          }}
          uid={me.uid}
          flatNo={me.flatNo}
        />
      )}
      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast("")} message={toast} />
    </Box>
  );
}

function NewRequestDialog({ open, onClose, onCreated, uid, flatNo }: { open: boolean; onClose: () => void; onCreated: () => void; uid: string; flatNo: string }) {
  const [category, setCategory] = React.useState<Category>("Plumbing");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setErr(null);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 4) return setErr("Add a short title (at least 4 characters).");
    setBusy(true);
    try {
      await createRequest({ uid, flatNo, title, description, category });
      onCreated();
    } catch {
      setErr("Couldn’t send your request. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" PaperProps={{ component: "form", onSubmit: submit }}>
      <DialogTitle>New request</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err && <Alert severity="error">{err}</Alert>}
          <TextField select label="Category" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="What’s wrong?" placeholder="e.g. Kitchen sink is leaking" value={title} onChange={(e) => setTitle(e.target.value)} inputProps={{ maxLength: 80 }} required autoFocus />
          <TextField label="Details (optional)" placeholder="Where exactly, since when, best time to visit…" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={3} inputProps={{ maxLength: 1000 }} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={busy}>
          {busy ? "Sending…" : "Send request"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
