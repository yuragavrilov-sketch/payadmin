import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export interface MerchantListItem {
  mercid: number
  name: string
  initiator: string
  circuit: string
  hierarchyId: number
}

export interface MerchantDetail {
  mercid: number
  name: string
  initiator: string
  circuit: string
  hierarchyId: number
  paLogin: string
  apiLogin: string
}

export interface MerchantConfig {
  parameterName: string
  parameterValue: string
  dateBegin: string
  dateEnd: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export function useMerchantList(search: string, page: number, size: number = 20) {
  const [data, setData] = useState<PageResponse<MerchantListItem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort: 'mercid,asc',
    })
    if (search) params.set('search', search)

    apiFetch<PageResponse<MerchantListItem>>(`/merchants?${params}`, { signal: controller.signal })
      .then(setData)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [search, page, size])

  return { data, loading, error }
}

export function useMerchantDetail(mercid: number | null) {
  const [detail, setDetail] = useState<MerchantDetail | null>(null)
  const [config, setConfig] = useState<MerchantConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(async (id: number, signal: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const [detailData, configData] = await Promise.all([
        apiFetch<MerchantDetail>(`/merchants/${id}`, { signal }),
        apiFetch<MerchantConfig[]>(`/merchants/${id}/config`, { signal }),
      ])
      setDetail(detailData)
      setConfig(configData)
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setError(e.message)
        setDetail(null)
        setConfig([])
      }
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (mercid !== null) {
      const controller = new AbortController()
      fetchDetail(mercid, controller.signal)
      return () => controller.abort()
    } else {
      setDetail(null)
      setConfig([])
      setError(null)
    }
  }, [mercid, fetchDetail])

  return { detail, config, loading, error }
}
