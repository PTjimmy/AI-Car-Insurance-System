import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { adminApi, type AdminStats, type Claim, type OfficerProfile } from "../../lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [officers, setOfficers] = useState<OfficerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([adminApi.getStats(), adminApi.getClaims(), adminApi.getOfficers()])
      .then(([s, c, o]) => {
        setStats(s);
        setClaims(c);
        setOfficers(o);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAssign = async (claimId: number, officerId: number) => {
    setAssigning(claimId);
    try {
      const updated = await adminApi.assignOfficer(claimId, officerId);
      setClaims((prev) =>
        prev.map((c) => (c.claim_id === updated.claim_id ? updated : c))
      );
    } finally {
      setAssigning(null);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400";
      case "Rejected":
        return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
      case "Evidence Requested":
        return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
      case "Under Review":
        return "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400";
      default:
        return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-gray-400">Loading admin dashboard…</p>
      </div>
    );
  }

  const totalClaims = stats?.total_claims ?? 0;
  const claimsByStatus = stats?.claims_by_status ?? {};
  const pendingClaims = claimsByStatus["Pending"] ?? 0;
  const approvedClaims = claimsByStatus["Approved"] ?? 0;
  const rejectedClaims = claimsByStatus["Rejected"] ?? 0;
  const evidenceRequested = claimsByStatus["Evidence Requested"] ?? 0;
  const underReview = claimsByStatus["Under Review"] ?? 0;
  const approvalRate =
    totalClaims > 0 ? Math.round((approvedClaims / totalClaims) * 100) : 0;
  const avgConfidencePct = Math.round((stats?.average_confidence ?? 0) * 100);

  return (
    <>
      <PageMeta
        title="InsureAI | Admin Dashboard"
        description="Monitor policies, claims, AI assessments and insurance activity."
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">
            Administration
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Monitor policies, claims, AI assessments and overall insurance activity.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {stats?.total_users ?? 0}
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {stats?.total_customers ?? 0} customers · {stats?.total_officers ?? 0} officers
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Claims</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {totalClaims}
            </p>
            <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              {totalClaims} claims recorded
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/5">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
            <p className="mt-2 text-3xl font-semibold text-blue-700 dark:text-blue-400">
              {pendingClaims}
            </p>
            <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              Requires officer attention
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-5 shadow-sm dark:border-green-500/20 dark:bg-green-500/5">
            <p className="text-sm text-gray-600 dark:text-gray-400">Approved Claims</p>
            <p className="mt-2 text-3xl font-semibold text-green-700 dark:text-green-400">
              {approvedClaims}
            </p>
            <p className="mt-2 text-xs text-green-600 dark:text-green-400">
              {approvalRate}% approval rate
            </p>
          </div>
        </div>

        {/* Claims Overview */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Claims Overview
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Live claim distribution from the database.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Total", value: totalClaims, cls: "bg-slate-50 dark:bg-white/[0.03]" },
              { label: "Pending", value: pendingClaims, cls: "bg-blue-50 dark:bg-blue-500/5" },
              { label: "Under Review", value: underReview, cls: "bg-purple-50 dark:bg-purple-500/5" },
              { label: "Approved", value: approvedClaims, cls: "bg-green-50 dark:bg-green-500/5" },
              { label: "Rejected", value: rejectedClaims, cls: "bg-red-50 dark:bg-red-500/5" },
            ].map(({ label, value, cls }) => (
              <div key={label} className={`rounded-xl p-5 ${cls}`}>
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Performance */}
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
                Damage assessment statistics from the database.
              </p>
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Average Confidence
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {avgConfidencePct}%
              </p>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${avgConfidencePct}%` }}
              />
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-5 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500 dark:text-gray-400">Assessments Completed</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats?.ai_assessments_completed ?? 0}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-5 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Claims Without AI Analysis
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {totalClaims - (stats?.ai_assessments_completed ?? 0)}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Awaiting image upload
              </p>
            </div>
          </div>
        </div>

        {/* Current Claims + Assign Officers */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 p-6 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Claims
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Assign officers and monitor claim progress.
            </p>
          </div>

          {claims.length === 0 ? (
            <div className="p-6 text-sm text-gray-400">No claims yet.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {claims.map((claim) => (
                <div key={claim.claim_id} className="p-6">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <Link
                        to={`/officer/claims/${claim.claim_id}`}
                        className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
                      >
                        {claim.claim_number}
                      </Link>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {claim.claim_type}
                        {claim.ai_analysis
                          ? ` · AI: ${claim.ai_analysis.damage_severity} (${Math.round((claim.ai_analysis.confidence_score ?? 0) * 100)}%)`
                          : " · No AI analysis yet"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(claim.status)}`}>
                        {claim.status}
                      </span>

                      {/* Officer assignment */}
                      {claim.assigned_officer_id ? (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Assigned to Officer #{claim.assigned_officer_id}
                        </span>
                      ) : (
                        <select
                          className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          defaultValue=""
                          disabled={assigning === claim.claim_id}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssign(claim.claim_id, Number(e.target.value));
                            }
                          }}
                        >
                          <option value="">Assign officer…</option>
                          {officers.map((o) => (
                            <option key={o.officer_id} value={o.officer_id}>
                              {o.first_name} {o.last_name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
