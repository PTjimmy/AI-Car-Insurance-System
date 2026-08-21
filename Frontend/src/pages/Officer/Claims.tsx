import PageMeta from "../../components/common/PageMeta";
import { Link } from "react-router";

type Claim = {
  number: string;
  customer: string;
  policy: string;
  type: string;
  submitted: string;
  status: string;
  severity: string;
  confidence: string;
  repairCost: string;
};

export default function OfficerClaims() {
  const claims: Claim[] = [
    {
      number: "CLM-2026-00142",
      customer: "InsureAI User",
      policy: "INS-MTR-2026-00124",
      type: "Vehicle Damage",
      submitted: "18 August 2026",
      status: "Under AI Assessment",
      severity: "Moderate",
      confidence: "91%",
      repairCost: "₹85,000",
    },
    {
      number: "CLM-2026-00098",
      customer: "InsureAI User",
      policy: "INS-MTR-2026-00124",
      type: "Minor Accident",
      submitted: "04 July 2026",
      status: "Approved",
      severity: "Low",
      confidence: "96%",
      repairCost: "₹32,500",
    },
  ];

  return (
    <>
      <PageMeta
        title="InsureAI | Claims Officer"
        description="Review and manage insurance claims."
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Claims Officer
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
            Claims Review
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Review submitted claims, AI assessments and make final claim
            decisions.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Claims
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              24
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/5">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Awaiting Review
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              8
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-5 dark:border-green-500/20 dark:bg-green-500/5">
            <p className="text-sm text-green-600 dark:text-green-400">
              Approved
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              12
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 dark:border-red-500/20 dark:bg-red-500/5">
            <p className="text-sm text-red-600 dark:text-red-400">
              Rejected
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              4
            </p>
          </div>
        </div>

        {/* Claims */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Recent Claims
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Review claims submitted by policyholders.
            </p>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {claims.map((claim) => (
              <div key={claim.number} className="p-6">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  {/* Claim */}
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {claim.number}
                      </h3>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          claim.status === "Approved"
                            ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
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

                  {/* Action */}
                  <Link
                    to={`/officer/claims/${claim.number}`}
                    className="w-fit rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    Review Claim
                  </Link>
                </div>

                {/* Information */}
                <div className="mt-6 grid grid-cols-1 gap-5 border-t border-gray-100 pt-6 dark:border-gray-800 sm:grid-cols-2 lg:grid-cols-4">
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
                      AI Severity
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {claim.severity}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      AI Confidence
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {claim.confidence}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Estimated Repair
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {claim.repairCost}
                    </p>
                  </div>
                </div>

                {/* AI Notice */}
                <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                      AI
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        AI Assessment Available
                      </p>

                      <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                        Review the AI-generated damage assessment and submitted
                        evidence before making the final claim decision.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                Officer Decision Required
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                AI assessments are recommendations only. The Claims Officer is
                responsible for reviewing the evidence and making the final
                decision.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}