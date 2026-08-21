import { Link } from "react-router";

export default function ClaimsOverview() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Recent Claim
          </p>

          <h2 className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
            Vehicle Damage
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Toyota Corolla
          </p>
        </div>

        <span className="w-fit rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400">
          Under Review
        </span>
      </div>

      {/* Claim Information */}
      <div className="grid grid-cols-1 gap-5 border-t border-gray-100 pt-5 dark:border-gray-800 sm:grid-cols-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Claim Number
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            CLM-2026-00142
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Submitted
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            18 August 2026
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Policy
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            INS-MTR-2026-00124
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
              Preliminary assessment based on submitted evidence.
            </p>
          </div>

          <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-600 shadow-sm dark:bg-white/10 dark:text-blue-400">
            91% confidence
          </span>
        </div>

        {/* AI Metrics */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-white/70 p-4 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Damage Severity
            </p>

            <p className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
              78%
            </p>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: "78%" }}
              />
            </div>
          </div>

          <div className="rounded-lg bg-white/70 p-4 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Estimated Repair Cost
            </p>

            <p className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
              ₹2,450 – ₹3,100
            </p>

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Preliminary estimate
            </p>
          </div>
        </div>

        <div className="mt-4 border-t border-blue-100 pt-4 dark:border-blue-500/10">
          <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
            AI assessment is preliminary. The Claims Officer reviews the
            evidence and AI assessment before making the final decision.
          </p>
        </div>
      </div>

      {/* Action */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/claims/CLM-2026-00142"
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