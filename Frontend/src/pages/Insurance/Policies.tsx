import PageMeta from "../../components/common/PageMeta";
import { Link } from "react-router";

export default function Policies() {
  return (
    <>
      <PageMeta
        title="InsureAI | My Policies"
        description="View and manage your insurance policies."
      />

      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">
            My Insurance
          </p>

          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
            My Policies
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            View your active insurance policies and coverage details.
          </p>
        </div>

        {/* Active Policy */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                Active Policy
              </p>

              <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                Comprehensive Motor Insurance
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Policy No. INS-MTR-2026-00124
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
              Active
            </span>
          </div>

          {/* Policy Information */}
          <div className="mt-6 grid grid-cols-1 gap-5 border-t border-gray-100 pt-6 dark:border-gray-800 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Coverage
              </p>

              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                ₹10,00,000
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Premium
              </p>

              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                ₹24,500
                <span className="text-sm font-normal text-gray-500">
                  {" "}
                  / year
                </span>
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Renewal Date
              </p>

              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                21 August 2027
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-100 pt-6 dark:border-gray-800">
            <Link
              to="/policy-details"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              View Details
            </Link>

            <Link
              to="/documents"
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              View Documents
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}