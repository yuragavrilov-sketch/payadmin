import { useState, useMemo, useEffect } from 'react'
import { useMonitoring, executeServiceAction } from '@/hooks/useMonitoring'
import MonitoringGroup from '@/components/MonitoringGroup'
import type { MonitoringGroupDto } from '@/lib/infra-types'

function useRelativeTime(groups: MonitoringGroupDto[]) {
  const [now, setNow] = useState(Date.now())

  // Update "now" every second
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const latestCheck = useMemo(() => {
    let latest = 0
    for (const g of groups) {
      for (const s of g.services) {
        if (s.checkedAt) {
          const t = new Date(s.checkedAt).getTime()
          if (t > latest) latest = t
        }
      }
    }
    return latest
  }, [groups])

  const secondsAgo = latestCheck ? Math.max(0, Math.floor((now - latestCheck) / 1000)) : null
  return secondsAgo
}

export default function MonitoringPage() {
  const { data: groups, loading, refresh } = useMonitoring(30000)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [groupFilter, setGroupFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const secondsAgo = useRelativeTime(groups)
  const nextIn = secondsAgo !== null ? Math.max(0, 30 - secondsAgo) : 30

  // Totals
  const totals = useMemo(() => {
    let running = 0, stopped = 0, unreachable = 0, total = 0
    for (const g of groups) {
      running += g.runningCount
      stopped += g.stoppedCount
      unreachable += g.unreachableCount
      total += g.services.length
    }
    return { total, running, stopped, unreachable }
  }, [groups])

  // Unique group names for filter
  const groupNames = useMemo(() => groups.map(g => g.groupName), [groups])

  // Filtered groups
  const filtered = useMemo(() => {
    let result = groups
    if (groupFilter) {
      result = result.filter(g => g.groupName === groupFilter)
    }
    if (statusFilter) {
      result = result
        .map(g => ({
          ...g,
          services: g.services.filter(s => s.status === statusFilter),
        }))
        .filter(g => g.services.length > 0)
    }
    return result
  }, [groups, groupFilter, statusFilter])

  async function handleAction(serviceId: number, action: string) {
    setActionLoading(serviceId)
    try {
      await executeServiceAction(serviceId, action)
      refresh()
    } catch {
      // errors handled silently
    } finally {
      setActionLoading(null)
    }
  }

  if (loading && groups.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-slate-800">Service Monitoring</h1>
        <p className="mt-4 text-slate-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Service Monitoring</h1>
        <span className="text-xs text-slate-400">
          {secondsAgo !== null
            ? `Last poll: ${secondsAgo}s ago · Next in ${nextIn}s`
            : 'Waiting for data...'}
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard label="Total" value={totals.total} labelColor="text-slate-400" />
        <SummaryCard label="Running" value={totals.running} labelColor="text-green-500" />
        <SummaryCard label="Stopped" value={totals.stopped} labelColor="text-red-500" />
        <SummaryCard label="Unreachable" value={totals.unreachable} labelColor="text-amber-500" />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          className="border rounded-lg px-3 py-1.5 text-sm bg-white"
          value={groupFilter}
          onChange={e => setGroupFilter(e.target.value)}
        >
          <option value="">All groups</option>
          {groupNames.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select
          className="border rounded-lg px-3 py-1.5 text-sm bg-white"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="Running">Running</option>
          <option value="Stopped">Stopped</option>
          <option value="Unknown">Unknown</option>
        </select>
      </div>

      {/* Groups */}
      <div className="space-y-4">
        {filtered.map(g => (
          <MonitoringGroup
            key={g.groupId}
            group={g}
            onAction={handleAction}
            actionLoading={actionLoading}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-slate-400 py-8">No services match the current filters.</p>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, labelColor }: { label: string; value: number; labelColor: string }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className={`text-xs uppercase font-medium ${labelColor}`}>{label}</div>
      <div className="text-3xl font-bold text-slate-800 mt-1">{value}</div>
    </div>
  )
}
