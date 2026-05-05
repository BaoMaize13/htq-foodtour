import { Loader2 } from "lucide-react";

interface ModalFooterActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  isDisabled?: boolean;
}

export function ModalFooterActions({
  onCancel,
  onSubmit,
  submitLabel = "Lưu",
  isSubmitting = false,
  isDisabled = false,
}: ModalFooterActionsProps) {
  return (
    <div className="flex items-center justify-end gap-3 pt-5 mt-2 border-t border-border">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-5 py-2.5 rounded-lg text-[13px] bg-secondary text-secondary-foreground hover:bg-muted transition-colors disabled:opacity-50"
      >
        Hủy
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isDisabled || isSubmitting}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {isSubmitting ? "Đang lưu..." : submitLabel}
      </button>
    </div>
  );
}
