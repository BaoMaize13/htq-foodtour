import { BadgeCheck, Loader2, MessageSquareWarning, RotateCcw } from "lucide-react";
import type { ContentActionType } from "./types";

interface ActionDecisionBarProps {
  compact?: boolean;
  disabled?: boolean;
  busyAction?: ContentActionType | null;
  onApprove?: () => void;
  onRequestRevision?: () => void;
  onReject?: () => void;
}

export function ActionDecisionBar({
  compact = false,
  disabled = false,
  busyAction = null,
  onApprove,
  onRequestRevision,
  onReject,
}: ActionDecisionBarProps) {
  const isBusy = busyAction !== null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          disabled={disabled || isBusy}
          onClick={onApprove}
          className="inline-flex min-w-[82px] items-center justify-center gap-1.5 rounded-lg border border-[#2D5A3D]/15 bg-[#2D5A3D]/8 px-3 py-1.5 text-[12px] text-[#2D5A3D] transition-colors hover:bg-[#2D5A3D]/12 disabled:cursor-not-allowed disabled:opacity-45"
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
          onClick={onRequestRevision}
          className="inline-flex min-w-[82px] items-center justify-center gap-1.5 rounded-lg border border-[#C9A84C]/15 bg-[#C9A84C]/8 px-3 py-1.5 text-[12px] text-[#A8890A] transition-colors hover:bg-[#C9A84C]/12 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busyAction === "revision" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang gửi
            </>
          ) : (
            "Revision"
          )}
        </button>
        <button
          disabled={disabled || isBusy}
          onClick={onReject}
          className="inline-flex min-w-[72px] items-center justify-center gap-1.5 rounded-lg border border-destructive/15 bg-destructive/8 px-3 py-1.5 text-[12px] text-destructive transition-colors hover:bg-destructive/12 disabled:cursor-not-allowed disabled:opacity-45"
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
    <div className="grid gap-3 md:grid-cols-3">
      <button
        disabled={disabled || isBusy}
        onClick={onApprove}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2D5A3D]/18 bg-[#2D5A3D]/10 px-4 py-3 text-[13px] text-[#2D5A3D] transition-colors hover:bg-[#2D5A3D]/15 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {busyAction === "approve" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang approve
          </>
        ) : (
          <>
            <BadgeCheck className="h-4 w-4" />
            Approve Content
          </>
        )}
      </button>

      <button
        disabled={disabled || isBusy}
        onClick={onRequestRevision}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#C9A84C]/18 bg-[#C9A84C]/10 px-4 py-3 text-[13px] text-[#A8890A] transition-colors hover:bg-[#C9A84C]/15 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {busyAction === "revision" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang gửi revision
          </>
        ) : (
          <>
            <RotateCcw className="h-4 w-4" />
            Request Revision
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
            Đang reject
          </>
        ) : (
          <>
            <MessageSquareWarning className="h-4 w-4" />
            Reject
          </>
        )}
      </button>
    </div>
  );
}
