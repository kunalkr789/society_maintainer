import { Box, Stack, Toolbar, Typography } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar, { SIDEBAR_WIDTH } from "./Sidebar";
import BottomNav from "./BottomNav";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/auth/AuthProvider";
import { isRootPath, titleFor } from "@/nav";

export default function AppShell() {
  const { pathname } = useLocation();
  const { claims } = useAuth();
  const title = titleFor(pathname, claims?.role === "admin");
  const showBack = !isRootPath(pathname);

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <TopBar />
      <Sidebar />

      <Box component="main" sx={{ ml: { md: `${SIDEBAR_WIDTH}px` }, pb: { xs: "calc(88px + env(safe-area-inset-bottom))", md: 6 } }}>
        <Toolbar />
        {/* pages pad themselves horizontally (px: { xs: 2, md: 3 }); the header matches */}
        <Box sx={{ maxWidth: 1120, mx: "auto", pt: { xs: 2, md: 3 } }}>
          {(showBack || title) && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, px: { xs: 2, md: 3 } }}>
              {showBack && <BackButton size="small" />}
              {title && (
                <Typography component="h1" variant="h5">
                  {title}
                </Typography>
              )}
            </Stack>
          )}
          <Outlet />
        </Box>
      </Box>

      <BottomNav />
    </Box>
  );
}
