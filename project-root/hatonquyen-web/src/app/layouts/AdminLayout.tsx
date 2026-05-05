import { ReactNode, useState } from 'react';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopbar from '../components/admin/AdminTopbar';

interface AdminLayoutProps {
  pageTitle: string;
  children: ReactNode;
}

export default function AdminLayout({ pageTitle, children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background font-['Inter',sans-serif]">
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'ml-[72px]' : 'ml-[260px]'}`}>
        <AdminTopbar pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
