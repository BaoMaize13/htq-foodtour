import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Pencil, Trash2, Eye, Copy, Sparkles } from "lucide-react";

interface RowActionMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onDuplicate?: () => void;
  onGenerateAudio?: () => void;
}

export function RowActionMenu({ onEdit, onDelete, onView, onDuplicate, onGenerateAudio }: RowActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
          open ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
        }`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
          {onView && (
            <button
              onClick={() => { onView(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] text-foreground hover:bg-secondary/60 transition-colors"
            >
              <Eye className="w-4 h-4 text-muted-foreground" /> Xem chi tiết
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => { onEdit(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] text-foreground hover:bg-secondary/60 transition-colors"
            >
              <Pencil className="w-4 h-4 text-muted-foreground" /> Chỉnh sửa
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={() => { onDuplicate(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] text-foreground hover:bg-secondary/60 transition-colors"
            >
              <Copy className="w-4 h-4 text-muted-foreground" /> Nhân bản
            </button>
          )}
          {onGenerateAudio && (
            <button
              onClick={() => { onGenerateAudio(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] text-[#C9A84C] hover:bg-[#C9A84C]/5 transition-colors"
            >
              <Sparkles className="w-4 h-4" /> Tạo Audio AI
            </button>
          )}
          {onDelete && (
            <>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => { onDelete(); setOpen(false); }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] text-destructive hover:bg-destructive/5 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Xóa
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}