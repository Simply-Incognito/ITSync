import { FormEvent, useCallback, useEffect, useState } from "react";
import { Search, ShieldAlert, UserRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { administrationApi, type AdminUser } from "../../services/api";
import { notify } from "../../lib/notify";

const pageSize = 20;

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await administrationApi.listUsers({
        page,
        limit: pageSize,
        search,
        role,
        status,
      });
      setUsers(response.users);
      setTotal(response.pagination.total);
      setTotalPages(Math.max(1, response.pagination.totalPages));
    } catch (requestError) {
      notify.error(
        requestError instanceof Error
          ? requestError.message
          : "Could not load users.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, role, search, status]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function toggleStatus(target: AdminUser) {
    const nextStatus = target.status === "active" ? "suspended" : "active";
    if (
      !window.confirm(
        `${nextStatus === "suspended" ? "Suspend" : "Reactivate"} ${target.email}?`,
      )
    )
      return;

    setUpdatingId(target._id);
    try {
      await administrationApi.updateUserStatus(target._id, nextStatus);
      notify.success(
        `Account ${nextStatus === "suspended" ? "suspended" : "reactivated"} successfully.`,
      );
      await loadUsers();
    } catch (requestError) {
      notify.error(
        requestError instanceof Error
          ? requestError.message
          : "Could not update account status.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">User management</h2>
        <p className="mt-1 text-sm text-slate-500">
          Search accounts, review roles, and manage account access.
        </p>
      </header>

      <form
        onSubmit={submitSearch}
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_190px_160px_auto]"
      >
        <label className="relative">
          <span className="sr-only">Search by email</span>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search email address"
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </label>
        <label>
          <span className="sr-only">Filter by role</span>
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
          >
            <option value="">All roles</option>
            <option value="student">Student</option>
            <option value="organization_representative">
              Organization representative
            </option>
            <option value="administrator">Administrator</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by account status</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Search
        </button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-900">Accounts</h3>
          <span className="text-sm text-slate-500">
            {total.toLocaleString()} total
          </span>
        </div>
        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">
            Loading users…
          </p>
        ) : users.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">
            No accounts match these filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Account</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((account) => {
                  const isSelf = account._id === currentUser?.id;
                  return (
                    <tr key={account._id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                            <UserRound size={17} />
                          </span>
                          <span className="font-medium text-slate-800">
                            {account.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 capitalize text-slate-600">
                        {account.role.replace(/_/g, " ")}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(account.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${account.status === "active" ? "bg-primary-100 text-primary-800" : "bg-rose-100 text-rose-800"}`}
                        >
                          {account.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {isSelf ? (
                          <span
                            title="You cannot suspend your own account"
                            className="inline-flex items-center gap-1 text-xs text-slate-400"
                          >
                            <ShieldAlert size={14} /> Current account
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={updatingId === account._id}
                            onClick={() => void toggleStatus(account)}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${account.status === "active" ? "bg-rose-50 text-rose-700 hover:bg-rose-100" : "bg-primary-50 text-primary-700 hover:bg-primary-100"}`}
                          >
                            {updatingId === account._id
                              ? "Saving…"
                              : account.status === "active"
                                ? "Suspend"
                                : "Reactivate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => value - 1)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
