import React from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
} from "@mui/material";
import { useAuth } from "@/auth/AuthProvider";
import { useNavigate } from "react-router-dom";

export default function ForcePasswordChange() {
  const { changePassword } = useAuth();
  const [p1, setP1] = React.useState("");
  const [p2, setP2] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState(false);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(false);
    if (p1.length < 6)
      return setErr("Password should be at least 6 characters");
    if (p1 !== p2) return setErr("Passwords do not match");
    try {
      await changePassword(p1);
      setOk(true);
      nav("/login", { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    }
  };

  return (
    <Box
      sx={{ display: "grid", placeItems: "center", minHeight: "100vh", p: 2 }}
    >
      <Card sx={{ width: 420, maxWidth: "100%" }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Set a new password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            For security, please set a new password before continuing.
          </Typography>
          {err && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {err}
            </Alert>
          )}
          {ok && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Password updated. You can now use the app.
            </Alert>
          )}
          <form onSubmit={submit}>
            <Stack spacing={2}>
              <TextField
                label="New password"
                type="password"
                value={p1}
                onChange={(e) => setP1(e.target.value)}
              />
              <TextField
                label="Confirm password"
                type="password"
                value={p2}
                onChange={(e) => setP2(e.target.value)}
              />
              <Button type="submit" variant="contained">
                Update password
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
      <Typography
        variant="caption"
        color="text.secondary"
        align="center"
        sx={{ mt: 2, display: "block", opacity: 0.7 }}
      >
        This app is intended for use by residents of{" "}
        <strong>Urmila Kunj</strong> only.
      </Typography>
    </Box>
  );
}
