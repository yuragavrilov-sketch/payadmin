import { useState, useEffect, useMemo } from 'react'
import { useHostServices } from '@/hooks/useHostServices'
import { useServiceGroups } from '@/hooks/useServiceGroups'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import StatusBadge from '@/components/StatusBadge'
import type { WindowsServiceDto } from '@/lib/infra-types'
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
  const [windowsServices, setWindowsServices] = useState<WindowsServiceDto[]>([])
  const [loadingWindows, setLoadingWindows] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [selectedService, setSelectedService] = useState<WindowsServiceDto | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [groupId, setGroupId] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)

  const monitoredNames = useMemo(
    () => new Set(services.map((s) => s.serviceName.toLowerCase())),
    [services]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return windowsServices
      .filter((s) => !monitoredNames.has(s.name.toLowerCase()))
      .filter((s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.displayName && s.displayName.toLowerCase().includes(q))
      )
      .slice(0, 100)
  }, [windowsServices, search, monitoredNames])

  useEffect(() => {
    if (!showAdd || hostId == null) return
    if (windowsServices.length > 0) return

    setLoadingWindows(true)
    setLoadError(null)
    apiFetch<WindowsServiceDto[]>(`/infra/hosts/${hostId}/windows-services`)
      .then(setWindowsServices)
      .catch((e) => setLoadError(e.message || 'Failed to load services'))
      .finally(() => setLoadingWindows(false))
  }, [showAdd, hostId, windowsServices.length])

  function resetForm() {
    setSelectedService(null)
    setDisplayName('')
    setGroupId('')
    setSearch('')
  }

  function closeAdd() {
    setShowAdd(false)
    resetForm()
  }

  async function handleAdd() {
    if (!selectedService || !groupId || hostId == null) return
    setSaving(true)
    try {
      await apiFetch(`/infra/hosts/${hostId}/services`, {
        method: 'POST',
        body: JSON.stringify({
          hostId,
          groupId,
          serviceName: selectedService.name,
          displayName: displayName || selectedService.displayName || null,
        }),
      })
      refresh()
      onRefresh()
      closeAdd()
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

  function handleClose() {
    setWindowsServices([])
    closeAdd()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
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
          <div className="flex flex-col gap-1 max-h-64 overflow-auto">
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
            <div className="text-xs font-medium text-slate-700 mb-2">Add Service from {hostname}</div>

            {loadingWindows ? (
              <div className="text-sm text-slate-400 py-4 text-center">
                Loading services from host...
              </div>
            ) : loadError ? (
              <div className="text-sm text-red-600 py-2">{loadError}</div>
            ) : (
              <>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search services..."
                  className="mb-2"
                />

                <div className="flex flex-col gap-0.5 max-h-48 overflow-auto border border-slate-200 rounded-lg">
                  {filtered.length === 0 ? (
                    <div className="text-xs text-slate-400 py-4 text-center">
                      {windowsServices.length === 0 ? 'No services loaded' : 'No matches'}
                    </div>
                  ) : (
                    filtered.map((ws) => (
                      <button
                        key={ws.name}
                        onClick={() => setSelectedService(ws)}
                        className={`flex items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-slate-50 ${
                          selectedService?.name === ws.name ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-slate-800 truncate">{ws.name}</div>
                          {ws.displayName && (
                            <div className="text-slate-500 truncate">{ws.displayName}</div>
                          )}
                        </div>
                        <StatusBadge status={ws.status} />
                      </button>
                    ))
                  )}
                </div>

                {selectedService && (
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="text-xs text-slate-600">
                      Selected: <span className="font-mono font-medium">{selectedService.name}</span>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Display name (optional)</label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={selectedService.displayName || 'Friendly label'}
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
                  </div>
                )}

                <div className="flex gap-2 justify-end mt-3">
                  <Button variant="outline" size="sm" onClick={closeAdd}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAdd}
                    disabled={saving || !selectedService || !groupId}
                  >
                    {saving ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
