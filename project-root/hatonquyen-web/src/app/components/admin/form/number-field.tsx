import { ValidationMessage } from "./validation-message";

interface NumberFieldProps {
  label: string;
  helpText?: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

export function NumberField({
  label,
  helpText,
  error,
  value,
  onChange,
  required,
  placeholder,
  disabled,
  min,
  max,
  step,
  suffix,
}: NumberFieldProps) {
  return (
    <div>
      <label className="flex items-center gap-1 text-[13px] text-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={`w-full px-3.5 py-2.5 rounded-lg text-[13px] text-foreground bg-input-background transition-all
            placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:bg-card
            disabled:opacity-50 disabled:cursor-not-allowed
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            ${suffix ? "pr-12" : ""}
            ${error
              ? "ring-2 ring-destructive/30 bg-destructive/[0.02] focus:ring-destructive/50"
              : "focus:ring-primary/20"
            }`}
        />
        {suffix && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {helpText && !error && (
        <p className="text-[11px] text-muted-foreground mt-1.5">{helpText}</p>
      )}
      {error && <ValidationMessage type="error" message={error} />}
    </div>
  );
}
