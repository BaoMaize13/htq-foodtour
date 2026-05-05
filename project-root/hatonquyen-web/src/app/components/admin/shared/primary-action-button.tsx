import { type LucideIcon, Plus } from "lucide-react";

interface PrimaryActionButtonProps {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "accent";
}

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
  accent: "bg-[#C9A84C] text-[#1A1215] hover:bg-[#B8960F]",
};

export function PrimaryActionButton({
  label,
  icon: Icon = Plus,
  onClick,
  variant = "primary",
}: PrimaryActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] transition-all shadow-sm hover:shadow ${variants[variant]}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
