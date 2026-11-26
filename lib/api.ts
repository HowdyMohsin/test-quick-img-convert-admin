// Same-origin API client. Browser calls go to /api/* (Next.js rewrite to the
// FastAPI backend). The qic_admin cookie is HttpOnly — never read in JS.
// Mutations send X-CSRF-Token fetched from GET /admin/auth/csrf.
// Error shape: { error: { code, message, hint } }.
export type ApiError = { code: string; message: string; hint?: string };
export class ApiException extends Error {
  code: string; status: number; hint?: string;
  constructor(status: number, e: ApiError) {
    super(e.message || 'Request failed'); this.code = e.code || 'error'; this.status = status; this.hint = e.hint;
  }
}
let csrfToken: string | null = null;
export async function getCsrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  try {
    const r = await fetch('/api/admin/auth/csrf', { credentials: 'include' });
    const j = await r.json().catch(() => ({}));
    csrfToken = j.csrf_token || j.csrfToken || '';
  } catch { csrfToken = ''; }
  return csrfToken || '';
}
export async function api<T = any>(path: string, opts: { method?: string; headers?: Record<string, string>; body?: any } = {}): Promise<T> {
  const method = (opts.method || 'GET').toUpperCase();
  const headers: Record<string, string> = { ...(opts.headers as any) };
  let body = opts.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
  if (method !== 'GET' && method !== 'HEAD') headers['X-CSRF-Token'] = await getCsrf();
  let r: Response;
  try {
    r = await fetch(`/api${path}`, { ...opts, method, headers, body, credentials: 'include' });
  } catch (e) {
    // Server unreachable (backend down, rewrite target refusing, offline).
    // Never surface the raw network error to the UI.
    console.error('API request failed', path, e);
    throw new ApiException(0, { code: 'network_error', message: 'Could not load data. Check the server connection and try again.' });
  }
  if (r.status === 401) { csrfToken = null; if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) window.location.href = '/login'; throw new ApiException(401, { code: 'unauthorized', message: 'Your session has expired. Please sign in again.' }); }
  const text = await r.text();
  let j: any = {};
  try {
    j = text ? JSON.parse(text) : {};
  } catch (e) {
    // Non-JSON body (e.g. a proxy/404 HTML page when the backend is down).
    // The technical detail stays in the console; the UI gets a plain message.
    console.error('API returned a non-JSON response', r.status, path, text.slice(0, 200));
    throw new ApiException(r.status, { code: `http_${r.status}`, message: 'Could not load data. Check the server connection and try again.' });
  }
  if (!r.ok) {
    const e: ApiError = j.error || { code: `http_${r.status}`, message: j.message || `Request failed (${r.status})` };
    throw new ApiException(r.status, e);
  }
  return j as T;
}
export const get = <T = any>(p: string) => api<T>(p);
export const post = <T = any>(p: string, b?: any) => api<T>(p, { method: 'POST', body: b });
export const patch = <T = any>(p: string, b?: any) => api<T>(p, { method: 'PATCH', body: b });
export const put = <T = any>(p: string, b?: any) => api<T>(p, { method: 'PUT', body: b });
export const del = <T = any>(p: string) => api<T>(p, { method: 'DELETE' });
// Endpoint map (spec §11 / §13.3) — pages code against these documented paths.
export const EP = {
  me: '/admin/auth/me', login: '/admin/auth/login', logout: '/admin/auth/logout',
  changePassword: '/admin/auth/change-password', totpSetup: '/admin/auth/totp/setup',
  dashboard: '/admin/dashboard', users: '/admin/users', paymentsRequests: '/admin/payments/requests',
  subscriptions: '/admin/payments/subscriptions', providers: '/admin/payments/providers',
  webhooks: '/admin/payments/webhooks', plans: '/admin/plans', coupons: '/admin/coupons',
  formats: '/admin/formats', adsSlots: '/admin/ads/slots', adsNetworks: '/admin/ads/networks',
  adsRevenue: '/admin/ads/revenue', popups: '/admin/popups', announcements: '/admin/announcements',
  jobs: '/admin/jobs', reports: '/admin/reports', team: '/admin/team',
  settings: '/admin/settings', audit: '/admin/audit',
} as const;
