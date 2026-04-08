import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import CircuitBadge from './CircuitBadge'
import type { MerchantDetail, MerchantConfig } from '@/hooks/useMerchants'

interface MerchantDetailModalProps {
  open: boolean
  onClose: () => void
  detail: MerchantDetail | null
  config: MerchantConfig[]
  loading: boolean
  error: string | null
}

export default function MerchantDetailModal({
  open,
  onClose,
  detail,
  config,
  loading,
  error,
}: MerchantDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        {error ? (
          <div className="flex items-center justify-center py-12 text-red-500 text-sm">{error}</div>
        ) : loading || !detail ? (
          <div className="flex items-center justify-center py-12 text-slate-400">Loading...</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-slate-800">
                {detail.name}
              </DialogTitle>
              <p className="text-sm text-slate-400">MERC ID: {detail.mercid}</p>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <InfoField label="Circuit">
                <CircuitBadge circuit={detail.circuit} />
              </InfoField>
              <InfoField label="Hierarchy ID">{detail.hierarchyId}</InfoField>
              <InfoField label="Initiator">{detail.initiator}</InfoField>
              <InfoField label="PA Login">{detail.paLogin || '—'}</InfoField>
              <InfoField label="API Login">{detail.apiLogin || '—'}</InfoField>
            </div>

            <div className="border-t border-slate-200 mt-5 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-800">Configuration</h4>
                <span className="text-xs text-slate-400">Active only</span>
              </div>

              {config.length === 0 ? (
                <p className="text-sm text-slate-400">No active configuration</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {config.map((c) => (
                    <div
                      key={c.parameterName}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5"
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-xs font-medium text-slate-800">
                          {c.parameterName}
                        </span>
                        <span className="text-sm text-slate-600 font-medium">
                          {c.parameterValue}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {c.dateBegin} — {c.dateEnd}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-400 uppercase mb-1">{label}</div>
      <div className="text-sm text-slate-700">{children}</div>
    </div>
  )
}
