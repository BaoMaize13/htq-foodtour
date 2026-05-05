import { ChevronRight, Home } from 'lucide-react';

const labelMap: Record<string, string> = {
  admin: 'Dashboard',
  'manage-places': 'Quản lý Địa điểm',
  'manage-narrations': 'Quản lý Thuyết minh',
  'owner-approval': 'Duyệt Chủ cửa hàng',
  'content-approval': 'Duyệt Nội dung',
  'audio-tasks': 'Dev TTS Test',
};

export default function AdminBreadcrumb() {
  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
      <a href="/admin" className="hover:text-primary transition-colors">
        <Home className="w-3.5 h-3.5" />
      </a>
      {segments.slice(1).map((segment, index) => (
        <span key={segment} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3" />
          <span className={index === segments.length - 2 ? 'text-foreground' : ''}>{labelMap[segment] || segment}</span>
        </span>
      ))}
    </nav>
  );
}
