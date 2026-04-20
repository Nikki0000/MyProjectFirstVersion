import type { AuthResponse } from "./types";

const AUTH_STORAGE_KEY = "autowrap-auth-v2";
const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: ApiMethod;
  body?: unknown;
  authRequired?: boolean;
}

export function getAuth(): AuthResponse | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveAuth(auth: AuthResponse): AuthResponse {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  return auth;
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = getAuth();
  const { method = "GET", body, authRequired = false } = options;

  if (authRequired && !auth?.token) {
    throw new Error("Требуется авторизация.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload));
  }

  return payload as T;
}

function extractErrorMessage(payload: unknown): string {
  if (!payload) {
    return "Ошибка запроса.";
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    "errors" in payload &&
    Array.isArray((payload as { errors: unknown[] }).errors)
  ) {
    const typed = payload as { message: string; errors: Array<{ field: string; message: string }> };
    const lines = typed.errors.map((error) => `- ${mapField(error.field)}: ${error.message}`);
    return `${typed.message}\n${lines.join("\n")}`;
  }

  if (typeof payload === "object" && payload !== null && "title" in payload && typeof (payload as { title: unknown }).title === "string") {
    return (payload as { title: string }).title;
  }

  return "Ошибка запроса.";
}

function mapField(field: string): string {
  const normalized = field.toLowerCase();
  if (normalized.includes("email")) return "Email";
  if (normalized.includes("password")) return "Пароль";
  if (normalized.includes("fullname") || normalized.includes("name")) return "Имя";
  if (normalized.includes("title")) return "Название";
  if (normalized.includes("description")) return "Описание";
  if (normalized.includes("city")) return "Город";
  if (normalized.includes("budget")) return "Бюджет";
  if (normalized.includes("role")) return "Роль";
  return field;
}
