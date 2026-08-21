import PageMeta from "../../components/common/PageMeta";
import { Link } from "react-router";
import { claims } from "../../data/claims";

export default function AdminDashboard() {
  /*
   * INSUREAI ADMIN DASHBOARD
   *
   * All claim statistics are calculated from the shared
   * claims data located in:
   *
   * src/data/claims.ts
   *
   * This keeps the Admin Dashboard and Claims Officer
   * dashboard consistent.
   */

  const totalPolicies = 2;

  // -----------------------------
  // CLAIM STATISTICS
  // -----------------------------

  const totalClaims = claims.length;

  const pendingClaims = claims.filter(
    (claim) => claim.status === "Pending"
  ).length;

  const approvedClaims = claims.filter(
    (claim) => claim.status === "Approved"
  ).length;

  const rejectedClaims = claims.filter(
    (claim) => claim.status === "Rejected"
  ).length;

  const evidenceRequestedClaims = claims.filter(
    (claim) => claim.status === "Evidence Requested"
  ).length;

  // -----------------------------
  // AI STATISTICS
  // -----------------------------

  const completedAssessments = claims.filter(
    (claim) => claim.confidence !== undefined
  ).length;

  const averageConfidence =
    completedAssessments > 0
      ? claims.reduce(
          (total, claim) => total + claim.confidence,
          0
        ) / completedAssessments
      : 0;

  const averageRepairCost =
    totalClaims > 0
      ? claims.reduce(
          (total, claim) => total + claim.repairCost,
          0
        ) / totalClaims
      : 0;

  // -----------------------------
  // PERCENTAGES
  // -----------------------------

  const approvalRate =
    totalClaims > 0
      ? Math.round((approvedClaims / totalClaims) * 100)
      : 0;

  return (
    <>
      <PageMeta
        title="InsureAI | Admin Dashboard"
        description="Monitor policies, claims, AI assessments and insurance activity."
      />

      <div className="space-y-6">

        {/* ========================================= */}
        {/* HEADER */}
        {/* ========================================= */}

        <div>
          <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">
            Administration
          </p>

          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Monitor policies, claims, AI assessments and overall insurance
            activity.
          </p>
        </div>

        {/* ========================================= */}
        {/* SUMMARY CARDS */}
        {/* ========================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Total Policies */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Policies
            </p>

            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {totalPolicies}
            </p>

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Policies in current prototype
            </p>
          </div>

          {/* Total Claims */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Claims
            </p>

            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {totalClaims}
            </p>

            <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              {totalClaims} claims currently recorded
            </p>
          </div>

          {/* Pending */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/5">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pending Review
            </p>

            <p className="mt-2 text-3xl font-semibold text-blue-700 dark:text-blue-400">
              {pendingClaims}
            </p>

            <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              Requires officer attention
            </p>
          </div>

          {/* Approved */}
          <div className="rounded-2xl border border-green-100 bg-green-50 p-5 shadow-sm dark:border-green-500/20 dark:bg-green-500/5">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Approved Claims
            </p>

            <p className="mt-2 text-3xl font-semibold text-green-700 dark:text-green-400">
              {approvedClaims}
            </p>

            <p className="mt-2 text-xs text-green-600 dark:text-green-400">
              {approvalRate}% approval rate
            </p>
          </div>
        </div>

        {/* ========================================= */}
        {/* CLAIMS OVERVIEW */}
        {/* ========================================= */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">

            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Claims Overview
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Current claim distribution in the InsureAI prototype.
              </p>
            </div>

            <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">
              2026
            </span>
          </div>

          {/* Claim Counts */}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

            {/* Total */}
            <div className="rounded-xl bg-slate-50 p-5 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total
              </p>

              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {totalClaims}
              </p>
            </div>

            {/* Pending */}
            <div className="rounded-xl bg-blue-50 p-5 dark:bg-blue-500/5">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Pending
              </p>

              <p className="mt-2 text-2xl font-semibold text-blue-700 dark:text-blue-400">
                {pendingClaims}
              </p>
            </div>

            {/* Approved */}
            <div className="rounded-xl bg-green-50 p-5 dark:bg-green-500/5">
              <p className="text-sm text-green-600 dark:text-green-400">
                Approved
              </p>

              <p className="mt-2 text-2xl font-semibold text-green-700 dark:text-green-400">
                {approvedClaims}
              </p>
            </div>

            {/* Rejected */}
            <div className="rounded-xl bg-red-50 p-5 dark:bg-red-500/5">
              <p className="text-sm text-red-600 dark:text-red-400">
                Rejected
              </p>

              <p className="mt-2 text-2xl font-semibold text-red-700 dark:text-red-400">
                {rejectedClaims}
              </p>
            </div>

            {/* Evidence Requested */}
            <div className="rounded-xl bg-amber-50 p-5 dark:bg-amber-500/5">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Evidence Requested
              </p>

              <p className="mt-2 text-2xl font-semibold text-amber-700 dark:text-amber-400">
                {evidenceRequestedClaims}
              </p>
            </div>
          </div>

          {/* Distribution Bar */}

          <div className="mt-8">

            <div className="flex h-5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">

              {totalClaims > 0 && approvedClaims > 0 && (
                <div
                  className="bg-green-500"
                  style={{
                    width: `${(approvedClaims / totalClaims) * 100}%`,
                  }}
                />
              )}

              {totalClaims > 0 && rejectedClaims > 0 && (
                <div
                  className="bg-red-500"
                  style={{
                    width: `${(rejectedClaims / totalClaims) * 100}%`,
                  }}
                />
              )}

              {totalClaims > 0 && pendingClaims > 0 && (
                <div
                  className="bg-blue-500"
                  style={{
                    width: `${(pendingClaims / totalClaims) * 100}%`,
                  }}
                />
              )}

              {totalClaims > 0 && evidenceRequestedClaims > 0 && (
                <div
                  className="bg-amber-500"
                  style={{
                    width: `${(evidenceRequestedClaims / totalClaims) * 100}%`,
                  }}
                />
              )}
            </div>

            {/* Legend */}

            <div className="mt-4 flex flex-wrap gap-5 text-sm">

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500" />

                <span className="text-gray-500 dark:text-gray-400">
                  Approved {approvedClaims}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />

                <span className="text-gray-500 dark:text-gray-400">
                  Rejected {rejectedClaims}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500" />

                <span className="text-gray-500 dark:text-gray-400">
                  Pending {pendingClaims}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500" />

                <span className="text-gray-500 dark:text-gray-400">
                  Evidence Requested {evidenceRequestedClaims}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* AI PERFORMANCE */}
        {/* ========================================= */}

        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm dark:border-blue-500/20 dark:bg-gray-900">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
              AI
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Performance
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Damage assessment statistics from current claims.
              </p>
            </div>
          </div>

          {/* Average Confidence */}

          <div className="mt-7">

            <div className="flex items-center justify-between">

              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Average Confidence
              </p>

              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {averageConfidence.toFixed(1)}%
              </p>
            </div>

            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">

              <div
                className="h-full rounded-full bg-blue-600"
                style={{
                  width: `${averageConfidence}%`,
                }}
              />

            </div>
          </div>

          {/* AI Metrics */}

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">

            {/* Assessments */}

            <div className="rounded-xl bg-slate-50 p-5 dark:bg-white/[0.03]">

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Assessments Completed
              </p>

              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {completedAssessments}
              </p>

            </div>

            {/* Average Repair */}

            <div className="rounded-xl bg-slate-50 p-5 dark:bg-white/[0.03]">

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Average Repair Estimate
              </p>

              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                ₹{Math.round(averageRepairCost).toLocaleString("en-IN")}
              </p>

              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Based on current claims
              </p>

            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* CURRENT CLAIMS */}
        {/* ========================================= */}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

          <div className="border-b border-gray-100 p-6 dark:border-gray-800">

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Current Claims
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Claims currently recorded in the InsureAI prototype.
            </p>

          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">

            {claims.map((claim) => (

              <div
                key={claim.number}
                className="p-6"
              >

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                  {/* Claim Information */}

                  <div>

                    <Link
                      to={`/officer/claims/${claim.number}`}
                      className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {claim.number}
                    </Link>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {claim.severity} damage • AI confidence{" "}
                      {claim.confidence}%
                    </p>

                  </div>

                  {/* Claim Details */}

                  <div className="flex flex-wrap items-center gap-4">

                    {/* Repair Cost */}

                    <div className="text-right">

                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        ₹{claim.repairCost.toLocaleString("en-IN")}
                      </p>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Estimated repair
                      </p>

                    </div>

                    {/* Status */}

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        claim.status === "Approved"
                          ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                          : claim.status === "Rejected"
                            ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                            : claim.status === "Evidence Requested"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                      }`}
                    >
                      {claim.status}
                    </span>

                    {/* Review Button */}

                    <Link
                      to={`/officer/claims/${claim.number}`}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
                    >
                      Review
                    </Link>

                  </div>
                </div>
              </div>

            ))}

          </div>
        </div>

        {/* ========================================= */}
        {/* DATA NOTICE */}
        {/* ========================================= */}

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">

          <div className="flex gap-3">

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              !
            </div>

            <div>

              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Prototype data
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                Dashboard statistics are calculated from the shared InsureAI
                claims data. When the backend is connected, this shared data
                source can be replaced by live database information.
              </p>

            </div>
          </div>
        </div>

      </div>
    </>
  );
}