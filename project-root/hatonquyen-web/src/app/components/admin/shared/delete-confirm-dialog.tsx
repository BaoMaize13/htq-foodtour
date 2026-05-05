import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
}

export function DeleteConfirmDialog({ open, onClose, onConfirm, title, description }: DeleteConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] text-foreground mb-1">{title}</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              {description || "Hành động này không thể hoàn tác. Dữ liệu sẽ bị xóa vĩnh viễn."}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="px-4 py-2 rounded-lg text-[13px] bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm"
          >
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>
  );
}
