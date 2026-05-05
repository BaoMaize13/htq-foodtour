import { BadgeCheck, Loader2, MessageSquareWarning } from "lucide-react";
import type { ReviewActionType } from "./types";

interface ApprovalActionGroupProps {
  compact?: boolean;
  disabled?: boolean;
  busyAction?: ReviewActionType | null;
  onApprove?: () => void;
  onReject?: () => void;
}

export function ApprovalActionGroup({
  compact = false,
  disabled = false,
  busyAction = null,
  onApprove,
  onReject,
}: ApprovalActionGroupProps) {
  const isBusy = busyAction !== null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          disabled={disabled || isBusy}
          onClick={onApprove}
          className="inline-flex min-w-[88px] items-center justify-center gap-1.5 rounded-lg border border-[#2D5A3D]/15 bg-[#2D5A3D]/8 px-3 py-1.5 text-[12px] text-[#2D5A3D] transition-colors hover:bg-[#2D5A3D]/12 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busyAction === "approve" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang duyệt
            </>
          ) : (
            "Approve"
          )}
        </button>
        <button
          disabled={disabled || isBusy}
          onClick={onReject}
          className="inline-flex min-w-[88px] items-center justify-center gap-1.5 rounded-lg border border-destructive/15 bg-destructive/8 px-3 py-1.5 text-[12px] text-destructive transition-colors hover:bg-destructive/12 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busyAction === "reject" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang gửi
            </>
          ) : (
            "Reject"
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        disabled={disabled || isBusy}
        onClick={onApprove}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2D5A3D]/18 bg-[#2D5A3D]/10 px-4 py-3 text-[13px] text-[#2D5A3D] transition-colors hover:bg-[#2D5A3D]/15 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {busyAction === "approve" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang approve owner
          </>
        ) : (
          <>
            <BadgeCheck className="h-4 w-4" />
            Approve Owner
          </>
        )}
      </button>
      <button
        disabled={disabled || isBusy}
        onClick={onReject}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/15 bg-destructive/8 px-4 py-3 text-[13px] text-destructive transition-colors hover:bg-destructive/12 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {busyAction === "reject" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang gửi phản hồi
          </>
        ) : (
          <>
            <MessageSquareWarning className="h-4 w-4" />
            Reject With Reason
          </>
        )}
      </button>
    </div>
  );
}
