import { queryClient } from "@/lib/queryClient";

const AUTH_STORAGE_KEYS = [
  "token",
  "vita_token",
  "vita_token_type",
  "vita_user",
];

export const SESSION_EXPIRED_MESSAGE = "Sua sessão expirou. Faça login novamente.";
export const SESSION_EXPIRED_STORAGE_KEY = "vita_session_expired_message";

export function clearAuthSession() {
  AUTH_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });

  queryClient.clear();
}
