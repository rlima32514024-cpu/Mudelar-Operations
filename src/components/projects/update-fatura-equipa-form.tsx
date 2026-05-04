'use client'

import { useActionState, useCallback } from 'react'
import { updateFaturaEquipa, type ActionResult } from '@/app/actions/projects'

const initialState: ActionResult = { error: null, success: false }

interface UpdateFaturaEquipaFormProps {
  projectId: string
  hasExtras: boolean
  extrasDescricao?: string | null
  faturaEnviadaAna: boolean
}

export function UpdateFaturaEquipaForm({ projectId, hasExtras, extrasDescricao, faturaEnviadaAna }: UpdateFaturaEquipaFormProps) {
  const boundAction = useCallback(
    (prev: ActionResult, formData: FormData) => updateFaturaEquipa(projectId, prev, formData),
    [projectId]
  )
  const [state, formAction, isPending] = useActionState(boundAction, initialState)

  return (
    <form action={formAction} className="space-y-2 min-w-[240px]">
      <textarea
        name="extras_descricao"
        defaultValue={extrasDescricao ?? ''}
        rows={2}
        placeholder="Descrição dos extras à equipa..."
        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
      />
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-gray-700">
          <input type="checkbox" name="has_extras" defaultChecked={hasExtras} className="h-3.5 w-3.5" />
          Tem extras
        </label>
        <label className="flex items-center gap-1.5 text-xs text-gray-700">
          <input type="checkbox" name="fatura_equipa_enviada_ana" defaultChecked={faturaEnviadaAna} className="h-3.5 w-3.5" />
          Enviada à Ana
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="ml-auto px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? '...' : 'Guardar'}
        </button>
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && <p className="text-xs text-green-600">✓ Guardado</p>}
    </form>
  )
}
