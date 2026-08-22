import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { customerApi, type Claim, ApiError, imageUrl } from "../../lib/api";

function stepState(
  current: Claim["status"],
  step: "Submitted" | "AI Assessment" | "Officer Review" | "Final Decision"
): "done" | "active" | "pending" {
  const order = ["Submitted", "AI Assessment", "Officer Review", "Final Decision"];
  const stepIdx = order.indexOf(step);

  const statusToStep: Record<string, number> = {
    Pending: 1,
    "Under Review": 2,
    "Evidence Requested": 2,
    Approved: 3,
    Rejected: 3,
  };

  const currentIdx = statusToStep[current] ?? 1;
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "active";
  return "pending";
}

export default function ClaimDetails() {
  const { claimNumber } = useParams<{ claimNumber: string }>();
  const claimId = Number(claimNumber);

  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (isNaN(claimId)) { setNotFound(true); setLoading(false); return; }
    customerApi
      .getClaim(claimId)
      .then(setClaim)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [claimId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-gray-400">Loading claim…</p>
      </div>
    );
  }

  if (notFound || !claim) {
    return (
      <div className="space-y-6">
        <Link to="/claims" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
          ← Back to My Claims
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/5">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Claim Not Found</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Claim #{claimNumber} could not be found.
          </p>
        </div>
      </div>
    );
  }

  const ai = claim.ai_analysis;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const steps = [
    { label: "Submitted", desc: formatDate(claim.claim_date) },
    { label: "AI Assessment", desc: ai ? "Completed" : "Waiting for image upload" },
    { label: "Officer Review", desc: claim.assigned_officer_id ? "In progress" : "Pending assignment" },
    {
      label: "Final Decision",
      desc:
        claim.status === "Approved"
          ? "Approved"
          : claim.status === "Rejected"
            ? "Rejected"
            : "Pending",
    },
  ] as const;

  return (
    <>
      <PageMeta title={`InsureAI | ${claim.claim_number}`} description="View claim progress and AI assessment." />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link to="/claims" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
            ← Back to My Claims
          </Link>
          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Claim Details</p>
              <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
                {claim.claim_number}
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {claim.claim_type} · Submitted {formatDate(claim.claim_date)}
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              {claim.status}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Claim Progress</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-4">
            {steps.map(({ label, desc }) => {
              const state = stepState(claim.status, label);
              return (
                <div key={label}>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      state === "done"
                        ? "bg-green-500 text-white"
                        : state === "active"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500"
                    }`}
                  >
                    {state === "done" ? "✓" : label === "AI Assessment" ? "AI" : steps.findIndex((s) => s.label === label) + 1}
                  </div>
                  <p className={`mt-3 text-sm font-semibold ${state === "pending" ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
                    {label}
                  </p>
                  <p className={`mt-1 text-xs ${state === "active" ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}>
                    {desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Claim Information */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Claim Information</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              { label: "Policy Number", value: claim.policy?.policy_number ?? `#${claim.policy_id}` },
              { label: "Claim Type", value: claim.claim_type },
              { label: "Incident Date", value: formatDate(claim.accident_date) },
              { label: "Location", value: claim.location ?? "—" },
              { label: "Claimed Amount", value: `₹${claim.claimed_amount.toLocaleString("en-IN")}` },
              {
                label: "Approved Amount",
                value: claim.approved_amount != null
                  ? `₹${claim.approved_amount.toLocaleString("en-IN")}`
                  : "—",
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>
          {claim.description && (
            <div className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Description</p>
              <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-300">{claim.description}</p>
            </div>
          )}
        </div>

        {/* AI Assessment */}
        <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm dark:border-blue-500/20 dark:bg-gray-900">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">AI</div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">InsureAI Damage Assessment</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {ai ? "AI-generated assessment based on submitted images." : "Upload images to trigger the AI analysis."}
              </p>
            </div>
          </div>

          {ai ? (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Damage Severity</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{ai.damage_severity}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                  <p className="text-xs text-gray-500 dark:text-gray-400">AI Confidence</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {Math.round((ai.confidence_score ?? 0) * 100)}%
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Estimated Repair Cost</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                    ₹{ai.estimated_repair_cost?.toLocaleString("en-IN") ?? "—"}
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Risk Level</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{ai.risk_level ?? "—"}</p>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
              AI analysis will appear here once damage images are uploaded.
            </p>
          )}
        </div>

        {/* Submitted Images */}
        {claim.images.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Submitted Evidence</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Images submitted with this claim.</p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {claim.images.map((img) => {
                const filename = img.file_path.split("/").pop() ?? "";
                return (
                  <a
                    key={img.image_id}
                    href={imageUrl(filename)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <img
                      src={imageUrl(filename)}
                      alt={`Damage evidence ${img.image_id}`}
                      className="h-48 w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <p className="border-t border-gray-100 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      Uploaded {formatDate(img.uploaded_at)}
                    </p>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Decision remarks */}
        {claim.decision_remarks && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Officer Remarks</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">{claim.decision_remarks}</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">!</div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Final decision is made by a Claims Officer</h3>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                The AI assessment supports the claims process and does not make the final approval or rejection decision.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
