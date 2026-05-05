import { useState, FormEvent } from 'react';
import {
  Mail,
  Lock,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  WifiOff,
  CheckCircle2,
} from 'lucide-react';
import { login } from '../../../services/auth.service';
import { getRedirectPathBySession, saveAuthSession } from '../../../services/auth-state.service';

type ErrorType = null | 'field' | 'credentials' | 'blocked' | 'server';

interface FormErrors {
  account?: string;
  password?: string;
}

function ErrorAlert({ type, message, icon: Icon }: { type: string; message: string; icon: React.ElementType }) {
  const styles: Record<string, string> = {
    credentials: 'bg-red-50 border-red-200 text-red-800',
    blocked: 'bg-red-50 border-red-300 text-red-900',
    server: 'bg-orange-50 border-orange-200 text-orange-800',
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${styles[type] || styles.server}`}>
      <Icon className="w-5 h-5 mt-0.5 shrink-0" />
      <p className="text-[14px]">{message}</p>
    </div>
  );
}

const mapLoginErrorType = (message: string): ErrorType => {
  if (message === 'Network error') {
    return 'server';
  }

  if (message === 'Invalid credentials' || message === 'Account is required') {
    return 'credentials';
  }

  if (message === 'Account is blocked') {
    return 'blocked';
  }

  return 'server';
};

export default function LoginForm() {
  const rememberedAccount = localStorage.getItem('rememberedLogin') || localStorage.getItem('rememberedEmail') || '';
  const [account, setAccount] = useState(rememberedAccount);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedAccount));
  const [loading, setLoading] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [successRedirect, setSuccessRedirect] = useState(false);

  const validate = (): boolean => {
    const errors: FormErrors = {};

    if (!account.trim()) {
      errors.account = 'Vui lòng nhập tên đăng nhập';
    }

    if (!password.trim()) {
      errors.password = 'Vui lòng nhập mật khẩu';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorType(null);

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      const data = await login({
        account: account.trim(),
        password,
      });

      if (!data?.accessToken) {
        throw new Error('Invalid login response');
      }

      saveAuthSession({
        accessToken: data.accessToken,
        user: data.user,
        role: data.role,
      });

      if (rememberMe) {
        localStorage.setItem('rememberedLogin', account.trim());
        localStorage.removeItem('rememberedEmail');
      } else {
        localStorage.removeItem('rememberedLogin');
        localStorage.removeItem('rememberedEmail');
      }

      setSuccessRedirect(true);
      setTimeout(() => {
        window.location.href = getRedirectPathBySession({
          accessToken: data.accessToken,
          user: data.user,
          role: data.role,
        });
      }, 300);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setErrorType(mapLoginErrorType(message));
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || successRedirect;

  if (successRedirect) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <p className="text-[18px] text-[#2D1A0E] font-semibold">Đăng nhập thành công!</p>
        <p className="text-[14px] text-[#8C7A6B]">Đang chuyển hướng đến bảng điều khiển...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
      {errorType === 'credentials' && (
        <ErrorAlert type="credentials" icon={AlertTriangle} message="Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại." />
      )}
      {errorType === 'blocked' && (
        <ErrorAlert type="blocked" icon={ShieldAlert} message="Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên." />
      )}
      {errorType === 'server' && (
        <ErrorAlert type="server" icon={WifiOff} message="Không thể kết nối đến máy chủ. Vui lòng thử lại sau ít phút." />
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="account" className="text-[14px] text-[#2D1A0E] font-medium">Tên đăng nhập</label>
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 bg-white
          ${
            fieldErrors.account
              ? 'border-red-400 ring-2 ring-red-100'
              : 'border-[#E0D5C8] hover:border-[#C8A87C] focus-within:border-[#8B1A1A] focus-within:ring-2 focus-within:ring-[#8B1A1A]/10'
          }`}
        >
          <Mail className="w-5 h-5 text-[#C8A87C] shrink-0" />
          <input
            id="account"
            type="text"
            placeholder="admin"
            value={account}
            onChange={(event) => {
              setAccount(event.target.value);
              setFieldErrors((prev) => ({ ...prev, account: undefined }));
              setErrorType(null);
            }}
            disabled={isDisabled}
            className="flex-1 bg-transparent outline-none placeholder:text-[#C4B8AA] text-[#2D1A0E] disabled:opacity-50"
            autoComplete="username"
          />
        </div>
        {fieldErrors.account && <p className="text-[13px] text-red-500 pl-1">{fieldErrors.account}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-[14px] text-[#2D1A0E] font-medium">Mật khẩu</label>
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 bg-white
          ${
            fieldErrors.password
              ? 'border-red-400 ring-2 ring-red-100'
              : 'border-[#E0D5C8] hover:border-[#C8A87C] focus-within:border-[#8B1A1A] focus-within:ring-2 focus-within:ring-[#8B1A1A]/10'
          }`}
        >
          <Lock className="w-5 h-5 text-[#C8A87C] shrink-0" />
          <input
            id="password"
            type="password"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
              setErrorType(null);
            }}
            disabled={isDisabled}
            className="flex-1 bg-transparent outline-none placeholder:text-[#C4B8AA] text-[#2D1A0E] disabled:opacity-50"
            autoComplete="current-password"
          />
        </div>
        {fieldErrors.password && <p className="text-[13px] text-red-500 pl-1">{fieldErrors.password}</p>}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="w-4 h-4 rounded border-[#E0D5C8] accent-[#8B1A1A]"
          />
          <span className="text-[14px] text-[#6B5B4E]">Ghi nhớ đăng nhập</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isDisabled}
        className="w-full py-3.5 rounded-lg text-white transition-all duration-200 flex items-center justify-center gap-2
          bg-gradient-to-r from-[#8B1A1A] to-[#A52422] hover:from-[#6B0F0F] hover:to-[#8B1A1A]
          active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
          shadow-lg shadow-[#8B1A1A]/20 hover:shadow-xl hover:shadow-[#8B1A1A]/30"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Đang đăng nhập...</span>
          </>
        ) : (
          <span>Đăng nhập</span>
        )}
      </button>

      <div className="flex flex-col items-center gap-3 pt-2">
        <p className="text-[13px] text-[#A89580] text-center">Chỉ tài khoản quản trị viên mới có thể đăng nhập</p>
      </div>
    </form>
  );
}
