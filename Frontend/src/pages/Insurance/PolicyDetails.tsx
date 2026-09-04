import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { customerApi, type Policy } from "../../lib/api";

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function PolicyDetails() {
  const [searchParams] = useSearchParams();
  const policyId = searchParams.get("id") ? Number(searchParams.get("id")) : null;

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customerApi
      .getPolicies()
      .then(setPolicies)
      .catch((err) => setError(err.message ?? "Failed to load policies."))
      .finally(() => setLoading(false));
  }, []);

  // Use the policy ID from query param, or fall back to the first active policy
  const policy: Policy | undefined =
    policyId != null
      ? policies.find((p) => p.policy_id === policyId)
      : policies.find((p) => p.status === "active") ?? policies[0];

  const pt = policy?.policy_type ?? null;
  const vehicle = policy?.vehicle ?? null;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-gray-400">Loading policy details…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/5">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
        <Link
          to="/policies"
          className="inline-block text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          ← Back to Policies
        </Link>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-500/20 dark:bg-amber-500/5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            No Policy Found
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            You do not have any active insurance policies.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              to="/vehicles"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Register Vehicle
            </Link>
            <Link
              to="/policies/buy"
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Buy a Policy
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Coverage percentage summary (from policy_type DB row — not hard-coded)
  const hasCoveragePcts =
    pt?.minor_coverage_pct != null ||
    pt?.moderate_coverage_pct != null ||
    pt?.severe_coverage_pct != null;

  return (
    <>
      <PageMeta
        title="InsureAI | Policy Details"
        description="View your insurance policy details and coverage."
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            to="/policies"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Back to Policies
          </Link>
          <div className="mt-4">
            <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">
              My Insurance
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
              Policy Details
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Review your policy coverage, terms and vehicle information.
            </p>
          </div>
        </div>

        {/* Policy Summary */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-start dark:border-gray-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                {policy.status === "active" ? "Active Policy" : `Policy — ${policy.status}`}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                {pt?.policy_name ?? "Insurance Policy"}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Policy No. {policy.policy_number}
                {pt?.policy_code ? ` · ${pt.policy_code}` : ""}
              </p>
            </div>
            <span
              className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                policy.status === "active"
                  ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                  : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400"
              }`}
            >
              {policy.status === "active" ? "Active" : policy.status}
            </span>
          </div>

          {/* Key figures */}
          <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
              <p className="text-xs text-gray-500 dark:text-gray-400">Maximum Claim</p>
              <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                {pt?.max_claim != null
                  ? `₹${Number(pt.max_claim).toLocaleString("en-IN")}`
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
              <p className="text-xs text-gray-500 dark:text-gray-400">Deductible</p>
              <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                {pt?.deductible != null
                  ? `₹${Number(pt.deductible).toLocaleString("en-IN")}`
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
              <p className="text-xs text-gray-500 dark:text-gray-400">Policy Start</p>
              <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                {formatDate(policy.start_date)}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
              <p className="text-xs text-gray-500 dark:text-gray-400">Renewal Date</p>
              <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                {formatDate(policy.end_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Policy Information */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Policy Information
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            {vehicle && (
              <>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Insured Vehicle</p>
                  <p className="mt-1 font-medium text-gray-900 dark:text-white">
                    {vehicle.make} {vehicle.model} ({vehicle.manufacturing_year})
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Vehicle Registration</p>
                  <p className="mt-1 font-medium text-gray-900 dark:text-white">
                    {vehicle.registration_number}
                  </p>
                </div>
              </>
            )}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Policy Type</p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {pt?.policy_name ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Annual Premium</p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {pt?.annual_premium != null
                  ? `₹${Number(pt.annual_premium).toLocaleString("en-IN")} / year`
                  : "Not specified in prototype"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Coverage Limit</p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {pt?.coverage_limit != null
                  ? `₹${Number(pt.coverage_limit).toLocaleString("en-IN")}`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Policy Code</p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {pt?.policy_code ?? "—"}
              </p>
            </div>
          </div>
          {pt?.description && (
            <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Description</p>
              <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-300">
                {pt.description}
              </p>
            </div>
          )}
        </div>

        {/* Per-severity coverage — from DB, not hard-coded */}
        {hasCoveragePcts && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Damage Coverage Percentages
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Percentage of customer claimed amount covered per damage severity.
              Deductible is subtracted after coverage. Final payout capped at maximum claim.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: "Minor Damage", pct: pt?.minor_coverage_pct },
                { label: "Moderate Damage", pct: pt?.moderate_coverage_pct },
                { label: "Severe Damage", pct: pt?.severe_coverage_pct },
              ].map(({ label, pct }) => (
                <div
                  key={label}
                  className="rounded-xl border border-gray-100 p-4 dark:border-gray-800"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="mt-2 text-xl font-bold text-blue-600 dark:text-blue-400">
                    {pct != null ? `${pct}%` : "—"}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-amber-700 dark:text-amber-400">
              Prototype synthetic policy — not a real insurance product.
            </p>
          </div>
        )}

        {/* Multiple policies — show switcher if customer has more than one */}
        {policies.length > 1 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              You have {policies.length} policies. Viewing:{" "}
              <strong>{policy.policy_number}</strong>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {policies.map((p) => (
                <Link
                  key={p.policy_id}
                  to={`/policy-details?id=${p.policy_id}`}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    p.policy_id === policy.policy_id
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
                  }`}
                >
                  {p.policy_number}
                  {p.status !== "active" ? " (inactive)" : ""}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            to="/claims/submit"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Submit a Claim
          </Link>
          <Link
            to="/documents"
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
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
