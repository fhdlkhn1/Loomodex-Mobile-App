import { get, post } from './client';
import { StoreCaseDetail, CaseMessage, Product } from './products';

/** Customer Service: store requests (Nos offres) — same endpoints as the website page /cs-requests/. */
export interface CsCaseRow extends StoreCaseDetail { name: string; phone: string; rep?: string; cs?: string }
export interface CsCasesList { cases: CsCaseRow[]; counts: Record<string, number>; statuses: Record<string, string> }
export interface CsQuoteLine { product_id?: number | null; name: string; qty: number; unit_price: number }

const qs = (o: Record<string, string | number | undefined>) => {
  const p = Object.entries(o).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return p.length ? `?${p.join('&')}` : '';
};

export const csCasesApi = {
  list: (f: { status?: string; search?: string; type?: string } = {}) => get<CsCasesList>(`/cs/cases${qs(f)}`, true),
  /** Full case for CS: quotes + proposals + appointments + history. */
  get: (id: number) => get<StoreCaseDetail & { name: string; phone: string; history?: any[]; role: string }>(`/cases/${id}`, true),
  messages: (id: number, channel: 'customer' | 'internal') => get<{ messages: CaseMessage[] }>(`/cases/${id}/messages?channel=${channel}`, true),
  send: (id: number, channel: 'customer' | 'internal', body: string) => post<{ messages: CaseMessage[] }>(`/cases/${id}/messages`, { channel, body }, true),
  setStatus: (id: number, status: string, note?: string) => post(`/cs/cases/${id}/status`, { status, note }, true),
  sendQuote: (id: number, d: { lines: CsQuoteLine[]; delivery_fee: number; valid_until?: string; timing?: string; notes?: string }) => post(`/cs/cases/${id}/quote`, d, true),
  confirmQuote: (quoteId: number) => post(`/quotes/${quoteId}/confirm`, {}, true),
  appointment: (apptId: number, d: { action: string; slot?: string; location?: string; note?: string }) => post(`/cs/appointments/${apptId}`, d, true),
  convert: (id: number) => post<{ order: { id: number; number: string } }>(`/cs/cases/${id}/convert`, {}, true),
  storeProducts: (storeId: number) => get<{ products: Product[] }>(`/stores/${storeId}/products?per_page=60`, false),
};
