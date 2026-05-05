import { Loader2, MessageSquareWarning, RotateCcw, XCircle } from "lucide-react";
import type { ContentActionType, ContentSubmission } from "./types";

interface RevisionRequestModalProps {
  open: boolean;
  mode: Extract<ContentActionType, "revision" | "reject">;
  submission: ContentSubmission | null;
  message: string;
  submitting?: boolean;
  onMessageChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function RevisionRequestModal({
  open,
  mode,
  submission,
  message,
  submitting = false,
  onMessageChange,
  onClose,
  onConfirm,
}: RevisionRequestModalProps) {
  if (!open || !submission) {
    return null;
  }

  const isReject = mode === "reject";
  const title = isReject ? "Reject content submission" : "Request revision";
  const helper = isReject
    ? "Reject chỉ nên dùng khi nội dung chưa đủ chất lượng để chỉnh sửa nhẹ. Copy cần rõ nhưng vẫn lịch sự."
    : "Request revision nên mềm hơn reject: nêu điểm cần chỉnh cụ thể để owner sửa nhanh và nộp lại.";
  const quickMessages = isReject
    ? [
        "Nội dung hiện còn quá ngắn để dùng cho trải nghiệm Smart Food Tour.",
        "Thông tin chưa đủ rõ về quán và trải nghiệm thực khách.",
        "Tone nội dung chưa phù hợp để xuất hiện trong hệ thống hướng dẫn.",
      ]
    : [
        "Vui lòng bổ sung thêm 1-2 câu về trải nghiệm đặc trưng tại quán.",
        "Nên làm rõ món signature hoặc điểm nhận diện thương hiệu.",
        "Cần chỉnh nhịp câu để audio script tự nhiên hơn khi đọc.",
      ];

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
      <div className="relative w-full max-w-[600px] rounded-[28px] border border-border bg-card shadow-2xl">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  isReject ? "bg-destructive/10 text-destructive" : "bg-[#C9A84C]/10 text-[#A8890A]"
                }`}
              >
                {isReject ? (
                  <MessageSquareWarning className="h-5 w-5" />
                ) : (
                  <RotateCcw className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-[18px] text-foreground">{title}</p>
                <p className="mt-1 text-[12px] leading-6 text-muted-foreground">{helper}</p>
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

          <div>
            <label className="mb-2 block text-[12px] text-foreground">
              {isReject ? "Reason sent to owner" : "Revision request"}
            </label>
            <textarea
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              placeholder={
                isReject
                  ? "Ví dụ: Nội dung hiện chưa đủ chi tiết về quán và trải nghiệm khách. Vui lòng viết lại cụ thể hơn rồi gửi lại."
                  : "Ví dụ: Vui lòng bổ sung thêm phần mô tả món signature và chỉnh phần script để câu ngắn, dễ nghe hơn."
              }
              className="min-h-[132px] w-full rounded-2xl border border-border bg-input-background px-4 py-3 text-[13px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
            />
            <p className="mt-2 text-[11px] text-muted-foreground">
              {isReject
                ? "Reject vẫn nên nêu rõ lý do để owner biết cần viết lại từ đâu."
                : "Request revision nên đưa chỉ dẫn cụ thể, ngắn gọn và mang tính hỗ trợ."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickMessages.map((item) => (
              <button
                key={item}
                disabled={submitting}
                onClick={() => onMessageChange(item)}
                className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                  isReject
                    ? "border-destructive/15 bg-destructive/5 text-destructive hover:bg-destructive/10"
                    : "border-[#C9A84C]/15 bg-[#C9A84C]/8 text-[#A8890A] hover:bg-[#C9A84C]/12"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-secondary/10 px-6 py-4">
          <p className="text-[11px] text-muted-foreground">
            {isReject
              ? "Reject là action mạnh nhất, luôn cần reason trước khi submit."
              : "Revision request là nhịp phản hồi trung gian, mềm hơn reject."}
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
              disabled={submitting || message.trim().length < 12}
              onClick={onConfirm}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                isReject
                  ? "border border-destructive/15 bg-destructive/10 text-destructive hover:bg-destructive/15"
                  : "border border-[#C9A84C]/18 bg-[#C9A84C]/12 text-[#A8890A] hover:bg-[#C9A84C]/18"
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isReject ? "Đang reject" : "Đang gửi revision"}
                </>
              ) : isReject ? (
                "Gửi phản hồi & Reject"
              ) : (
                "Gửi yêu cầu chỉnh sửa"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
