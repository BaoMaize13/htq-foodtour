import type { ReactNode } from "react";

interface StatePreviewCardProps {
  title: string;
  subtitle: string;
  tone: "neutral" | "gold" | "green" | "red";
  icon: ReactNode;
}

export function StatePreviewCard({
  title,
  subtitle,
  tone,
  icon,
}: StatePreviewCardProps) {
  const toneClass =
    tone === "gold"
      ? "border-[#C9A84C]/15 bg-[#C9A84C]/8"
      : tone === "green"
        ? "border-[#2D5A3D]/15 bg-[#2D5A3D]/5"
        : tone === "red"
          ? "border-destructive/15 bg-destructive/5"
          : "border-border bg-background";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[13px] text-foreground">{title}</p>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}
