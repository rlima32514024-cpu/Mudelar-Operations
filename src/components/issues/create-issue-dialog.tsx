'use client'

import { useActionState, useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AlertCircle, X } from 'lucide-react'
import { createIssue } from '@/app/actions/issues'
import type { Project } from '@/types'

const initialState = { error: null, success: false }

interface CreateIssueDialogProps {
  projects: Pick<Project, 'id' | 'contract_number' | 'client_name'>[]
}

export function CreateIssueDialog({ projects }: CreateIssueDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createIssue, initialState)

  useEffect(() => {
    if (state.success && open) setOpen(false)
  }, [state.success, open])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
          <AlertCircle className="w-4 h-4" />
          Reportar Problema
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-xl shadow-xl z-50 p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              Reportar Problema / Reclamação
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="ci-title" className="block text-sm font-medium text-gray-700 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                id="ci-title"
                name="issue_title"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="ci-project" className="block text-sm font-medium text-gray-700 mb-1">
                Obra <span className="text-red-500">*</span>
              </label>
              <select
                id="ci-project"
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
              <label htmlFor="ci-priority" className="block text-sm font-medium text-gray-700 mb-1">
                Prioridade
              </label>
              <select
                id="ci-priority"
                name="priority"
                defaultValue="Normal"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="Low">Baixa</option>
                <option value="Normal">Normal</option>
                <option value="High">Alta</option>
                <option value="Urgent">Urgente</option>
              </select>
            </div>

            <div>
              <label htmlFor="ci-tipo_reclamacao" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de reclamação
              </label>
              <select
                id="ci-tipo_reclamacao"
                name="tipo_reclamacao"
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">Sem tipo</option>
                <option value="defeito_execucao">Defeito de execução</option>
                <option value="acabamento">Acabamento</option>
                <option value="mobiliario">Mobiliário</option>
                <option value="gas">Gás</option>
                <option value="eletrodomesticos">Electrodomésticos</option>
                <option value="falta_de_algo">Falta de algo</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label htmlFor="ci-description" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                id="ci-description"
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="ci-afeta_pagamento"
                name="afeta_pagamento"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-gray-900"
              />
              <label htmlFor="ci-afeta_pagamento" className="text-sm text-gray-700">
                Afecta pagamento
              </label>
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
                className="flex-1 py-2 px-4 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'A reportar...' : 'Reportar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
