import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, MessageSquareWarning, RefreshCw } from "lucide-react";
import { OwnerProfilePreviewCard } from "../owner-approval/owner-profile-preview-card";
import { OwnerTable } from "../owner-approval/owner-table";
import { RejectReasonModal } from "../owner-approval/reject-reason-modal";
import { SummaryCard } from "../owner-approval/summary-card";
import {
  approveOwnerApplication,
  fetchOwnerApplications,
  rejectOwnerApplication,
} from "../owner-approval/owner-approval.service";
import type {
  OwnerActionInFlight,
  OwnerApplication,
  OwnerApplicationListMeta,
  ReviewActionType,
} from "../owner-approval/types";
import { PageHeader } from "../shared/page-header";

const reviewerContext = {
  reviewerId: "admin-smart-food-tour",
  reviewerName: "Smart Food Tour Admin",
};

const emptyMeta: OwnerApplicationListMeta = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  needsAttention: 0,
  approvedToday: 0,
};

export function OwnerApprovalPage() {
  const [applications, setApplications] = useState<OwnerApplication[]>([]);
  const [meta, setMeta] = useState<OwnerApplicationListMeta>(emptyMeta);
  const [requestState, setRequestState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [feedback, setFeedback] = useState<{ type: ReviewActionType; message: string } | null>(null);
  const [actionInFlight, setActionInFlight] = useState<OwnerActionInFlight | null>(null);

  const loadApplications = async () => {
    setRequestState("loading");

    try {
      const response = await fetchOwnerApplications();
      setApplications(response.data);
      setMeta(response.meta || emptyMeta);
      setRequestState("success");
    } catch {
      setRequestState("error");
    }
  };

  useEffect(() => {
    void loadApplications();
  }, []);

  const selectedOwner = useMemo(
    () => applications.find((item) => item.id === selectedOwnerId) ?? applications[0] ?? null,
    [applications, selectedOwnerId]
  );

  useEffect(() => {
    if (!selectedOwnerId && applications.length > 0) {
      setSelectedOwnerId(applications[0].id);
    }
  }, [applications, selectedOwnerId]);

  const rejectTarget = applications.find((item) => item.id === rejectTargetId) ?? null;

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 3200);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const handleApprove = async (owner: OwnerApplication) => {
    if (actionInFlight) return;

    setActionInFlight({ ownerId: owner.id, action: "approve" });

    try {
      const response = await approveOwnerApplication(owner.id, {
        ...reviewerContext,
        note: owner.review.adminNote,
      });

      setApplications((current) => current.map((item) => (item.id === response.application.id ? response.application : item)));
      setMeta(response.meta || emptyMeta);
      setFeedback({ type: "approve", message: `Đã approve hồ sơ của ${owner.owner.fullName}.` });
    } catch {
      setRequestState("error");
    } finally {
      setActionInFlight(null);
    }
  };

  const handleOpenReject = (owner: OwnerApplication) => {
    setRejectTargetId(owner.id);
    setRejectReason("");
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget || rejectReason.trim().length < 12 || actionInFlight) return;

    setActionInFlight({ ownerId: rejectTarget.id, action: "reject" });

    try {
      const response = await rejectOwnerApplication(rejectTarget.id, {
        ...reviewerContext,
        reason: rejectReason.trim(),
      });

      setApplications((current) => current.map((item) => (item.id === response.application.id ? response.application : item)));
      setMeta(response.meta || emptyMeta);
      setFeedback({ type: "reject", message: `Đã gửi phản hồi từ chối cho ${rejectTarget.owner.fullName}.` });
      setRejectTargetId(null);
      setRejectReason("");
    } catch {
      setRequestState("error");
    } finally {
      setActionInFlight(null);
    }
  };

  const previewBusyAction = selectedOwner && actionInFlight?.ownerId === selectedOwner.id ? actionInFlight.action : null;
  return (
    <div className="space-y-6 pb-10">
      {feedback && (
        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${feedback.type === "approve" ? "border-[#2D5A3D]/18 bg-[#2D5A3D]/5" : "border-[#C9A84C]/18 bg-[#C9A84C]/10"}`}>
          {feedback.type === "approve" ? (
            <BadgeCheck className="h-5 w-5 shrink-0 text-[#2D5A3D]" />
          ) : (
            <MessageSquareWarning className="h-5 w-5 shrink-0 text-[#A8890A]" />
          )}
          <p className="text-[13px] text-foreground">{feedback.message}</p>
        </div>
      )}

      {requestState === "error" && (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/15 bg-destructive/5 px-4 py-3">
          <MessageSquareWarning className="h-5 w-5 shrink-0 text-destructive" />
          <p className="text-[13px] text-foreground">Không thể tải hoặc cập nhật dữ liệu owner approval.</p>
        </div>
      )}

      <PageHeader
        title="Owner Approval"
        subtitle="Duyệt hồ sơ owner đăng ký vào Smart Food Tour với dữ liệu backend thời gian thực."
        action={
          <button
            onClick={() => void loadApplications()}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-[13px] text-secondary-foreground transition-all shadow-sm hover:bg-muted hover:shadow"
          >
            <RefreshCw className={`h-4 w-4 ${requestState === "loading" ? "animate-spin" : ""}`} />
            Làm mới dữ liệu
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Pending owners" value={String(meta.pending)} note="Danh sách ưu tiên cần quyết định hôm nay" tone="primary" />
        <SummaryCard label="Needs attention" value={String(meta.needsAttention)} note="Thiếu giấy tờ hoặc cần đọc kỹ trước khi approve" tone="gold" />
        <SummaryCard label="Approved today" value={String(meta.approvedToday)} note="Giữ nhịp duyệt nhanh nhưng vẫn kiểm soát rủi ro" tone="success" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <OwnerTable
          owners={applications}
          selectedId={selectedOwnerId}
          viewState={requestState === "loading" && applications.length === 0 ? "loading" : "default"}
          actionInFlight={actionInFlight}
          onSelect={(owner) => setSelectedOwnerId(owner.id)}
          onApprove={handleApprove}
          onReject={handleOpenReject}
        />
        <OwnerProfilePreviewCard
          owner={selectedOwner}
          loading={requestState === "loading" && applications.length === 0}
          busyAction={previewBusyAction}
          onApprove={selectedOwner ? () => void handleApprove(selectedOwner) : undefined}
          onReject={selectedOwner ? () => handleOpenReject(selectedOwner) : undefined}
        />
      </div>

      <RejectReasonModal
        owner={rejectTarget}
        open={Boolean(rejectTarget)}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onClose={() => {
          setRejectTargetId(null);
          setRejectReason("");
        }}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
}
