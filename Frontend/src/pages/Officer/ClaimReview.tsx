import { Link, useParams } from "react-router";
import { useState } from "react";

import PageMeta from "../../components/common/PageMeta";
import { useClaims } from "../../context/ClaimsContext";
import type { ClaimStatus } from "../../data/claims";

export default function ClaimReview() {
  const { claimNumber } = useParams();

  const { claims, updateClaimStatus } = useClaims();

  const [decision, setDecision] = useState<ClaimStatus | null>(null);

  const claim = claims.find(
    (item) => item.number === claimNumber
  );

  /*
   * If the claim number does not exist,
   * show a safe message instead of crashing.
   */
  if (!claim) {
    return (
      <>
        <PageMeta
          title="InsureAI | Claim Not Found"
          description="Claim could not be found."
        />

        <div className="space-y-6">
          <Link
            to="/officer/claims"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Back to Claims
          </Link>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/5">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Claim Not Found
            </h1>

            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              The claim{" "}
              <strong>{claimNumber}</strong> could not be
              found in the current InsureAI claim data.
            </p>
          </div>
        </div>
      </>
    );
  }

  const handleDecision = (status: ClaimStatus) => {
    updateClaimStatus(claim.number, status);
    setDecision(status);
  };

  const currentStatus = decision || claim.status;

  const statusStyles =
    currentStatus === "Approved"
      ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
      : currentStatus === "Rejected"
        ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
        : currentStatus === "Evidence Requested"
          ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
          : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";

  return (
    <>
      <PageMeta
        title={`InsureAI | Review ${claim.number}`}
        description="Review claim evidence and AI assessment."
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
                Review Claim
              </h1>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Review the submitted evidence and AI assessment before making
                the final decision.
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles}`}
            >
              {currentStatus}
            </span>
          </div>
        </div>

        {/* Decision Confirmation */}
        {decision && (
          <div
            className={`rounded-2xl border p-5 ${
              decision === "Approved"
                ? "border-green-200 bg-green-50 dark:border-green-500/20 dark:bg-green-500/5"
                : decision === "Rejected"
                  ? "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/5"
                  : "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5"
            }`}
          >
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Claim status updated
            </h2>

            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {claim.number} is now marked as{" "}
              <strong>{decision}</strong>.
            </p>
          </div>
        )}

        {/* Claim Overview */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Claim Overview
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Claim Number
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {claim.number}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Customer
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {claim.customer}
              </p>
            </div>

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
                Claim Type
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {claim.type}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Incident Date
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {claim.incidentDate}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Location
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {claim.location}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Submitted
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {claim.submitted}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Current Status
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {currentStatus}
              </p>
            </div>

          </div>
        </div>

        {/* AI Assessment */}
        <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm dark:border-blue-500/20 dark:bg-gray-900">

          <div className="flex items-start gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
              AI
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                InsureAI Damage Assessment
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                AI-generated assessment based on the submitted evidence.
              </p>
            </div>

          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

            <div className="rounded-xl bg-slate-50 p-5 dark:bg-white/[0.03]">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Damage Severity
              </p>

              <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                {claim.severity}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5 dark:bg-white/[0.03]">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                AI Confidence
              </p>

              <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                {claim.confidence}%
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5 dark:bg-white/[0.03]">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Estimated Repair Cost
              </p>

              <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                ₹{claim.repairCost.toLocaleString("en-IN")}
              </p>
            </div>

          </div>

          <div className="mt-5 rounded-xl border border-gray-100 p-5 dark:border-gray-800">

            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              AI Findings
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
              {claim.aiFindings}
            </p>

          </div>
        </div>

        {/* Evidence */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">

          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Submitted Evidence
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review the evidence submitted by the policyholder.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">

            {[
              "Front Damage",
              "Right Side Damage",
              "Vehicle Document",
            ].map((item) => (
              <div
                key={item}
                className="flex h-36 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm font-medium text-gray-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-400"
              >
                {item}
              </div>
            ))}

          </div>
        </div>

        {/* Officer Decision */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">

          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Officer Decision
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The AI assessment is advisory. The Claims Officer makes the final
            decision.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">

            <button
              type="button"
              onClick={() => handleDecision("Approved")}
              disabled={currentStatus === "Approved"}
              className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {currentStatus === "Approved"
                ? "Claim Approved"
                : "Approve Claim"}
            </button>

            <button
              type="button"
              onClick={() => handleDecision("Rejected")}
              disabled={currentStatus === "Rejected"}
              className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/5"
            >
              {currentStatus === "Rejected"
                ? "Claim Rejected"
                : "Reject Claim"}
            </button>

            <button
              type="button"
              onClick={() => handleDecision("Evidence Requested")}
              disabled={currentStatus === "Evidence Requested"}
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              {currentStatus === "Evidence Requested"
                ? "Evidence Requested"
                : "Request More Evidence"}
            </button>

          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">

          <div className="flex gap-3">

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              !
            </div>

            <div>

              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Human review required
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                AI-generated information supports the claims process but does
                not make the final insurance decision.
              </p>

            </div>

          </div>
        </div>

      </div>
    </>
  );
}