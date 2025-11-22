import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
  Chip,
  Tooltip,
  IconButton,
} from "@mui/material";
import { useState } from "react";
import { useApp } from "@/store";
import { fmt } from "@/utils/date";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Campaign, Delete } from "@mui/icons-material";

export default function AddNotice() {
  const { db, addNotice, deleteNotice } = useApp();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [valid, setValid] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const onSave = async () => {
    setSaving(true);
    try {
      await addNotice({
        title,
        body,
        pinned,
        validTill: valid || undefined,
      });
      setMsg({ type: "success", text: "Notice created" });
    } catch (e: any) {
      setMsg({ type: "error", text: e?.message ?? "Failed to create notice" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotice(id);
      setToast({ type: "success", text: "Notice deleted" });
    } catch (e: any) {
      setToast({
        type: "error",
        text: e?.message || "Failed to delete notice",
      });
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <Box sx={{ px: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        {(db.notices ?? []).map((n: any) => {
          const dateStr = n?.createdAt?.seconds
            ? new Date(n.createdAt.seconds * 1000).toLocaleString()
            : n?.createdAt
            ? new Date(n.createdAt).toLocaleString()
            : "";
          return (
            <Card key={n.id} variant="outlined">
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Stack spacing={0.5} sx={{ pr: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Campaign fontSize="small" />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {n.title}
                      </Typography>
                    </Stack>
                    {dateStr && (
                      <Typography variant="caption" color="text.secondary">
                        {dateStr}
                      </Typography>
                    )}
                    <Typography sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
                      {n.body}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Delete notice">
                      <IconButton
                        color="error"
                        onClick={() => setConfirmId(n.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
        {(!db.notices || db.notices.length === 0) && (
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary">No notices yet.</Typography>
            </CardContent>
          </Card>
        )}
      </Stack>

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && handleDelete(confirmId)}
        title="Delete this notice?"
        message="This will permanently delete the notice for all residents."
        confirmText="Delete"
        cancelText="Cancel"
      />

      {toast && (
        <Snackbar open autoHideDuration={2400} onClose={() => setToast(null)}>
          <Alert
            onClose={() => setToast(null)}
            severity={toast.type}
            variant="filled"
          >
            {toast.text}
          </Alert>
        </Snackbar>
      )}
      <Card sx={{mt: 2}}>
        <CardContent>
          <Typography variant="h6">Add Notice</Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              label="Body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              multiline
              minRows={3}
            />
            <TextField
              label="Valid Till"
              type="date"
              value={valid}
              onChange={(e) => setValid(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                />
              }
              label="Pin Notice"
            />
            <Button
              variant="contained"
              onClick={() => {
                onSave();
              }}
            >
              Submit
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Snackbar
        open={!!msg}
        autoHideDuration={3000}
        onClose={() => setMsg(null)}
      >
        {msg ? (
          <Alert
            onClose={() => setMsg(null)}
            severity={msg.type}
            variant="filled"
          >
            {msg.text}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
