import { type LucideIcon, ArrowRight } from "lucide-react";

interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  description: string;
  to: string;
  badge?: string;
}

export function QuickActionCard({ icon: Icon, label, description, to, badge }: QuickActionCardProps) {
  return (
    <a
      href={to}
      className="group flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/20 hover:shadow-sm transition-all duration-200"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
        <Icon className="w-[18px] h-[18px] text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] text-foreground">{label}</p>
          {badge && (
            <span className="px-1.5 py-0.5 bg-[#C9A84C]/15 text-[#C9A84C] text-[10px] rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
    </a>
  );
}
