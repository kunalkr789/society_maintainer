import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { useApp } from "@/store";
import { navFor } from "@/nav";

export const SIDEBAR_WIDTH = 248;

export default function Sidebar() {
  const nav = useNavigate();
  const loc = useLocation();
  const { claims } = useAuth();
  const { db } = useApp();
  const isAdmin = claims?.role === "admin";
  const latestMonth = db.dues?.[0]?.id;

  return (
    <Box
      component="nav"
      aria-label="Main"
      sx={{
        display: { xs: "none", md: "block" },
        position: "fixed",
        top: 64,
        left: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        borderRight: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        overflowY: "auto",
        py: 2,
      }}
    >
      <Typography variant="overline" color="text.secondary" sx={{ px: 3 }}>
        {isAdmin ? "Manage" : "My home"}
      </Typography>
      <List dense>
        {navFor(isAdmin).map((item) => {
          const selected = item.match(loc.pathname);
          return (
            <ListItemButton key={item.label} selected={selected} onClick={() => nav(item.to(latestMonth))} aria-current={selected ? "page" : undefined} sx={{ my: 0.25, py: 1 }}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: selected ? 700 : 500 }} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
