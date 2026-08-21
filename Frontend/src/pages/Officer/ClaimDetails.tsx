import { useState } from "react";
import { Link, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";

export default function OfficerClaimDetails() {
  const { claimNumber } = useParams();
  const [decision, setDecision] = useState<string | null>(null);

  const claimId = claimNumber || "CLM-2026-00142";

  const handleDecision = (newDecision: string) => {
    setDecision(newDecision);
  };

  return (
    <>
      <PageMeta
        title="InsureAI | Claim Review"
        description="Review insurance claim evidence and AI assessment."
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            to="/officer/claims"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Back to Claims
          </Link>

          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Claims Officer
              </p>

              <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
                {claimId}
              </h1>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Vehicle Damage • Submitted 18 August 2026
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              Under Review
            </span>
          </div>
        </div>

        {/* Customer & Policy Information */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Customer Information
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Customer
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  InsureAI User
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Email
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  customer@insureai.com
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Phone
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  +91 98765 43210
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Policy Information
            </h2>

            <div className="mt-5 space-y-4">
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
                  Policy Type
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  Comprehensive Motor Insurance
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Coverage
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  ₹10,00,000
                </p>
              </div>
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

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Incident Location
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                Vadodara, Gujarat
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Incident Description
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
              The insured vehicle was involved in a minor road accident. The
              front bumper and right-side body panel sustained visible damage.
              The customer has submitted photographs and supporting vehicle
              documentation for assessment.
            </p>
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
                  AI-generated assessment based on submitted evidence.
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              Recommendation
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
            Review the evidence provided by the policyholder.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                title: "Front Damage",
                type: "IMG",
                description: "Vehicle front bumper",
              },
              {
                title: "Right Side Damage",
                type: "IMG",
                description: "Right-side body panel",
              },
              {
                title: "Vehicle Document",
                type: "PDF",
                description: "Supporting document",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  {item.type}
                </div>

                <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                  {item.title}
                </h3>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>

                <button
                  type="button"
                  className="mt-4 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  View Evidence
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Decision */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Claims Officer Decision
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review all available information before making the final decision.
          </p>

          {decision && (
            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Decision Selected
              </p>

              <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                {decision}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => handleDecision("Claim Approved")}
              className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
            >
              Approve Claim
            </button>

            <button
              type="button"
              onClick={() => handleDecision("More Information Requested")}
              className="rounded-lg border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
            >
              Request More Information
            </button>

            <button
              type="button"
              onClick={() => handleDecision("Claim Rejected")}
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Reject Claim
            </button>
          </div>
        </div>

        {/* Important Notice */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              !
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                AI is a decision-support tool
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                The AI assessment provides recommendations based on submitted
                evidence. The Claims Officer remains responsible for the final
                approval or rejection decision.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}