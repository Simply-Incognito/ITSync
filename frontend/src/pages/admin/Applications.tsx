import { useCallback, useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import {
  administrationApi,
  type AdminApplication,
  type AdminApplicationStatus,
} from "../../services/api";

const pageSize = 20;
const statuses: AdminApplicationStatus[] = [
  "submitted",
  "under_review",
  "shortlisted",
  "interview",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
];
const nextStatuses: Record<AdminApplicationStatus, AdminApplicationStatus[]> = {
  submitted: ["under_review", "rejected", "withdrawn"],
  under_review: ["shortlisted", "rejected", "withdrawn"],
  shortlisted: ["interview", "rejected", "withdrawn"],
  interview: ["offer", "rejected", "withdrawn"],
  offer: ["accepted", "rejected"],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function studentLabel(application: AdminApplication) {
  if (typeof application.studentId === "string") return application.studentId;
  return (
    application.studentId.fullName || application.studentId.email || "Student"
  );
}

function opportunityLabel(application: AdminApplication) {
  return typeof application.opportunityId === "string"
    ? "Opportunity"
    : application.opportunityId.title || "Opportunity";
}

export default function AdminApplications() {
  const [status, setStatus] = useState<AdminApplicationStatus | "">("");
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<
    Record<string, AdminApplicationStatus>
  >({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await administrationApi.listApplications({
        page,
        limit: pageSize,
        ...(status ? { status } : {}),
      });
      setApplications(response.applications);
      setTotal(response.pagination.total);
      setTotalPages(Math.max(1, response.pagination.totalPages));
      setSelectedStatuses({});
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load applications.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  async function updateStatus(application: AdminApplication) {
    const nextStatus = selectedStatuses[application._id];
    if (!nextStatus || !nextStatuses[application.status].includes(nextStatus))
      return;

    let reason: string | undefined;
    if (nextStatus === "rejected") {
      reason = window.prompt("Reason for rejecting this application:")?.trim();
      if (!reason) return;
      if (reason.length < 5) {
        setError("A rejection reason must be at least 5 characters.");
        return;
      }
    } else if (
      !window.confirm(
        `Change this application from ${application.status.replace(/_/g, " ")} to ${nextStatus.replace(/_/g, " ")}?`,
      )
    ) {
      return;
    }

    setUpdatingId(application._id);
    setError("");
    setNotice("");
    try {
      await administrationApi.updateApplicationStatus(
        application._id,
        nextStatus,
        reason,
      );
      setNotice(
        `Application status updated to ${nextStatus.replace(/_/g, " ")}.`,
      );
      await loadApplications();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not update application status.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">
          Application management
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Review platform applications and apply valid status transitions.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="text-sm font-medium text-slate-700">
          Filter by status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as AdminApplicationStatus | "");
              setPage(1);
            }}
            className="ml-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal"
          >
            <option value="">All applications</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-slate-500">{total.toLocaleString()} total</p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-800"
        >
          {notice}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">
            Loading applications…
          </p>
        ) : applications.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardList className="mx-auto mb-3 text-slate-300" size={36} />
            <p className="text-sm text-slate-500">
              No applications match this status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Student</th>
                  <th className="px-5 py-3 font-semibold">Opportunity</th>
                  <th className="px-5 py-3 font-semibold">Applied</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Update status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((application) => {
                  const options = nextStatuses[application.status];
                  const selectedStatus =
                    selectedStatuses[application._id] || "";
                  return (
                    <tr key={application._id}>
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {studentLabel(application)}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {opportunityLabel(application)}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(application.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                          {application.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {options.length === 0 ? (
                          <span className="text-xs text-slate-400">
                            Final status
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              aria-label={`Next status for ${studentLabel(application)}`}
                              value={selectedStatus}
                              onChange={(event) =>
                                setSelectedStatuses((current) => ({
                                  ...current,
                                  [application._id]: event.target
                                    .value as AdminApplicationStatus,
                                }))
                              }
                              className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs"
                            >
                              <option value="">Choose…</option>
                              {options.map((option) => (
                                <option key={option} value={option}>
                                  {option.replace(/_/g, " ")}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={
                                !selectedStatus ||
                                updatingId === application._id
                              }
                              onClick={() => void updateStatus(application)}
                              className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-40"
                            >
                              {updatingId === application._id
                                ? "Saving…"
                                : "Update"}
                            </button>
                          </div>
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
