import { Bell } from 'lucide-react';
import AdminBreadcrumb from './AdminBreadcrumb';
import AdminProfileMenuTrigger from './AdminProfileMenuTrigger';

interface AdminTopbarProps {
  pageTitle: string;
}

export default function AdminTopbar({ pageTitle }: AdminTopbarProps) {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
      <div className="flex flex-col">
        <h2 className="text-[18px] text-foreground leading-tight">{pageTitle}</h2>
        <AdminBreadcrumb />
      </div>

      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
          <Bell className="w-[18px] h-[18px] text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C9A84C] rounded-full" />
        </button>

        <div className="w-px h-8 bg-border" />

        <AdminProfileMenuTrigger />
      </div>
    </header>
  );
}
