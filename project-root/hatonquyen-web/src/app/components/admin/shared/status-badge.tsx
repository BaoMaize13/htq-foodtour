type BadgeVariant = "active" | "inactive" | "pending" | "draft" | "archived";

const variantStyles: Record<BadgeVariant, string> = {
  active: "bg-[#2D5A3D]/10 text-[#2D5A3D] border-[#2D5A3D]/15",
  inactive: "bg-muted text-muted-foreground border-border",
  pending: "bg-[#C9A84C]/10 text-[#A8890A] border-[#C9A84C]/15",
  draft: "bg-secondary text-muted-foreground border-border",
  archived: "bg-destructive/8 text-destructive border-destructive/15",
};

const variantLabels: Record<BadgeVariant, string> = {
  active: "Hiển thị",
  inactive: "Ẩn",
  pending: "Chờ duyệt",
  draft: "Bản nháp",
  archived: "Đã lưu trữ",
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
}

export function StatusBadge({ variant, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] border ${variantStyles[variant]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${
        variant === "active" ? "bg-[#2D5A3D]" :
        variant === "pending" ? "bg-[#C9A84C]" :
        variant === "archived" ? "bg-destructive" :
        "bg-muted-foreground"
      }`} />
      {label || variantLabels[variant]}
    </span>
  );
}
