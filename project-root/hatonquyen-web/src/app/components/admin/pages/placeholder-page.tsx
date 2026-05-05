import { type LucideIcon, Inbox } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function PlaceholderPage({ title, description, icon: Icon = Inbox }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="text-[17px] text-foreground mb-1">{title}</h3>
      <p className="text-[13px] text-muted-foreground max-w-sm">{description}</p>
      <div className="mt-6 flex gap-3">
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-[13px] hover:opacity-90 transition-opacity">
          Bắt đầu
        </button>
        <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-[13px] hover:bg-muted transition-colors">
          Tìm hiểu thêm
        </button>
      </div>
    </div>
  );
}
