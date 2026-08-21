import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { claims } from "../../data/claims";

export default function ClaimsOfficer() {
  const totalClaims = claims.length;

  const pendingClaims = claims.filter(
    (claim) => claim.status === "Pending"
  ).length;

  const approvedClaims = claims.filter(
    (claim) => claim.status === "Approved"
  ).length;

  const rejectedClaims = claims.filter(
    (claim) => claim.status === "Rejected"
  ).length;

  return (
    <>
      <PageMeta
        title="InsureAI | Claims Officer"
        description="Review insurance claims and AI damage assessments."
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">
            Claims Management
          </p>

          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
            Claims Officer
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Review submitted claims, AI assessments and make final claim
            decisions.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Claims */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Claims
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              {totalClaims}
            </p>
          </div>

          {/* Awaiting Review */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/5">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Awaiting Review
            </p>

            <p className="mt-2 text-2xl font-semibold text-blue-700 dark:text-blue-400">
              {pendingClaims}
            </p>
          </div>

          {/* Approved */}
          <div className="rounded-2xl border border-green-100 bg-green-50 p-5 shadow-sm dark:border-green-500/20 dark:bg-green-500/5">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Approved
            </p>

            <p className="mt-2 text-2xl font-semibold text-green-700 dark:text-green-400">
              {approvedClaims}
            </p>
          </div>

          {/* Rejected */}
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm dark:border-red-500/20 dark:bg-red-500/5">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Rejected
            </p>

            <p className="mt-2 text-2xl font-semibold text-red-700 dark:text-red-400">
              {rejectedClaims}
            </p>
          </div>
        </div>

        {/* Claims Queue */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 p-6 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Claims Requiring Review
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Review the AI assessment before making the final decision.
            </p>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {claims.map((claim) => (
              <div key={claim.number} className="p-6">
                {/* Claim Header */}
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {claim.number}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          claim.status === "Approved"
                            ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                            : claim.status === "Rejected"
                              ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                              : claim.status === "Evidence Requested"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                                : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                        }`}
                      >
                        {claim.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {claim.customer} • {claim.type}
                    </p>

                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      Submitted {claim.submitted}
                    </p>
                  </div>

                  {/* Review Button */}
                  <Link
                    to={`/officer/claims/${claim.number}`}
                    className="w-fit rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    Review Claim
                  </Link>
                </div>

                {/* Claim Data */}
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Policy
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {claim.policy}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      AI Severity
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {claim.severity}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      AI Confidence
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {claim.confidence}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Estimated Repair
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{claim.repairCost.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* AI Assessment */}
                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                      AI
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        AI Assessment
                      </p>

                      <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                        {claim.aiFindings}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Officer Actions */}
                {claim.status === "Pending" && (
                  <div className="mt-5 flex flex-wrap gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
                    <Link
                      to={`/officer/claims/${claim.number}`}
                      className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
                    >
                      Review & Decide
                    </Link>
                  </div>
                )}

                {claim.status === "Evidence Requested" && (
                  <div className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-500/5 dark:text-amber-400">
                    Additional evidence has been requested from the
                    policyholder.
                  </div>
                )}

                {claim.status === "Approved" && (
                  <div className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-500/5 dark:text-green-400">
                    This claim has already been approved.
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
        </div>

        {/* AI Disclaimer */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              !
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Officer decision required
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                AI-generated assessments are used to support the claims
                process. The Claims Officer remains responsible for the final
                approval or rejection decision.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}