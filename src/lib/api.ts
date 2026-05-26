import { toast } from "sonner";
import { clearAuthSession, SESSION_EXPIRED_MESSAGE, SESSION_EXPIRED_STORAGE_KEY } from "@/lib/authSession";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type PageResponse<T> = {
  content: T[];
  number?: number;
  size?: number;
  totalPages?: number;
  totalElements?: number;
  last?: boolean;
  first?: boolean;
};

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const LOGIN_PATHS = ["/", "/login"];
let isHandlingExpiredSession = false;

export function getAuthToken() {
  return localStorage.getItem("vita_token") || localStorage.getItem("token");
}

export function getAuthHeaders() {
  const token = getAuthToken();
  const tokenType = localStorage.getItem("vita_token_type") || "Bearer";

  return token ? { Authorization: `${tokenType} ${token}` } : {};
}

export function resolveApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildQueryString(params?: Record<string, unknown>) {
  const query = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });

  const value = query.toString();
  return value ? `?${value}` : "";
}

export function unwrapPageContent<T>(response: T[] | PageResponse<T>) {
  return Array.isArray(response) ? response : response.content ?? [];
}

export function normalizePageResponse<T>(response: T[] | PageResponse<T>, page = 0, size = 10): PageResponse<T> {
  if (Array.isArray(response)) {
    return {
      content: response,
      number: page,
      size,
      totalPages: response.length < size ? page + 1 : page + 2,
      totalElements: response.length,
      last: response.length < size,
      first: page === 0,
    };
  }

  return {
    ...response,
    content: response.content ?? [],
    number: response.number ?? page,
    size: response.size ?? size,
    totalPages: response.totalPages ?? (response.last === false ? page + 2 : page + 1),
    last: response.last ?? true,
    first: response.first ?? page === 0,
  };
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<number, string> = {
      400: error.message || "Revise os dados informados.",
      401: SESSION_EXPIRED_MESSAGE,
      403: SESSION_EXPIRED_MESSAGE,
      500: "Erro interno do servidor. Tente novamente em instantes.",
    };

    return messages[error.status] ?? error.message;
  }

  return error instanceof Error
    ? error.message
    : "Nao foi possivel concluir a operacao.";
}

function isAuthErrorStatus(status: number) {
  return status === 401 || status === 403;
}

function isLoginRoute() {
  return LOGIN_PATHS.includes(window.location.pathname);
}

function handleExpiredSession() {
  clearAuthSession();

  if (!isHandlingExpiredSession) {
    isHandlingExpiredSession = true;
    toast.error(SESSION_EXPIRED_MESSAGE);
  }

  if (!isLoginRoute()) {
    localStorage.setItem(SESSION_EXPIRED_STORAGE_KEY, SESSION_EXPIRED_MESSAGE);
    window.location.assign("/");
    return;
  }

  window.setTimeout(() => {
    isHandlingExpiredSession = false;
  }, 0);
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = resolveApiUrl(path);
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...getAuthHeaders(),
      ...init.headers,
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (isAuthErrorStatus(response.status)) {
      handleExpiredSession();
      throw new ApiError(SESSION_EXPIRED_MESSAGE, response.status);
    }

    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : "Nao foi possivel concluir a operacao.";

    console.error("Erro de API:", {
      url,
      status: response.status,
      body,
    });

    throw new ApiError(message, response.status);
  }

  return body as T;
}
