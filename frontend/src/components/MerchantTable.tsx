import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import CircuitBadge from './CircuitBadge'
import type { MerchantListItem } from '@/hooks/useMerchants'

interface MerchantTableProps {
  merchants: MerchantListItem[]
  totalElements: number
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
  onRowClick: (mercid: number) => void
}

export default function MerchantTable({
  merchants,
  totalElements,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onRowClick,
}: MerchantTableProps) {
  return (
    <div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-20 text-xs font-medium text-slate-500">MERC ID</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">NAME</TableHead>
              <TableHead className="w-28 text-xs font-medium text-slate-500">INITIATOR</TableHead>
              <TableHead className="w-24 text-xs font-medium text-slate-500">CIRCUIT</TableHead>
              <TableHead className="w-28 text-xs font-medium text-slate-500">HIERARCHY</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {merchants.map((m) => (
              <TableRow
                key={m.mercid}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => onRowClick(m.mercid)}
              >
                <TableCell className="text-blue-600 font-medium">{m.mercid}</TableCell>
                <TableCell className="text-slate-800">{m.name}</TableCell>
                <TableCell className="text-slate-500">{m.initiator}</TableCell>
                <TableCell>
                  <CircuitBadge circuit={m.circuit} />
                </TableCell>
                <TableCell className="text-slate-500">{m.hierarchyId}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-slate-400">
          Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)} of{' '}
          {totalElements.toLocaleString()}
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = page < 3 ? i : page - 2 + i
            if (p >= totalPages) return null
            return (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(p)}
              >
                {p + 1}
              </Button>
            )
          })}
          {totalPages > 5 && page < totalPages - 3 && (
            <>
              <span className="px-2 text-slate-400 text-sm self-center">...</span>
              <Button variant="outline" size="sm" onClick={() => onPageChange(totalPages - 1)}>
                {totalPages}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
