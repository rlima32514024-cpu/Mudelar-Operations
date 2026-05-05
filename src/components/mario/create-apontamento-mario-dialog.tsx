'use client'

import { useActionState, useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus, X } from 'lucide-react'
import { createApontamento } from '@/app/actions/apontamentos'
import type { ActionResult } from '@/app/actions/projects'

const initialState: ActionResult = { error: null, success: false }

interface Project {
  id: string
  contract_number: string
  client_name: string
}

interface CreateApontamentoMarioDialogProps {
  projects: Project[]
}

export function CreateApontamentoMarioDialog({ projects }: CreateApontamentoMarioDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createApontamento, initialState)

  useEffect(() => {
    if (state.success && open) setOpen(false)
  }, [state.success, open])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" />
          Novo apontamento
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              Registar Apontamento
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="cam-project_id" className="block text-sm font-medium text-gray-700 mb-1">
                Obra <span className="text-red-500">*</span>
              </label>
              <select
                id="cam-project_id"
                name="project_id"
                required
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="" disabled>Selecciona a obra</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.contract_number} — {p.client_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cam-title" className="block text-sm font-medium text-gray-700 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                id="cam-title"
                name="apontamento_title"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="cam-tipo_problema" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de problema
              </label>
              <select
                id="cam-tipo_problema"
                name="tipo_problema"
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">Sem tipo</option>
                <option value="atraso_obra">Atraso de obra</option>
                <option value="ma_execucao">Má execução</option>
                <option value="mobiliario">Mobiliário</option>
                <option value="acabamentos">Acabamentos</option>
                <option value="comunicacao">Comunicação</option>
                <option value="limpeza_cuidado">Limpeza / Cuidado</option>
                <option value="falta_de_algo">Falta de algo</option>
                <option value="material_defeituoso">Material defeituoso</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label htmlFor="cam-reportado_por" className="block text-sm font-medium text-gray-700 mb-1">
                Reportado por
              </label>
              <select
                id="cam-reportado_por"
                name="reportado_por"
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">Não especificado</option>
                <option value="cliente">Cliente</option>
                <option value="supervisor">Supervisor</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label htmlFor="cam-descricao" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                id="cam-descricao"
                name="descricao"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                placeholder="Descreve o apontamento..."
              />
            </div>

            {state.error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-2 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'A registar...' : 'Registar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
