'use client'

import { useTransition } from 'react'
import { updateFaturaEquipaPaga } from '@/app/actions/projects'

interface MarkFaturaEquipaPagaButtonProps {
  projectId: string
}

export function MarkFaturaEquipaPagaButton({ projectId }: MarkFaturaEquipaPagaButtonProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(async () => { await updateFaturaEquipaPaga(projectId) })}
      disabled={isPending}
      className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
    >
      {isPending ? '...' : 'Marcar paga'}
    </button>
  )
}
