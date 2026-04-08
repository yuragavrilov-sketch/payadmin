import { useState } from 'react'
import type { MonitoringGroupDto, MonitoringServiceDto } from '@/lib/infra-types'
import StatusBadge from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface MonitoringGroupProps {
  group: MonitoringGroupDto
  onAction: (serviceId: number, action: string) => void
  actionLoading: number | null
}

export default function MonitoringGroup({ group, onAction, actionLoading }: MonitoringGroupProps) {
  const hasProblems = group.services.some(s => s.status !== 'Running')
  const [expanded, setExpanded] = useState(hasProblems)
  const [confirm, setConfirm] = useState<{ serviceId: number; action: string; name: string } | null>(null)

  function handleAction(svc: MonitoringServiceDto, action: string) {
    if (action === 'START') {
      onAction(svc.serviceId, action)
    } else {
      setConfirm({ serviceId: svc.serviceId, action, name: svc.displayName || svc.serviceName })
    }
  }

  function rowBg(status: string) {
    if (status === 'Stopped') return 'bg-red-50/60'
    if (status === 'Unknown' || status === 'Unreachable') return 'bg-amber-50/60'
    return ''
  }

  function formatInfo(svc: MonitoringServiceDto) {
    if (svc.status === 'Running' && svc.pid) {
      return `PID ${svc.pid}`
    }
    if (svc.errorMessage) return svc.errorMessage
    return '—'
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="text-slate-400 text-xs">{expanded ? '▼' : '▶'}</span>
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
          {group.groupName}
        </span>
        <span className="text-sm text-slate-400 flex-1">{group.groupDescription}</span>
        <div className="flex gap-2">
          {group.runningCount > 0 && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
              {group.runningCount} running
            </span>
          )}
          {group.stoppedCount > 0 && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
              {group.stoppedCount} stopped
            </span>
          )}
          {group.unreachableCount > 0 && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
              {group.unreachableCount} unreachable
            </span>
          )}
        </div>
      </button>

      {/* Table */}
      {expanded && (
        <div className="border-t">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>HOST</TableHead>
                <TableHead>SERVICE</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>INFO</TableHead>
                <TableHead>ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.services.map(svc => (
                <TableRow key={svc.serviceId} className={cn(rowBg(svc.status))}>
                  <TableCell className="font-medium">{svc.hostname}</TableCell>
                  <TableCell>{svc.displayName || svc.serviceName}</TableCell>
                  <TableCell><StatusBadge status={svc.status} /></TableCell>
                  <TableCell className="text-slate-500 text-xs max-w-[200px] truncate">
                    {formatInfo(svc)}
                  </TableCell>
                  <TableCell>
                    {svc.status === 'Running' ? (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          disabled={actionLoading === svc.serviceId}
                          onClick={() => handleAction(svc, 'STOP')}
                        >
                          {actionLoading === svc.serviceId ? '...' : 'Stop'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === svc.serviceId}
                          onClick={() => handleAction(svc, 'RESTART')}
                        >
                          {actionLoading === svc.serviceId ? '...' : 'Restart'}
                        </Button>
                      </div>
                    ) : svc.status === 'Stopped' ? (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={actionLoading === svc.serviceId}
                        onClick={() => handleAction(svc, 'START')}
                      >
                        {actionLoading === svc.serviceId ? '...' : 'Start'}
                      </Button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Confirmation dialog */}
      <Dialog open={confirm !== null} onOpenChange={open => { if (!open) setConfirm(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {confirm?.action?.toLowerCase()}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirm?.action?.toLowerCase()} <strong>{confirm?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button
              variant={confirm?.action === 'STOP' ? 'destructive' : 'default'}
              onClick={() => {
                if (confirm) {
                  onAction(confirm.serviceId, confirm.action)
                  setConfirm(null)
                }
              }}
            >
              {confirm?.action === 'STOP' ? 'Stop' : 'Restart'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
