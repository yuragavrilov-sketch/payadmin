import { useState, useCallback } from 'react'
import SearchInput from '@/components/SearchInput'
import MerchantTable from '@/components/MerchantTable'
import MerchantDetailModal from '@/components/MerchantDetailModal'
import { useMerchantList, useMerchantDetail } from '@/hooks/useMerchants'

export default function MerchantsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selectedMercid, setSelectedMercid] = useState<number | null>(null)

  const { data, loading, error } = useMerchantList(search, page)
  const { detail, config, loading: detailLoading } = useMerchantDetail(selectedMercid)

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(0)
  }, [])

  return (
    <div className="p-6">
      <div className="mb-1">
        <h1 className="text-xl font-semibold text-slate-800">Merchants</h1>
        <span className="text-sm text-slate-400">
          {data ? `${data.totalElements.toLocaleString()} total` : ''}
        </span>
      </div>

      <div className="my-4">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by ID or Name..."
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex gap-8">
            {[80, 160, 100, 60, 100].map((w, i) => (
              <div key={i} className="h-3 bg-slate-200 rounded animate-pulse" style={{ width: w }} />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-4 py-3.5 border-b border-slate-100 flex gap-8">
              <div className="h-3.5 w-16 bg-slate-100 rounded animate-pulse" />
              <div className="h-3.5 w-40 bg-slate-100 rounded animate-pulse" />
              <div className="h-3.5 w-24 bg-slate-100 rounded animate-pulse" />
              <div className="h-3.5 w-12 bg-slate-100 rounded animate-pulse" />
              <div className="h-3.5 w-20 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : data ? (
        <MerchantTable
          merchants={data.content}
          totalElements={data.totalElements}
          page={data.number}
          totalPages={data.totalPages}
          onPageChange={setPage}
          onRowClick={setSelectedMercid}
        />
      ) : null}

      <MerchantDetailModal
        open={selectedMercid !== null}
        onClose={() => setSelectedMercid(null)}
        detail={detail}
        config={config}
        loading={detailLoading}
      />
    </div>
  )
}
