const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const buildApiUrl = (path: string) => {
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }

  return path;
};

interface LoginPayload {
  account: string;
  password: string;
}

const parseResponse = async (response: Response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
};

export async function login(payload: LoginPayload) {
  const account = String(payload.account || '').trim();

  if (!account) {
    throw new Error('Account is required');
  }

  let response: Response;

  try {
    response = await fetch(buildApiUrl('/api/users/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        account,
        password: payload.password,
      }),
    });
  } catch {
    throw new Error('Network error');
  }

  const data = await parseResponse(response);
  return data?.data;
}
