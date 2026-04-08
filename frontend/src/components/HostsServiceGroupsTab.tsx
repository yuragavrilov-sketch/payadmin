import { useState } from 'react'
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

export default function HostsServiceGroupsTab() {
  const { data: groups, loading, refresh } = useServiceGroups()
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [saving, setSaving] = useState(false)

  function resetForm() {
    setName('')
    setDescription('')
    setSortOrder(0)
  }

  async function handleCreate() {
    if (!name) return
    setSaving(true)
    try {
      await apiFetch('/infra/service-groups', {
        method: 'POST',
        body: JSON.stringify({ name, description, sortOrder }),
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
    await apiFetch(`/infra/service-groups/${deleteId}`, { method: 'DELETE' })
    refresh()
    setDeleteId(null)
  }

  const deleteTarget = groups.find((g) => g.id === deleteId)

  if (loading) {
    return <div className="text-sm text-slate-400 py-8 text-center">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-slate-500">{groups.length} group(s)</span>
        <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Group</Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NAME</TableHead>
              <TableHead>DESCRIPTION</TableHead>
              <TableHead>SERVICES</TableHead>
              <TableHead>SORT ORDER</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                  No service groups configured
                </TableCell>
              </TableRow>
            ) : (
              groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium text-slate-800">{g.name}</TableCell>
                  <TableCell className="text-slate-500">{g.description || '—'}</TableCell>
                  <TableCell>{g.serviceCount}</TableCell>
                  <TableCell>{g.sortOrder}</TableCell>
                  <TableCell>
                    <button
                      className={`text-sm ${g.serviceCount > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-red-500 hover:text-red-700'}`}
                      onClick={() => g.serviceCount === 0 && setDeleteId(g.id)}
                      disabled={g.serviceCount > 0}
                      title={g.serviceCount > 0 ? 'Cannot delete: has services' : 'Delete'}
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

      {/* Add Group Dialog */}
      <Dialog open={showAdd} onOpenChange={(v) => !v && setShowAdd(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Service Group</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Payment Services" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Sort Order</label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !name}>
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId != null && deleteTarget?.serviceCount === 0} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service Group</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Are you sure you want to delete this service group? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
