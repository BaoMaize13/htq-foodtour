import AuthLayout from '../../layouts/AuthLayout';
import LoginForm from './components/LoginForm';

export default function LoginPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-2">
        <h2 className="text-[#2D1A0E] text-[28px] font-semibold">Đăng nhập Quản trị viên</h2>
        <p className="text-[#8C7A6B] text-[15px]">Truy cập hệ thống quản trị</p>
      </div>
      <div className="h-px bg-gradient-to-r from-[#C8A87C]/30 via-[#C8A87C]/20 to-transparent" />
      <LoginForm />
    </AuthLayout>
  );
}
