export type ApiErrorShape = {
  status: number
  message: string
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | object | null
  query?: Record<string, unknown>
}

const DEFAULT_API_URL = "http://localhost:3000/api/v1"

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, "")
}

export function getAuthToken() {
  return localStorage.getItem("blog.token") || ""
}

export function setAuthToken(token: string) {
  if (token) localStorage.setItem("blog.token", token)
}

export function clearAuthToken() {
  localStorage.removeItem("blog.token")
}

export function normalizeApiError(status: number, payload?: unknown): ApiErrorShape {
  const fallback =
    status === 401
      ? "Your session has expired. Please log in again."
      : status === 413
        ? "This file is too large for the server. Please upload a smaller file."
        : status === 415
          ? "This file type is not supported. Please choose a different format."
          : "Something went wrong while contacting the server."

  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload) as { message?: string }
      if (parsed?.message) return { status, message: parsed.message }
    } catch {
      if (payload.trim()) return { status, message: payload.trim() }
    }
  }

  if (payload && typeof payload === "object") {
    const message = (payload as { message?: string }).message
    if (message) return { status, message }
  }

  return { status, message: fallback }
}

function buildUrl(path: string, query?: Record<string, unknown>) {
  const base = getApiBaseUrl()
  const url = new URL(path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return
      url.searchParams.set(key, String(value))
    })
  }

  return url.toString()
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { query, headers, body, ...rest } = options
  const token = getAuthToken()
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData
  const isJsonBody =
    body !== undefined &&
    body !== null &&
    typeof body === "object" &&
    !isFormData &&
    !(typeof Blob !== "undefined" && body instanceof Blob) &&
    !(body instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(body) &&
    !(body instanceof URLSearchParams)
  const init: RequestInit = {
    ...rest,
    headers: {
      ...(headers as Record<string, string> | undefined),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(isJsonBody && !(headers as Record<string, string> | undefined)?.["Content-Type"]
        ? { "Content-Type": "application/json" }
        : {}),
    },
  }

  if (isJsonBody) {
    init.body = JSON.stringify(body)
  } else if (body !== undefined && body !== null) {
    init.body = body as BodyInit
  }

  const response = await fetch(buildUrl(path, query), init)
  const payload = response.headers.get("content-type")?.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null)

  if (!response.ok) {
    const err = normalizeApiError(response.status, payload)
    if (response.status === 401) {
      clearAuthToken()
      if (window.location.pathname !== "/login") {
        window.location.assign("/login")
      }
    }
    throw err
  }

  return (payload ?? ({} as T)) as T
}

export function uploadWithProgress(
  path: string,
  file: File,
  onProgress?: (value: number) => void,
  query?: Record<string, unknown>,
) {
  return new Promise<unknown>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", buildUrl(path, query), true)

    const token = getAuthToken()
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      const percent = Math.round((event.loaded / event.total) * 100)
      onProgress?.(percent)
    }

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText || "{}"))
        } catch {
          resolve(xhr.responseText as unknown)
        }
        return
      }
      reject(normalizeApiError(xhr.status, xhr.responseText))
      if (xhr.status === 401) {
        clearAuthToken()
        if (window.location.pathname !== "/login") {
          window.location.assign("/login")
        }
      }
    }

    xhr.onerror = () => reject(normalizeApiError(0, "Network error"))

    const form = new FormData()
    form.append("file", file)
    xhr.send(form)
  })
}
