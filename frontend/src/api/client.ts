function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : "Ошибка запроса");
    this.status = status;
    this.detail = detail;
  }
}

async function ensureCsrfCookie() {
  if (!getCookie("csrftoken")) {
    await fetch("/api/auth/csrf/", { credentials: "include" });
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  if (method !== "GET") {
    await ensureCsrfCookie();
  }

  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const csrfToken = getCookie("csrftoken");
  if (csrfToken && method !== "GET") {
    headers.set("X-CSRFToken", csrfToken);
  }

  const response = await fetch(path, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(response.status, isJson ? data?.detail ?? data : data);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};

// Переиспользует загрузку файлов CKEditor5 (уже требует is_staff) вместо отдельного эндпоинта.
export async function uploadImage(file: File): Promise<string> {
  await ensureCsrfCookie();
  const formData = new FormData();
  formData.append("upload", file);
  const csrfToken = getCookie("csrftoken");
  const response = await fetch("/ckeditor5/image_upload/", {
    method: "POST",
    headers: csrfToken ? { "X-CSRFToken": csrfToken } : undefined,
    body: formData,
    credentials: "include",
  });
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new ApiError(response.status, data?.error?.message ?? "Не удалось загрузить изображение");
  }
  return data.url as string;
}
