import { Link, useParams } from "react-router";
import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { officerApi, type Claim, type ClaimStatus, ApiError, imageUrl } from "../../lib/api";

export default function ClaimReview() {
  const { claimNumber } = useParams<{ claimNumber: string }>();
  const claimId = Number(claimNumber); // App.tsx uses :claimNumber but we now store IDs in the URL

  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [remarksInput, setRemarksInput] = useState("");
  const [approvedAmountInput, setApprovedAmountInput] = useState("");
  const [deciding, setDeciding] = useState(false);
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  useEffect(() => {
    if (isNaN(claimId)) { setNotFound(true); setLoading(false); return; }
    officerApi
      .getClaim(claimId)
      .then(setClaim)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [claimId]);

  const handleDecision = async (status: ClaimStatus) => {
    if (!claim) return;
    setDecisionError(null);
    setDeciding(true);
    try {
      const updated = await officerApi.updateStatus(claim.claim_id, {
        status,
        remarks: remarksInput || undefined,
        approved_amount:
          status === "Approved" && approvedAmountInput
            ? parseFloat(approvedAmountInput)
            : undefined,
      });
      setClaim(updated);
      setDecisionMessage(`Claim has been marked as ${status}.`);
    } catch (err) {
      setDecisionError(err instanceof ApiError ? err.message : "Update failed.");
    } finally {
      setDeciding(false);
    }
  };

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
        <Link to="/officer/claims" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
          ← Back to Claims
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/5">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Claim Not Found</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Claim #{claimNumber} could not be found or is not assigned to you.
          </p>
        </div>
      </div>
    );
  }

  const ai = claim.ai_analysis;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const statusStyles: Record<string, string> = {
    Approved: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",
    Rejected: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    "Evidence Requested": "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    "Under Review": "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
    Pending: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  };

  return (
    <>
      <PageMeta
        title={`InsureAI | Review Claim ${claim.claim_number}`}
        description="Review claim evidence and AI assessment."
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link to="/officer/claims" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
            ← Back to Claims
          </Link>
          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Claims Officer</p>
              <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
                Review Claim
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Review the submitted evidence and AI assessment before making the final decision.
              </p>
            </div>
            <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[claim.status] ?? ""}`}>
              {claim.status}
            </span>
          </div>
        </div>

        {/* Decision message */}
        {decisionMessage && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-500/20 dark:bg-green-500/5">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Status updated</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{decisionMessage}</p>
          </div>
        )}
        {decisionError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-500/20 dark:bg-red-500/5">
            <p className="text-sm text-red-700 dark:text-red-400">{decisionError}</p>
          </div>
        )}

        {/* Claim Overview */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Claim Overview</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Claim Number", value: claim.claim_number },
              { label: "Policy", value: claim.policy?.policy_number ?? `#${claim.policy_id}` },
              { label: "Claim Type", value: claim.claim_type },
              { label: "Location", value: claim.location ?? "—" },
              { label: "Incident Date", value: formatDate(claim.accident_date) },
              { label: "Submitted", value: formatDate(claim.claim_date) },
              { label: "Customer Claimed Amount", value: `₹${claim.claimed_amount.toLocaleString("en-IN")}` },
              { label: "Current Status", value: claim.status },
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

        {/* AI Assessment + Policy Calculation */}
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
                {ai
                  ? "ViT-B/16 model prediction. The AI determines severity only — the officer makes the final decision."
                  : "No AI analysis available yet — images may not have been uploaded."}
              </p>
            </div>
          </div>

          {ai ? (
            <>
              {/* AI Prediction */}
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  AI Prediction — ViT-B/16
                </p>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Damage Severity</p>
                    <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                      {ai.damage_severity ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">AI Confidence</p>
                    <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                      {ai.confidence_score != null ? `${Math.round(ai.confidence_score * 100)}%` : "—"}
                    </p>
                    {ai.confidence_score != null && (
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-500/20">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${Math.round(ai.confidence_score * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                  Model: {ai.model_version ?? "—"} · Analysed: {formatDate(ai.analyzed_at)}
                </p>
              </div>

              {/* Policy Calculation */}
              {ai.estimated_claim_amount != null ? (
                <div className="mt-4 rounded-xl border border-green-100 bg-green-50 p-4 dark:border-green-500/20 dark:bg-green-500/5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
                    Policy Calculation — Business Rule
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Customer Claimed Amount</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                        ₹{claim.claimed_amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Coverage Applied</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                        {ai.coverage_pct_applied != null ? `${ai.coverage_pct_applied}%` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Deductible</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                        ₹{ai.deductible_applied?.toLocaleString("en-IN") ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Estimated Claim</p>
                      <p className="mt-1 text-xl font-semibold text-green-700 dark:text-green-400">
                        ₹{ai.estimated_claim_amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                    = (₹{claim.claimed_amount.toLocaleString("en-IN")} × {ai.coverage_pct_applied ?? "?"}%) − ₹{ai.deductible_applied?.toLocaleString("en-IN") ?? "?"}, capped at policy maximum.
                    This is a prototype estimate only. The final approved amount is set by the officer below.
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/5">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Policy calculation not available — policy rules may not be configured for this plan.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-400">
              The customer has not uploaded damage images yet. Request evidence below.
            </div>
          )}
        </div>

        {/* Submitted Images */}
        {claim.images.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Submitted Images</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Damage evidence uploaded by the customer.
              The first image was used for AI severity analysis; additional images are
              supporting evidence.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {claim.images.map((img) => {
                const filename = img.file_path.split("/").pop() ?? "";
                return (
                  <a
                    key={img.image_id}
                    href={imageUrl(filename)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <img
                      src={imageUrl(filename)}
                      alt={`Claim image ${img.image_id}`}
                      className="h-48 w-full object-cover transition group-hover:opacity-90"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <p className="border-t border-gray-100 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      {img.image_type} · {new Date(img.uploaded_at).toLocaleDateString("en-IN")}
                    </p>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Claim History */}
        {claim.history.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Claim History</h2>
            <div className="mt-4 space-y-3">
              {claim.history.map((h) => (
                <div key={h.history_id} className="flex gap-3 text-sm">
                  <span className="shrink-0 text-xs text-gray-400">{formatDate(h.changed_at)}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{h.status}</span>
                  {h.remarks && <span className="text-gray-500 dark:text-gray-400">— {h.remarks}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Officer Decision */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Officer Decision</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The AI assessment is advisory. You make the final decision.
          </p>

          {/* Remarks */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Remarks (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Add a remark or explanation for your decision…"
              value={remarksInput}
              onChange={(e) => setRemarksInput(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          {/* Approved Amount */}
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Approved Amount (₹) — required when approving
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="Enter approved amount"
              value={approvedAmountInput}
              onChange={(e) => setApprovedAmountInput(e.target.value)}
              className="h-11 w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          {/* Buttons */}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleDecision("Approved")}
              disabled={deciding || claim.status === "Approved"}
              className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {claim.status === "Approved" ? "Claim Approved ✓" : "Approve Claim"}
            </button>
            <button
              type="button"
              onClick={() => handleDecision("Rejected")}
              disabled={deciding || claim.status === "Rejected"}
              className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/5"
            >
              {claim.status === "Rejected" ? "Claim Rejected ✓" : "Reject Claim"}
            </button>
            <button
              type="button"
              onClick={() => handleDecision("Evidence Requested")}
              disabled={deciding || claim.status === "Evidence Requested"}
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              {claim.status === "Evidence Requested" ? "Evidence Requested ✓" : "Request More Evidence"}
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">!</div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Human review required</h3>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                AI-generated information supports the claims process but does not make the final insurance decision.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
