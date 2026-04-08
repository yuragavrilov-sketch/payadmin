import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import type { ServiceGroupDto } from '@/lib/infra-types'

export function useServiceGroups() {
  const [data, setData] = useState<ServiceGroupDto[]>([])
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(() => {
    setLoading(true)
    apiFetch<ServiceGroupDto[]>('/infra/service-groups')
      .then(setData)
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { refresh() }, [refresh])
  return { data, loading, refresh }
}
