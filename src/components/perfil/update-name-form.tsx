'use client'

import { useActionState } from 'react'
import { updateProfileName } from '@/app/actions/profile'

const initialState = { error: null, success: false }

export function UpdateNameForm({ currentName }: { currentName: string }) {
  const [state, formAction, isPending] = useActionState(updateProfileName, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
          Nome completo
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={currentName}
          required
          minLength={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
          Nome actualizado com sucesso.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'A guardar...' : 'Guardar alterações'}
      </button>
    </form>
  )
}
