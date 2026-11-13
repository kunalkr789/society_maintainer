import React from "react";
import { Alert, Box, Button, Card, CardContent, CircularProgress, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { useAuth } from "@/auth/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";
import { SOCIETY_NAME } from "@/components/TopBar";

/** Firebase auth codes → messages a resident can act on. */
function friendlyError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  if (/invalid-credential|wrong-password|user-not-found|invalid-email/.test(code)) return "That email and password don’t match. Check them and try again.";
  if (code.includes("too-many-requests")) return "Too many attempts. Wait a few minutes, then try again.";
  if (code.includes("network-request-failed")) return "You seem to be offline. Check your connection and try again.";
  if (code.includes("user-disabled")) return "This account has been disabled. Please contact the society admin.";
  return "Couldn’t sign you in. Please try again.";
}

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const nav = useNavigate();
  const loc = useLocation();
  // return to the page that sent the user here, if any
  const from = (loc.state as { from?: string } | null)?.from ?? "/";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErr(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      nav(from, { replace: true });
    } catch (e) {
      setErr(friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        p: 2,
        background: "radial-gradient(1200px 600px at 10% -10%, rgba(21,128,61,0.12), transparent 60%), radial-gradient(900px 500px at 110% 110%, rgba(3,105,161,0.08), transparent 60%), #F6F7F9",
      }}
    >
      <Stack spacing={3} sx={{ width: 400, maxWidth: "100%" }}>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
          <Box sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: "primary.main", color: "#fff", display: "grid", placeItems: "center" }}>
            <ApartmentRoundedIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
              {SOCIETY_NAME}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Society maintenance portal
            </Typography>
          </Box>
        </Stack>

        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" sx={{ mb: 0.5 }}>
              Welcome back
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Sign in to pay dues, read notices and raise requests.
            </Typography>
            {err && (
              <Alert severity="error" sx={{ mb: 2 }} role="alert">
                {err}
              </Alert>
            )}
            <form onSubmit={onSubmit} noValidate>
              <Stack spacing={2}>
                <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
                <TextField
                  label="Password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShow((s) => !s)} edge="end" aria-label={show ? "Hide password" : "Show password"}>
                          {show ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button type="submit" variant="contained" size="large" disabled={busy || !email || !password} startIcon={busy ? <CircularProgress size={18} color="inherit" /> : undefined}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>

        <Typography variant="caption" color="text.secondary" align="center">
          For residents of <strong>{SOCIETY_NAME}</strong> only. Forgot your password? Ask the society admin to reset it.
        </Typography>
      </Stack>
    </Box>
  );
}
