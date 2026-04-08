import { useState } from 'react'
import { useCredentials } from '@/hooks/useCredentials'
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

export default function HostsCredentialsTab() {
  const { data: credentials, loading, refresh } = useCredentials()
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  function resetForm() {
    setName('')
    setDomain('')
    setUsername('')
    setPassword('')
  }

  async function handleCreate() {
    if (!name || !username || !password) return
    setSaving(true)
    try {
      await apiFetch('/infra/credentials', {
        method: 'POST',
        body: JSON.stringify({ name, domain, username, password }),
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
    await apiFetch(`/infra/credentials/${deleteId}`, { method: 'DELETE' })
    refresh()
    setDeleteId(null)
  }

  const deleteTarget = credentials.find((c) => c.id === deleteId)

  if (loading) {
    return <div className="text-sm text-slate-400 py-8 text-center">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-slate-500">{credentials.length} credential(s)</span>
        <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Credential</Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NAME</TableHead>
              <TableHead>DOMAIN\USER</TableHead>
              <TableHead>USED BY</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {credentials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-400 py-8">
                  No credentials configured
                </TableCell>
              </TableRow>
            ) : (
              credentials.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-slate-800">{c.name}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">
                      {c.domain ? `${c.domain}\\${c.username}` : c.username}
                    </span>
                  </TableCell>
                  <TableCell>{c.hostCount} host(s)</TableCell>
                  <TableCell>
                    <button
                      className={`text-sm ${c.hostCount > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-red-500 hover:text-red-700'}`}
                      onClick={() => c.hostCount === 0 && setDeleteId(c.id)}
                      disabled={c.hostCount > 0}
                      title={c.hostCount > 0 ? 'Cannot delete: in use by hosts' : 'Delete'}
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

      {/* Add Credential Dialog */}
      <Dialog open={showAdd} onOpenChange={(v) => !v && setShowAdd(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credential</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Production Admin" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Domain</label>
              <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="MYDOMAIN" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Username</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !name || !username || !password}>
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId != null && deleteTarget?.hostCount === 0} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Credential</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Are you sure you want to delete this credential? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
