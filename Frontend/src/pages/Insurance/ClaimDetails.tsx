import PageMeta from "../../components/common/PageMeta";
import { Link } from "react-router";

export default function ClaimDetails() {
  return (
    <>
      <PageMeta
        title="InsureAI | Claim Details"
        description="View claim progress and AI assessment."
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            to="/claims"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Back to My Claims
          </Link>

          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Claim Details
              </p>

              <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
                CLM-2026-00142
              </h1>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Vehicle Damage • Submitted 18 August 2026
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              Under AI Assessment
            </span>
          </div>
        </div>

        {/* Claim Progress */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Claim Progress
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-4">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                ✓
              </div>

              <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                Submitted
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                18 Aug 2026
              </p>
            </div>

            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                AI
              </div>

              <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                AI Assessment
              </p>

              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                In progress
              </p>
            </div>

            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-400 dark:bg-white/10 dark:text-gray-500">
                3
              </div>

              <p className="mt-3 text-sm font-semibold text-gray-500 dark:text-gray-400">
                Officer Review
              </p>

              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Pending
              </p>
            </div>

            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-400 dark:bg-white/10 dark:text-gray-500">
                4
              </div>

              <p className="mt-3 text-sm font-semibold text-gray-500 dark:text-gray-400">
                Final Decision
              </p>

              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Pending
              </p>
            </div>
          </div>
        </div>

        {/* Claim Information */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Claim Information
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Policy Number
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                INS-MTR-2026-00124
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Claim Type
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                Vehicle Damage
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Incident Date
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                17 August 2026
              </p>
            </div>
          </div>
        </div>

        {/* AI Assessment */}
        <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm dark:border-blue-500/20 dark:bg-gray-900">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
                AI
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  InsureAI Damage Assessment
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Preliminary assessment generated from submitted evidence.
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              Preliminary
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Damage Severity
              </p>

              <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                Moderate
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                AI Confidence
              </p>

              <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                91%
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Estimated Repair Cost
              </p>

              <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                ₹85,000
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              AI Findings
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              The submitted vehicle images indicate visible damage to the
              front bumper and right-side body panel. The AI estimates the
              damage as moderate and recommends further inspection before
              repair approval.
            </p>
          </div>
        </div>

        {/* Evidence */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Submitted Evidence
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Evidence submitted with this claim.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {["Front Damage", "Right Side Damage", "Vehicle Document"].map(
              (item) => (
                <div
                  key={item}
                  className="flex h-32 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm font-medium text-gray-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-400"
                >
                  {item}
                </div>
              )
            )}
          </div>
        </div>

        {/* Officer Notice */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              !
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Final decision is made by a Claims Officer
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                The AI assessment is used to support the claims process. It
                does not make the final approval or rejection decision.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}