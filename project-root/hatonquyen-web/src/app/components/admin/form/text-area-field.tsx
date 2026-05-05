import { type TextareaHTMLAttributes } from "react";
import { ValidationMessage } from "./validation-message";

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  label: string;
  helpText?: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  maxLength?: number;
}

export function TextAreaField({
  label,
  helpText,
  error,
  value,
  onChange,
  required,
  maxLength,
  disabled,
  rows = 3,
  ...rest
}: TextAreaFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="flex items-center gap-1 text-[13px] text-foreground">
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
        {maxLength && (
          <span className={`text-[11px] ${value.length > maxLength ? "text-destructive" : "text-muted-foreground"}`}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows}
        className={`w-full px-3.5 py-2.5 rounded-lg text-[13px] text-foreground bg-input-background resize-none transition-all
          placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:bg-card
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error
            ? "ring-2 ring-destructive/30 bg-destructive/[0.02] focus:ring-destructive/50"
            : "focus:ring-primary/20"
          }`}
        {...rest}
      />
      {helpText && !error && (
        <p className="text-[11px] text-muted-foreground mt-1.5">{helpText}</p>
      )}
      {error && <ValidationMessage type="error" message={error} />}
    </div>
  );
}
