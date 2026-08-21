import { Link } from "react-router";

export default function PolicyCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            My Insurance
          </p>

          <h2 className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
            Toyota Corolla
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comprehensive Motor Insurance
          </p>
        </div>

        <span className="w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
          Active
        </span>
      </div>

      {/* Policy Information */}
      <div className="grid grid-cols-1 gap-5 border-t border-gray-100 pt-5 dark:border-gray-800 sm:grid-cols-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Policy Number
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            INS-MTR-2026-00124
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Coverage
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            ₹10,00,000
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Renewal Date
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            21 August 2027
          </p>
        </div>
      </div>

      {/* Premium */}
      <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Annual Premium
            </p>

            <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
              ₹24,500
            </p>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Policy active
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/policy-details"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          View Policy
        </Link>

        <Link
          to="/documents"
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          View Documents
        </Link>
      </div>
    </div>
  );
}