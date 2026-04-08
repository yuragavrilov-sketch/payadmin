import { useState } from 'react'
import { useAuditLog } from '@/hooks/useAuditLog'
import ActionBadge from '@/components/ActionBadge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const actionOptions = [
  'All actions', 'START', 'STOP', 'RESTART',
  'HOST_ADD', 'HOST_DELETE', 'CRED_ADD', 'CRED_DELETE',
  'SERVICE_ADD', 'SERVICE_DELETE',
]

const dateRanges = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'All time', days: null },
]

const selectClass = 'px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600'

export default function AuditLogPage() {
  const [page, setPage] = useState(0)
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [selectedDateRange, setSelectedDateRange] = useState<number | null>(7)
  const [usernameFilter, setUsernameFilter] = useState('')

  const { data, loading } = useAuditLog(
    page,
    usernameFilter || undefined,
    selectedAction || undefined,
  )

  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 0
  const pageSize = data?.size ?? 20

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Audit Log</h1>
        <p className="text-sm text-slate-500 mt-1">All service management actions</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          className={selectClass}
          value={selectedDateRange ?? ''}
          onChange={(e) => {
            const v = e.target.value
            setSelectedDateRange(v === '' ? null : Number(v))
          }}
        >
          {dateRanges.map((r) => (
            <option key={r.label} value={r.days ?? ''}>{r.label}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="All users"
          className={cn(selectClass, 'min-w-[140px]')}
          value={usernameFilter}
          onChange={(e) => {
            setUsernameFilter(e.target.value)
            setPage(0)
          }}
        />

        <select
          className={selectClass}
          value={selectedAction}
          onChange={(e) => {
            setSelectedAction(e.target.value === 'All actions' ? '' : e.target.value)
            setPage(0)
          }}
        >
          {actionOptions.map((a) => (
            <option key={a} value={a === 'All actions' ? '' : a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-medium text-slate-500">TIMESTAMP</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">USER</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">ACTION</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">HOST</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">SERVICE</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">RESULT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && data?.content.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                  No audit log entries found.
                </TableCell>
              </TableRow>
            )}
            {!loading && data?.content.map((entry) => (
              <TableRow
                key={entry.id}
                className={cn(entry.result === 'Failed' && 'bg-red-50')}
              >
                <TableCell className="font-mono text-xs text-slate-500">
                  {entry.timestamp}
                </TableCell>
                <TableCell className="font-medium text-slate-800">
                  {entry.username}
                </TableCell>
                <TableCell>
                  <ActionBadge action={entry.action} />
                </TableCell>
                <TableCell className="text-slate-500">
                  {entry.hostname ?? '\u2014'}
                </TableCell>
                <TableCell className="text-slate-800">
                  {entry.serviceName ?? '\u2014'}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      entry.result === 'Failed'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-green-50 text-green-600',
                    )}
                  >
                    {entry.result}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalElements > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">
            Showing {page * pageSize + 1}&ndash;{Math.min((page + 1) * pageSize, totalElements)} of{' '}
            {totalElements.toLocaleString()}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
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
                  onClick={() => setPage(p)}
                >
                  {p + 1}
                </Button>
              )
            })}
            {totalPages > 5 && page < totalPages - 3 && (
              <>
                <span className="px-2 text-slate-400 text-sm self-center">...</span>
                <Button variant="outline" size="sm" onClick={() => setPage(totalPages - 1)}>
                  {totalPages}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
