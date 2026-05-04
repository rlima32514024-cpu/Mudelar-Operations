'use client'

import { useActionState, useState, useEffect, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { CheckCircle, X } from 'lucide-react'
import { resolveIssue } from '@/app/actions/issues'
import type { ActionResult } from '@/app/actions/projects'

const initialState: ActionResult = { error: null, success: false }

interface ResolveIssueDialogProps {
  issueId: string
}

export function ResolveIssueDialog({ issueId }: ResolveIssueDialogProps) {
  const [open, setOpen] = useState(false)

  const boundAction = useCallback(
    (prev: ActionResult, formData: FormData) => resolveIssue(issueId, prev, formData),
    [issueId]
  )

  const [state, formAction, isPending] = useActionState(boundAction, initialState)

  useEffect(() => {
    if (state.success && open) setOpen(false)
  }, [state.success, open])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors">
          <CheckCircle className="w-3.5 h-3.5" />
          Resolver
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              Resolver Problema
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="ri-coberto_garantia" className="block text-sm font-medium text-gray-700 mb-1">
                Coberto por garantia
              </label>
              <select
                id="ri-coberto_garantia"
                name="coberto_garantia"
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">Não definido</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
                <option value="a_avaliar">A avaliar</option>
              </select>
            </div>

            <div>
              <label htmlFor="ri-departamento" className="block text-sm font-medium text-gray-700 mb-1">
                Departamento responsável
              </label>
              <select
                id="ri-departamento"
                name="departamento_responsavel"
                defaultValue=""
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">Não definido</option>
                <option value="operacao">Operação</option>
                <option value="compras">Compras</option>
                <option value="comercial">Comercial</option>
                <option value="cliente_trata_diretamente">Cliente trata diretamente</option>
              </select>
            </div>

            <div>
              <label htmlFor="ri-resolution_notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notas de resolução
              </label>
              <textarea
                id="ri-resolution_notes"
                name="resolution_notes"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                placeholder="Descreve como foi resolvido..."
              />
            </div>

            <div>
              <label htmlFor="ri-data_resolucao" className="block text-sm font-medium text-gray-700 mb-1">
                Data de resolução
              </label>
              <input
                id="ri-data_resolucao"
                name="data_resolucao_real"
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="ri-cliente_confirmou"
                name="cliente_confirmou_resolucao"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-gray-900"
              />
              <label htmlFor="ri-cliente_confirmou" className="text-sm text-gray-700">
                Cliente confirmou a resolução
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
                className="flex-1 py-2 px-4 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'A resolver...' : 'Confirmar resolução'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
