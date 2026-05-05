import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (v: string) => void;
}

export function FilterDropdown({ label, options, value, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

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
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] border transition-all ${
          value !== "all"
            ? "border-primary/30 bg-primary/5 text-foreground"
            : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80"
        }`}
      >
        <span>{label}:</span>
        <span className="text-foreground">{selected?.label || "Tất cả"}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-52 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="flex items-center justify-between w-full px-3.5 py-2 text-[13px] hover:bg-secondary/60 transition-colors"
            >
              <span className={opt.value === value ? "text-primary" : "text-foreground"}>
                {opt.label}
              </span>
              <div className="flex items-center gap-2">
                {opt.count !== undefined && (
                  <span className="text-[11px] text-muted-foreground">{opt.count}</span>
                )}
                {opt.value === value && <Check className="w-3.5 h-3.5 text-primary" />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
