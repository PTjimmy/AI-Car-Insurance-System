import { BrowserRouter as Router, Routes, Route } from "react-router";

import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import VerifyEmail from "./pages/AuthPages/VerifyEmail";
import VerifyLogin from "./pages/AuthPages/VerifyLogin";
import NotFound from "./pages/OtherPage/NotFound";

import UserProfiles from "./pages/UserProfiles";
import Settings from "./pages/Settings";

import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import Home from "./pages/Dashboard/Home";

import Policies from "./pages/Insurance/Policies";
import Vehicles from "./pages/Insurance/Vehicles";
import BuyPolicy from "./pages/Insurance/BuyPolicy";
import Documents from "./pages/Insurance/Documents";
import Claims from "./pages/Insurance/Claims";
import SubmitClaim from "./pages/Insurance/SubmitClaim";
import PolicyDetails from "./pages/Insurance/PolicyDetails";
import ClaimDetails from "./pages/Insurance/ClaimDetails";

import ClaimsOfficer from "./pages/Officer/ClaimsOfficer";
import ClaimReview from "./pages/Officer/ClaimReview";

import AdminDashboard from "./pages/Admin/AdminDashboard";
import UserManagement from "./pages/Admin/UserManagement";

import { AuthProvider } from "./context/AuthContext";
import { ClaimsProvider } from "./context/ClaimsContext";

export default function App() {
  return (
    <AuthProvider>
      <ClaimsProvider>
        <Router>
          <ScrollToTop />

          <Routes>
            {/* ============================================================
                Protected application routes — all require authentication
            ============================================================ */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* ----- Customer dashboard ----- */}
              <Route
                path="/"
                element={
                  <ProtectedRoute roles={["CUSTOMER"]}>
                    <Home />
                  </ProtectedRoute>
                }
              />

              {/* ----- Customer: Insurance ----- */}
              <Route
                path="/policies"
                element={
                  <ProtectedRoute roles={["CUSTOMER"]}>
                    <Policies />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vehicles"
                element={
                  <ProtectedRoute roles={["CUSTOMER"]}>
                    <Vehicles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/policies/buy"
                element={
                  <ProtectedRoute roles={["CUSTOMER"]}>
                    <BuyPolicy />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents"
                element={
                  <ProtectedRoute roles={["CUSTOMER"]}>
                    <Documents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/claims"
                element={
                  <ProtectedRoute roles={["CUSTOMER"]}>
                    <Claims />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/claims/submit"
                element={
                  <ProtectedRoute roles={["CUSTOMER"]}>
                    <SubmitClaim />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/claims/:claimNumber"
                element={
                  <ProtectedRoute roles={["CUSTOMER"]}>
                    <ClaimDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/policy-details"
                element={
                  <ProtectedRoute roles={["CUSTOMER"]}>
                    <PolicyDetails />
                  </ProtectedRoute>
                }
              />

              {/* ----- Claims Officer ----- */}
              <Route
                path="/officer/claims"
                element={
                  <ProtectedRoute roles={["CLAIM_OFFICER", "ADMIN"]}>
                    <ClaimsOfficer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/officer/claims/:claimNumber"
                element={
                  <ProtectedRoute roles={["CLAIM_OFFICER", "ADMIN"]}>
                    <ClaimReview />
                  </ProtectedRoute>
                }
              />

              {/* ----- Admin ----- */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={["ADMIN"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute roles={["ADMIN"]}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />

              {/* ----- Shared: Profile / Settings ----- */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfiles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* ============================================================
                Public auth routes
            ============================================================ */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/verify-login" element={<VerifyLogin />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ClaimsProvider>
    </AuthProvider>
  );
}
