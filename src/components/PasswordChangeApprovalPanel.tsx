"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/EmptyState";
import { ClipboardCheck } from "lucide-react";
import type { UserRoleSlug } from "@/lib/messageActions";

type PasswordRequestRow = {
  id: number;
  requestedById: string;
  requestedByRole: UserRoleSlug;
  requestedAt: string;
  displayName: string;
  status: string;
};

type PasswordChangeApprovalPanelProps = {
  initialRequests: PasswordRequestRow[];
};

const PasswordChangeApprovalPanel = ({ initialRequests }: PasswordChangeApprovalPanelProps) => {
  const [requests, setRequests] = useState(initialRequests);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const router = useRouter();

  const handleReview = async (id: number, action: "approve" | "reject") => {
    setProcessingId(id);
    try {
      const response = await fetch("/api/password-change/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, action }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Unable to update request.");
      }

      toast.success(`Password request ${action}d.`);
      setRequests((current) => current.filter((request) => request.id !== id));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Password approvals</h2>
          <p className="mt-1 text-sm text-slate-500">Approve or reject pending profile password requests from users.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {requests.length} pending
        </span>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="w-16 h-16" />}
          title="No Pending Approvals"
          message="All password change requests have been reviewed. No action needed."
          variant="info"
        />
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="rounded-3xl bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{request.displayName}</p>
                  <p className="text-sm text-slate-500">{request.requestedByRole.toUpperCase()}</p>
                </div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  {new Date(request.requestedAt).toLocaleString()}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={processingId === request.id}
                  onClick={() => handleReview(request.id, "approve")}
                  className="inline-flex rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={processingId === request.id}
                  onClick={() => handleReview(request.id, "reject")}
                  className="inline-flex rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordChangeApprovalPanel;
