import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import type { CredentialDto } from '@/lib/infra-types'

export function useCredentials() {
  const [data, setData] = useState<CredentialDto[]>([])
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(() => {
    setLoading(true)
    apiFetch<CredentialDto[]>('/infra/credentials')
      .then(setData)
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { refresh() }, [refresh])
  return { data, loading, refresh }
}
