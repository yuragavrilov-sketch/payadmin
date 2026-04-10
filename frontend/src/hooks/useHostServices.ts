import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import type { MonitoredServiceDto } from '@/lib/infra-types'

export function useHostServices(hostId: number | null) {
  const [data, setData] = useState<MonitoredServiceDto[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(() => {
    if (hostId == null) {
      setData([])
      return
    }
    setLoading(true)
    apiFetch<MonitoredServiceDto[]>(`/infra/hosts/${hostId}/services`)
      .then(setData)
      .finally(() => setLoading(false))
  }, [hostId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, loading, refresh }
}
