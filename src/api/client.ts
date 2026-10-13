import AsyncStorage from '@react-native-async-storage/async-storage';
import { t, getLanguage } from '../i18n';

export const API_BASE = 'https://loomodex.com/wp-json/loomodexapp/v1';

/**
 * Why a request failed — lets screens show the right message (and a Retry) instead of
 * one generic error:
 *   network  — no connection / DNS / TLS (request never reached the server)
 *   blocked  — the host's firewall/CDN answered with an HTML page (403/429/503…)
 *   timeout  — the server took too long (504 / gateway timeout page)
 *   server   — PHP/server error (5xx with JSON or HTML)
 *   notfound — the API said 404 (the thing genuinely doesn't exist)
 *   api      — any other JSON error from the Loomodex API (validation, permission…)
 */
export type ApiErrorKind = 'network' | 'blocked' | 'timeout' | 'server' | 'notfound' | 'api';

export class ApiError extends Error {
  status: number;
  kind: ApiErrorKind;
  code?: string;
  constructor(message: string, status: number, kind: ApiErrorKind, code?: string) {
    super(message);
    this.status = status;
    this.kind = kind;
    this.code = code;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

/** User-facing French message for any thrown error (screens show this verbatim). */
export function friendlyError(e: unknown, fallback?: string): string {
  const fb = fallback ?? t('Une erreur est survenue. Veuillez réessayer.');
  if (e instanceof ApiError) {
    switch (e.kind) {
      case 'network': return t('Connexion au serveur impossible. Vérifiez votre connexion internet.');
      case 'blocked': return t('Accès refusé par le serveur ({status}). Réessayez dans un instant.', { status: e.status });
      case 'timeout': return t('Le serveur met trop de temps à répondre. Réessayez dans un instant.');
      case 'server':  return t('Le serveur a rencontré une erreur ({status}). Réessayez dans un instant.', { status: e.status });
      default:        return e.message ? t(e.message) : fb;
    }
  }
  if (e instanceof Error && e.message) return t(e.message);
  return fb;
}

const REQUEST_TIMEOUT_MS = 30000;

/** Classify a non-JSON (HTML) error body by status. */
function htmlErrorKind(status: number): ApiErrorKind {
  if (status === 504 || status === 524 || status === 408) return 'timeout';
  if (status === 403 || status === 401 || status === 429 || status === 503 || status === 406) return 'blocked';
  return 'server';
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = false, ...fetchOpts } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Language': getLanguage(),
    ...(fetchOpts.headers as Record<string, string> ?? {}),
  };

  if (auth) {
    const token = await AsyncStorage.getItem('lmx_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...fetchOpts, headers, signal: controller.signal });
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === 'AbortError') {
      throw new ApiError(t('Le serveur met trop de temps à répondre.'), 0, 'timeout');
    }
    // Network failure (no connection, DNS, captive portal, TLS) — never a JSON parse error
    throw new ApiError(t('Connexion au serveur impossible. Vérifiez votre connexion internet.'), 0, 'network');
  }
  clearTimeout(timer);

  // Read the raw body once, then try to parse. A server/CDN error page is HTML,
  // not JSON — surface a clear message instead of a cryptic "JSON Parse error".
  const raw = await res.text();
  let data: any = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      if (!res.ok) {
        const kind = htmlErrorKind(res.status);
        throw new ApiError(t('Erreur serveur ({status}). Veuillez réessayer.', { status: res.status }), res.status, kind);
      }
      throw new ApiError(t('Réponse inattendue du serveur. Veuillez réessayer.'), res.status, 'server');
    }
  }

  if (!res.ok) {
    const msg = data?.message || data?.code || `Error ${res.status}`;
    const kind: ApiErrorKind = res.status === 404 ? 'notfound' : res.status >= 500 ? 'server' : 'api';
    throw new ApiError(msg, res.status, kind, data?.code);
  }

  return data as T;
}

export function get<T = any>(path: string, auth = false) {
  return apiRequest<T>(path, { method: 'GET', auth });
}

export function post<T = any>(path: string, body: object, auth = false) {
  return apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body), auth });
}

/**
 * Multipart upload of one local file (image or video) to a plugin endpoint.
 * Returns the parsed JSON body; throws ApiError like apiRequest.
 */
export async function uploadFile<T = any>(path: string, uri: string, opts: { name?: string; type?: string; field?: string } = {}): Promise<T> {
  const token = await AsyncStorage.getItem('lmx_token');
  const name = opts.name || uri.split('/').pop() || `file-${Date.now()}`;
  const ext = (name.split('.').pop() || '').toLowerCase();
  const type = opts.type || (
    ext === 'png' ? 'image/png'
    : ext === 'webp' ? 'image/webp'
    : ext === 'mp4' ? 'video/mp4'
    : ext === 'mov' ? 'video/quicktime'
    : ext === 'm4v' ? 'video/x-m4v'
    : 'image/jpeg'
  );
  const form = new FormData();
  // @ts-ignore — React Native FormData file shape
  form.append(opts.field || 'file', { uri, name, type });

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { Authorization: token ? `Bearer ${token}` : '', Accept: 'application/json' },
      body: form,
    });
  } catch {
    throw new ApiError(t('Connexion au serveur impossible. Vérifiez votre connexion internet.'), 0, 'network');
  }
  const raw = await res.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch {
    if (res.status === 413) throw new ApiError(t('Fichier trop volumineux pour le serveur.'), 413, 'api');
    throw new ApiError(t('Erreur serveur ({status}). Veuillez réessayer.', { status: res.status }), res.status, res.ok ? 'server' : htmlErrorKind(res.status));
  }
  if (!res.ok) {
    throw new ApiError(data?.message || t('Échec du téléversement.'), res.status, res.status === 404 ? 'notfound' : res.status >= 500 ? 'server' : 'api', data?.code);
  }
  return data as T;
}
