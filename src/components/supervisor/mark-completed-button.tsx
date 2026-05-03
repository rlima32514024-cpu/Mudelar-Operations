'use client'

import { useTransition } from 'react'
import { Flag } from 'lucide-react'
import { markCompleted } from '@/app/actions/projects'

interface MarkCompletedButtonProps {
  projectId: string
}

export function MarkCompletedButton({ projectId }: MarkCompletedButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Confirmas a conclusão desta obra?')) return
    startTransition(async () => {
      await markCompleted(projectId)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Flag className="w-3.5 h-3.5" />
      {isPending ? 'A concluir...' : 'Concluir Obra'}
    </button>
  )
}
