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
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as any)?.from ?? "/";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await login(email, password);
      nav("/", { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    }
  };

  return (
    <Box
      sx={{ display: "grid", placeItems: "center", minHeight: "100vh", p: 2 }}
    >
      <Card sx={{ width: 380, maxWidth: "100%" }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Sign in
          </Typography>
          {err && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {err}
            </Alert>
          )}
          <form onSubmit={onSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading && err === null}
              >
                Sign in
              </Button>
            </Stack>
          </form>
          {/* <Typography variant="caption" color="text.secondary" sx={{ mt:2, display:'block' }}>
            Tip: admin@society.local / admin123 or resident1@society.local / welcome123
          </Typography> */}
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
