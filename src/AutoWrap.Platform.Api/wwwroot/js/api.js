export const AUTH_STORAGE_KEY = "autowrap-auth-v1";

export function getAuth() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveAuth(data) {
  const auth = {
    token: data.token,
    userId: data.userId,
    fullName: data.fullName,
    email: data.email,
    role: data.role
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  return auth;
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function roleName(role) {
  if (role === "Customer") return "Заказчик";
  if (role === "Wrapper") return "Исполнитель";
  if (role === "Admin") return "Администратор";
  return role;
}

export async function apiRequest(path, { method = "GET", body, authRequired = false } = {}) {
  const auth = getAuth();
  const headers = { "Content-Type": "application/json" };

  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }

  if (authRequired && !auth?.token) {
    throw new Error("Требуется авторизация.");
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload));
  }

  return payload;
}

export function toStatusCode(status) {
  switch (status) {
    case "Open": return 1;
    case "InProgress": return 2;
    case "Completed": return 3;
    case "Cancelled": return 4;
    default: return null;
  }
}

export function extractErrorMessage(payload) {
  if (!payload) {
    return "Произошла ошибка запроса.";
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (payload.message && Array.isArray(payload.errors) && payload.errors.length > 0) {
    const lines = payload.errors.map(e => `- ${mapField(e.field)}: ${e.message}`);
    return `${payload.message}\n${lines.join("\n")}`;
  }

  if (payload.errors && typeof payload.errors === "object") {
    const lines = [];
    for (const [field, messages] of Object.entries(payload.errors)) {
      const arrayMessages = Array.isArray(messages) ? messages : [messages];
      for (const message of arrayMessages) {
        lines.push(`- ${mapField(field)}: ${message}`);
      }
    }

    if (lines.length > 0) {
      return `Проверьте заполнение формы:\n${lines.join("\n")}`;
    }
  }

  return payload.title || payload.detail || "Произошла ошибка запроса.";
}

function mapField(field) {
  if (!field) return "Поле";

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

export function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3500);
}
