import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { customerApi, type Claim, type Policy, ApiError } from "../../lib/api";
import { useClaims } from "../../context/ClaimsContext";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Claim types that represent damage to the customer's own vehicle.
// This is used only to show a client-side warning note.
// The authoritative coverage check is performed by the backend
// (customer.py _policy_covers_own_vehicle) using the policy_type DB row.
const OWN_DAMAGE_TYPES = new Set([
  "Vehicle Damage",
  "Own Vehicle Damage",
  "Accident",
  "Natural Disaster",
  "Flood",
  "Fire",
]);

function policyExpiryWarning(policy: Policy): string | null {
  if (!policy.end_date) return null;
  const daysLeft = Math.ceil(
    (new Date(policy.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (daysLeft < 0) return "This policy has expired and cannot be used for new claims.";
  if (daysLeft <= 30) return `This policy expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Renew soon.`;
  return null;
}

export default function SubmitClaim() {
  const navigate = useNavigate();
  const { refresh } = useClaims();

  // Form state
  const [policyId, setPolicyId] = useState<number | "">("");
  const [claimType, setClaimType] = useState("Vehicle Damage");
  const [incidentDate, setIncidentDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [claimedAmount, setClaimedAmount] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  // Data
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);

  // UI
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedClaim, setSubmittedClaim] = useState<Claim | null>(null);

  useEffect(() => {
    customerApi
      .getPolicies()
      .then((all) => setPolicies(all.filter((p) => p.status === "active")))
      .catch(() => setPolicies([]))
      .finally(() => setLoadingPolicies(false));
  }, []);

  // ---- Derived: selected policy object ----
  const selectedPolicy = policies.find((p) => p.policy_id === policyId) ?? null;
  const coverageLimit = selectedPolicy?.policy_type?.coverage_limit ?? null;
  const policyName = selectedPolicy?.policy_type?.policy_name ?? "";

  // ---- Client-side business rule checks ----
  const coverageLimitWarning: string | null = (() => {
    if (!coverageLimit || !claimedAmount) return null;
    if (parseFloat(claimedAmount) > coverageLimit) {
      return `Customer claimed amount exceeds the policy coverage limit of ₹${Number(coverageLimit).toLocaleString("en-IN")}. Please reduce the amount or select a higher-tier policy.`;
    }
    return null;
  })();

  // DB-driven own-vehicle coverage check:
  // A policy covers own-vehicle damage when at least one per-severity
  // coverage percentage is present and > 0. This mirrors the backend logic
  // in customer.py _policy_covers_own_vehicle().
  const policyCoversOwnVehicle: boolean = (() => {
    if (!selectedPolicy?.policy_type) return true; // assume covered if unknown
    const pt = selectedPolicy.policy_type;
    return [pt.minor_coverage_pct, pt.moderate_coverage_pct, pt.severe_coverage_pct]
      .some((pct) => pct != null && pct > 0);
  })();

  const notCoveredWarning: string | null = (() => {
    if (!selectedPolicy) return null;
    if (!policyCoversOwnVehicle && OWN_DAMAGE_TYPES.has(claimType)) {
      return `Not Covered Under Selected Policy — "${selectedPolicy.policy_type?.policy_name}" does not cover own-vehicle damage. Please select a policy with own-vehicle damage coverage.`;
    }
    return null;
  })();

  const expiryWarning = selectedPolicy ? policyExpiryWarning(selectedPolicy) : null;
  const hasBlockingError = !!notCoveredWarning || !!coverageLimitWarning || !!expiryWarning?.startsWith("This policy has expired");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []).filter((f) => f.size <= MAX_FILE_SIZE);
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const formatFileSize = (bytes: number) =>
    bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (policyId === "" || hasBlockingError) return;
    if (files.length === 0) {
      setError("Please upload at least one damage image for AI analysis.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      // 1. Create claim
      const claim = await customerApi.submitClaim({
        policy_id: Number(policyId),
        accident_date: incidentDate,
        claim_type: claimType,
        location: location || undefined,
        description,
        claimed_amount: parseFloat(claimedAmount) || 0,
      });

      // 2. Upload images (first triggers AI inference)
      for (const file of files) {
        await customerApi.uploadImage(claim.claim_id, file);
      }

      await refresh();
      setSubmittedClaim(claim);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Success screen ----
  if (submittedClaim) {
    return (
      <>
        <PageMeta title="InsureAI | Claim Submitted" description="Your claim has been submitted." />
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm dark:border-green-500/20 dark:bg-gray-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600 dark:bg-green-500/10 dark:text-green-400">
              ✓
            </div>
            <h1 className="mt-5 text-2xl font-semibold text-gray-900 dark:text-white">
              Claim Submitted Successfully
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Your claim has been submitted. The AI model has analysed your damage images.
              A Claims Officer will review the assessment and make the final decision.
            </p>
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left dark:bg-white/[0.03]">
              <p className="text-xs text-gray-500 dark:text-gray-400">Claim Number</p>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">{submittedClaim.claim_number}</p>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">Status</p>
              <p className="mt-1 font-semibold text-blue-600 dark:text-blue-400">
                Submitted — Awaiting Officer Assignment
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/claims" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700">
                View My Claims
              </Link>
              <Link to="/" className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="InsureAI | Submit Claim" description="Submit a new insurance claim." />
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link to="/claims" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
            ← Back to My Claims
          </Link>
          <div className="mt-4">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Claims</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
              Submit a Claim
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Provide the incident details and damage images for AI analysis.
            </p>
          </div>
        </div>

        {/* No policies state */}
        {!loadingPolicies && policies.length === 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-500/20 dark:bg-amber-500/5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">No Active Policies</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              You need an active insurance policy before submitting a claim.
            </p>
            <div className="mt-4 flex gap-3">
              <Link to="/vehicles" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700">
                Register Vehicle
              </Link>
              <Link to="/policies/buy" className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
                Buy a Policy
              </Link>
            </div>
          </div>
        )}

        {/* AI info banner */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white">AI</div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">What happens after submission?</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                Your uploaded damage images are analysed by the ViT-B/16 AI model to estimate
                damage severity (Minor / Moderate / Severe) and repair cost. A Claims Officer
                reviews the AI assessment and makes the final decision.
              </p>
            </div>
          </div>
        </div>

        {/* API error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1 — Claim Information */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Claim Information</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select the policy and describe the incident.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Policy selector */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Insurance Policy <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={policyId}
                  onChange={(e) => {
                    setPolicyId(e.target.value === "" ? "" : Number(e.target.value));
                    setError(null);
                  }}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">
                    {loadingPolicies ? "Loading policies…" : "Select an active policy"}
                  </option>
                  {policies.map((p) => (
                    <option key={p.policy_id} value={p.policy_id}>
                      {p.policy_number} — {p.policy_type?.policy_name ?? "Motor Insurance"}
                      {p.vehicle ? ` (${p.vehicle.make} ${p.vehicle.model} · ${p.vehicle.registration_number})` : ""}
                    </option>
                  ))}
                </select>

                {/* Policy context info */}
                {selectedPolicy && (
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Coverage Limit: <strong className="text-gray-700 dark:text-gray-300">₹{Number(coverageLimit).toLocaleString("en-IN")}</strong></span>
                    <span>Expires: <strong className="text-gray-700 dark:text-gray-300">{new Date(selectedPolicy.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong></span>
                  </div>
                )}

                {/* Expiry warning */}
                {expiryWarning && (
                  <p className={`mt-2 text-xs ${expiryWarning.startsWith("This policy has expired") ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                    ⚠ {expiryWarning}
                  </p>
                )}
              </div>

              {/* Claim Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Claim Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={claimType}
                  onChange={(e) => { setClaimType(e.target.value); setError(null); }}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="Vehicle Damage">Vehicle Damage</option>
                  <option value="Own Vehicle Damage">Own Vehicle Damage</option>
                  <option value="Accident">Accident</option>
                  <option value="Third Party Damage">Third Party Damage</option>
                  <option value="Theft">Theft</option>
                  <option value="Fire">Fire</option>
                  <option value="Flood">Flood</option>
                  <option value="Natural Disaster">Natural Disaster</option>
                  <option value="Glass Damage">Glass Damage</option>
                  <option value="Engine Damage">Engine Damage</option>
                  <option value="Roadside Assistance">Roadside Assistance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Incident Date */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Incident Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* Location */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Incident Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vadodara, Gujarat"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* Claimed Amount */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Customer Claimed Amount (₹) <span className="text-red-500">*</span>
                  {coverageLimit && (
                    <span className="ml-2 font-normal text-gray-400">
                      max ₹{Number(coverageLimit).toLocaleString("en-IN")}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={coverageLimit ?? undefined}
                  step="0.01"
                  placeholder="0.00"
                  value={claimedAmount}
                  onChange={(e) => { setClaimedAmount(e.target.value); setError(null); }}
                  className={`h-11 w-full rounded-lg border px-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-blue-500 dark:bg-gray-900 dark:text-white ${
                    coverageLimitWarning
                      ? "border-red-400 dark:border-red-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                />
              </div>
            </div>

            {/* Business rule warnings */}
            {notCoveredWarning && (
              <div className="mt-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/5">
                <span className="shrink-0 text-lg">🚫</span>
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Not Covered Under Selected Policy</p>
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{notCoveredWarning}</p>
                  <Link to="/policies/buy" className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                    Upgrade your policy →
                  </Link>
                </div>
              </div>
            )}

            {coverageLimitWarning && !notCoveredWarning && (
              <div className="mt-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/5">
                <span className="shrink-0 text-lg">⚠️</span>
                <p className="text-sm text-red-700 dark:text-red-400">{coverageLimitWarning}</p>
              </div>
            )}
          </div>

          {/* Section 2 — Description */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Incident Description <span className="text-red-500">*</span>
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Describe what happened and the damage observed.
            </p>
            <textarea
              required
              rows={5}
              placeholder="Describe the incident, visible damage, and any relevant details…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-5 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          {/* Section 3 — Image Upload */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Upload Damage Images <span className="text-red-500">*</span>
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Upload clear photographs of the damaged vehicle. The AI model analyses each image
              to classify damage severity.
            </p>

            <div className="mt-5 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                ↑
              </div>
              <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                Upload damage photos
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                PNG or JPG files up to 10 MB each
              </p>
              <label className="mt-4 inline-flex cursor-pointer rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
                Choose Files
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Selected Images
                  </h3>
                  <span className="text-xs text-gray-500">{files.length} file{files.length !== 1 ? "s" : ""}</span>
                </div>
                {files.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                        IMG
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {files.length === 0 && (
              <p className="mt-4 text-center text-xs text-amber-600 dark:text-amber-400">
                At least one damage image is required for AI analysis.
              </p>
            )}
          </div>

          {/* Section 4 — Declaration */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                I confirm that the information and evidence provided in this claim are accurate
                and complete to the best of my knowledge.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Link
              to="/claims"
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || files.length === 0 || policyId === "" || hasBlockingError}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting & running AI analysis…" : "Submit Claim for AI Assessment"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
