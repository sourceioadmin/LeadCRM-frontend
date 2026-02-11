import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./contexts/AuthContext";

// Import components (will be created later)
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import AcceptInvite from "./pages/AcceptInvite";
import ManageUsers from "./pages/ManageUsers";
import AddLead from "./pages/AddLead";
import MyLeads from "./pages/MyLeads";
import AllLeads from "./pages/AllLeads";
import AssignLeads from "./pages/AssignLeads";
import UpcomingFollowups from "./pages/UpcomingFollowups";
import Reports from "./pages/Reports";
import ConversionReport from "./pages/ConversionReport";
import WinLossReport from "./pages/WinLossReport";
import AdditionalReports from "./pages/AdditionalReports";
import Settings from "./pages/Settings";
import PrivateRoute from "./components/PrivateRoute";
import ImportLeads from "./pages/ImportLeads";
import ImportHistory from "./pages/ImportHistory";

// IMPORTANT: Set your actual Google OAuth Client ID in environment variable VITE_GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "dummy-client-id.apps.googleusercontent.com";

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="add-lead" element={<AddLead />} />
              <Route path="my-leads" element={<MyLeads />} />
              <Route path="all-leads" element={<AllLeads />} />
              <Route
                path="import-leads"
                element={
                  <PrivateRoute requiredRole="System Admin,Company Admin,Company Manager">
                    <ImportLeads />
                  </PrivateRoute>
                }
              />
              <Route
                path="import-history"
                element={
                  <PrivateRoute requiredRole="System Admin,Company Admin,Company Manager">
                    <ImportHistory />
                  </PrivateRoute>
                }
              />
              <Route path="assign-leads" element={<PrivateRoute requiredRole="Company Admin,Company Manager"><AssignLeads /></PrivateRoute>} />
              <Route path="followups" element={<UpcomingFollowups />} />
              <Route path="reports" element={<Reports />} />
              <Route path="reports/conversion" element={<ConversionReport />} />
              <Route path="reports/win-loss" element={<WinLossReport />} />
              <Route path="reports/additional" element={<AdditionalReports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="manage-users" element={<PrivateRoute requiredRole="Company Admin"><ManageUsers /></PrivateRoute>} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;


