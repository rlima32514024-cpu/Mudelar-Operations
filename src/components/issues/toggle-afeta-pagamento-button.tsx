'use client'

import { useTransition } from 'react'
import { toggleAfetaPagamento } from '@/app/actions/issues'

interface ToggleAfetaPagamentoButtonProps {
  issueId: string
  currentValue: boolean
}

export function ToggleAfetaPagamentoButton({ issueId, currentValue }: ToggleAfetaPagamentoButtonProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(async () => { await toggleAfetaPagamento(issueId, currentValue) })}
      disabled={isPending}
      className={`text-xs font-medium px-2 py-0.5 rounded transition-colors disabled:opacity-50 ${
        currentValue
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      {isPending ? '...' : currentValue ? 'Sim' : '—'}
    </button>
  )
}
