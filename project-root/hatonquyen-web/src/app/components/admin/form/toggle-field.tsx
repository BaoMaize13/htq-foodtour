interface ToggleFieldProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export function ToggleField({ label, description, checked, onChange, disabled }: ToggleFieldProps) {
  return (
    <div className={`flex items-start justify-between gap-4 p-3.5 rounded-lg bg-input-background transition-colors ${
      disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
    }`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div>
        <p className="text-[13px] text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`relative w-10 h-[22px] rounded-full shrink-0 transition-colors duration-200 ${
          checked ? "bg-[#2D5A3D]" : "bg-switch-background"
        }`}
        onClick={(e) => { e.stopPropagation(); !disabled && onChange(!checked); }}
      >
        <span
          className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-[18px]" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
