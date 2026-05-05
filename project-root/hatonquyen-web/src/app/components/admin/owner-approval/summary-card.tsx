interface SummaryCardProps {
  label: string;
  value: string;
  note: string;
  tone: "primary" | "gold" | "success";
}

export function SummaryCard({ label, value, note, tone }: SummaryCardProps) {
  const toneClass =
    tone === "gold"
      ? "from-[#C9A84C]/20 to-[#A8890A]/10 border-[#C9A84C]/20"
      : tone === "success"
        ? "from-[#2D5A3D]/18 to-[#2D5A3D]/8 border-[#2D5A3D]/18"
        : "from-primary/14 to-primary/5 border-primary/18";

  return (
    <div className={`rounded-2xl border bg-gradient-to-br px-4 py-4 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-[20px] text-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
    </div>
  );
}
