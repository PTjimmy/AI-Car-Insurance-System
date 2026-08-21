import PageMeta from "../../components/common/PageMeta";
import { Link } from "react-router";
import { useClaims } from "../../context/ClaimsContext";

export default function Claims() {
  const { claims } = useClaims();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Pending":
        return "Pending Officer Review";

      case "Approved":
        return "Approved";

      case "Rejected":
        return "Rejected";

      case "Evidence Requested":
        return "More Evidence Required";

      default:
        return status;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400";

      case "Rejected":
        return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";

      case "Evidence Requested":
        return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

      case "Pending":
      default:
        return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
    }
  };

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
            <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">
              Claims
            </p>

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

        {/* Claims */}
        <div className="space-y-4">

          {claims.map((claim) => (
            <div
              key={claim.number}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >

              {/* Top */}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

                <div>
                  <div className="flex flex-wrap items-center gap-3">

                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {claim.number}
                    </h2>

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                        claim.status
                      )}`}
                    >
                      {getStatusLabel(claim.status)}
                    </span>

                  </div>

                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {claim.type} • Submitted {claim.submitted}
                  </p>
                </div>

                <Link
                  to={`/claims/${claim.number}`}
                  className="w-fit rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  View Claim
                </Link>

              </div>

              {/* Claim Information */}
              <div className="mt-6 grid grid-cols-1 gap-5 border-t border-gray-100 pt-6 dark:border-gray-800 sm:grid-cols-3">

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Policy
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {claim.policy}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    AI Damage Severity
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {claim.severity}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Estimated Repair Cost
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    ₹{claim.repairCost.toLocaleString("en-IN")}
                  </p>
                </div>

              </div>

              {/* AI Assessment */}
              <div className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                    AI
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      AI Assessment
                    </p>

                    <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                      {claim.aiFindings}
                    </p>

                  </div>

                </div>

              </div>

              {/* Claim Status Message */}
              <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">

                {claim.status === "Pending" && (
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Your claim has been submitted and is currently awaiting
                    review by a Claims Officer.
                  </p>
                )}

                {claim.status === "Approved" && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Your claim has been approved by the Claims Officer.
                  </p>
                )}

                {claim.status === "Rejected" && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Your claim has been rejected following officer review.
                  </p>
                )}

                {claim.status === "Evidence Requested" && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    The Claims Officer has requested additional evidence for
                    this claim.
                  </p>
                )}

              </div>

            </div>
          ))}

        </div>

        {/* Information Card */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/5">

          <div className="flex gap-3">

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              i
            </div>

            <div>

              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                How claim assessment works
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                InsureAI analyses your uploaded evidence to estimate damage
                severity and repair costs. The AI assessment supports the
                Claims Officer, who makes the final claim decision.
              </p>

            </div>

          </div>

        </div>

      </div>
    </>
  );
}