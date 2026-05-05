import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { ValidationMessage } from "./validation-message";

interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface SelectFieldProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export function SelectField({
  label,
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  helpText,
  error,
  required,
  disabled,
}: SelectFieldProps) {
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
    <div>
      <label className="flex items-center gap-1 text-[13px] text-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] bg-input-background transition-all text-left
            focus:outline-none focus:ring-2 focus:bg-card
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error
              ? "ring-2 ring-destructive/30 bg-destructive/[0.02] focus:ring-destructive/50"
              : open ? "ring-2 ring-primary/20 bg-card" : "focus:ring-primary/20"
            }`}
        >
          {selected ? (
            <span className="flex items-center gap-2 text-foreground">
              {selected.icon && <span className="text-[14px]">{selected.icon}</span>}
              {selected.label}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-card border border-border rounded-xl shadow-lg py-1 z-50 max-h-52 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 text-[13px] transition-colors ${
                  opt.value === value ? "bg-primary/5 text-primary" : "text-foreground hover:bg-secondary/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  {opt.icon && <span className="text-[14px]">{opt.icon}</span>}
                  {opt.label}
                </span>
                {opt.value === value && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>
      {helpText && !error && (
        <p className="text-[11px] text-muted-foreground mt-1.5">{helpText}</p>
      )}
      {error && <ValidationMessage type="error" message={error} />}
    </div>
  );
}
