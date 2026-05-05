import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  trend?: { value: string; direction: "up" | "down"; label?: string };
  subtitle?: string;
  state?: "default" | "loading" | "error" | "empty";
  onRetry?: () => void;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  trend,
  subtitle,
  state = "default",
}: StatCardProps) {
  if (state === "loading") return <StatCardSkeleton />;
  if (state === "error") return <StatCardError label={label} />;

  return (
    <div className="group bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-border/80 transition-all duration-200 relative overflow-hidden">
      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-[0.03] pointer-events-none">
        <Icon className="w-20 h-20 -translate-y-2 translate-x-2" />
      </div>

      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] ${
              trend.direction === "up"
                ? "bg-[#2D5A3D]/10 text-[#2D5A3D]"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      <p className="text-[13px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-[28px] text-foreground leading-tight tracking-tight">
        {state === "empty" ? "—" : value}
      </p>
      {subtitle && (
        <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-muted" />
        <div className="w-14 h-5 rounded-full bg-muted" />
      </div>
      <div className="w-24 h-4 bg-muted rounded mb-2" />
      <div className="w-16 h-8 bg-muted rounded" />
    </div>
  );
}

export function StatCardError({ label }: { label?: string }) {
  return (
    <div className="bg-card rounded-xl border border-destructive/20 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center">
          <span className="text-destructive text-[16px]">!</span>
        </div>
      </div>
      <p className="text-[13px] text-muted-foreground mb-0.5">{label || "Lỗi tải dữ liệu"}</p>
      <p className="text-[12px] text-destructive">Không thể tải</p>
    </div>
  );
}
