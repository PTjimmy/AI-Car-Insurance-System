import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { customerApi, type Vehicle, ApiError } from "../../lib/api";

const CURRENT_YEAR = new Date().getFullYear();

const MAKES = [
  "Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Toyota", "Honda",
  "Kia", "Renault", "Volkswagen", "Skoda", "Ford", "MG", "Nissan",
  "BMW", "Mercedes-Benz", "Audi", "Jeep", "Other",
];

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [reg, setReg] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [value, setValue] = useState("");

  const load = () => {
    setLoading(true);
    customerApi
      .getVehicles()
      .then(setVehicles)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setReg(""); setMake(""); setModel(""); setYear(""); setValue("");
    setError(null); setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await customerApi.createVehicle({
        registration_number: reg.toUpperCase().trim(),
        make,
        model,
        manufacturing_year: parseInt(year),
        vehicle_value: parseFloat(value),
      });
      setSuccess(`${make} ${model} registered successfully.`);
      setShowForm(false);
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta title="InsureAI | My Vehicles" description="Register and manage your vehicles." />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">My Insurance</p>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
              My Vehicles
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Register your vehicles to purchase insurance policies and submit claims.
            </p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setError(null); setSuccess(null); }}
            className="inline-flex w-fit items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "+ Register Vehicle"}
          </button>
        </div>

        {/* Success */}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-500/20 dark:bg-green-500/5 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Registration Form */}
        {showForm && (
          <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm dark:border-blue-500/20 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Register a New Vehicle
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter the details exactly as they appear on the vehicle registration certificate (RC).
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Registration Number */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Registration Number <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. GJ06AB1234"
                  value={reg}
                  onChange={(e) => setReg(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm uppercase text-gray-800 outline-none placeholder:normal-case placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* Make */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Make (Brand) <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Select make</option>
                  {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Swift, Creta, Nexon"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* Manufacturing Year */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Manufacturing Year <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Select year</option>
                  {Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Vehicle Value */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vehicle Value (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min={1}
                  step="1000"
                  placeholder="e.g. 800000"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* Submit row */}
              <div className="sm:col-span-2 flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Registering…" : "Register Vehicle"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Vehicle List */}
        {loading ? (
          <p className="text-sm text-gray-400">Loading your vehicles…</p>
        ) : vehicles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              No vehicles registered yet.
            </p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Register your vehicle above to get started with insurance.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              + Register Your First Vehicle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {vehicles.map((v) => (
              <div
                key={v.vehicle_id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                {/* Vehicle icon + reg */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl dark:bg-blue-500/10">
                    🚗
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-gray-300">
                    {v.registration_number}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                  {v.make} {v.model}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {v.manufacturing_year}
                </p>

                <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Vehicle Value</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    ₹{Number(v.vehicle_value).toLocaleString("en-IN")}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/policies/buy?vehicle_id=${v.vehicle_id}`}
                    className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-medium text-white transition hover:bg-blue-700"
                  >
                    Get Insurance
                  </Link>
                  <Link
                    to="/policies"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-center text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    View Policy
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/5">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              i
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Each vehicle can have one active policy
              </h3>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                Register your vehicle first, then purchase an insurance plan. Once insured, you
                can submit claims for that vehicle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
