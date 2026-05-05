import type { ReactNode } from "react";

interface SectionFrameProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function SectionFrame({
  eyebrow,
  title,
  description,
  children,
}: SectionFrameProps) {
  return (
    <section className="rounded-[26px] border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-primary/70">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-[20px] text-foreground">{title}</h2>
        </div>
        <p className="max-w-[560px] text-[12px] leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}
