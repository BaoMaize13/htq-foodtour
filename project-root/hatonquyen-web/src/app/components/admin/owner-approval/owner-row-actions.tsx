import { Eye } from "lucide-react";
import { ApprovalActionGroup } from "./approval-action-group";
import type { ReviewActionType, OwnerApplication } from "./types";

interface OwnerRowActionsProps {
  owner: OwnerApplication;
  busyAction?: ReviewActionType | null;
  onSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export function OwnerRowActions({
  owner,
  busyAction = null,
  onSelect,
  onApprove,
  onReject,
}: OwnerRowActionsProps) {
  if (owner.status !== "pending") {
    return (
      <button
        onClick={onSelect}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
      >
        <Eye className="h-3.5 w-3.5" />
        Xem
      </button>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={onSelect}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
      >
        <Eye className="h-3.5 w-3.5" />
        Review
      </button>
      <ApprovalActionGroup
        compact
        busyAction={busyAction}
        onApprove={onApprove}
        onReject={onReject}
      />
    </div>
  );
}
