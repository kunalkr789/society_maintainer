import * as React from "react";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import VerifiedIcon from "@mui/icons-material/Verified";
import HistoryIcon from "@mui/icons-material/History";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CampaignIcon from "@mui/icons-material/Campaign";
import PersonIcon from "@mui/icons-material/Person";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@/store";
import { ReceiptLong } from "@mui/icons-material";

type TabValue =
  | "admin-home"
  | "admin-verify"
  | "admin-history"
  | "admin-finance"
  | "admin-notice"
  | "admin-profile"
  | "admin-ledger";

export default function AdminBottomNav() {
  const nav = useNavigate();
  const loc = useLocation();
  const { db } = useApp();
  const latestMonth = db.dues?.[0]?.id;

  const tabs = React.useMemo(
    () => [
      {
        value: "admin-home" as const,
        to: "/admin",
        match: (p: string) => p === "/admin",
      },
      {
        value: "admin-verify" as const,
        to: `/admin/dues/${latestMonth ?? ""}/verify`,
        match: (p: string) =>
          p.includes("/admin/dues/") && p.endsWith("/verify"),
      },
      {
        value: "admin-history" as const,
        to: "/admin/dues/history",
        match: (p: string) => p.startsWith("/admin/dues/history"),
      },
      {
        value: "admin-finance" as const,
        to: "/admin/finance",
        match: (p: string) => p.startsWith("/admin/finance"),
      },
      {
        value: "admin-notice" as const,
        to: "/admin/notices/add",
        match: (p: string) => p.startsWith("/admin/notices"),
      },
      // { value: 'admin-profile' as const, to: '/settings/profile',                 match: (p:string)=> p.startsWith('/settings/profile') },
      {
        value: "admin-ledger" as const,
        to: "/admin/ledger",
        match: (p: string) => p.startsWith("/admin/ledger"),
      },
    ],
    [latestMonth]
  );

  const active: TabValue =
    tabs.find((t) => t.match(loc.pathname))?.value ?? "admin-home";

  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (t) => t.zIndex.modal + 1,
        paddingBottom: "env(safe-area-inset-bottom)",
        display: { xs: "block", md: "none" },
      }}
    >
      <BottomNavigation
        value={active}
        showLabels
        sx={{ touchAction: "manipulation" }}
      >
        <BottomNavigationAction
          value="admin-home"
          label="Dashboard"
          icon={<DashboardIcon />}
          onClick={() => nav("/admin")}
          sx={{ flex: 1, minWidth: 0, py: 1.25 }}
          disableRipple
        />
        <BottomNavigationAction
          value="admin-verify"
          label="Verify"
          icon={<VerifiedIcon />}
          onClick={() => nav(`/admin/dues/${latestMonth ?? ""}/verify`)}
          sx={{ flex: 1, minWidth: 0, py: 1.25 }}
          disableRipple
        />
        <BottomNavigationAction
          value="admin-history"
          label="History"
          icon={<HistoryIcon />}
          onClick={() => nav("/admin/dues/history")}
          sx={{ flex: 1, minWidth: 0, py: 1.25 }}
          disableRipple
        />
        <BottomNavigationAction
          value="admin-finance"
          label="Finance"
          icon={<AccountBalanceIcon />}
          onClick={() => nav("/admin/finance")}
          sx={{ flex: 1, minWidth: 0, py: 1.25 }}
          disableRipple
        />
        <BottomNavigationAction
          value="admin-notice"
          label="Notice"
          icon={<CampaignIcon />}
          onClick={() => nav("/admin/notices/add")}
          sx={{ flex: 1, minWidth: 0, py: 1.25 }}
          disableRipple
        />
        {/* <BottomNavigationAction value="admin-profile" label="Profile"   icon={<PersonIcon />} onClick={() => nav('/settings/profile')} sx={{ flex:1, minWidth:0, py:1.25 }} disableRipple /> */}
        <BottomNavigationAction
          value="admin-ledger"
          label="Ledger"
          icon={<ReceiptLong />}
          onClick={() => nav("/admin/ledger")}
          sx={{ flex: 1, minWidth: 0, py: 1.25 }}
          disableRipple
        />
      </BottomNavigation>
    </Paper>
  );
}
