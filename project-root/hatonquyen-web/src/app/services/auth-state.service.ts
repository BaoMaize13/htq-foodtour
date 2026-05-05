export interface AuthUser {
  id: string;
  fullName?: string;
  email?: string;
  status?: string;
  phone?: string | null;
}

export interface AuthRole {
  id?: string;
  code?: string | null;
  name?: string;
}

export interface AuthSession {
  accessToken: string;
  user?: AuthUser;
  role?: AuthRole | null;
}

const AUTH_STORAGE_KEY = 'authSession';
const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';

const normalizeRoleCode = (roleCode?: string | null) => String(roleCode || '').trim().toUpperCase();
const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
};

const parseJwtPayload = (token?: string | null): { exp?: number } | null => {
  if (!token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return null;
  }
};

export const saveAuthSession = (session: AuthSession) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, session.accessToken);
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
};

export const isAccessTokenExpired = (token?: string | null) => {
  if (!token) {
    return true;
  }

  const payload = parseJwtPayload(token);
  if (!payload) {
    return true;
  }

  if (typeof payload.exp !== 'number') {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
};

export const getAuthSession = (): AuthSession | null => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    const legacyAccessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (legacyAccessToken && isAccessTokenExpired(legacyAccessToken)) {
      clearAuthSession();
    }

    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;

    if (!parsed?.accessToken || isAccessTokenExpired(parsed.accessToken)) {
      clearAuthSession();
      return null;
    }

    return parsed;
  } catch {
    clearAuthSession();
    return null;
  }
};

export const getAccessToken = () => {
  const session = getAuthSession();
  if (session?.accessToken) {
    return session.accessToken;
  }

  const legacyAccessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (!legacyAccessToken) {
    return null;
  }

  if (isAccessTokenExpired(legacyAccessToken)) {
    clearAuthSession();
    return null;
  }

  return legacyAccessToken;
};

export const hasValidAccessToken = () => Boolean(getAccessToken());

export const getRoleCode = (session: AuthSession | null) => normalizeRoleCode(session?.role?.code);

export const getRedirectPathBySession = (session: AuthSession | null) => {
  if (!session?.accessToken) {
    return '/auth/login';
  }

  const roleCode = getRoleCode(session);

  if (roleCode === 'ADMIN') {
    return '/admin';
  }

  return '/auth/unauthorized?reason=generic';
};
