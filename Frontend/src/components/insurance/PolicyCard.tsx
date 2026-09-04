import { Link } from "react-router";
import { customerApi, type Policy } from "../../lib/api";
import { useEffect, useState } from "react";

export default function PolicyCard() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerApi
      .getPolicies()
      .then(setPolicies)
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm text-gray-400 dark:text-gray-500">Loading policy…</p>
      </div>
    );
  }

  const active = policies.find((p) => p.status === "active") ?? policies[0];

  if (!active) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">My Insurance</p>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          No active policies found.{" "}
          <Link to="/policies" className="text-blue-600 hover:underline dark:text-blue-400">
            View policies
          </Link>
        </p>
      </div>
    );
  }

  const vehicle = active.vehicle;
  const vehicleLabel = vehicle
    ? `${vehicle.make} ${vehicle.model} (${vehicle.manufacturing_year})`
    : `Vehicle #${active.vehicle_id}`;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">My Insurance</p>
          <h2 className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
            {vehicleLabel}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {active.policy_type?.policy_name ?? "Motor Insurance"}
          </p>
        </div>
        <span className="w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
          Active
        </span>
      </div>

      {/* Policy Information */}
      <div className="grid grid-cols-1 gap-5 border-t border-gray-100 pt-5 dark:border-gray-800 sm:grid-cols-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Policy Number</p>
          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            {active.policy_number}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Maximum Claim</p>
          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            {active.policy_type?.max_claim != null
              ? `₹${Number(active.policy_type.max_claim).toLocaleString("en-IN")}`
              : active.policy_type?.coverage_limit != null
                ? `₹${Number(active.policy_type.coverage_limit).toLocaleString("en-IN")}`
                : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Renewal Date</p>
          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            {formatDate(active.end_date)}
          </p>
        </div>
      </div>

      {/* Premium */}
      <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Annual Premium</p>
            <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
              {active.policy_type?.annual_premium != null
                ? `₹${active.policy_type.annual_premium.toLocaleString("en-IN")}`
                : "Not specified in prototype"}
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Policy active</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/policies"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          View Policy
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
}
