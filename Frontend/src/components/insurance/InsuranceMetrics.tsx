import { Link } from "react-router";

export default function InsuranceMetrics() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {/* Active Policies */}
      <Link
        to="/policies"
        className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-blue-500/30"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Active Policies
        </p>

        <h3 className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          1
        </h3>

        <p className="mt-1 text-sm text-green-600 dark:text-green-400">
          Policy active
        </p>

        <p className="mt-4 text-xs font-medium text-blue-600 opacity-0 transition group-hover:opacity-100 dark:text-blue-400">
          View policies →
        </p>
      </Link>

      {/* Active Claims */}
      <Link
        to="/claims"
        className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-blue-500/30"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Active Claims
        </p>

        <h3 className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          1
        </h3>

        <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
          1 claim under review
        </p>

        <p className="mt-4 text-xs font-medium text-blue-600 opacity-0 transition group-hover:opacity-100 dark:text-blue-400">
          View claims →
        </p>
      </Link>

      {/* Next Payment */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Next Payment
        </p>

        <h3 className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          ₹12,500
        </h3>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Due 15 September 2026
        </p>

        <p className="mt-4 text-xs font-medium text-gray-400">
          Annual premium payment
        </p>
      </div>
    </div>
  );
}