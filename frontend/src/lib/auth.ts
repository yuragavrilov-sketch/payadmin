interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
}

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180'
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'payadmin'
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'payadmin-frontend'

const TOKEN_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`

const STORAGE_KEY = 'payadmin_auth'

const state: AuthState = loadState()

function loadState(): AuthState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { accessToken: null, refreshToken: null, expiresAt: null }
}

function persistState(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}

export async function login(username: string, password: string): Promise<void> {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: KEYCLOAK_CLIENT_ID,
    username,
    password,
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    throw new Error('Invalid credentials')
  }

  const data: TokenResponse = await res.json()
  setTokens(data)
}

export function logout(): void {
  state.accessToken = null
  state.refreshToken = null
  state.expiresAt = null
  cachedUserInfo = null
  try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}

export function getAccessToken(): string | null {
  return state.accessToken
}

export function isAuthenticated(): boolean {
  return state.accessToken !== null && state.expiresAt !== null && Date.now() < state.expiresAt
}

export async function refreshAccessToken(): Promise<boolean> {
  if (!state.refreshToken) return false

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: KEYCLOAK_CLIENT_ID,
    refresh_token: state.refreshToken,
  })

  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!res.ok) return false

    const data: TokenResponse = await res.json()
    setTokens(data)
    return true
  } catch {
    return false
  }
}

let cachedUserInfo: { username: string; roles: string[] } | null = null
let cachedToken: string | null = null

export function getUserInfo(): { username: string; roles: string[] } | null {
  if (!state.accessToken) return null
  if (cachedToken === state.accessToken && cachedUserInfo) return cachedUserInfo

  try {
    const base64 = state.accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    cachedToken = state.accessToken
    cachedUserInfo = {
      username: payload.preferred_username || payload.sub,
      roles: payload.realm_access?.roles || [],
    }
    return cachedUserInfo
  } catch {
    return null
  }
}

function setTokens(data: TokenResponse): void {
  state.accessToken = data.access_token
  state.refreshToken = data.refresh_token
  state.expiresAt = Date.now() + data.expires_in * 1000
  cachedUserInfo = null
  cachedToken = null
  persistState()
}
