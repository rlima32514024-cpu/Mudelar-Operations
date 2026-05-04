'use client'

import { useActionState, useCallback } from 'react'
import { updateExtras, type ActionResult } from '@/app/actions/projects'

const initialState: ActionResult = { error: null, success: false }

interface UpdateExtrasFormProps {
  projectId: string
  currentDescricao?: string | null
  currentValor?: number | null
  currentEstado?: string | null
}

export function UpdateExtrasForm({ projectId, currentDescricao, currentValor, currentEstado }: UpdateExtrasFormProps) {
  const boundAction = useCallback(
    (prev: ActionResult, formData: FormData) => updateExtras(projectId, prev, formData),
    [projectId]
  )
  const [state, formAction, isPending] = useActionState(boundAction, initialState)

  return (
    <form action={formAction} className="space-y-2 min-w-[260px]">
      <textarea
        name="orcamento_extra_descricao"
        defaultValue={currentDescricao ?? ''}
        rows={2}
        placeholder="Descrição do extra..."
        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
      />
      <div className="flex items-center gap-2">
        <input
          name="orcamento_extra_valor"
          type="number"
          min="0"
          step="0.01"
          defaultValue={currentValor ?? ''}
          placeholder="Valor €"
          className="w-24 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        <select
          name="orcamento_extra_estado"
          defaultValue={currentEstado ?? 'pendente_orcamento'}
          className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
        >
          <option value="pendente_orcamento">Pendente</option>
          <option value="em_negociacao">Em negociação</option>
          <option value="aprovado_pelo_cliente">Aprovado</option>
          <option value="recusado">Recusado</option>
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? '...' : 'Guardar'}
        </button>
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && <p className="text-xs text-green-600">✓ Guardado</p>}
    </form>
  )
}
