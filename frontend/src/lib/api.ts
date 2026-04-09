import { getAccessToken, refreshAccessToken, isAuthenticated, logout } from './auth'

const BASE_URL = '/api'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isAuthenticated()) {
    const refreshed = await refreshAccessToken()
    if (!refreshed) {
      logout()
      throw new Error('Session expired')
    }
  }

  const token = getAccessToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })

  if (res.status === 401) {
    logout()
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }

  const text = await res.text()
  return text ? JSON.parse(text) as T : undefined as unknown as T
}
