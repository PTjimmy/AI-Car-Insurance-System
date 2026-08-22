import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../lib/api";

interface Props {
  children: React.ReactNode;
  /** If provided, the user must have one of these roles. */
  roles?: UserRole[];
}

/**
 * Wraps any route that requires authentication.
 * - Unauthenticated → redirect to /signin, preserving the intended path.
 * - Wrong role → redirect to the role's default home.
 */
export default function ProtectedRoute({ children, roles }: Props) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Avoid a flash redirect while rehydrating from localStorage
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    // Redirect to the user's proper home
    const home =
      user.role === "ADMIN"
        ? "/admin"
        : user.role === "CLAIM_OFFICER"
          ? "/officer/claims"
          : "/";
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
