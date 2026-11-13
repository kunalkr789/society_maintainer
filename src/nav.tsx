import type { ReactElement } from "react";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import ContactPhoneRoundedIcon from "@mui/icons-material/ContactPhoneRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";

/**
 * One navigation model for both roles. The sidebar, the mobile bottom bar
 * and the page titles all read from here, so they can't drift apart.
 */
export type NavItem = {
  label: string;
  /** Shown in the page header; defaults to `label`. */
  title?: string;
  /** Builds the link; receives the latest dues month id (YYYY-MM) when known. */
  to: (latestMonth?: string) => string;
  match: (path: string) => boolean;
  icon: ReactElement;
  /** Pinned to the mobile bottom bar (max 4; the rest go under "More"). */
  mobile?: boolean;
};

export const residentNav: NavItem[] = [
  { label: "Home", title: "Dashboard", to: () => "/dashboard", match: (p) => p === "/dashboard", icon: <DashboardRoundedIcon />, mobile: true },
  { label: "Dues", to: () => "/dues", match: (p) => p === "/dues" || /^\/dues\/[^/]+\/mark-paid$/.test(p), icon: <ReceiptLongRoundedIcon />, mobile: true },
  { label: "History", title: "Dues History", to: () => "/dues/history", match: (p) => p === "/dues/history", icon: <HistoryRoundedIcon /> },
  { label: "Ledger", to: () => "/ledger", match: (p) => p === "/ledger", icon: <MenuBookRoundedIcon /> },
  { label: "Notices", to: () => "/notices", match: (p) => p === "/notices", icon: <CampaignRoundedIcon />, mobile: true },
  { label: "Helpdesk", to: () => "/helpdesk", match: (p) => p === "/helpdesk", icon: <SupportAgentRoundedIcon />, mobile: true },
  { label: "Contacts", to: () => "/contacts", match: (p) => p === "/contacts", icon: <ContactPhoneRoundedIcon /> },
];

export const adminNav: NavItem[] = [
  { label: "Dashboard", to: () => "/admin", match: (p) => p === "/admin", icon: <DashboardRoundedIcon />, mobile: true },
  {
    label: "Verify",
    title: "Verify Payments",
    to: (m) => (m ? `/admin/dues/${m}/verify` : "/admin/dues/history"),
    match: (p) => /^\/admin\/dues\/[^/]+\/verify$/.test(p),
    icon: <VerifiedRoundedIcon />,
    mobile: true,
  },
  { label: "Create Month", to: () => "/admin/dues/create", match: (p) => p === "/admin/dues/create", icon: <AddCircleRoundedIcon /> },
  { label: "Dues History", to: () => "/admin/dues/history", match: (p) => p === "/admin/dues/history", icon: <HistoryRoundedIcon /> },
  { label: "Finance", to: () => "/admin/finance", match: (p) => p === "/admin/finance", icon: <AccountBalanceRoundedIcon />, mobile: true },
  { label: "Ledger", to: () => "/admin/ledger", match: (p) => p === "/admin/ledger", icon: <MenuBookRoundedIcon /> },
  { label: "Helpdesk", to: () => "/admin/helpdesk", match: (p) => p === "/admin/helpdesk", icon: <SupportAgentRoundedIcon />, mobile: true },
  { label: "Notices", title: "Add Notice", to: () => "/admin/notices/add", match: (p) => p.startsWith("/admin/notices") || p === "/notices", icon: <CampaignRoundedIcon /> },
  { label: "Contacts", to: () => "/admin/contacts", match: (p) => p === "/admin/contacts", icon: <ContactPhoneRoundedIcon /> },
];

/** Routes that aren't nav destinations but still need a header title. */
const extraTitles: [RegExp, string][] = [[/^\/settings\/profile$/, "My Profile"]];

export function navFor(isAdmin: boolean) {
  return isAdmin ? adminNav : residentNav;
}

export function titleFor(path: string, isAdmin: boolean): string {
  const item = navFor(isAdmin).find((i) => i.match(path));
  if (item) return item.title ?? item.label;
  return extraTitles.find(([re]) => re.test(path))?.[1] ?? "";
}

/** Dashboards are roots: no back button there. */
export const isRootPath = (path: string) => path === "/" || path === "/dashboard" || path === "/admin";
