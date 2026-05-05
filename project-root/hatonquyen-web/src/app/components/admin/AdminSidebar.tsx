import {
  Activity,
  ClipboardList,
  FileCheck,
  LayoutDashboard,
  MapPin,
  Mic,
  PanelLeft,
  PanelLeftClose,
  Shield,
  Star,
  UserCheck,
  Users,
  Utensils,
} from 'lucide-react';
import AdminNavItem from './AdminNavItem';
import { getAuthSession, getRoleCode } from '../../services/auth-state.service';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN'] },
  { to: '/admin/manage-places', icon: MapPin, label: 'Quản lý Địa điểm', roles: ['ADMIN'] },
  { to: '/admin/manage-narrations', icon: Mic, label: 'Quản lý Thuyết minh', roles: ['ADMIN'] },
  { to: '/admin/owner-approval', icon: UserCheck, label: 'Duyệt Chủ cửa hàng', roles: ['ADMIN'] },
  { to: '/admin/content-approval', icon: FileCheck, label: 'Duyệt Nội dung', roles: ['ADMIN'] },
  { to: '/admin/menu', icon: Utensils, label: 'Quản lý Menu', roles: ['ADMIN'] },
  { to: '/admin/reviews', icon: Star, label: 'Quản lý Đánh giá', roles: ['ADMIN'] },
  { to: '/admin/active-owners', icon: Users, label: 'Chủ cửa hàng hoạt động', roles: ['ADMIN'] },
  { to: '/admin/users', icon: Shield, label: 'Người dùng & Phân quyền', roles: ['ADMIN'] },
  { to: '/admin/audio-tasks', icon: Activity, label: 'Dev TTS Test', roles: ['ADMIN'] },
  { to: '/admin/audit-logs', icon: ClipboardList, label: 'Nhật ký hoạt động', roles: ['ADMIN'] },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const roleCode = getRoleCode(getAuthSession());
  const visibleNavItems = navItems.filter((item) => item.roles.includes(roleCode || ''));

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-sidebar flex flex-col transition-all duration-300 z-40 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C9A84C] to-[#7A1B2E] flex items-center justify-center shrink-0">
          <span className="text-white text-[11px] tracking-wider">SF</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-[14px] text-[#FFF8F0] tracking-wide leading-tight truncate">Smart Food Tour</p>
            <p className="text-[11px] text-[#E8DDD6]/40 leading-tight truncate">Hà Tôn Quyền Admin</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className={`text-[10px] uppercase tracking-[0.15em] text-[#E8DDD6]/30 mb-3 ${collapsed ? 'text-center' : 'px-3'}`}>
          {collapsed ? '•••' : 'Menu chính'}
        </p>
        {visibleNavItems.map((item) => (
          <AdminNavItem key={item.to} {...item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-lg text-[#E8DDD6]/40 hover:text-[#E8DDD6] hover:bg-white/5 transition-colors"
        >
          {collapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
