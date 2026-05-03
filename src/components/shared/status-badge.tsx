import { cn } from '@/lib/utils'
import { GENERAL_STATUS_LABELS, type GeneralStatus } from '@/types'

const STATUS_COLORS: Record<GeneralStatus, string> = {
  '1_aguarda_atribuicao': 'bg-slate-100 text-slate-700',
  '2_aguarda_retificacao': 'bg-yellow-100 text-yellow-700',
  '3_aguarda_compras': 'bg-orange-100 text-orange-700',
  '4_aguarda_arranque': 'bg-blue-100 text-blue-700',
  '5_em_execucao': 'bg-green-100 text-green-700',
  '6_concluida': 'bg-teal-100 text-teal-700',
  '7_fechada': 'bg-gray-100 text-gray-500',
  'cancelada': 'bg-red-100 text-red-600',
}

interface StatusBadgeProps {
  status: GeneralStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        STATUS_COLORS[status],
        className
      )}
    >
      {GENERAL_STATUS_LABELS[status]}
    </span>
  )
}
