import PageMeta from "../../components/common/PageMeta";
import { Link } from "react-router";

export default function PolicyDetails() {
  return (
    <>
      <PageMeta
        title="InsureAI | Policy Details"
        description="View your insurance policy details and coverage."
      />

      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">
            My Insurance
          </p>

          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
            Policy Details
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Review your policy coverage, premium and important information.
          </p>
        </div>

        {/* Policy Summary */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-start dark:border-gray-800">
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

          {/* Coverage */}
          <div className="p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Coverage Summary
            </h3>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Coverage Amount
                </p>

                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                  ₹10,00,000
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Annual Premium
                </p>

                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                  ₹24,500
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Policy Start
                </p>

                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                  21 August 2026
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Renewal Date
                </p>

                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                  21 August 2027
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Information */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Policy Information
          </h3>

          <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Insured Vehicle
              </p>

              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                Toyota Corolla
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Vehicle Registration
              </p>

              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                GJ-01-AB-1234
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Policy Type
              </p>

              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                Comprehensive Motor Insurance
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Payment Frequency
              </p>

              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                Annual
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Policy Holder
              </p>

              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                Customer
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Insurer
              </p>

              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                InsureAI Insurance
              </p>
            </div>
          </div>
        </div>

        {/* Included Coverage */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Included Coverage
          </h3>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              "Accidental damage",
              "Theft protection",
              "Fire damage",
              "Natural disaster damage",
              "Third-party liability",
              "Emergency assistance",
            ].map((coverage) => (
              <div
                key={coverage}
                className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                  ✓
                </span>

                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {coverage}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
<div className="flex flex-wrap gap-3">
  <Link
    to="/documents"
    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
  >
    View Documents
  </Link>

  <Link
    to="/policies"
    className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
  >
    Back to Policies
  </Link>
</div>
      </div>
    </>
  );
}