import { clearAuthSession, getAccessToken } from './auth-state.service';

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

let isRedirectingToLogin = false;

export const buildApiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

const redirectToLogin = () => {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.location.pathname === '/auth/login' || window.location.pathname === '/login') {
    isRedirectingToLogin = false;
    return;
  }

  if (isRedirectingToLogin) {
    return;
  }

  isRedirectingToLogin = true;
  window.location.replace('/auth/login');
};

const buildHeaders = (headers?: HeadersInit, body?: BodyInit | null) => {
  const normalizedHeaders = new Headers(headers || {});

  if (!(body instanceof FormData) && !normalizedHeaders.has('Content-Type')) {
    normalizedHeaders.set('Content-Type', 'application/json');
  }

  return normalizedHeaders;
};

export async function requestJson<T = unknown>(
  path: string,
  init: RequestInit = {},
  options: { requiresAuth?: boolean } = {},
): Promise<T> {
  const { requiresAuth = true } = options;
  const accessToken = requiresAuth ? getAccessToken() : null;

  if (requiresAuth && !accessToken) {
    clearAuthSession();
    redirectToLogin();
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  const headers = buildHeaders(init.headers, init.body);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearAuthSession();
    redirectToLogin();
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data as T;
}

export const generateNarrationAudio = (payload: {
  text: string;
  voiceId: string;
  language: string;
  narrationId?: string;
  speed?: number;
}) =>
  requestJson<{ data: { url: string; filename: string; size: number; audioAssetId?: string | null } }>('/api/narrations/generate-audio', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const previewNarrationAudio = (payload: {
  text: string;
  voiceId: string;
  language: string;
  speed?: number;
}) =>
  requestJson<{ data: { url: string; filename: string; size: number } }>('/api/narrations/admin/audio/preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
