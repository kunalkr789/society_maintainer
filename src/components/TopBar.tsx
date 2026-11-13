import * as React from "react";
import { AppBar, Avatar, Box, Chip, Divider, IconButton, ListItemIcon, Menu, MenuItem, Toolbar, Tooltip, Typography } from "@mui/material";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";

export const SOCIETY_NAME = "Urmila Kunj";

export default function TopBar() {
  const nav = useNavigate();
  const { profile, claims, logout } = useAuth();
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const isAdmin = claims?.role === "admin";
  const initials = (profile?.name || profile?.flatNo || "?").trim().slice(0, 2).toUpperCase();

  return (
    <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: "primary.main", color: "#fff", display: "grid", placeItems: "center" }}>
          <ApartmentRoundedIcon fontSize="small" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }} noWrap>
            {SOCIETY_NAME}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {isAdmin ? "Society admin" : "Resident portal"}
          </Typography>
        </Box>
        {!isAdmin && profile?.flatNo && <Chip size="small" label={`Flat ${profile.flatNo}`} sx={{ display: { xs: "none", sm: "inline-flex" } }} />}
        <Tooltip title="Account">
          <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Open account menu" aria-haspopup="menu">
            <Avatar sx={{ width: 34, height: 34, fontSize: 14, fontWeight: 700, bgcolor: "primary.main" }}>{initials}</Avatar>
          </IconButton>
        </Tooltip>
        <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2">{profile?.name || "Signed in"}</Typography>
            <Typography variant="caption" color="text.secondary">
              {isAdmin ? "Admin" : `Flat ${profile?.flatNo ?? "—"}`}
            </Typography>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => {
              setAnchor(null);
              nav("/settings/profile");
            }}
          >
            <ListItemIcon>
              <PersonRoundedIcon fontSize="small" />
            </ListItemIcon>
            My profile
          </MenuItem>
          <MenuItem
            onClick={async () => {
              setAnchor(null);
              await logout();
              nav("/login", { replace: true });
            }}
          >
            <ListItemIcon>
              <LogoutRoundedIcon fontSize="small" />
            </ListItemIcon>
            Sign out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
