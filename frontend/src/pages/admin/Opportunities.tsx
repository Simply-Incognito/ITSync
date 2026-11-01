import { useCallback, useEffect, useState } from "react";
import { BriefcaseBusiness, MapPin } from "lucide-react";
import { opportunityAdminApi, type AdminOpportunity } from "../../services/api";
import { notify } from "../../lib/notify";

const statuses: AdminOpportunity["status"][] = [
  "pending_review",
  "published",
  "rejected",
  "suspended",
  "closed",
  "draft",
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function getOrganizationName(opportunity: AdminOpportunity) {
  if (!opportunity.organizationId) return "Unknown organization";
  return typeof opportunity.organizationId === "string"
    ? opportunity.organizationId
    : opportunity.organizationId.legalName || opportunity.organizationId._id;
}

export default function AdminOpportunities() {
  const [status, setStatus] =
    useState<AdminOpportunity["status"]>("pending_review");
  const [opportunities, setOpportunities] = useState<AdminOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  const loadOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await opportunityAdminApi.listForReview(status);
      setOpportunities(response.opportunities);
    } catch (requestError) {
      notify.error(
        requestError instanceof Error
          ? requestError.message
          : "Could not load opportunities.",
      );
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void loadOpportunities();
  }, [loadOpportunities]);

  async function moderate(
    opportunity: AdminOpportunity,
    action: "approve" | "reject" | "suspend",
  ) {
    let reason = "";
    if (action !== "approve") {
      const prompt =
        action === "reject"
          ? "Reason for rejecting this opportunity:"
          : "Reason for suspending this opportunity:";
      reason = window.prompt(prompt)?.trim() ?? "";
      if (reason.length < 10) {
        if (reason) notify.error("Enter a reason of at least 10 characters.");
        return;
      }
    } else if (!window.confirm(`Approve and publish "${opportunity.title}"?`)) {
      return;
    }

    setUpdatingId(opportunity._id);
    try {
      if (action === "approve")
        await opportunityAdminApi.approve(opportunity._id);
      else if (action === "reject")
        await opportunityAdminApi.reject(opportunity._id, reason);
      else await opportunityAdminApi.suspend(opportunity._id, reason);
      notify.success(
        `Opportunity ${action === "approve" ? "approved" : `${action}ed`} successfully.`,
      );
      await loadOpportunities();
    } catch (requestError) {
      notify.error(
        requestError instanceof Error
          ? requestError.message
          : "Could not update opportunity review.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">
          Opportunity moderation
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Review organization postings before publication and manage published
          listings.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="text-sm font-medium text-slate-700">
          Filter by status
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as AdminOpportunity["status"])
            }
            className="ml-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal"
          >
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-slate-500">
          {opportunities.length}{" "}
          {opportunities.length === 1 ? "opportunity" : "opportunities"}
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading opportunities…
        </div>
      ) : opportunities.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <BriefcaseBusiness
            className="mx-auto mb-3 text-slate-300"
            size={36}
          />
          <p className="text-sm text-slate-500">
            No opportunities in this status.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opportunity) => (
            <article
              key={opportunity._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {opportunity.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {getOrganizationName(opportunity)}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1 text-sm text-slate-500">
                    <MapPin size={15} />
                    {opportunity.location.city}, {opportunity.location.state},{" "}
                    {opportunity.location.country}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                  {opportunity.status.replace(/_/g, " ")}
                </span>
              </div>
              {opportunity.description && (
                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {opportunity.description}
                </p>
              )}
              <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                {opportunity.fieldOfStudy && <p><strong>Field of study:</strong> {opportunity.fieldOfStudy}</p>}
                {opportunity.workArrangement && <p><strong>Work arrangement:</strong> {opportunity.workArrangement}</p>}
                {opportunity.durationWeeks && <p><strong>Duration:</strong> {opportunity.durationWeeks} weeks</p>}
                {opportunity.availableSlots !== undefined && <p><strong>Available slots:</strong> {opportunity.availableSlots}</p>}
                {opportunity.requiredSkills && opportunity.requiredSkills.length > 0 && (
                  <p><strong>Required skills:</strong> {opportunity.requiredSkills.join(", ")}</p>
                )}
              </div>
              {opportunity.academicRequirements && (
                <p className="mt-3 whitespace-pre-line text-sm text-slate-600">
                  <strong>Academic requirements:</strong> {opportunity.academicRequirements}
                </p>
              )}
              {opportunity.requiredDocuments && opportunity.requiredDocuments.length > 0 && (
                <p className="mt-3 text-sm text-slate-600">
                  <strong>Required documents:</strong> {opportunity.requiredDocuments.join(", ")}
                </p>
              )}
              {opportunity.additionalRequirements && (
                <p className="mt-3 whitespace-pre-line text-sm text-slate-600">
                  <strong>Additional requirements:</strong> {opportunity.additionalRequirements}
                </p>
              )}
              {opportunity.status === "rejected" && opportunity.reviewNote && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-rose-800">Rejection feedback sent to the organization</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-rose-700">{opportunity.reviewNote}</p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">
                  Application deadline:{" "}
                  {formatDate(opportunity.applicationDeadline)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {opportunity.status === "pending_review" && (
                    <>
                      <button
                        type="button"
                        disabled={updatingId === opportunity._id}
                        onClick={() => void moderate(opportunity, "reject")}
                        className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === opportunity._id}
                        onClick={() => void moderate(opportunity, "approve")}
                        className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        {updatingId === opportunity._id
                          ? "Saving…"
                          : "Approve & publish"}
                      </button>
                    </>
                  )}
                  {opportunity.status === "published" && (
                    <button
                      type="button"
                      disabled={updatingId === opportunity._id}
                      onClick={() => void moderate(opportunity, "suspend")}
                      className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      Suspend listing
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
