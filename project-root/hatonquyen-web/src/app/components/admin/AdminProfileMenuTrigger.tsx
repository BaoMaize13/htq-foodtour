import { ChevronDown, LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { clearAuthSession } from '../../services/auth-state.service';

export default function AdminProfileMenuTrigger() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    window.location.replace('/auth/login');
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-secondary transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7A1B2E] to-[#C9A84C] flex items-center justify-center text-white text-[13px]">
          AD
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-[13px] text-foreground leading-tight">Admin User</p>
          <p className="text-[11px] text-muted-foreground leading-tight">admin@smartfoodtour.vn</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-lg py-1.5 z-50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] text-destructive hover:bg-secondary transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
