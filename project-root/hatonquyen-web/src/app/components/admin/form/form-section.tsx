import { type ReactNode } from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-border">
        <h4 className="text-[14px] text-foreground">{title}</h4>
        {description && (
          <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
