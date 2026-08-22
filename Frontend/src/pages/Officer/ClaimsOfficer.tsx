import { Link } from "react-router";
import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { officerApi, type Claim } from "../../lib/api";

function statusStyle(status: Claim["status"]): string {
  switch (status) {
    case "Approved": return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400";
    case "Rejected": return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
    case "Evidence Requested": return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
    case "Under Review": return "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400";
    default: return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
  }
}

export default function ClaimsOfficer() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    officerApi
      .getClaims()
      .then(setClaims)
      .catch((err) => setError(err.message ?? "Failed to load claims."))
      .finally(() => setLoading(false));
  }, []);

  const totalClaims = claims.length;
  const pendingClaims = claims.filter((c) => c.status === "Pending" || c.status === "Under Review").length;
  const approvedClaims = claims.filter((c) => c.status === "Approved").length;
  const rejectedClaims = claims.filter((c) => c.status === "Rejected").length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <PageMeta
        title="InsureAI | Claims Officer"
        description="Review insurance claims and AI damage assessments."
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">Claims Management</p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
            Claims Officer
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Review submitted claims, AI assessments and make final claim decisions.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Claims</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{totalClaims}</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/5">
            <p className="text-sm text-gray-600 dark:text-gray-400">Awaiting Review</p>
            <p className="mt-2 text-2xl font-semibold text-blue-700 dark:text-blue-400">{pendingClaims}</p>
          </div>
          <div className="rounded-2xl border border-green-100 bg-green-50 p-5 shadow-sm dark:border-green-500/20 dark:bg-green-500/5">
            <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
            <p className="mt-2 text-2xl font-semibold text-green-700 dark:text-green-400">{approvedClaims}</p>
          </div>
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm dark:border-red-500/20 dark:bg-red-500/5">
            <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
            <p className="mt-2 text-2xl font-semibold text-red-700 dark:text-red-400">{rejectedClaims}</p>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && <p className="text-sm text-gray-400">Loading assigned claims…</p>}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Claims Queue */}
        {!loading && !error && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-100 p-6 dark:border-gray-800">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Claims Assigned to You
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Review the AI assessment before making the final decision.
              </p>
            </div>

            {claims.length === 0 ? (
              <div className="p-6 text-sm text-gray-400">
                No claims assigned to you yet. Ask your admin to assign claims.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {claims.map((claim) => (
                  <div key={claim.claim_id} className="p-6">
                    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {claim.claim_number}
                          </h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(claim.status)}`}>
                            {claim.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          {claim.claim_type}
                          {claim.policy?.vehicle
                            ? ` · ${claim.policy.vehicle.make} ${claim.policy.vehicle.model}`
                            : ""}
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          Submitted {formatDate(claim.claim_date)}
                        </p>
                      </div>
                      <Link
                        to={`/officer/claims/${claim.claim_id}`}
                        className="w-fit rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                      >
                        Review Claim
                      </Link>
                    </div>

                    {/* Claim Data */}
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Policy</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {claim.policy?.policy_number ?? `#${claim.policy_id}`}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                        <p className="text-xs text-gray-500 dark:text-gray-400">AI Severity</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {claim.ai_analysis?.damage_severity ?? "Pending"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                        <p className="text-xs text-gray-500 dark:text-gray-400">AI Confidence</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {claim.ai_analysis?.confidence_score != null
                            ? `${Math.round(claim.ai_analysis.confidence_score * 100)}%`
                            : "—"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Estimated Repair</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {claim.ai_analysis?.estimated_repair_cost != null
                            ? `₹${claim.ai_analysis.estimated_repair_cost.toLocaleString("en-IN")}`
                            : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Status callout */}
                    {claim.status === "Evidence Requested" && (
                      <div className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-500/5 dark:text-amber-400">
                        Additional evidence has been requested from the customer.
                      </div>
                    )}
                    {claim.status === "Approved" && (
                      <div className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-500/5 dark:text-green-400">
                        This claim has been approved.
                      </div>
                    )}
                    {claim.status === "Rejected" && (
                      <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/5 dark:text-red-400">
                        This claim has been rejected.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">!</div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Officer decision required</h3>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                AI-generated assessments support the claims process. The Claims Officer makes the final decision.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
