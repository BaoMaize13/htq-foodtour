import { Clock } from "lucide-react";

interface PendingItemProps {
  title: string;
  subtitle: string;
  time: string;
  type: "owner" | "content" | "narration";
  status?: string;
}

const typeColors: Record<string, string> = {
  owner: "bg-[#7A1B2E]",
  content: "bg-[#C9A84C]",
  narration: "bg-[#2D5A3D]",
};

export function PendingItem({ title, subtitle, time, type }: PendingItemProps) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5 hover:bg-secondary/40 transition-colors cursor-pointer group">
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${typeColors[type]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-foreground truncate group-hover:text-primary transition-colors">{title}</p>
        <p className="text-[12px] text-muted-foreground truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
        <Clock className="w-3 h-3" />
        {time}
      </div>
    </div>
  );
}
