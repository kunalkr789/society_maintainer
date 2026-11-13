import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import AppShell from "@/components/AppShell";
import {
  RequireAuth,
  RequireAdmin,
  RequireResident,
  RoleRedirect,
} from "@/auth/guards";

// Each page is its own chunk, so residents never download admin-only screens (or the PDF libraries)
const Login = lazy(() => import("@/pages/auth/Login"));
const ForcePasswordChange = lazy(() => import("@/pages/auth/ForcePasswordChange"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const VerifyPayments = lazy(() => import("@/pages/admin/VerifyPayments"));
const AdminDuesHistory = lazy(() => import("@/pages/admin/DuesHistory"));
const Finance = lazy(() => import("@/pages/admin/Finance"));
const AddNotice = lazy(() => import("@/pages/admin/AddNotice"));
const ResidentDashboard = lazy(() => import("@/pages/resident/Dashboard"));
const Dues = lazy(() => import("@/pages/resident/Dues"));
const DuesHistory = lazy(() => import("@/pages/resident/DuesHistory"));
const Notices = lazy(() => import("@/pages/resident/Notices"));
const MarkPaid = lazy(() => import("@/pages/resident/MarkPaid"));
const Profile = lazy(() => import("@/pages/settings/Profile"));
const CreateMonth = lazy(() => import("@/pages/admin/CreateMonth"));
const Contacts = lazy(() => import("@/pages/resident/Contacts"));
const Ledger = lazy(() => import("@/pages/admin/Ledger"));
const ResidentLedger = lazy(() => import("@/pages/resident/Ledger"));
const Helpdesk = lazy(() => import("@/pages/resident/Helpdesk"));
const AdminHelpdesk = lazy(() => import("@/pages/admin/Helpdesk"));

const PageFallback = () => (
  <Box sx={{ display: "grid", placeItems: "center", py: 10 }} role="status" aria-label="Loading">
    <CircularProgress size={28} />
  </Box>
);

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/first-login" element={<ForcePasswordChange />} />

      {/* Default: send signed-in user to their home based on role */}
      <Route element={<RequireAuth />}>
        <Route index element={<RoleRedirect />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          {/* shared routes for both roles */}
          <Route path="/settings/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Resident area */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireResident />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<ResidentDashboard />} />
            <Route path="/dues" element={<Dues />} />
            <Route path="/dues/history" element={<DuesHistory />} />
            <Route path="/dues/:monthId/mark-paid" element={<MarkPaid />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/settings/profile" element={<Profile />} />
            <Route path="/ledger" element={<ResidentLedger />} />
            <Route path="/helpdesk" element={<Helpdesk />} />
          </Route>
        </Route>
      </Route>

      {/* Admin area */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireAdmin />}>
          <Route element={<AppShell />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route
              path="/admin/dues/:monthId/verify"
              element={<VerifyPayments />}
            />
            <Route path="/admin/dues/create" element={<CreateMonth />} />
            <Route path="/admin/dues/history" element={<AdminDuesHistory />} />
            <Route path="/admin/finance" element={<Finance />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/admin/notices/add" element={<AddNotice />} />
            <Route path="/settings/profile" element={<Profile />} />
            <Route path="/admin/ledger" element={<Ledger />} />
            <Route path="/admin/helpdesk" element={<AdminHelpdesk />} />
            <Route path="/admin/contacts" element={<Contacts editable />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
