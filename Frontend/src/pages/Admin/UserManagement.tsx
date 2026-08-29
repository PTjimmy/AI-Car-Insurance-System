import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { adminApi, type AdminUser, ApiError } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const ROLE_BADGE: Record<string, string> = {
  CUSTOMER:      "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  CLAIM_OFFICER: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  ADMIN:         "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
};

const ROLE_LABEL: Record<string, string> = {
  CUSTOMER:      "Customer",
  CLAIM_OFFICER: "Claim Officer",
  ADMIN:         "Admin",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function UserManagement() {
  const { user: me } = useAuth();
  const [users, setUsers]         = useState<AdminUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [msg, setMsg]             = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = () => {
    setLoading(true);
    adminApi.getUsers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const notify = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleActivate = async (u: AdminUser) => {
    setActionLoading(u.user_id);
    try {
      const updated = await adminApi.activateUser(u.user_id);
      setUsers((prev) => prev.map((x) => x.user_id === updated.user_id ? updated : x));
      notify("ok", `${u.email} has been activated.`);
    } catch (err) {
      notify("err", err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (u: AdminUser) => {
    setActionLoading(u.user_id);
    try {
      const updated = await adminApi.deactivateUser(u.user_id);
      setUsers((prev) => prev.map((x) => x.user_id === updated.user_id ? updated : x));
      notify("ok", `${u.email} has been deactivated.`);
    } catch (err) {
      notify("err", err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (u: AdminUser) => {
    setConfirmDelete(null);
    setActionLoading(u.user_id);
    try {
      await adminApi.deleteUser(u.user_id);
      setUsers((prev) => prev.filter((x) => x.user_id !== u.user_id));
      notify("ok", `${u.email} has been permanently deleted.`);
    } catch (err) {
      notify("err", err instanceof ApiError ? err.message : "Delete failed.");
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered list
  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter   === "ALL" || u.role === roleFilter;
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE"   &&  u.is_active) ||
      (statusFilter === "INACTIVE" && !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  const total     = users.length;
  const customers = users.filter((u) => u.role === "CUSTOMER").length;
  const officers  = users.filter((u) => u.role === "CLAIM_OFFICER").length;
  const inactive  = users.filter((u) => !u.is_active).length;

  return (
    <>
      <PageMeta title="InsureAI | User Management" description="Manage all user accounts." />

      <div className="space-y-6">

        {/* Header */}
        <div>
          <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">Administration</p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
            User Management
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            View, activate, deactivate and delete user accounts.
          </p>
        </div>

        {/* Notification */}
        {msg && (
          <div className={`rounded-lg border px-4 py-3 text-sm ${
            msg.type === "ok"
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/5 dark:text-green-400"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400"
          }`}>
            {msg.text}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Users",    value: total,     color: "text-gray-900 dark:text-white" },
            { label: "Customers",      value: customers,  color: "text-blue-700 dark:text-blue-400" },
            { label: "Claim Officers", value: officers,   color: "text-purple-700 dark:text-purple-400" },
            { label: "Inactive",       value: inactive,   color: "text-red-700 dark:text-red-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search by email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="ALL">All Roles</option>
            <option value="CUSTOMER">Customers</option>
            <option value="CLAIM_OFFICER">Officers</option>
            <option value="ADMIN">Admins</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button
            onClick={load}
            className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            ↺ Refresh
          </button>
        </div>

        {/* Users table */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 p-5 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              All Users
              <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length} shown)</span>
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading users…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No users match your filters.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((u) => {
                const isMe = u.user_id === me?.user_id;
                const busy = actionLoading === u.user_id;

                return (
                  <div key={u.user_id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">

                    {/* Left: user info */}
                    <div className="flex items-start gap-4">
                      {/* Avatar initials */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                        {u.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {u.email}
                            {isMe && (
                              <span className="ml-2 text-xs font-normal text-gray-400">(you)</span>
                            )}
                          </p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_BADGE[u.role] ?? ""}`}>
                            {ROLE_LABEL[u.role] ?? u.role}
                          </span>
                          {!u.is_active && (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                              Inactive
                            </span>
                          )}
                          {!u.is_verified && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                              Unverified
                            </span>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>ID: {u.user_id}</span>
                          <span>Joined: {formatDate(u.created_at)}</span>
                          {u.customer_id && <span>Customer ID: {u.customer_id}</span>}
                          {u.officer_id  && <span>Officer ID: {u.officer_id}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Right: actions */}
                    {!isMe && (
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {u.is_active ? (
                          <button
                            onClick={() => handleDeactivate(u)}
                            disabled={busy}
                            className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-50 dark:border-amber-500/30 dark:text-amber-400"
                          >
                            {busy ? "…" : "Deactivate"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(u)}
                            disabled={busy}
                            className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-50 disabled:opacity-50 dark:border-green-500/30 dark:text-green-400"
                          >
                            {busy ? "…" : "Activate"}
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDelete(u)}
                          disabled={busy}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">!</div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Deletion is permanent</h3>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                Deleting a customer account also removes all their vehicles, policies, claims,
                images and AI analysis records. This cannot be undone. Use Deactivate to
                temporarily block access without losing data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Delete account?
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              You are about to permanently delete:
            </p>
            <p className="mt-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-400">
              {confirmDelete.email} ({ROLE_LABEL[confirmDelete.role]})
            </p>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              This will also delete all their vehicles, policies, claims and uploaded images.
              <strong className="text-red-600"> This cannot be undone.</strong>
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Yes, delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
