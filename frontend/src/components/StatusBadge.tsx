import { cn } from '@/lib/utils'

const styles: Record<string, string> = {
  Running: 'bg-green-50 text-green-600',
  Online: 'bg-green-50 text-green-600',
  Stopped: 'bg-red-50 text-red-600',
  Offline: 'bg-red-50 text-red-600',
  Unknown: 'bg-amber-50 text-amber-600',
}

export default function StatusBadge({ status }: { status: string }) {
  const style = styles[status] || 'bg-slate-100 text-slate-600'
  const icon = (status === 'Running' || status === 'Online') ? '\u25cf' :
               (status === 'Stopped' || status === 'Offline') ? '\u25cf' : '\u26a0'
  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', style)}>
      {icon} {status}
    </span>
  )
}
