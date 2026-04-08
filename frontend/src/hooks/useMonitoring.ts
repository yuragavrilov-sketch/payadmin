import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import type { MonitoringGroupDto } from '@/lib/infra-types'

export function useMonitoring(pollInterval: number = 30000) {
  const [data, setData] = useState<MonitoringGroupDto[]>([])
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(() => {
    apiFetch<MonitoringGroupDto[]>('/infra/monitoring')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, pollInterval)
    return () => clearInterval(timer)
  }, [refresh, pollInterval])
  return { data, loading, refresh }
}

export async function executeServiceAction(serviceId: number, action: string): Promise<string> {
  const res = await apiFetch<{ result: string }>('/infra/monitoring/action', {
    method: 'POST',
    body: JSON.stringify({ serviceId, action }),
  })
  return res.result
}
