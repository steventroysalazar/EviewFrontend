// Centralized API client for the EV12 portal.
// Uses VITE_API_URL (fallback http://localhost:8090). All requests go through
// fetchApi() which attaches optional gateway headers persisted in localStorage.

const DEFAULT_BASE = "http://localhost:8090";

export const getApiBaseUrl = (): string => {
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  return (fromEnv && fromEnv.length ? fromEnv : DEFAULT_BASE).replace(/\/+$/, "");
};

const STORAGE_KEY = "ev12:gateway-config";

export interface GatewayConfig {
  authorization?: string; // Authorization header value
  gatewayToken?: string; // X-Gateway-Token
  gatewayBaseUrl?: string; // X-Gateway-Base-Url
  webhookToken?: string; // X-Webhook-Token
  authToken?: string; // X-Auth-Token from /api/auth/login
}

export const loadGatewayConfig = (): GatewayConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GatewayConfig) : {};
  } catch {
    return {};
  }
};

export const saveGatewayConfig = (cfg: GatewayConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
};

export const updateGatewayConfig = (patch: Partial<GatewayConfig>) => {
  const next = { ...loadGatewayConfig(), ...patch };
  saveGatewayConfig(next);
  return next;
};

const buildHeaders = (extra?: HeadersInit): HeadersInit => {
  const cfg = loadGatewayConfig();
  const headers: Record<string, string> = {};
  if (cfg.authorization) headers["Authorization"] = cfg.authorization;
  if (cfg.gatewayToken) headers["X-Gateway-Token"] = cfg.gatewayToken;
  if (cfg.gatewayBaseUrl) headers["X-Gateway-Base-Url"] = cfg.gatewayBaseUrl;
  if (cfg.webhookToken) headers["X-Webhook-Token"] = cfg.webhookToken;
  if (cfg.authToken) headers["X-Auth-Token"] = cfg.authToken;
  if (extra) Object.assign(headers, extra as Record<string, string>);
  return headers;
};

const isAbsolute = (url: string) => /^https?:\/\//i.test(url);

const buildUrl = (path: string) => {
  if (isAbsolute(path)) return path;
  const base = getApiBaseUrl();
  return `${base}/${path.replace(/^\/+/, "")}`;
};

export interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
}

export async function fetchApi<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, query, headers, method = "GET", ...rest } = options;

  let url = buildUrl(path);
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.append(k, String(v));
    });
    const qs = params.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }

  const isJsonBody = body && typeof body === "object" && !(body instanceof FormData);
  const finalHeaders = buildHeaders({
    ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
    ...((headers as Record<string, string>) || {}),
  });

  const res = await fetch(url, {
    ...rest,
    method,
    headers: finalHeaders,
    body: isJsonBody ? JSON.stringify(body) : (body as BodyInit | null | undefined),
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && (data as { error?: string; message?: string }).error) ||
      (data && typeof data === "object" && (data as { error?: string; message?: string }).message) ||
      `Request failed (${res.status})`;
    throw new Error(String(msg));
  }

  return data as T;
}

export const buildStreamUrl = (path: string) => buildUrl(path);
