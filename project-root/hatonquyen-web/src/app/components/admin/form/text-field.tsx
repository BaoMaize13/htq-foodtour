import { type InputHTMLAttributes } from "react";
import { ValidationMessage } from "./validation-message";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  helpText?: string;
  error?: string;
  success?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}

export function TextField({
  label,
  helpText,
  error,
  success,
  value,
  onChange,
  required,
  disabled,
  ...rest
}: TextFieldProps) {
  return (
    <div>
      <label className="flex items-center gap-1 text-[13px] text-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3.5 py-2.5 rounded-lg text-[13px] text-foreground bg-input-background transition-all
          placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:bg-card
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error
            ? "ring-2 ring-destructive/30 bg-destructive/[0.02] focus:ring-destructive/50"
            : "focus:ring-primary/20"
          }`}
        {...rest}
      />
      {helpText && !error && !success && (
        <p className="text-[11px] text-muted-foreground mt-1.5">{helpText}</p>
      )}
      {error && <ValidationMessage type="error" message={error} />}
      {success && !error && <ValidationMessage type="success" message={success} />}
    </div>
  );
}
