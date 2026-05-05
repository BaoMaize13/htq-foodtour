import { type LucideIcon } from 'lucide-react';

interface AdminNavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
}

export default function AdminNavItem({ to, icon: Icon, label, collapsed = false }: AdminNavItemProps) {
  const isActive = window.location.pathname === to;

  return (
    <a
      href={to}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative ${
        collapsed ? 'justify-center' : ''
      } ${isActive ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'text-[#E8DDD6]/60 hover:text-[#E8DDD6] hover:bg-white/5'}`}
    >
      {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#C9A84C] rounded-r-full" />}
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span className="text-[14px] tracking-wide">{label}</span>}
    </a>
  );
}
