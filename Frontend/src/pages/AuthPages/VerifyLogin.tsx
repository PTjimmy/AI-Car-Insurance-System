import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { authApi, ApiError } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function VerifyLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();

  const email = searchParams.get("email") ?? "";

  const [codes, setCodes] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...codes];
    next[i] = digit;
    setCodes(next);
    setError(null);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
    if (digit && next.every((d) => d !== "")) handleVerify(next.join(""));
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codes[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCodes(pasted.split(""));
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (codeStr?: string) => {
    const code = codeStr ?? codes.join("");
    if (code.length !== 6) { setError("Please enter all 6 digits."); return; }
    setError(null);
    setVerifying(true);
    try {
      const token = await authApi.verifyLogin(email, code);
      loginWithToken(token);
      const dest =
        token.role === "ADMIN"
          ? "/admin"
          : token.role === "CLAIM_OFFICER"
            ? "/officer/claims"
            : "/";
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Verification failed.";
      setError(msg);
      setCodes(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResendMsg(null);
    setError(null);
    setResending(true);
    try {
      const res = await authApi.resendLoginCode(email);
      setResendMsg(res.message);
      setCountdown(120);
      setCodes(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <PageMeta title="InsureAI | Verify Login" description="Enter the login code sent to your email." />

      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="w-full max-w-md">

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">

            {/* Logo */}
            <div className="mb-8 text-center">
              <div className="mb-4 flex justify-center">
                <img
                  src="/images/logo/insureai-logo-icon.png"
                  alt="InsureAI"
                  className="h-14 w-14 rounded-2xl object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">InsureAI</h1>
            </div>

            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl dark:bg-blue-500/10">
                🔐
              </div>
            </div>

            {/* Heading */}
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Check your email
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                We sent a 6-digit login code to
              </p>
              <p className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
                {email || "your email address"}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                The code expires in 10 minutes.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Resend success */}
            {resendMsg && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center text-sm text-green-700 dark:border-green-500/20 dark:bg-green-500/5 dark:text-green-400">
                {resendMsg}
              </div>
            )}

            {/* 6-digit input */}
            <div className="mb-6 flex justify-center gap-3" onPaste={handlePaste}>
              {codes.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={verifying}
                  className={`h-14 w-12 rounded-xl border-2 text-center text-xl font-bold outline-none transition
                    ${digit
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300"
                      : "border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    }
                    focus:border-blue-500 dark:focus:border-blue-400
                    disabled:opacity-50`}
                />
              ))}
            </div>

            {/* Verify button */}
            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={verifying || codes.some((d) => !d)}
              className="mb-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifying ? "Verifying…" : "Verify & Sign In"}
            </button>

            {/* Resend */}
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Didn't receive the code?{" "}
                {countdown > 0 ? (
                  <span className="font-medium text-gray-400 dark:text-gray-500">
                    Resend in {countdown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 dark:text-blue-400"
                  >
                    {resending ? "Sending…" : "Resend code"}
                  </button>
                )}
              </p>
            </div>

            {/* Back to sign in */}
            <div className="mt-6 border-t border-gray-100 pt-5 text-center dark:border-gray-800">
              <Link
                to="/signin"
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                ← Back to Sign In
              </Link>
            </div>
          </div>

          {/* Dev hint */}
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-500/20 dark:bg-amber-500/5">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>Development mode:</strong> If email is not configured, the login code is
              printed in the backend server console.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
