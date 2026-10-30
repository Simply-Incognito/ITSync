import { useCallback, useEffect, useState } from "react";
import { Building2, Download, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  administrationApi,
  organizationAdminApi,
  type AdminOrganization,
  type OrganizationReviewDocument,
  type OrganizationReviewProfile,
} from "../../services/api";

const pageSize = 20;
const statuses = [
  "draft",
  "pending",
  "verified",
  "rejected",
  "suspended",
] as const;
const verificationChecks = [
  ["registryRecordFound", "Registry record found"],
  ["legalNameAndNumberMatch", "Legal name and registration number match"],
  ["representativeAuthorityConfirmed", "Representative authority confirmed"],
  [
    "independentlySourcedContactConfirmed",
    "Contact details independently confirmed",
  ],
  ["documentsAppearAuthentic", "Submitted documents appear authentic"],
] as const;
type ReviewStatus = "verified" | "rejected" | "suspended";
type ReviewDetails = {
  organization: OrganizationReviewProfile;
  documents: OrganizationReviewDocument[];
  events: Array<{
    _id: string;
    action: string;
    fromStatus?: string;
    toStatus: string;
    note?: string;
    createdAt: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function statusStyle(status: AdminOrganization["verificationStatus"]) {
  if (status === "verified") return "bg-primary-100 text-primary-800";
  if (status === "pending") return "bg-amber-100 text-amber-800";
  if (status === "rejected" || status === "suspended")
    return "bg-rose-100 text-rose-800";
  return "bg-slate-100 text-slate-700";
}

export default function AdminOrganizations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryStatus = searchParams.get("status") ?? "";
  const status = statuses.includes(queryStatus as (typeof statuses)[number])
    ? queryStatus
    : "";
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedOrganization, setSelectedOrganization] =
    useState<AdminOrganization | null>(null);
  const [review, setReview] = useState<ReviewDetails | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [openingDocumentId, setOpeningDocumentId] = useState("");
  const [registrySource, setRegistrySource] = useState("");
  const [registryReference, setRegistryReference] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [reason, setReason] = useState("");
  const [checks, setChecks] = useState<
    Record<(typeof verificationChecks)[number][0], boolean>
  >({
    registryRecordFound: false,
    legalNameAndNumberMatch: false,
    representativeAuthorityConfirmed: false,
    independentlySourcedContactConfirmed: false,
    documentsAppearAuthentic: false,
  });
  const websiteUrl = review?.organization.website;
  const hasSafeWebsite = websiteUrl && /^https?:\/\//i.test(websiteUrl);

  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await administrationApi.listOrganizations({
        page,
        limit: pageSize,
        status,
      });
      setOrganizations(response.organizations);
      setTotal(response.pagination.total);
      setTotalPages(Math.max(1, response.pagination.totalPages));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load organizations.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  const closeReview = useCallback(() => {
    setSelectedOrganization(null);
    setReview(null);
    setReviewError("");
    setReason("");
    setRegistrySource("");
    setRegistryReference("");
    setReviewNote("");
    setChecks({
      registryRecordFound: false,
      legalNameAndNumberMatch: false,
      representativeAuthorityConfirmed: false,
      independentlySourcedContactConfirmed: false,
      documentsAppearAuthentic: false,
    });
  }, []);

  async function openReview(organization: AdminOrganization) {
    setSelectedOrganization(organization);
    setReview(null);
    setReviewError("");
    setReviewLoading(true);
    try {
      setReview(await organizationAdminApi.getReview(organization._id));
    } catch (requestError) {
      setReviewError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load organization review.",
      );
    } finally {
      setReviewLoading(false);
    }
  }

  function updateFilter(value: string) {
    setPage(1);
    if (value) setSearchParams({ status: value });
    else setSearchParams({});
  }

  async function submitReviewAction(action: ReviewStatus) {
    if (!selectedOrganization || !review) return;
    setReviewError("");
    setActionBusy(true);
    try {
      if (action === "verified") {
        if (
          !registrySource.trim() ||
          !registryReference.trim() ||
          !verificationChecks.every(([key]) => checks[key])
        ) {
          setReviewError(
            "Provide the registry source and reference, and confirm every verification check.",
          );
          return;
        }
        await organizationAdminApi.approve(selectedOrganization._id, {
          registrySource: registrySource.trim(),
          registryReference: registryReference.trim(),
          checks: {
            registryRecordFound: true,
            legalNameAndNumberMatch: true,
            representativeAuthorityConfirmed: true,
            independentlySourcedContactConfirmed: true,
            documentsAppearAuthentic: true,
          },
          ...(reviewNote.trim() ? { note: reviewNote.trim() } : {}),
        });
      } else {
        if (reason.trim().length < 10) {
          setReviewError("Enter a reason of at least 10 characters.");
          return;
        }
        if (action === "rejected") {
          await organizationAdminApi.reject(
            selectedOrganization._id,
            reason.trim(),
          );
        } else {
          await organizationAdminApi.suspend(
            selectedOrganization._id,
            reason.trim(),
          );
        }
      }

      setNotice(`${selectedOrganization.legalName} was ${action}.`);
      closeReview();
      await loadOrganizations();
    } catch (requestError) {
      setReviewError(
        requestError instanceof Error
          ? requestError.message
          : "Could not update organization review.",
      );
    } finally {
      setActionBusy(false);
    }
  }

  async function downloadDocument(document: OrganizationReviewDocument) {
    if (!selectedOrganization) return;
    setOpeningDocumentId(document.id);
    setReviewError("");
    try {
      const url = await organizationAdminApi.openDocument(
        selectedOrganization._id,
        document.id,
      );
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.originalName;
      link.rel = "noreferrer";
      window.document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (requestError) {
      setReviewError(
        requestError instanceof Error
          ? requestError.message
          : "Could not download document.",
      );
    } finally {
      setOpeningDocumentId("");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">
          Organization review
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Review profiles and evidence before making verification decisions.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="text-sm font-medium text-slate-700">
          Filter by status
          <select
            value={status}
            onChange={(event) => updateFilter(event.target.value)}
            className="ml-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-normal"
          >
            <option value="">All organizations</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value[0].toUpperCase() + value.slice(1)}
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
            Loading organizations…
          </p>
        ) : organizations.length === 0 ? (
          <div className="p-10 text-center">
            <Building2 className="mx-auto mb-3 text-slate-300" size={36} />
            <p className="text-sm text-slate-500">
              No organizations match this status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Organization</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 font-semibold">Verification</th>
                  <th className="px-5 py-3 font-semibold">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {organizations.map((organization) => (
                  <tr key={organization._id}>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {organization.legalName}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(organization.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle(organization.verificationStatus)}`}
                      >
                        {organization.verificationStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => void openReview(organization)}
                        className="rounded-lg bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                      >
                        Review details
                      </button>
                    </td>
                  </tr>
                ))}
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

      {selectedOrganization && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="organization-review-title"
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h3
                  id="organization-review-title"
                  className="text-xl font-bold text-slate-900"
                >
                  {selectedOrganization.legalName}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Organization verification review
                </p>
              </div>
              <button
                type="button"
                onClick={closeReview}
                aria-label="Close review"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {reviewLoading ? (
              <p className="p-10 text-center text-sm text-slate-500">
                Loading organization details…
              </p>
            ) : review ? (
              <div className="space-y-6 p-6">
                {reviewError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                  >
                    {reviewError}
                  </div>
                )}

                <section>
                  <h4 className="mb-3 font-semibold text-slate-900">
                    Organization profile
                  </h4>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">Legal name</dt>
                      <dd className="font-medium text-slate-800">
                        {review.organization.legalName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Trading name</dt>
                      <dd className="font-medium text-slate-800">
                        {review.organization.tradingName || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Registration number</dt>
                      <dd className="font-medium text-slate-800">
                        {review.organization.registrationCountry} ·{" "}
                        {review.organization.registrationNumber}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Industry</dt>
                      <dd className="font-medium text-slate-800">
                        {review.organization.industry}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Representative</dt>
                      <dd className="font-medium text-slate-800">
                        {review.organization.representativeName} ·{" "}
                        {review.organization.representativeTitle}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Address</dt>
                      <dd className="font-medium text-slate-800">
                        {review.organization.address.street},{" "}
                        {review.organization.address.city},{" "}
                        {review.organization.address.state},{" "}
                        {review.organization.address.country}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-slate-500">Description</dt>
                      <dd className="mt-1 whitespace-pre-wrap text-slate-700">
                        {review.organization.description}
                      </dd>
                    </div>
                    {websiteUrl && (
                      <div>
                        <dt className="text-slate-500">Website</dt>
                        <dd>
                          {hasSafeWebsite ? (
                            <a
                              className="font-medium text-primary-700 underline"
                              href={websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {websiteUrl}
                            </a>
                          ) : (
                            <span className="font-medium text-slate-800">
                              {websiteUrl}
                            </span>
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>

                <section>
                  <h4 className="mb-3 font-semibold text-slate-900">
                    Submitted documents
                  </h4>
                  {review.documents.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No documents have been uploaded.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                      {review.documents.map((document) => (
                        <li
                          key={document.id}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {document.originalName}
                            </p>
                            <p className="mt-1 text-xs capitalize text-slate-500">
                              {document.documentType.replace(/_/g, " ")} ·{" "}
                              {(document.byteSize / 1024).toFixed(0)} KB ·{" "}
                              {formatDate(document.uploadedAt)}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={openingDocumentId === document.id}
                            onClick={() => void downloadDocument(document)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            <Download size={15} />{" "}
                            {openingDocumentId === document.id
                              ? "Opening…"
                              : "Download"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <h4 className="mb-3 font-semibold text-slate-900">
                    Review history
                  </h4>
                  {review.events.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No previous review actions.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {review.events.map((event) => (
                        <li
                          key={event._id}
                          className="rounded-xl bg-slate-50 p-3 text-sm"
                        >
                          <p className="font-medium capitalize text-slate-800">
                            {event.action} · {event.fromStatus || "created"} →{" "}
                            {event.toStatus}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(event.createdAt)}
                            {event.note ? ` · ${event.note}` : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {selectedOrganization.verificationStatus === "pending" && (
                  <section className="space-y-4 border-t border-slate-200 pt-5">
                    <h4 className="font-semibold text-slate-900">
                      Verification decision
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm font-medium text-slate-700">
                        Registry source
                        <input
                          value={registrySource}
                          onChange={(event) =>
                            setRegistrySource(event.target.value)
                          }
                          minLength={2}
                          maxLength={200}
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
                          placeholder="Official registry"
                        />
                      </label>
                      <label className="text-sm font-medium text-slate-700">
                        Registry reference
                        <input
                          value={registryReference}
                          onChange={(event) =>
                            setRegistryReference(event.target.value)
                          }
                          minLength={2}
                          maxLength={200}
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
                          placeholder="Record / search reference"
                        />
                      </label>
                    </div>
                    <div className="space-y-2">
                      {verificationChecks.map(([key, label]) => (
                        <label
                          key={key}
                          className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700"
                        >
                          <input
                            type="checkbox"
                            checked={checks[key]}
                            onChange={(event) =>
                              setChecks((current) => ({
                                ...current,
                                [key]: event.target.checked,
                              }))
                            }
                            className="mt-0.5 accent-primary-600"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <label className="block text-sm font-medium text-slate-700">
                      Review note (optional)
                      <textarea
                        value={reviewNote}
                        onChange={(event) => setReviewNote(event.target.value)}
                        maxLength={2000}
                        rows={2}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
                      />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Rejection reason or suspension reason
                      <textarea
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        minLength={10}
                        maxLength={2000}
                        rows={2}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
                        placeholder="Required for rejection or suspension (at least 10 characters)"
                      />
                    </label>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => void submitReviewAction("rejected")}
                        className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => void submitReviewAction("suspended")}
                        className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                      >
                        Suspend
                      </button>
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => void submitReviewAction("verified")}
                        className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        {actionBusy ? "Saving…" : "Verify organization"}
                      </button>
                    </div>
                  </section>
                )}

                {selectedOrganization.verificationStatus === "verified" && (
                  <section className="space-y-3 border-t border-slate-200 pt-5">
                    <h4 className="font-semibold text-slate-900">
                      Suspend organization
                    </h4>
                    <label className="block text-sm font-medium text-slate-700">
                      Reason
                      <textarea
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        minLength={10}
                        maxLength={2000}
                        rows={2}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
                        placeholder="Provide a reason of at least 10 characters"
                      />
                    </label>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => void submitReviewAction("suspended")}
                        className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                      >
                        Suspend organization
                      </button>
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <p className="p-8 text-sm text-slate-500">
                Organization details could not be loaded.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
