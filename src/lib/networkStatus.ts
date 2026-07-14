type NetworkStatusListener = (isOnline: boolean) => void;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081";
const HEALTHCHECK_TIMEOUT_MS = 3000;
const MIN_CHECK_INTERVAL_MS = 5000;

let apiOnline = typeof navigator === "undefined" ? true : navigator.onLine;
let lastCheckAt = 0;
let inFlightCheck: Promise<boolean> | null = null;
const listeners = new Set<NetworkStatusListener>();

function resolveHealthUrl() {
  return `${API_BASE_URL.replace(/\/$/, "")}/health`;
}

function emit(nextOnline: boolean) {
  if (apiOnline === nextOnline) return;
  apiOnline = nextOnline;
  listeners.forEach((listener) => listener(apiOnline));
}

export function getNetworkStatus() {
  return apiOnline;
}

export function markNetworkOnline() {
  emit(true);
}

export function markNetworkOffline() {
  emit(false);
}

export function subscribeNetworkStatus(listener: NetworkStatusListener) {
  listeners.add(listener);
  listener(apiOnline);
  return () => listeners.delete(listener);
}

export async function checkApiConnection(options: { force?: boolean } = {}) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    lastCheckAt = Date.now();
    markNetworkOffline();
    return false;
  }

  const now = Date.now();
  if (!options.force && now - lastCheckAt < MIN_CHECK_INTERVAL_MS) {
    return apiOnline;
  }

  if (inFlightCheck) return inFlightCheck;

  lastCheckAt = now;
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), HEALTHCHECK_TIMEOUT_MS);

  inFlightCheck = fetch(resolveHealthUrl(), {
    method: "GET",
    cache: "no-store",
    signal: controller.signal,
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      const body = response.ok ? await response.json().catch(() => null) : null;
      const isReachable = response.status === 200 && body?.status === "UP";
      if (isReachable) {
        markNetworkOnline();
      } else {
        markNetworkOffline();
      }
      return isReachable;
    })
    .catch(() => {
      markNetworkOffline();
      return false;
    })
    .finally(() => {
      globalThis.clearTimeout(timeout);
      inFlightCheck = null;
    });

  return inFlightCheck;
}
