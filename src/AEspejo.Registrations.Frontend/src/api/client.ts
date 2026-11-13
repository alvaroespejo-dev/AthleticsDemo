import type { ProblemDetails } from './types'

/** Base URL of the API. In `next dev` it goes through the rewrite in next.config.ts. */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api'

const PANEL_TOKEN_KEY = 'aespejo.token'
const ATHLETE_TOKEN_KEY = 'aespejo.athlete.token'

/**
 * Error carrying the detail the API returned. The backend writes the business-rule messages so that
 * the operator understands what to fix, so they are shown exactly as they arrive.
 */
export class ApiError extends Error {
  // Declared and assigned by hand: the project uses `erasableSyntaxOnly`, which does not allow
  // parameter properties in constructors.
  readonly status: number
  readonly title?: string
  /** Per-field validation messages, present only for 400 validation errors. */
  readonly fields?: Record<string, string>

  constructor(status: number, message: string, title?: string, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.title = title
    this.fields = fields
  }

  /** The token expired or is invalid: the user has to sign in again. */
  get requiresSignIn() {
    return this.status === 401
  }
}

/** Storage for the panel's bearer token. Client-only: guarded so SSR and blocked storage do not throw. */
export const tokenStore = {
  read: () => safeStorage(() => localStorage.getItem(PANEL_TOKEN_KEY)),
  save: (token: string) => safeStorage(() => localStorage.setItem(PANEL_TOKEN_KEY, token)),
  clear: () => safeStorage(() => localStorage.removeItem(PANEL_TOKEN_KEY)),
}

/** Storage for the athlete portal's bearer token. */
export const athleteTokenStore = {
  read: () => safeStorage(() => localStorage.getItem(ATHLETE_TOKEN_KEY)),
  save: (token: string) => safeStorage(() => localStorage.setItem(ATHLETE_TOKEN_KEY, token)),
  clear: () => safeStorage(() => localStorage.removeItem(ATHLETE_TOKEN_KEY)),
}

function safeStorage<T>(action: () => T): T | null {
  if (typeof window === 'undefined') return null
  try {
    return action()
  } catch {
    // Storage blocked (private window, cleared site data): the caller falls back to "signed out".
    return null
  }
}

/** Language sent to the API, so its messages come back in the user's language. */
function acceptLanguage(): string {
  if (typeof document === 'undefined') return 'en'
  return document.documentElement.lang || 'en'
}

/** Shape of an RFC 9457 problem response, as produced by ApiExceptionHandler on the backend. */
async function readError(response: Response): Promise<ApiError> {
  let problem: ProblemDetails = {}

  try {
    problem = await response.json()
  } catch {
    // No body or a non-JSON body: falls through to the generic message below.
  }

  if (problem.fields && Object.keys(problem.fields).length > 0) {
    const detail = Object.values(problem.fields).join(' ')
    return new ApiError(response.status, detail, problem.title, problem.fields)
  }

  const message = problem.detail ?? problem.title ?? `The request failed with status ${response.status}.`

  return new ApiError(response.status, message, problem.title)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.read()

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': acceptLanguage(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) throw await readError(response)

  if (response.status === 204) return undefined as T

  const text = await response.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  delete: (path: string) => request<void>(path, { method: 'DELETE' }),

  /**
   * Uploads a file as multipart.
   *
   * Does not go through `request`, which sets `Content-Type: application/json`. A multipart body needs
   * the browser to set its own content type with the `boundary` it generates.
   */
  async uploadFile<T>(path: string, field: string, file: File): Promise<T> {
    const token = tokenStore.read()
    const body = new FormData()
    body.append(field, file)

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Accept-Language': acceptLanguage(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
    })

    if (!response.ok) throw await readError(response)

    const text = await response.text()
    return text ? (JSON.parse(text) as T) : (undefined as T)
  },

  /**
   * Downloads an authenticated binary (the WhatsApp media, for example). A plain `<img src>` cannot
   * send the token, which goes in the `Authorization` header rather than the URL, so the file is
   * fetched and turned into an object URL for display.
   */
  async downloadBlob(path: string): Promise<Blob> {
    const token = tokenStore.read()

    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })

    if (!response.ok) throw await readError(response)

    return response.blob()
  },
}

/** Calls made with an explicit athlete token (or the stored one), for the athlete portal. */
export const athleteApi = {
  get: <T>(path: string, token?: string) => requestWithToken<T>(path, token ?? athleteTokenStore.read()),

  post: <T>(path: string, body: unknown, token?: string) =>
    requestWithToken<T>(path, token ?? athleteTokenStore.read(), {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown, token?: string) =>
    requestWithToken<T>(path, token ?? athleteTokenStore.read(), {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
}

async function requestWithToken<T>(path: string, token: string | null, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': acceptLanguage(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) throw await readError(response)

  const text = await response.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}
