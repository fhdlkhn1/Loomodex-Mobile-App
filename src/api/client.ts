import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE = 'https://loomodex.com/wp-json/loomodex/v1';

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = false, ...fetchOpts } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOpts.headers as Record<string, string> ?? {}),
  };

  if (auth) {
    const token = await AsyncStorage.getItem('lmx_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOpts,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.message || data?.code || `Error ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export function get<T = any>(path: string, auth = false) {
  return apiRequest<T>(path, { method: 'GET', auth });
}

export function post<T = any>(path: string, body: object, auth = false) {
  return apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body), auth });
}
