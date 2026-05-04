'use client'

import { useActionState, useCallback } from 'react'
import { updateProcurement, type ActionResult } from '@/app/actions/projects'
import { FileUploadInput } from '@/components/shared/file-upload-input'
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
  currentListUrl?: string | null
  currentListDate?: string | null
  contractNumber: string
}

export function UpdateProcurementForm({
  projectId,
  currentStatus,
  currentListUrl,
  currentListDate,
  contractNumber,
}: UpdateProcurementFormProps) {
  const boundAction = useCallback(
    (prev: ActionResult, formData: FormData) => updateProcurement(projectId, prev, formData),
    [projectId]
  )

  const [state, formAction, isPending] = useActionState(boundAction, initialState)
  const today = new Date().toISOString().split('T')[0]

  return (
    <form action={formAction} className="space-y-2 min-w-[280px]">
      <div className="flex items-center gap-2">
        <select
          name="procurement_status"
          defaultValue={currentStatus ?? 'submitted'}
          className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
        >
          {(['submitted', 'in_procurement', 'received'] as ProcurementStatus[]).map((s) => (
            <option key={s} value={s}>{PROCUREMENT_LABELS[s]}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {isPending ? '...' : 'Guardar'}
        </button>
      </div>

      <FileUploadInput
        name="procurement_list_url"
        storagePath={`procurement/${contractNumber}`}
        accept=".pdf,.xls,.xlsx,.doc,.docx"
        label="Lista de compras"
        existingUrl={currentListUrl}
      />

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Data de upload
        </label>
        <input
          name="procurement_list_uploaded_date"
          type="date"
          defaultValue={currentListDate ?? today}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && <p className="text-xs text-green-600">✓ Guardado</p>}
    </form>
  )
}
