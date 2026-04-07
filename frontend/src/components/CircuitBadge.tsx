import { cn } from '@/lib/utils'

const circuitStyles: Record<string, string> = {
  VISA: 'bg-blue-100 text-blue-700',
  MC: 'bg-amber-100 text-amber-800',
  MIR: 'bg-green-100 text-green-800',
}

export default function CircuitBadge({ circuit }: { circuit: string }) {
  const style = circuitStyles[circuit?.toUpperCase()] || 'bg-slate-100 text-slate-600'
  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', style)}>
      {circuit}
    </span>
  )
}
