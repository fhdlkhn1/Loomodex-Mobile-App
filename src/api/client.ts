import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE = 'https://loomodex.com/wp-json/loomodexapp/v1';

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

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...fetchOpts, headers });
  } catch {
    // Network failure (no connection, DNS, captive portal, TLS) — never a JSON parse error
    throw new Error('Connexion au serveur impossible. Vérifiez votre connexion internet.');
  }

  // Read the raw body once, then try to parse. A server/CDN error page is HTML,
  // not JSON — surface a clear message instead of a cryptic "JSON Parse error".
  const raw = await res.text();
  let data: any = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      if (!res.ok) throw new Error(`Erreur serveur (${res.status}). Veuillez réessayer.`);
      throw new Error('Réponse inattendue du serveur. Veuillez réessayer.');
    }
  }

  if (!res.ok) {
    const msg = data?.message || data?.code || `Error ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

export function get<T = any>(path: string, auth = false) {
  return apiRequest<T>(path, { method: 'GET', auth });
}

export function post<T = any>(path: string, body: object, auth = false) {
  return apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body), auth });
}
