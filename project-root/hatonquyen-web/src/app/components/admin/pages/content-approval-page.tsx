import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { ApproveConfirmModal } from "../content-approval/approve-confirm-modal";
import { ContentApprovalTable } from "../content-approval/content-approval-table";
import { ContentPreviewDrawer } from "../content-approval/content-preview-drawer";
import {
  approveContentSubmission,
  fetchContentSubmissions,
  rejectContentSubmission,
  requestRevisionForContent,
} from "../content-approval/content-approval.service";
import { RevisionRequestModal } from "../content-approval/revision-request-modal";
import type {
  ContentActionInFlight,
  ContentActionType,
  ContentApprovalListMeta,
  ContentSubmission,
} from "../content-approval/types";
import { SummaryCard } from "../owner-approval/summary-card";
import { PageHeader } from "../shared/page-header";

const reviewerContext = {
  reviewerId: "admin-smart-food-tour",
  reviewerName: "Smart Food Tour Admin",
};

const emptyMeta: ContentApprovalListMeta = {
  total: 0,
  pending: 0,
  approved: 0,
  revisionRequested: 0,
  rejected: 0,
  readyToApprove: 0,
};

export function ContentApprovalPage() {
  const logApiError = (error: unknown) => {
    const err = error as any;
    console.error("API FETCH ERROR in Content Approval:", err?.response?.status, err?.response?.data || err?.message || err);
  };

  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [meta, setMeta] = useState<ContentApprovalListMeta>(emptyMeta);
  const [requestState, setRequestState] = useState<"idle" | "loading" | "success" | "error">("loading");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"revision" | "reject">("revision");
  const [modalTargetId, setModalTargetId] = useState<string | null>(null);
  const [modalMessage, setModalMessage] = useState("");
  const [feedback, setFeedback] = useState<{ type: ContentActionType; message: string } | null>(null);
  const [actionInFlight, setActionInFlight] = useState<ContentActionInFlight | null>(null);

  const loadSubmissions = async () => {
    setRequestState("loading");

    try {
      const response = await fetchContentSubmissions();
      setSubmissions(response.data);
      setMeta(response.meta || emptyMeta);
      setRequestState("success");
    } catch {
      setRequestState("error");
    }
  };

  useEffect(() => {
    void loadSubmissions();
  }, []);

  const selectedSubmission = useMemo(
    () => submissions.find((item) => item.id === selectedSubmissionId) ?? submissions[0] ?? null,
    [submissions, selectedSubmissionId]
  );

  useEffect(() => {
    if (!selectedSubmissionId && submissions.length > 0) {
      setSelectedSubmissionId(submissions[0].id);
    }
  }, [selectedSubmissionId, submissions]);

  const approveTarget = submissions.find((item) => item.id === approveTargetId) ?? null;
  const modalTarget = submissions.find((item) => item.id === modalTargetId) ?? null;

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 3200);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const handleOpenApproveConfirm = (submission: ContentSubmission) => {
    setSelectedSubmissionId(submission.id);
    setApproveTargetId(submission.id);
  };

  const handleConfirmApprove = async () => {
    if (!approveTarget || actionInFlight) return;

    setActionInFlight({ submissionId: approveTarget.id, action: "approve" });

    try {
      await approveContentSubmission(approveTarget.id, {
        ...reviewerContext,
        note: approveTarget.moderation.note,
      });

      await loadSubmissions();
      setFeedback({ type: "approve", message: `Đã approve nội dung "${approveTarget.title}".` });
      setApproveTargetId(null);
      setRequestState("success");
    } catch (error) {
      logApiError(error);
      setRequestState("error");
    } finally {
      setActionInFlight(null);
    }
  };

  const handleOpenModal = (mode: "revision" | "reject", submission: ContentSubmission) => {
    setSelectedSubmissionId(submission.id);
    setModalMode(mode);
    setModalTargetId(submission.id);
    setModalMessage("");
  };

  const handleConfirmModal = async () => {
    if (!modalTarget || modalMessage.trim().length < 12 || actionInFlight) return;

    setActionInFlight({ submissionId: modalTarget.id, action: modalMode });

    try {
      await (
        modalMode === "revision"
          ? await requestRevisionForContent(modalTarget.id, {
              ...reviewerContext,
              message: modalMessage.trim(),
            })
          : await rejectContentSubmission(modalTarget.id, {
              ...reviewerContext,
              reason: modalMessage.trim(),
            })
      );

      await loadSubmissions();
      setFeedback({
        type: modalMode,
        message:
          modalMode === "revision"
            ? `Đã gửi yêu cầu chỉnh sửa cho "${modalTarget.title}".`
            : `Đã từ chối nội dung "${modalTarget.title}".`,
      });
      setRequestState("success");
      setModalTargetId(null);
      setModalMessage("");
    } catch (error) {
      logApiError(error);
      setRequestState("error");
    } finally {
      setActionInFlight(null);
    }
  };

  const previewBusyAction = selectedSubmission && actionInFlight?.submissionId === selectedSubmission.id ? actionInFlight.action : null;

  return (
    <div className="space-y-6 pb-10">
      {feedback && (
        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${feedback.type === "approve" ? "border-[#2D5A3D]/18 bg-[#2D5A3D]/5" : feedback.type === "revision" ? "border-[#C9A84C]/18 bg-[#C9A84C]/10" : "border-destructive/15 bg-destructive/5"}`}>
          {feedback.type === "approve" ? (
            <RefreshCw className="h-5 w-5 shrink-0 text-[#2D5A3D]" />
          ) : feedback.type === "revision" ? (
            <RefreshCw className="h-5 w-5 shrink-0 text-[#A8890A]" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          )}
          <p className="text-[13px] text-foreground">{feedback.message}</p>
        </div>
      )}

      {requestState === "error" && (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/15 bg-destructive/5 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          <p className="text-[13px] text-foreground">Không thể tải hoặc cập nhật dữ liệu content approval.</p>
        </div>
      )}

      <PageHeader
        title="Content Approval"
        subtitle="Duyệt nội dung owner gửi lên với dữ liệu backend thời gian thực."
        action={
          <button
            onClick={() => void loadSubmissions()}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-[13px] text-secondary-foreground transition-all shadow-sm hover:bg-muted hover:shadow"
          >
            <RefreshCw className={`h-4 w-4 ${requestState === "loading" ? "animate-spin" : ""}`} />
            Làm mới dữ liệu
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Pending content" value={String(meta.pending)} note="Các nội dung đang cần quyết định moderation hôm nay" tone="primary" />
        <SummaryCard label="Request revision" value={String(meta.revisionRequested)} note="Nhịp phản hồi trung gian mềm hơn reject, giữ cơ hội cải thiện" tone="gold" />
        <SummaryCard label="Ready to approve" value={String(meta.readyToApprove)} note="Những nội dung có quality score cao, phù hợp để duyệt nhanh" tone="success" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_400px]">
        <ContentApprovalTable
          items={submissions}
          selectedId={selectedSubmissionId}
          viewState={requestState === "loading" && submissions.length === 0 ? "loading" : "default"}
          actionInFlight={actionInFlight}
          onSelect={(submission) => setSelectedSubmissionId(submission.id)}
          onApprove={handleOpenApproveConfirm}
          onRequestRevision={(submission) => handleOpenModal("revision", submission)}
          onReject={(submission) => handleOpenModal("reject", submission)}
        />
        <ContentPreviewDrawer
          submission={selectedSubmission}
          loading={requestState === "loading" && submissions.length === 0}
          busyAction={previewBusyAction}
          onApprove={selectedSubmission ? () => handleOpenApproveConfirm(selectedSubmission) : undefined}
          onRequestRevision={selectedSubmission ? () => handleOpenModal("revision", selectedSubmission) : undefined}
          onReject={selectedSubmission ? () => handleOpenModal("reject", selectedSubmission) : undefined}
        />
      </div>

      <ApproveConfirmModal
        submission={approveTarget}
        open={Boolean(approveTarget)}
        onClose={() => setApproveTargetId(null)}
        onConfirm={handleConfirmApprove}
      />

      <RevisionRequestModal
        submission={modalTarget}
        open={Boolean(modalTarget)}
        mode={modalMode}
        message={modalMessage}
        onMessageChange={setModalMessage}
        onClose={() => {
          setModalTargetId(null);
          setModalMessage("");
        }}
        onConfirm={handleConfirmModal}
      />
    </div>
  );
}
