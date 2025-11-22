import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Stack,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import { useAuth } from "@/auth/AuthProvider";
import * as React from "react";

export default function Profile() {
  const { profile, updateProfile, logout } = useAuth();
  const [name, setName] = React.useState(profile?.name ?? "");
  const [phone, setPhone] = React.useState(profile?.phone ?? "");
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  React.useEffect(() => {
    setName(profile?.name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile?.name, profile?.phone]);

  const onSave = async () => {
    if (!name.trim()) {
      setMsg({ type: "error", text: "Name is required" });
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
      setMsg({ type: "success", text: "Profile updated" });
    } catch (e: any) {
      setMsg({ type: "error", text: e?.message ?? "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ px: { xs: 2, md: 3 } }}>
      <Card>
        <CardContent>
          <Typography variant="h6">My Profile</Typography>
          <Stack spacing={2} sx={{ mt: 1, maxWidth: 480 }}>
            <TextField
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <TextField
              label="Email"
              value={profile?.email ?? ""}
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Flat"
              value={profile?.flatNo ?? ""}
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Role"
              value={profile?.role ?? ""}
              InputProps={{ readOnly: true }}
            />

            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={onSave} disabled={saving}>
                Save
              </Button>
              <Button variant="outlined" color="inherit" onClick={logout}>
                Logout
              </Button>
            </Stack>
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
