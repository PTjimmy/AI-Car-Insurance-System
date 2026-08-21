import { Link } from "react-router";

export default function QuickActions() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="mb-5">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Quick Actions
        </p>

        <h2 className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
          Manage your insurance
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Quickly access the most important insurance actions.
        </p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* Submit Claim */}
        <Link
          to="/claims/submit"
          className="group rounded-xl bg-blue-600 p-4 text-white transition hover:bg-blue-700"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-lg">
            +
          </div>

          <p className="mt-4 text-sm font-semibold">
            Submit a Claim
          </p>

          <p className="mt-1 text-xs text-blue-100">
            Report an incident and upload evidence.
          </p>
        </Link>

        {/* My Claims */}
        <Link
          to="/claims"
          className="group rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/50 dark:border-gray-700 dark:bg-transparent dark:hover:border-blue-500/30 dark:hover:bg-blue-500/5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            ✓
          </div>

          <p className="mt-4 text-sm font-semibold text-gray-800 dark:text-white/90">
            My Claims
          </p>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Track your submitted claims.
          </p>
        </Link>

        {/* Policies */}
        <Link
          to="/policies"
          className="group rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/50 dark:border-gray-700 dark:bg-transparent dark:hover:border-blue-500/30 dark:hover:bg-blue-500/5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            ◈
          </div>

          <p className="mt-4 text-sm font-semibold text-gray-800 dark:text-white/90">
            My Policies
          </p>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            View your coverage and policy details.
          </p>
        </Link>

        {/* Documents */}
        <Link
          to="/documents"
          className="group rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/50 dark:border-gray-700 dark:bg-transparent dark:hover:border-blue-500/30 dark:hover:bg-blue-500/5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            □
          </div>

          <p className="mt-4 text-sm font-semibold text-gray-800 dark:text-white/90">
            Documents
          </p>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Access your insurance documents.
          </p>
        </Link>
      </div>
    </div>
  );
}