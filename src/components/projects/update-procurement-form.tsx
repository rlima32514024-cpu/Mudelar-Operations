'use client'

import { useActionState, useCallback } from 'react'
import { updateProcurement, type ActionResult } from '@/app/actions/projects'
import type { ProcurementStatus } from '@/types'

const initialState: ActionResult = { error: null, success: false }

const PROCUREMENT_LABELS: Record<ProcurementStatus, string> = {
  submitted: 'Submetido',
  in_procurement: 'Em compras',
  received: 'Recebido',
}

interface UpdateProcurementFormProps {
  projectId: string
  currentStatus: ProcurementStatus | null
}

export function UpdateProcurementForm({ projectId, currentStatus }: UpdateProcurementFormProps) {
  const boundAction = useCallback(
    (prev: ActionResult, formData: FormData) => updateProcurement(projectId, prev, formData),
    [projectId]
  )

  const [state, formAction, isPending] = useActionState(boundAction, initialState)

  return (
    <form action={formAction} className="flex items-center gap-2">
      <select
        name="procurement_status"
        defaultValue={currentStatus ?? 'submitted'}
        className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
      >
        {(['submitted', 'in_procurement', 'received'] as ProcurementStatus[]).map((s) => (
          <option key={s} value={s}>{PROCUREMENT_LABELS[s]}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? '...' : 'Guardar'}
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      {state.success && <span className="text-xs text-green-600">Guardado</span>}
    </form>
  )
}
