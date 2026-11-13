import * as React from "react";
import { BottomNavigation, BottomNavigationAction, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Paper, Typography } from "@mui/material";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { useApp } from "@/store";
import { navFor } from "@/nav";

/** Mobile bottom bar for both roles: four pinned destinations plus a "More" sheet. */
export default function BottomNav() {
  const nav = useNavigate();
  const loc = useLocation();
  const { claims } = useAuth();
  const { db } = useApp();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const items = navFor(claims?.role === "admin");
  const pinned = items.filter((i) => i.mobile);
  const rest = items.filter((i) => !i.mobile);
  const latestMonth = db.dues?.[0]?.id;

  const activePinned = pinned.findIndex((i) => i.match(loc.pathname));
  const value = activePinned >= 0 ? activePinned : rest.some((i) => i.match(loc.pathname)) ? "more" : false;

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          display: { xs: "block", md: "none" },
          zIndex: (t) => t.zIndex.appBar,
          borderTop: 1,
          borderColor: "divider",
          borderRadius: 0,
          pb: "env(safe-area-inset-bottom)",
        }}
      >
        <BottomNavigation value={value} showLabels>
          {pinned.map((i, idx) => (
            <BottomNavigationAction key={i.label} value={idx} label={i.label} icon={i.icon} onClick={() => nav(i.to(latestMonth))} />
          ))}
          {rest.length > 0 && <BottomNavigationAction value="more" label="More" icon={<MoreHorizRoundedIcon />} onClick={() => setMoreOpen(true)} />}
        </BottomNavigation>
      </Paper>

      <Drawer anchor="bottom" open={moreOpen} onClose={() => setMoreOpen(false)} PaperProps={{ sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20, pb: "calc(16px + env(safe-area-inset-bottom))" } }}>
        <Typography variant="overline" color="text.secondary" sx={{ px: 3, pt: 2 }}>
          More
        </Typography>
        <List>
          {rest.map((i) => (
            <ListItemButton
              key={i.label}
              selected={i.match(loc.pathname)}
              onClick={() => {
                setMoreOpen(false);
                nav(i.to(latestMonth));
              }}
              sx={{ py: 1.25 }}
            >
              <ListItemIcon>{i.icon}</ListItemIcon>
              <ListItemText primary={i.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
    </>
  );
}
