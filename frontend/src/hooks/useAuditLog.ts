import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import type { AuditLogDto, PageResponse } from '@/lib/infra-types'

export function useAuditLog(page: number, username?: string, action?: string) {
  const [data, setData] = useState<PageResponse<AuditLogDto> | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), size: '20', sort: 'timestamp,desc' })
    if (username) params.set('username', username)
    if (action) params.set('action', action)
    apiFetch<PageResponse<AuditLogDto>>(`/infra/audit?${params}`, { signal: controller.signal })
      .then(setData)
      .catch((e) => { if (e.name !== 'AbortError') console.error(e) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [page, username, action])
  return { data, loading }
}
