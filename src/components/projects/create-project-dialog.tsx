'use client'

import { useActionState, useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus, X } from 'lucide-react'
import { createProject } from '@/app/actions/projects'
import type { WorkModel, ResponsibleParty } from '@/types'

const initialState = { error: null, success: false }

interface CreateProjectDialogProps {
  workModels: WorkModel[]
  supervisors: ResponsibleParty[]
}

export function CreateProjectDialog({ workModels }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createProject, initialState)

  useEffect(() => {
    if (state.success && open) setOpen(false)
  }, [state.success, open])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
          <Plus className="w-4 h-4" />
          Nova Obra
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-xl shadow-xl z-50 p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              Nova Obra
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="cp-client_name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do cliente <span className="text-red-500">*</span>
              </label>
              <input
                id="cp-client_name"
                name="client_name"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="cp-address" className="block text-sm font-medium text-gray-700 mb-1">
                Morada <span className="text-red-500">*</span>
              </label>
              <input
                id="cp-address"
                name="address"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="cp-work_type" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de obra <span className="text-red-500">*</span>
              </label>
              <select
                id="cp-work_type"
                name="work_type"
                required
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="" disabled>Selecciona o tipo</option>
                <option value="Kitchen">Cozinha</option>
                <option value="Bathroom">WC</option>
                <option value="Both">Cozinha + WC</option>
              </select>
            </div>

            <div>
              <label htmlFor="cp-client_phone" className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                id="cp-client_phone"
                name="client_phone"
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="cp-client_email" className="block text-sm font-medium text-gray-700 mb-1">
                Email do cliente
              </label>
              <input
                id="cp-client_email"
                name="client_email"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="cp-contract_signature_date" className="block text-sm font-medium text-gray-700 mb-1">
                Data de assinatura do contrato
              </label>
              <input
                id="cp-contract_signature_date"
                name="contract_signature_date"
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="cp-total_project_value" className="block text-sm font-medium text-gray-700 mb-1">
                Valor total do projecto (€)
              </label>
              <input
                id="cp-total_project_value"
                name="total_project_value"
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {workModels.length > 0 && (
              <div>
                <label htmlFor="cp-work_model_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Modelo de obra
                </label>
                <select
                  id="cp-work_model_id"
                  name="work_model_id"
                  defaultValue=""
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                >
                  <option value="">Sem modelo</option>
                  {workModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome_modelo} ({m.categoria} — {m.prazo_estimado_dias} dias)
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                className="flex-1 py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'A criar...' : 'Criar obra'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
