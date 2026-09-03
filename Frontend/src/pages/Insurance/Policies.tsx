import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { customerApi, type Policy } from "../../lib/api";

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function Policies() {
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

  return (
    <>
      <PageMeta
        title="InsureAI | My Policies"
        description="View and manage your insurance policies."
      />

      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">
            My Insurance
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
            My Policies
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            View your active insurance policies and coverage details.
          </p>
        </div>

        {loading && (
          <p className="text-sm text-gray-400">Loading your policies…</p>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && policies.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No policies found. Contact your insurance provider to set up a policy.
            </p>
          </div>
        )}

        {/* Policy list */}
        <div className="space-y-4">
          {policies.map((policy) => {
            const vehicle = policy.vehicle;
            const policyType = policy.policy_type;
            const isActive = policy.status === "active";

            return (
              <div
                key={policy.policy_id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                      {isActive ? "Active Policy" : `Policy — ${policy.status}`}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                      {policyType?.policy_name ?? "Motor Insurance"}
                    </h2>
                    {vehicle && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {vehicle.make} {vehicle.model} ({vehicle.manufacturing_year}) ·{" "}
                        {vehicle.registration_number}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Policy No. {policy.policy_number}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      isActive
                        ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                        : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400"
                    }`}
                  >
                    {isActive ? "Active" : policy.status}
                  </span>
                </div>

                {/* Policy details */}
                <div className="mt-6 grid grid-cols-1 gap-5 border-t border-gray-100 pt-6 dark:border-gray-800 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Coverage Limit</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                      ₹{policyType?.coverage_limit?.toLocaleString("en-IN") ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Annual Premium</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                      {policyType?.annual_premium != null
                        ? <>₹{policyType.annual_premium.toLocaleString("en-IN")}<span className="text-sm font-normal text-gray-500"> / year</span></>
                        : <span className="text-sm font-normal text-gray-500">Not specified in prototype</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Renewal Date</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                      {formatDate(policy.end_date)}
                    </p>
                  </div>
                </div>

                {policyType?.description && (
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    {policyType.description}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-100 pt-6 dark:border-gray-800">
                  <Link
                    to="/claims/submit"
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    Submit a Claim
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
          })}
        </div>
      </div>
    </>
  );
}
