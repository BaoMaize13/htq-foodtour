interface DashboardSectionHeaderProps {
  title: string;
  action?: { label: string; onClick?: () => void };
  subtitle?: string;
}

export function DashboardSectionHeader({ title, action, subtitle }: DashboardSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-[15px] text-foreground">{title}</h3>
        {subtitle && <p className="text-[12px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="text-[12px] text-primary hover:text-primary/80 hover:underline transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
