import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      // After login the user object is set — redirect based on role
      // We read the freshly-set user from the navigate callback below.
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      setLoading(false);
      return;
    }

    // Redirect: honour the "from" state set by ProtectedRoute, or default by role
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

    // Re-read user from localStorage since state update is async
    const raw = localStorage.getItem("auth_user");
    const freshUser = raw ? JSON.parse(raw) : null;
    const role = freshUser?.role;

    const destination =
      from ??
      (role === "ADMIN"
        ? "/admin"
        : role === "CLAIM_OFFICER"
          ? "/officer/claims"
          : "/");

    navigate(destination, { replace: true });
    setLoading(false);
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-6 py-10">
        <div>
          {/* InsureAI Branding */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <img
                src="/images/logo/insureai-logo-icon.png"
                alt="InsureAI"
                className="h-16 w-16 rounded-2xl object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              InsureAI
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Smart insurance. Simpler claims.
            </p>
          </div>

          {/* Welcome */}
          <div className="mb-6">
            <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
              Welcome back
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in to manage your policies and claims.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Email */}
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>

              {/* Sign In Button */}
              <Button className="w-full" size="sm" disabled={loading}>
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </div>
          </form>

          {/* Sign Up */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Create an account
              </Link>
            </p>
          </div>

          {/* Security Notice */}
          <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center dark:border-gray-800 dark:bg-white/5">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your information is protected with secure authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
