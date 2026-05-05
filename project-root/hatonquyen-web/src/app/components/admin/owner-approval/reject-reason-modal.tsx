import { Loader2, MessageSquareWarning, XCircle } from "lucide-react";
import type { OwnerApplication } from "./types";

interface RejectReasonModalProps {
  open: boolean;
  owner: OwnerApplication | null;
  reason: string;
  submitting?: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const quickReasons = [
  "Thông tin giấy phép kinh doanh chưa đầy đủ.",
  "Địa chỉ cửa hàng chưa khớp với hồ sơ.",
  "Cần bổ sung ảnh mặt tiền rõ hơn.",
];

export function RejectReasonModal({
  open,
  owner,
  reason,
  submitting = false,
  onReasonChange,
  onClose,
  onConfirm,
}: RejectReasonModalProps) {
  if (!open || !owner) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={() => {
          if (!submitting) {
            onClose();
          }
        }}
      />
      <div className="relative w-full max-w-[560px] rounded-[28px] border border-border bg-card shadow-2xl">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <MessageSquareWarning className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[18px] text-foreground">
                  Reject owner application
                </p>
                <p className="mt-1 text-[12px] leading-6 text-muted-foreground">
                  Phản hồi sẽ được gửi với giọng điệu lịch sự để chủ cửa hàng biết
                  cần chỉnh sửa gì trước khi nộp lại.
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
            <p className="text-[12px] text-foreground">{owner.business.name}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {owner.owner.fullName} · {owner.owner.email}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-[12px] text-foreground">
              Rejection reason
            </label>
            <textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Ví dụ: Hồ sơ hiện chưa có mã số thuế và ảnh mặt tiền chưa đủ rõ để đối chiếu. Vui lòng bổ sung rồi gửi lại."
              className="min-h-[132px] w-full rounded-2xl border border-border bg-input-background px-4 py-3 text-[13px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
            />
            <p className="mt-2 text-[11px] text-muted-foreground">
              Nên nêu rõ điểm còn thiếu để owner dễ chỉnh sửa và gửi lại.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickReasons.map((item) => (
              <button
                key={item}
                disabled={submitting}
                onClick={() => onReasonChange(item)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/20 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-secondary/10 px-6 py-4">
          <p className="text-[11px] text-muted-foreground">
            Destructive action có copy lịch sự, không dùng wording nặng nề.
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
              disabled={submitting || reason.trim().length < 12}
              onClick={onConfirm}
              className="inline-flex items-center gap-2 rounded-xl border border-destructive/15 bg-destructive/10 px-4 py-2.5 text-[13px] text-destructive transition-colors hover:bg-destructive/15 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang gửi phản hồi
                </>
              ) : (
                "Gửi phản hồi & Từ chối"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
