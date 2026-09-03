import PageMeta from "../../components/common/PageMeta";
import { Link } from "react-router";
import { useClaims } from "../../context/ClaimsContext";
import type { Claim } from "../../lib/api";

function statusLabel(status: Claim["status"]): string {
  switch (status) {
    case "Pending": return "Pending Officer Review";
    case "Approved": return "Approved";
    case "Rejected": return "Rejected";
    case "Evidence Requested": return "More Evidence Required";
    case "Under Review": return "Under Review";
    default: return status;
  }
}

function statusStyle(status: Claim["status"]): string {
  switch (status) {
    case "Approved": return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400";
    case "Rejected": return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
    case "Evidence Requested": return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
    case "Under Review": return "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400";
    default: return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
  }
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default function Claims() {
  const { claims, loading, error } = useClaims();

  return (
    <>
      <PageMeta
        title="InsureAI | My Claims"
        description="Track your insurance claims and AI assessments."
      />

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">Claims</p>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
              My Claims
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Track your claims, AI assessments and claim decisions.
            </p>
          </div>
          <Link
            to="/claims/submit"
            className="inline-flex w-fit items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            + Submit New Claim
          </Link>
        </div>

        {/* Loading / Error */}
        {loading && (
          <p className="text-sm text-gray-400">Loading your claims…</p>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && claims.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No claims yet.{" "}
              <Link to="/claims/submit" className="text-blue-600 hover:underline dark:text-blue-400">
                Submit your first claim
              </Link>
            </p>
          </div>
        )}

        {/* Claims */}
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim.claim_id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              {/* Top */}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {claim.claim_number}
                    </h2>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(claim.status)}`}>
                      {statusLabel(claim.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {claim.claim_type} · Submitted {formatDate(claim.claim_date)}
                  </p>
                </div>
                <Link
                  to={`/claims/${claim.claim_id}`}
                  className="w-fit rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  View Claim
                </Link>
              </div>

              {/* Claim Information */}
              <div className="mt-6 grid grid-cols-1 gap-5 border-t border-gray-100 pt-6 dark:border-gray-800 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Policy</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {claim.policy?.policy_number ?? `#${claim.policy_id}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Damage Severity
                    <span className="ml-1 text-blue-500 dark:text-blue-400">(AI)</span>
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {claim.ai_analysis?.damage_severity ?? "Pending analysis"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Customer Claimed Amount
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    ₹{claim.claimed_amount.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* AI + Policy Calculation */}
              {claim.ai_analysis && (
                <div className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                      AI
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        AI Prediction · {Math.round((claim.ai_analysis.confidence_score ?? 0) * 100)}% confidence
                      </p>
                      <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                        Damage classified as{" "}
                        <strong>{claim.ai_analysis.damage_severity}</strong>.
                      </p>
                      {claim.ai_analysis.estimated_claim_amount != null && (
                        <div className="mt-3 rounded-lg border border-green-100 bg-green-50 px-3 py-2 dark:border-green-500/20 dark:bg-green-500/5">
                          <p className="text-xs font-medium text-green-700 dark:text-green-400">
                            Policy Calculation
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
                            Estimated Claim: ₹{claim.ai_analysis.estimated_claim_amount.toLocaleString("en-IN")}
                          </p>
                          {claim.ai_analysis.coverage_pct_applied != null && (
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                              {claim.ai_analysis.coverage_pct_applied}% of ₹{claim.claimed_amount.toLocaleString("en-IN")} − ₹{claim.ai_analysis.deductible_applied?.toLocaleString("en-IN")} deductible
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Status message */}
              <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">
                {claim.status === "Pending" && (
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Your claim has been submitted and is awaiting a Claims Officer.
                  </p>
                )}
                {claim.status === "Under Review" && (
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    Your claim is currently being reviewed by a Claims Officer.
                  </p>
                )}
                {claim.status === "Approved" && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Your claim has been approved.
                    {claim.approved_amount != null &&
                      ` Approved amount: ₹${claim.approved_amount.toLocaleString("en-IN")}.`}
                  </p>
                )}
                {claim.status === "Rejected" && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Your claim has been rejected.
                    {claim.decision_remarks && ` Reason: ${claim.decision_remarks}`}
                  </p>
                )}
                {claim.status === "Evidence Requested" && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    The Claims Officer has requested additional evidence for this claim.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
