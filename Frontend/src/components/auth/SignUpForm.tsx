import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api";

export default function SignUpForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("Please accept the Terms & Conditions to continue.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password,
      });
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
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

          {/* Heading */}
          <div className="mb-6">
            <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
              Create your account
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Get started with smarter insurance management.
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
              {/* Name */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>
                    First name <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>
                    Last name <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

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

              {/* Phone */}
              <div>
                <Label>
                  Phone <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                    placeholder="Create a password"
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
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Use at least 8 characters with a mix of letters and numbers.
                </p>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <label htmlFor="terms" className="text-sm text-gray-500 dark:text-gray-400">
                  I agree to the{" "}
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Terms & Conditions
                  </span>{" "}
                  and{" "}
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    Privacy Policy
                  </span>
                  .
                </label>
              </div>

              {/* Create Account */}
              <Button className="w-full" size="sm" disabled={loading}>
                {loading ? "Creating account…" : "Create Account"}
              </Button>
            </div>
          </form>

          {/* Sign In */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                to="/signin"
                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Sign In
              </Link>
            </p>
          </div>

          {/* Security Notice */}
          <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center dark:border-gray-800 dark:bg-white/5">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your personal information is protected with secure authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
