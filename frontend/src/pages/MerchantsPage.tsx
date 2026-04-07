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
        <div className="flex items-center justify-center py-20 text-slate-400">Loading...</div>
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
