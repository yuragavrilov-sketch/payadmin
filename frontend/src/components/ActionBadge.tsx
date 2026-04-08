import { cn } from '@/lib/utils'

const styles: Record<string, string> = {
  START: 'bg-green-50 text-green-700',
  STOP: 'bg-red-50 text-red-700',
  RESTART: 'bg-amber-50 text-amber-700',
  HOST_ADD: 'bg-blue-50 text-blue-700',
  HOST_DELETE: 'bg-blue-50 text-blue-700',
  CRED_ADD: 'bg-blue-50 text-blue-700',
  CRED_DELETE: 'bg-blue-50 text-blue-700',
  SERVICE_ADD: 'bg-blue-50 text-blue-700',
  SERVICE_DELETE: 'bg-blue-50 text-blue-700',
}

export default function ActionBadge({ action }: { action: string }) {
  const style = styles[action] || 'bg-slate-100 text-slate-600'
  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', style)}>
      {action}
    </span>
  )
}
