import { useState } from 'react'
import { useHosts } from '@/hooks/useHosts'
import { useCredentials } from '@/hooks/useCredentials'
import { apiFetch } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

function hostStatus(lastSeen: string | null): string {
  if (!lastSeen) return 'Offline'
  const diff = Date.now() - new Date(lastSeen).getTime()
  return diff <= 5 * 60 * 1000 ? 'Online' : 'Offline'
}

export default function HostsServersTab() {
  const { data: hosts, loading, refresh } = useHosts()
  const { data: credentials } = useCredentials()
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [hostname, setHostname] = useState('')
  const [port, setPort] = useState(5985)
  const [useHttps, setUseHttps] = useState(false)
  const [credentialId, setCredentialId] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  function resetForm() {
    setHostname('')
    setPort(5985)
    setUseHttps(false)
    setCredentialId('')
    setDescription('')
  }

  async function handleCreate() {
    if (!hostname || !credentialId) return
    setSaving(true)
    try {
      await apiFetch('/infra/hosts', {
        method: 'POST',
        body: JSON.stringify({ hostname, port, useHttps, credentialId, description }),
      })
      refresh()
      setShowAdd(false)
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (deleteId == null) return
    await apiFetch(`/infra/hosts/${deleteId}`, { method: 'DELETE' })
    refresh()
    setDeleteId(null)
  }

  if (loading) {
    return <div className="text-sm text-slate-400 py-8 text-center">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-slate-500">{hosts.length} server(s)</span>
        <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Server</Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>HOSTNAME</TableHead>
              <TableHead>PORT</TableHead>
              <TableHead>CREDENTIAL</TableHead>
              <TableHead>SERVICES</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                  No servers configured
                </TableCell>
              </TableRow>
            ) : (
              hosts.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium text-slate-800">{h.hostname}</TableCell>
                  <TableCell>{h.port}</TableCell>
                  <TableCell>
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                      {h.credentialName}
                    </span>
                  </TableCell>
                  <TableCell>{h.serviceCount}</TableCell>
                  <TableCell>
                    <StatusBadge status={hostStatus(h.lastSeen)} />
                  </TableCell>
                  <TableCell>
                    <button
                      className="text-red-500 hover:text-red-700 text-sm"
                      onClick={() => setDeleteId(h.id)}
                      title="Delete"
                    >
                      🗑
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Server Dialog */}
      <Dialog open={showAdd} onOpenChange={(v) => !v && setShowAdd(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Server</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Hostname</label>
              <Input value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder="server.example.com" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Port</label>
              <Input type="number" value={port} onChange={(e) => setPort(Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useHttps"
                checked={useHttps}
                onChange={(e) => setUseHttps(e.target.checked)}
                className="rounded border-slate-300"
              />
              <label htmlFor="useHttps" className="text-sm text-slate-700">Use HTTPS</label>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Credential</label>
              <select
                className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Select credential...</option>
                {credentials.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !hostname || !credentialId}>
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId != null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Server</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Are you sure you want to delete this server? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
