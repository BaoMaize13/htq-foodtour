import { BadgeCheck, Loader2, XCircle } from "lucide-react";
import type { ContentSubmission } from "./types";

interface ApproveConfirmModalProps {
  open: boolean;
  submission: ContentSubmission | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ApproveConfirmModal({
  open,
  submission,
  submitting = false,
  onClose,
  onConfirm,
}: ApproveConfirmModalProps) {
  if (!open || !submission) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          if (!submitting) {
            onClose();
          }
        }}
      />
      <div className="relative w-full max-w-[520px] rounded-[28px] border border-border bg-card shadow-2xl">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2D5A3D]/10 text-[#2D5A3D]">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[18px] text-foreground">Approve content</p>
                <p className="mt-1 text-[12px] leading-6 text-muted-foreground">
                  Approval là action tích cực nhưng vẫn có bước confirm ngắn để admin tránh thao tác nhầm.
                </p>
              </div>
            </div>
            <button
              disabled={submitting}
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-2xl border border-border bg-secondary/20 px-4 py-3">
            <p className="text-[12px] text-foreground">{submission.title}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {submission.relatedPOI.name} · {submission.submittedBy.name}
            </p>
          </div>
          <div className="rounded-2xl border border-[#2D5A3D]/15 bg-[#2D5A3D]/5 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#2D5A3D]">
              Approval impact
            </p>
            <p className="mt-2 text-[12px] leading-6 text-foreground">
              Sau khi approve, nội dung sẽ sẵn sàng chuyển sang bước publish/onboarding tiếp theo trong hệ thống.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-secondary/10 px-6 py-4">
          <p className="text-[11px] text-muted-foreground">
            Approve dùng tone xanh dịu và confirm nhanh, không tạo cảm giác nặng nề.
          </p>
          <div className="flex items-center gap-3">
            <button
              disabled={submitting}
              onClick={onClose}
              className="rounded-xl bg-secondary px-4 py-2.5 text-[13px] text-secondary-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
            >
              Hủy
            </button>
            <button
              disabled={submitting}
              onClick={onConfirm}
              className="inline-flex items-center gap-2 rounded-xl border border-[#2D5A3D]/18 bg-[#2D5A3D]/10 px-4 py-2.5 text-[13px] text-[#2D5A3D] transition-colors hover:bg-[#2D5A3D]/15 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang approve
                </>
              ) : (
                "Xác nhận duyệt"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
