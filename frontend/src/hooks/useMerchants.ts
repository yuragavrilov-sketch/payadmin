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

interface PageResponse<T> {
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
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort: 'mercid,asc',
    })
    if (search) params.set('search', search)

    apiFetch<PageResponse<MerchantListItem>>(`/merchants?${params}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, page, size])

  return { data, loading, error }
}

export function useMerchantDetail(mercid: number | null) {
  const [detail, setDetail] = useState<MerchantDetail | null>(null)
  const [config, setConfig] = useState<MerchantConfig[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDetail = useCallback(async (id: number) => {
    setLoading(true)
    try {
      const [detailData, configData] = await Promise.all([
        apiFetch<MerchantDetail>(`/merchants/${id}`),
        apiFetch<MerchantConfig[]>(`/merchants/${id}/config`),
      ])
      setDetail(detailData)
      setConfig(configData)
    } catch {
      setDetail(null)
      setConfig([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (mercid !== null) {
      fetchDetail(mercid)
    } else {
      setDetail(null)
      setConfig([])
    }
  }, [mercid, fetchDetail])

  return { detail, config, loading }
}
