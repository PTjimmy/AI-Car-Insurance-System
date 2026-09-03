import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { customerApi, type PolicyType, type Vehicle, ApiError } from "../../lib/api";

// Coverage names that belong to each tier — used for the "Not Included" row
const TIER_ORDER = [
  "Third Party Liability",
  "Own Vehicle Damage",
  "Fire Damage",
  "Theft",
  "Flood",
  "Cyclone / Natural Disaster",
  "Roadside Assistance",
  "Engine Protection",
  "Zero Depreciation",
  "Glass Replacement",
];

function CoverageRow({ label, included }: { label: string; included: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 dark:border-gray-800">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          included
            ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
            : "bg-red-50 text-red-400 dark:bg-red-500/5 dark:text-red-500"
        }`}
      >
        {included ? "✓" : "✗"}
      </span>
      <span
        className={`text-sm ${
          included ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-500 line-through"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function BuyPolicy() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedVehicleId = searchParams.get("vehicle_id")
    ? Number(searchParams.get("vehicle_id"))
    : null;

  const [plans, setPlans] = useState<PolicyType[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState<PolicyType | null>(null);
  const [vehicleId, setVehicleId] = useState<number | "">(preselectedVehicleId ?? "");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  });

  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([customerApi.getPolicyTypes(), customerApi.getVehicles()])
      .then(([p, v]) => {
        setPlans(p);
        setVehicles(v);
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePurchase = async () => {
    if (!selectedPlan || vehicleId === "") return;
    setError(null);
    setPurchasing(true);
    try {
      await customerApi.purchasePolicy({
        vehicle_id: Number(vehicleId),
        policy_type_id: selectedPlan.policy_type_id,
        start_date: startDate,
        end_date: endDate,
      });
      navigate("/policies");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Purchase failed. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  // Card styling derived from policy_code (P001–P006) rather than policy name,
  // so adding new policies never breaks the UI. Unknown codes fall back to the
  // default "entry" tier styling.
  const getPlanColors = (policyCode: string | null): { border: string; badge: string } => {
    switch (policyCode) {
      case "P001":
        return { border: "border-slate-200 dark:border-gray-700", badge: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-gray-300" };
      case "P002":
        return { border: "border-blue-200 dark:border-blue-500/30", badge: "bg-blue-600 text-white" };
      case "P003":
        return { border: "border-indigo-200 dark:border-indigo-500/30", badge: "bg-indigo-600 text-white" };
      case "P004":
        return { border: "border-amber-200 dark:border-amber-500/30", badge: "bg-amber-500 text-white" };
      case "P005":
        return { border: "border-gray-200 dark:border-gray-700", badge: "bg-gray-500 text-white" };
      case "P006":
        return { border: "border-purple-200 dark:border-purple-500/30", badge: "bg-purple-600 text-white" };
      default:
        return { border: "border-gray-200 dark:border-gray-700", badge: "bg-gray-600 text-white" };
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-gray-400">Loading plans…</p>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="InsureAI | Buy Insurance" description="Choose an insurance plan for your vehicle." />

      <div className="space-y-8">
        {/* Header */}
        <div>
          <Link to="/vehicles" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
            ← Back to My Vehicles
          </Link>
          <div className="mt-4">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Insurance Plans</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
              Choose Your Insurance Plan
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Select the plan that best suits your vehicle and coverage needs.
            </p>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const colors = getPlanColors(plan.policy_code ?? null);
            const isSelected = selectedPlan?.policy_type_id === plan.policy_type_id;
            const coverages = plan.coverages ?? [];

            return (
              <button
                key={plan.policy_type_id}
                type="button"
                onClick={() => setSelectedPlan(plan)}
                className={`rounded-2xl border-2 bg-white p-6 text-left shadow-sm transition hover:shadow-md dark:bg-gray-900 ${
                  isSelected
                    ? "border-blue-500 shadow-blue-100 dark:shadow-none"
                    : colors.border
                }`}
              >
                {/* Plan header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colors.badge}`}>
                      {plan.policy_name}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                      ✓
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mt-5">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    ₹{Number(plan.annual_premium).toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">per year</p>
                </div>

                {/* Coverage limit */}
                <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3 dark:bg-white/[0.03]">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Coverage Limit</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    ₹{Number(plan.coverage_limit).toLocaleString("en-IN")}
                  </p>
                </div>

                {/* Coverage list */}
                <div className="mt-5">
                  {TIER_ORDER.map((coverage) => (
                    <CoverageRow
                      key={coverage}
                      label={coverage}
                      included={coverages.includes(coverage)}
                    />
                  ))}
                </div>

                {/* Description */}
                {plan.description && (
                  <p className="mt-4 text-xs leading-5 text-gray-400 dark:text-gray-500">
                    {plan.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Purchase form — shown after selecting a plan */}
        {selectedPlan && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Complete Your Purchase — {selectedPlan.policy_name}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select the vehicle and policy duration.
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Vehicle */}
              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vehicle <span className="text-red-500">*</span>
                </label>
                {vehicles.length === 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-400">
                    No vehicles registered.{" "}
                    <Link to="/vehicles" className="font-medium underline">
                      Register a vehicle first
                    </Link>
                  </div>
                ) : (
                  <select
                    required
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">Select vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v.vehicle_id} value={v.vehicle_id}>
                        {v.make} {v.model} — {v.registration_number}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Start date */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* End date */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 rounded-xl bg-slate-50 p-5 dark:bg-white/[0.03]">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Order Summary</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Plan</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selectedPlan.policy_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Coverage Limit</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ₹{Number(selectedPlan.coverage_limit).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Annual Premium</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    ₹{Number(selectedPlan.annual_premium).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => { setSelectedPlan(null); setError(null); }}
                className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Change Plan
              </button>
              <button
                type="button"
                onClick={handlePurchase}
                disabled={purchasing || vehicleId === ""}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {purchasing ? "Processing…" : `Confirm — ₹${Number(selectedPlan.annual_premium).toLocaleString("en-IN")}/yr`}
              </button>
            </div>
          </div>
        )}

        {/* Business rules note */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">!</div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Important</h3>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                Policies marked with coverage percentages for Minor, Moderate, and Severe damage
                cover own-vehicle damage. Policies with no coverage percentages set only cover
                third-party liability. Each vehicle can hold only one active policy at a time.
                These are prototype policies — not real insurance products.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
