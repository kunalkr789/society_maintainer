import * as React from "react";
import { Alert, Avatar, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, List, ListItem, ListItemAvatar, ListItemText, MenuItem, Skeleton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import CallRoundedIcon from "@mui/icons-material/CallRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { WhatsApp } from "@mui/icons-material";
import ConfirmDialog from "@/components/ConfirmDialog";
import { FALLBACK, GROUPS, isValidPhone, normalisePhone, removeContact, saveContact, useContacts, type Contact, type Group } from "@/features/contacts/api";

/** The society directory. Residents call or WhatsApp; admins (`editable`) also add, edit and remove. */
export default function Contacts({ editable = false }: { editable?: boolean }) {
  const { items, error } = useContacts();
  const [editing, setEditing] = React.useState<Contact | "new" | null>(null);
  const [deleting, setDeleting] = React.useState<Contact | null>(null);

  // residents always see at least the built-in security number (empty directory, or rules not yet published)
  const list = !editable && (error || items?.length === 0) ? FALLBACK : items;
  const groups = GROUPS.map((g) => ({ g, people: (list ?? []).filter((c) => c.group === g) })).filter((x) => x.people.length);

  return (
    <Box sx={{ px: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        {editable && (
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography color="text.secondary">Residents see this directory under Contacts.</Typography>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditing("new")}>
              Add contact
            </Button>
          </Stack>
        )}
        {editable && error && <Alert severity="error">{error} Publish the rules in docs/firestore-rules.md.</Alert>}
        {!list && !error && <Skeleton variant="rounded" height={200} />}
        {editable && items?.length === 0 && <Alert severity="info">No contacts yet. Residents currently see just the security guard’s number. Add security, staff, plumber, electrician and emergency numbers here.</Alert>}

        {groups.map(({ g, people }) => (
          <Box key={g}>
            <Typography variant="overline" color="text.secondary">
              {g}
            </Typography>
            <Card>
              <List disablePadding>
                {people.map((c, i) => {
                  const phone = normalisePhone(c.phone);
                  return (
                    <React.Fragment key={c.id}>
                      {i > 0 && <Divider component="li" />}
                      <ListItem
                        sx={{ py: 1.5 }}
                        secondaryAction={
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title={`Call ${c.name}`}>
                              <IconButton color="primary" href={`tel:${phone}`} aria-label={`Call ${c.name}`}>
                                <CallRoundedIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="WhatsApp">
                              <IconButton color="success" href={`https://wa.me/${phone.replace("+", "")}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${c.name}`}>
                                <WhatsApp />
                              </IconButton>
                            </Tooltip>
                            {editable && (
                              <>
                                <IconButton onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}>
                                  <EditRoundedIcon />
                                </IconButton>
                                <IconButton onClick={() => setDeleting(c)} aria-label={`Remove ${c.name}`}>
                                  <DeleteOutlineRoundedIcon />
                                </IconButton>
                              </>
                            )}
                          </Stack>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: "primary.main", fontWeight: 700 }}>{c.name.slice(0, 1).toUpperCase()}</Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={c.name} secondary={[c.role, c.note].filter(Boolean).join(" · ")} sx={{ pr: editable ? 22 : 11 }} />
                      </ListItem>
                    </React.Fragment>
                  );
                })}
              </List>
            </Card>
          </Box>
        ))}
      </Stack>

      {editable && <ContactDialog value={editing} onClose={() => setEditing(null)} />}
      {editable && (
        <ConfirmDialog
          open={!!deleting}
          title={`Remove ${deleting?.name ?? ""}?`}
          message="Residents will no longer see this contact."
          confirmText="Remove"
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            if (deleting) await removeContact(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </Box>
  );
}

function ContactDialog({ value, onClose }: { value: Contact | "new" | null; onClose: () => void }) {
  const existing = value && value !== "new" ? value : null;
  const [form, setForm] = React.useState<Omit<Contact, "id">>({ name: "", role: "", phone: "", group: "Society staff", note: "" });
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!value) return;
    setErr(null);
    setForm(existing ? { name: existing.name, role: existing.role, phone: existing.phone, group: existing.group, note: existing.note ?? "" } : { name: "", role: "", phone: "", group: "Society staff", note: "" });
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setErr("Name is required.");
    if (!isValidPhone(form.phone)) return setErr("Enter a valid phone number, e.g. 98xxxxxxxx or +9198xxxxxxxx.");
    setBusy(true);
    try {
      await saveContact(form, existing?.id);
      onClose();
    } catch {
      setErr("Couldn’t save. Check that you have admin access and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!value} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs" PaperProps={{ component: "form", onSubmit: submit }}>
      <DialogTitle>{existing ? "Edit contact" : "Add contact"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err && <Alert severity="error">{err}</Alert>}
          <TextField label="Name" value={form.name} onChange={set("name")} required autoFocus />
          <TextField label="Role" placeholder="e.g. Plumber, Night guard" value={form.role} onChange={set("role")} />
          <TextField label="Phone" type="tel" inputMode="tel" placeholder="98xxxxxxxx" value={form.phone} onChange={set("phone")} required />
          <TextField select label="Group" value={form.group} onChange={(e) => setForm((f) => ({ ...f, group: e.target.value as Group }))}>
            {GROUPS.map((g) => (
              <MenuItem key={g} value={g}>
                {g}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Note (optional)" placeholder="e.g. Available 9am–6pm" value={form.note} onChange={set("note")} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
