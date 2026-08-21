import { BrowserRouter as Router, Routes, Route } from "react-router";

import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";

import UserProfiles from "./pages/UserProfiles";
import Settings from "./pages/Settings";

import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";

import Home from "./pages/Dashboard/Home";

import Policies from "./pages/Insurance/Policies";
import Documents from "./pages/Insurance/Documents";
import Claims from "./pages/Insurance/Claims";
import SubmitClaim from "./pages/Insurance/SubmitClaim";
import PolicyDetails from "./pages/Insurance/PolicyDetails";
import ClaimDetails from "./pages/Insurance/ClaimDetails";

import ClaimsOfficer from "./pages/Officer/ClaimsOfficer";
import ClaimReview from "./pages/Officer/ClaimReview";

import AdminDashboard from "./pages/Admin/AdminDashboard";

import { ClaimsProvider } from "./context/ClaimsContext";

export default function App() {
  return (
    <ClaimsProvider>
      <Router>
        <ScrollToTop />

        <Routes>
          {/* InsureAI Application */}
          <Route element={<AppLayout />}>

            {/* Dashboard */}
            <Route path="/" element={<Home />} />

            {/* Insurance */}
            <Route path="/policies" element={<Policies />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/claims" element={<Claims />} />
            <Route
              path="/claims/submit"
              element={<SubmitClaim />}
            />
            <Route
              path="/claims/:claimNumber"
              element={<ClaimDetails />}
            />
            <Route
              path="/policy-details"
              element={<PolicyDetails />}
            />

            {/* Claims Officer */}
            <Route
              path="/officer/claims"
              element={<ClaimsOfficer />}
            />

            <Route
              path="/officer/claims/:claimNumber"
              element={<ClaimReview />}
            />

            {/* Admin */}
            <Route
              path="/admin"
              element={<AdminDashboard />}
            />

            {/* User */}
            <Route
              path="/profile"
              element={<UserProfiles />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />
          </Route>

          {/* Authentication */}
          <Route
            path="/signin"
            element={<SignIn />}
          />

          <Route
            path="/signup"
            element={<SignUp />}
          />

          {/* 404 */}
          <Route
            path="*"
            element={<NotFound />}
          />
        </Routes>
      </Router>
    </ClaimsProvider>
  );
}