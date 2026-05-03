import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/queries'
import { ROLE_LABELS } from '@/types'
import type { UserRole } from '@/types'
import { UpdateNameForm } from '@/components/perfil/update-name-form'
import { ChangePasswordForm } from '@/components/perfil/change-password-form'

export const metadata = { title: 'O meu perfil — Mudelar Operations' }

export default async function PerfilPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">O meu perfil</h1>
        <p className="text-sm text-gray-500 mt-1">Informações da tua conta Mudelar Operations.</p>
      </div>

      {/* Informações da conta */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Informações da conta</h2>
        </div>
        <div className="px-6 py-4 space-y-4">
          {/* Email (read-only) */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Email</p>
            <p className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              {profile.email}
            </p>
          </div>

          {/* Role (read-only) */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Função</p>
            <p className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              {ROLE_LABELS[profile.role as UserRole]}
            </p>
          </div>

          {/* Name (editable) */}
          <UpdateNameForm currentName={profile.full_name} />
        </div>
      </div>

      {/* Alterar password */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Alterar password</h2>
        </div>
        <div className="px-6 py-4">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  )
}
