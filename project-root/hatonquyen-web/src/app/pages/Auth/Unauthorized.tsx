import { useState } from 'react';
import { ShieldOff, ArrowLeft, Home, Mail, ChevronDown, ChevronUp } from 'lucide-react';

type DeniedReason = 'generic';

const reasonContent: Record<DeniedReason, { badge: string; title: string; description: string; detail: string }> = {
  generic: {
    badge: 'Quyền truy cập',
    title: 'Bạn không có quyền truy cập',
    description:
      'Tài khoản hiện tại không có quyền truy cập trang này. Vui lòng quay lại trang phù hợp hoặc liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn.',
    detail: 'Hệ thống phân quyền theo vai trò (Role-based Access Control). Mỗi khu vực yêu cầu vai trò phù hợp.',
  },
};

export default function UnauthorizedPage() {
  const [showDetail, setShowDetail] = useState(false);
  const content = reasonContent.generic;

  return (
    <div className="min-h-screen bg-[#FAF7F4] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#C8A87C] to-[#A8884C] flex items-center justify-center shadow-md">
            <span className="text-white text-[16px] font-bold">S</span>
          </div>
          <span className="text-[#2D1A0E] text-[16px] tracking-wide font-medium">Smart Food Tour</span>
        </div>
        <span className="text-[13px] text-[#A89580] hidden sm:block">Cổng quản trị hệ thống</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[520px] flex flex-col items-center gap-8">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#8B1A1A]/5 to-[#C8A87C]/10 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white border border-[#E0D5C8] shadow-sm flex items-center justify-center">
                <ShieldOff className="w-10 h-10 text-[#8B1A1A]/70" strokeWidth={1.5} />
              </div>
            </div>
            <div className="absolute inset-0 rounded-full border border-dashed border-[#C8A87C]/20" style={{ margin: '-8px' }} />
          </div>

          <div className="w-full bg-white rounded-2xl border border-[#E0D5C8]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-8 flex flex-col items-center gap-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B1A1A]/5 border border-[#8B1A1A]/10 text-[12px] text-[#8B1A1A] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B1A1A]/50" />
              {content.badge}
            </span>

            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-[11px] text-[#A89580] tracking-[0.15em] uppercase">Access Denied</p>
              <h1 className="text-[#2D1A0E] text-[24px] font-semibold">{content.title}</h1>
              <p className="text-[15px] text-[#8C7A6B] leading-relaxed max-w-md">{content.description}</p>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#C8A87C]/20 to-transparent" />

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                onClick={() => (window.location.href = '/')}
                className="flex-1 w-full sm:w-auto py-3 px-6 rounded-lg text-white flex items-center justify-center gap-2
                  bg-gradient-to-r from-[#8B1A1A] to-[#A52422] hover:from-[#6B0F0F] hover:to-[#8B1A1A]
                  active:scale-[0.98] transition-all duration-200
                  shadow-lg shadow-[#8B1A1A]/15 hover:shadow-xl hover:shadow-[#8B1A1A]/25"
              >
                <Home className="w-4 h-4" />
                <span>Về trang chủ</span>
              </button>
              <button
                onClick={() => window.history.back()}
                className="flex-1 w-full sm:w-auto py-3 px-6 rounded-lg flex items-center justify-center gap-2
                  border border-[#E0D5C8] text-[#2D1A0E] bg-white
                  hover:border-[#C8A87C] hover:bg-[#FAF7F4] active:scale-[0.98] transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
            </div>

            <button
              onClick={() => setShowDetail((prev) => !prev)}
              className="flex items-center gap-1.5 text-[13px] text-[#A89580] hover:text-[#6B5B4E] transition-colors"
            >
              <span>Chi tiết</span>
              {showDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDetail && (
              <div className="w-full bg-[#FAF7F4] border border-[#E0D5C8]/50 rounded-lg p-4 text-[13px] text-[#6B5B4E] leading-relaxed">
                {content.detail}
              </div>
            )}
          </div>

          <div className="w-full bg-amber-50/50 border border-[#C8A87C]/15 rounded-xl p-5 flex items-start gap-3">
            <Mail className="w-5 h-5 text-[#C8A87C] shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-[13px] text-[#6B5B4E] font-medium">Bạn cần hỗ trợ?</p>
              <p className="text-[13px] text-[#8C7A6B] leading-relaxed">
                Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ quản trị viên tại{' '}
                <a href="mailto:admin@smartfoodtour.vn" className="text-[#8B1A1A] hover:underline font-medium">
                  admin@smartfoodtour.vn
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-4 px-6">
        <p className="text-[12px] text-[#C4B8AA]">© 2026 Smart Food Tour. All rights reserved.</p>
      </footer>
    </div>
  );
}
