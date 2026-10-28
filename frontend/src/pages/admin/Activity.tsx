import { useEffect, useState } from "react";
import { Activity as ActivityIcon } from "lucide-react";
import { administrationApi, type AdminActivityEvent } from "../../services/api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminActivity() {
  const [activities, setActivities] = useState<AdminActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    administrationApi
      .listActivity()
      .then((response) => {
        if (active) setActivities(response.activities);
      })
      .catch((requestError: unknown) => {
        if (active)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Could not load activity.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">
          Administration activity
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          The latest account, organization, opportunity, and application review
          actions.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">
            Loading activity…
          </p>
        ) : activities.length === 0 ? (
          <div className="p-10 text-center">
            <ActivityIcon className="mx-auto mb-3 text-slate-300" size={36} />
            <p className="font-medium text-slate-700">
              No activity recorded yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Administrative changes will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Action</th>
                  <th className="px-5 py-3 font-semibold">Target</th>
                  <th className="px-5 py-3 font-semibold">Administrator</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((log) => (
                  <tr key={log._id}>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {log.action.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-4 capitalize text-slate-600">
                      {log.targetType} ·{" "}
                      <span className="font-mono text-xs">{log.targetId}</span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">
                      {log.actorUserId}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                      {formatDate(log.createdAt)}
                    </td>
                    <td
                      className="max-w-xs truncate px-5 py-4 text-xs text-slate-500"
                      title={JSON.stringify(log.details)}
                    >
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
