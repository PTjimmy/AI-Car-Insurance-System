import { Link } from "react-router";
import { useClaims } from "../../context/ClaimsContext";
import { customerApi, type Policy } from "../../lib/api";
import { useEffect, useState } from "react";

export default function InsuranceMetrics() {
  const { claims, loading: claimsLoading } = useClaims();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(true);

  useEffect(() => {
    customerApi
      .getPolicies()
      .then(setPolicies)
      .catch(() => setPolicies([]))
      .finally(() => setPoliciesLoading(false));
  }, []);

  const activePolicies = policies.filter((p) => p.status === "active").length;
  const activeClaims = claims.filter(
    (c) => c.status === "Pending" || c.status === "Under Review"
  ).length;

  // Find next renewal from active policies
  const nextRenewal = policies
    .filter((p) => p.status === "active")
    .sort(
      (a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
    )[0];

  const nextPremium = nextRenewal?.policy_type?.annual_premium;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {/* Active Policies */}
      <Link
        to="/policies"
        className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-blue-500/30"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">Active Policies</p>
        <h3 className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          {policiesLoading ? "—" : activePolicies}
        </h3>
        <p className="mt-1 text-sm text-green-600 dark:text-green-400">
          {activePolicies === 1 ? "Policy active" : `${activePolicies} policies active`}
        </p>
        <p className="mt-4 text-xs font-medium text-blue-600 opacity-0 transition group-hover:opacity-100 dark:text-blue-400">
          View policies →
        </p>
      </Link>

      {/* Active Claims */}
      <Link
        to="/claims"
        className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-blue-500/30"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">Active Claims</p>
        <h3 className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          {claimsLoading ? "—" : activeClaims}
        </h3>
        <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
          {activeClaims === 0
            ? "No claims under review"
            : `${activeClaims} claim${activeClaims !== 1 ? "s" : ""} under review`}
        </p>
        <p className="mt-4 text-xs font-medium text-blue-600 opacity-0 transition group-hover:opacity-100 dark:text-blue-400">
          View claims →
        </p>
      </Link>

      {/* Next Payment */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm text-gray-500 dark:text-gray-400">Next Payment</p>
        <h3 className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          {policiesLoading
            ? "—"
            : nextPremium != null
              ? `₹${nextPremium.toLocaleString("en-IN")}`
              : "Not specified"}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {nextRenewal ? `Due ${formatDate(nextRenewal.end_date)}` : "No active policy"}
        </p>
        <p className="mt-4 text-xs font-medium text-gray-400">
          {nextPremium != null ? "Annual premium payment" : "Premium not specified in prototype"}
        </p>
      </div>
    </div>
  );
}
