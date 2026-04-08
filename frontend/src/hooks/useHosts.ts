import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import type { HostDto } from '@/lib/infra-types'

export function useHosts() {
  const [data, setData] = useState<HostDto[]>([])
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(() => {
    setLoading(true)
    apiFetch<HostDto[]>('/infra/hosts')
      .then(setData)
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { refresh() }, [refresh])
  return { data, loading, refresh }
}
