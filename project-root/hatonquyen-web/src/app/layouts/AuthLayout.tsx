import { ReactNode } from 'react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface AuthLayoutProps {
  children: ReactNode;
  heroTitle?: ReactNode;
  heroDescription?: string;
  maxWidth?: string;
}

export default function AuthLayout({
  children,
  heroTitle,
  heroDescription,
  maxWidth = '420px',
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-[50%] xl:w-[55%] relative overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1774979301475-bdbfe389ce72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwbGFudGVybiUyMG5pZ2h0JTIwc3RyZWV0JTIwZm9vZHxlbnwxfHx8fDE3NzU5MDg1NDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Phố ẩm thực Trung Hoa"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A0A0A]/80 via-[#2D0A0A]/60 to-[#0A0505]/70" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C8A87C' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C8A87C] to-[#A8884C] flex items-center justify-center shadow-lg">
              <span className="text-white text-[18px] font-bold">S</span>
            </div>
            <span className="text-white/90 text-[18px] tracking-wide font-medium">Smart Food Tour</span>
          </div>

          <div className="flex flex-col gap-6 max-w-md">
            {heroTitle || (
              <h1 className="text-white text-[40px] leading-tight font-semibold">
                Khám phá tinh hoa
                <br />
                <span className="text-[#C8A87C]">ẩm thực Trung Hoa</span>
              </h1>
            )}
            <p className="text-white/60 text-[16px] leading-relaxed">
              {heroDescription ||
                'Phố Hà Tôn Quyền — nơi hội tụ hương vị truyền thống và trải nghiệm ẩm thực đẳng cấp giữa lòng Sài Gòn.'}
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="h-px flex-1 bg-gradient-to-r from-[#C8A87C]/40 to-transparent" />
              <span className="text-[#C8A87C]/60 text-[13px] tracking-widest uppercase">Discover · Taste · Experience</span>
              <div className="h-px flex-1 bg-gradient-to-l from-[#C8A87C]/40 to-transparent" />
            </div>
          </div>

          <p className="text-white/30 text-[13px]">© 2026 Smart Food Tour. All rights reserved.</p>
        </div>
      </div>

      <div className="flex-1 flex justify-center bg-[#FAF7F4] px-6 py-10 lg:px-12 lg:py-0 lg:overflow-y-auto">
        <div className="w-full flex flex-col gap-8 py-8 lg:py-12" style={{ maxWidth }}>
          <div className="flex flex-col items-center gap-3 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C8A87C] to-[#A8884C] flex items-center justify-center shadow-lg">
              <span className="text-white text-[22px] font-bold">S</span>
            </div>
            <span className="text-[#2D1A0E] text-[18px] font-semibold">Smart Food Tour</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
