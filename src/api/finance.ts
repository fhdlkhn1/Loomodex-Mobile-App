import AsyncStorage from '@react-native-async-storage/async-storage';
import { get, post, API_BASE, ApiError } from './client';
import { getLanguage, t } from '../i18n';

/** Ledger statuses (plugin finance/ledger.php). */
export type LedgerStatus =
  | 'pending' | 'awaiting_verification' | 'awaiting_confirmation' | 'confirmed'
  | 'partially_confirmed' | 'discrepancy_reported' | 'rejected' | 'cancelled';

export type PartyType = 'seller' | 'driver' | 'partner' | 'agent' | 'influencer';

export interface LedgerEntry {
  id: number;
  ref: string;
  kind: 'earning' | 'revenue' | 'cash' | 'deposit' | 'payment' | 'subscription' | 'correction';
  category: string;
  party_type: PartyType | 'loomodex';
  party_id: string;
  party_name: string;
  partner_id: string;
  order_id: number | null;
  amount: number;
  declared_amount: number | null;
  confirmed_amount: number | null;
  base_amount: number | null;
  rate: number | null;
  status: LedgerStatus;
  method: string;
  reference: string;
  attachment_url: string | null;
  note: string;
  created_by_name: string;
  created_at: string;
}

export interface EarningsBalance {
  earned: number; paid_confirmed: number; paid_awaiting: number; paid_disputed: number; paid_recorded: number; balance: number;
}
export interface CashBalance {
  collected: number; deposits_declared: number; deposits_waiting: number; deposits_confirmed: number; deposits_rejected: number; to_remit: number;
}
export interface FinanceProfile {
  party_type: PartyType;
  party_id: string;
  partner_id?: string;
  name: string;
  earnings: EarningsBalance;
  cash: CashBalance | null;
  plan?: { key: string; label: string; commission: number; price: number; expires: string; expired: boolean };
  contract?: { key: string; label: string; driver_share: number } | null;
  paid_by_partner?: boolean;
}
export interface FinanceMe {
  profiles: FinanceProfile[];
  is_accountant: boolean;
  methods: Record<string, string>;
  currency: string;
}

/** Multipart POST with text fields and an optional local file (proof photo / PDF). */
async function postForm<T>(path: string, fields: Record<string, string | number | undefined>, file?: { uri: string; name?: string; type?: string }): Promise<T> {
  const token = await AsyncStorage.getItem('lmx_token');
  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => { if (v !== undefined && v !== '') form.append(k, String(v)); });
  if (file) {
    const name = file.name || file.uri.split('/').pop() || `proof-${Date.now()}.jpg`;
    const ext = (name.split('.').pop() || '').toLowerCase();
    const type = file.type || (ext === 'png' ? 'image/png' : ext === 'pdf' ? 'application/pdf' : ext === 'webp' ? 'image/webp' : 'image/jpeg');
    // @ts-ignore — React Native FormData file shape
    form.append('file', { uri: file.uri, name, type });
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { Authorization: token ? `Bearer ${token}` : '', Accept: 'application/json', 'Accept-Language': getLanguage() },
      body: form,
    });
  } catch {
    throw new ApiError(t('Connexion au serveur impossible. Vérifiez votre connexion internet.'), 0, 'network');
  }
  const raw = await res.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch {
    throw new ApiError(t('Erreur serveur ({status}). Veuillez réessayer.', { status: res.status }), res.status, 'server');
  }
  if (!res.ok) throw new ApiError(data?.message || t('Une erreur est survenue. Veuillez réessayer.'), res.status, res.status >= 500 ? 'server' : 'api', data?.code);
  return data as T;
}

export const financeApi = {
  me: () => get<FinanceMe>('/finance/me', true),
  entries: (q: { party_type?: PartyType; kind?: string[]; status?: string[]; page?: number; per_page?: number } = {}) => {
    const p: string[] = [];
    if (q.party_type) p.push(`party_type=${q.party_type}`);
    (q.kind || []).forEach(k => p.push(`kind[]=${encodeURIComponent(k)}`));
    (q.status || []).forEach(s => p.push(`status[]=${encodeURIComponent(s)}`));
    if (q.page) p.push(`page=${q.page}`);
    if (q.per_page) p.push(`per_page=${q.per_page}`);
    return get<{ entries: LedgerEntry[]; total: number }>(`/finance/me/entries${p.length ? '?' + p.join('&') : ''}`, true);
  },
  declareDeposit: (d: { amount: number; method: string; reference?: string; note?: string }, file?: { uri: string; name?: string; type?: string }) =>
    postForm<{ success: boolean; entry: LedgerEntry }>('/finance/deposits', d, file),
  confirmPayment: (id: number) => post<{ success: boolean; entry: LedgerEntry }>(`/finance/payments/${id}/confirm`, {}, true),
  disputePayment: (id: number, amount_received: number, comment: string) =>
    post<{ success: boolean; entry: LedgerEntry }>(`/finance/payments/${id}/dispute`, { amount_received, comment }, true),
};
