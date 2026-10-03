/** Base URL of the API. Empty in development (Vite proxies /api), set in production builds. */
export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

const TOKEN_KEY = 'worksync.token'

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set: (token: string | null) => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* storage unavailable (private mode); session lasts for this tab only */
    }
  },
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message)
  }
}

let onUnauthorized: () => void = () => {}
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn
}

type Body = Record<string, unknown> | FormData | undefined

async function request<T>(method: string, path: string, body?: Body): Promise<T> {
  const headers: Record<string, string> = {}
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.")
  }

  if (res.status === 204 || res.status === 202) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized()
    throw new ApiError(
      res.status,
      data.error ?? `Request failed (${res.status})`,
      data.details?.fields ?? {},
    )
  }
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: Body) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: Body) => request<T>('PATCH', path, body),
  put: <T>(path: string, body?: Body) => request<T>('PUT', path, body),
  delete: <T>(path: string, body?: Body) => request<T>('DELETE', path, body),
}

export function avatarUrl(
  kind: 'user' | 'group',
  id: string,
  version: number | null,
): string | null {
  if (version === null) return null
  return `${API_URL}/api/${kind === 'user' ? 'users' : 'groups'}/${id}/avatar?v=${version}`
}

export const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'Something went wrong. Please try again.'

export const fieldErrorsOf = (err: unknown): Record<string, string> =>
  err instanceof ApiError ? err.fields : {}
