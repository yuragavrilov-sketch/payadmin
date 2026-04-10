import { useState } from 'react'
import { useHostServices } from '@/hooks/useHostServices'
import { useServiceGroups } from '@/hooks/useServiceGroups'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface HostServicesDialogProps {
  open: boolean
  onClose: () => void
  hostId: number | null
  hostname: string
  onRefresh: () => void
}

export default function HostServicesDialog({
  open,
  onClose,
  hostId,
  hostname,
  onRefresh,
}: HostServicesDialogProps) {
  const { data: services, loading, refresh } = useHostServices(hostId)
  const { data: groups } = useServiceGroups()

  const [showAdd, setShowAdd] = useState(false)
  const [serviceName, setServiceName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [groupId, setGroupId] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)

  function resetForm() {
    setServiceName('')
    setDisplayName('')
    setGroupId('')
  }

  async function handleAdd() {
    if (!serviceName || !groupId || hostId == null) return
    setSaving(true)
    try {
      await apiFetch(`/infra/hosts/${hostId}/services`, {
        method: 'POST',
        body: JSON.stringify({
          hostId,
          groupId,
          serviceName,
          displayName: displayName || null,
        }),
      })
      refresh()
      onRefresh()
      setShowAdd(false)
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(serviceId: number) {
    if (hostId == null) return
    if (!confirm('Remove this service from monitoring?')) return
    await apiFetch(`/infra/hosts/${hostId}/services/${serviceId}`, { method: 'DELETE' })
    refresh()
    onRefresh()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Services on {hostname}</DialogTitle>
        </DialogHeader>

        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-slate-500">{services.length} monitored</span>
          <Button size="sm" onClick={() => setShowAdd(true)} disabled={groups.length === 0}>
            + Add Service
          </Button>
        </div>

        {groups.length === 0 && (
          <p className="text-xs text-amber-600 mb-2">
            Create a Service Group first to add services
          </p>
        )}

        {loading ? (
          <div className="text-sm text-slate-400 py-4 text-center">Loading...</div>
        ) : services.length === 0 ? (
          <div className="text-sm text-slate-400 py-6 text-center">
            No monitored services on this host
          </div>
        ) : (
          <div className="flex flex-col gap-1 max-h-80 overflow-auto">
            {services.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800 truncate">
                      {s.serviceName}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      {s.groupName}
                    </span>
                  </div>
                  {s.displayName && (
                    <div className="text-xs text-slate-500 truncate">{s.displayName}</div>
                  )}
                </div>
                <button
                  className="text-red-500 hover:text-red-700 text-sm ml-2"
                  onClick={() => handleDelete(s.id)}
                  title="Remove"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}

        {showAdd && (
          <div className="mt-3 p-3 border border-slate-200 rounded-lg bg-white">
            <div className="text-xs font-medium text-slate-700 mb-2">Add Service</div>
            <div className="flex flex-col gap-2">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Windows service name</label>
                <Input
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. PayGateService"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Display name (optional)</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Friendly label"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Group</label>
                <select
                  className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Select group...</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowAdd(false); resetForm() }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={saving || !serviceName || !groupId}
                >
                  {saving ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
