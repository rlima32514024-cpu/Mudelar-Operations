import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import { ROLE_LABELS } from '@/types'
import type { UserRole } from '@/types'
import { InviteUserDialog } from '@/components/admin/invite-user-dialog'
import { RoleSelect } from '@/components/admin/role-select'
import { formatDateTime } from '@/lib/utils'

export const metadata = { title: 'Utilizadores — Mudelar Operations' }

export default async function UtilizadoresPage() {
  const currentProfile = await getProfile()
  if (!currentProfile) redirect('/login')
  if (!['mario', 'admin'].includes(currentProfile.role)) redirect('/')

  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  const users = (profiles ?? []) as {
    id: string
    email: string
    full_name: string
    role: string
    created_at: string
  }[]

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Utilizadores</h1>
          <p className="text-sm text-gray-500 mt-1">
            {users.length} {users.length === 1 ? 'membro' : 'membros'} na equipa
          </p>
        </div>
        <InviteUserDialog />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Utilizador
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Função
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">
                Registado em
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                      {user.full_name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n[0].toUpperCase())
                        .join('')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {user.id === currentProfile.id ? (
                    <span className="text-xs text-gray-500">
                      {ROLE_LABELS[user.role as UserRole]}
                    </span>
                  ) : (
                    <RoleSelect
                      userId={user.id}
                      currentRole={user.role as UserRole}
                    />
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                  {formatDateTime(user.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  {user.id === currentProfile.id && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Tu
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            Nenhum utilizador encontrado.
          </div>
        )}
      </div>
    </div>
  )
}
