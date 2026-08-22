import { Link } from "react-router";
import { useClaims } from "../../context/ClaimsContext";
import type { Claim } from "../../lib/api";

function statusStyle(status: Claim["status"]): string {
  switch (status) {
    case "Approved":
      return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400";
    case "Rejected":
      return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
    case "Evidence Requested":
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
    default:
      return "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400";
  }
}

export default function ClaimsOverview() {
  const { claims, loading } = useClaims();

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm text-gray-400 dark:text-gray-500">Loading claims…</p>
      </div>
    );
  }

  if (claims.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Recent Claim</p>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          No claims submitted yet.{" "}
          <Link to="/claims/submit" className="text-blue-600 hover:underline dark:text-blue-400">
            Submit your first claim
          </Link>
        </p>
      </div>
    );
  }

  // Show the most recent claim
  const claim = claims[0];
  const ai = claim.ai_analysis;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Recent Claim</p>
          <h2 className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
            {claim.claim_type}
          </h2>
          {claim.policy?.vehicle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {claim.policy.vehicle.make} {claim.policy.vehicle.model}
            </p>
          )}
        </div>
        <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(claim.status)}`}>
          {claim.status}
        </span>
      </div>

      {/* Claim Information */}
      <div className="grid grid-cols-1 gap-5 border-t border-gray-100 pt-5 dark:border-gray-800 sm:grid-cols-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Claim Number</p>
          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            {claim.claim_number}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Submitted</p>
          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            {formatDate(claim.claim_date)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Policy</p>
          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            {claim.policy?.policy_number ?? `#${claim.policy_id}`}
          </p>
        </div>
      </div>

      {/* AI Assessment */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                AI
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                AI Damage Assessment
              </p>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {ai ? "Assessment based on submitted evidence." : "Awaiting image upload for AI assessment."}
            </p>
          </div>
          {ai && (
            <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-600 shadow-sm dark:bg-white/10 dark:text-blue-400">
              {Math.round((ai.confidence_score ?? 0) * 100)}% confidence
            </span>
          )}
        </div>

        {ai ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-white/70 p-4 dark:bg-white/[0.03]">
              <p className="text-xs text-gray-500 dark:text-gray-400">Damage Severity</p>
              <p className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                {ai.damage_severity ?? "—"}
              </p>
              {ai.confidence_score != null && (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${Math.round(ai.confidence_score * 100)}%` }}
                  />
                </div>
              )}
            </div>
            <div className="rounded-lg bg-white/70 p-4 dark:bg-white/[0.03]">
              <p className="text-xs text-gray-500 dark:text-gray-400">Estimated Repair Cost</p>
              <p className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                {ai.estimated_repair_cost != null
                  ? `₹${ai.estimated_repair_cost.toLocaleString("en-IN")}`
                  : "—"}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">AI estimate</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-xs text-blue-600 dark:text-blue-400">
            Upload damage images to trigger the AI analysis.
          </p>
        )}

        <div className="mt-4 border-t border-blue-100 pt-4 dark:border-blue-500/10">
          <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
            AI assessment is preliminary. The Claims Officer reviews the evidence before making
            the final decision.
          </p>
        </div>
      </div>

      {/* Action */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to={`/claims/${claim.claim_id}`}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          View Claim
        </Link>
        <Link
          to="/claims"
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          All Claims
        </Link>
      </div>
    </div>
  );
}
