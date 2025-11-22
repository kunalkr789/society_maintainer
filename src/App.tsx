import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "@/components/AppShell";

import Login from "@/pages/auth/Login";
import ForcePasswordChange from "@/pages/auth/ForcePasswordChange";

import AdminDashboard from "@/pages/admin/Dashboard";
import VerifyPayments from "@/pages/admin/VerifyPayments";
import AdminDuesHistory from "@/pages/admin/DuesHistory";
import Finance from "@/pages/admin/Finance";
import AddNotice from "@/pages/admin/AddNotice";

import ResidentDashboard from "@/pages/resident/Dashboard";
import Dues from "@/pages/resident/Dues";
import DuesHistory from "@/pages/resident/DuesHistory";
import Notices from "@/pages/resident/Notices";
import MarkPaid from "@/pages/resident/MarkPaid";
import Profile from "@/pages/settings/Profile";

import {
  RequireAuth,
  RequireAdmin,
  RequireResident,
  RoleRedirect,
} from "@/auth/guards";
import CreateMonth from "./pages/admin/CreateMonth";
import Contacts from "./pages/resident/Contacts";
import Ledger from "./pages/admin/Ledger";
import ResidentLedger from "./pages/resident/Ledger";

export default function App() {
  return (
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
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
