'use server'

import { createAuthAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserRole } from '@/types'

async function assertAdminAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['admin', 'mario'].includes((profile as { role: string } | null)?.role ?? '')) {
    throw new Error('Acesso negado')
  }
}

type InviteResult = { error: string | null; success: boolean; message?: string }

export async function inviteUser(
  _prev: InviteResult,
  formData: FormData
): Promise<InviteResult> {
  try {
    await assertAdminAccess()

    const email = (formData.get('email') as string)?.trim()
    const full_name = (formData.get('full_name') as string)?.trim()
    const role = formData.get('role') as UserRole

    if (!email || !full_name || !role) {
      return { error: 'Todos os campos são obrigatórios', success: false }
    }

    const adminClient = createAuthAdminClient()
    const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/update-password`,
    })

    if (error) return { error: error.message, success: false }

    revalidatePath('/admin/utilizadores')
    return { error: null, success: true, message: `Convite enviado para ${email}` }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}

export async function updateUserRole(userId: string, role: UserRole) {
  try {
    await assertAdminAccess()

    const supabase = await createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    if (error) return { error: error.message, success: false }

    revalidatePath('/admin/utilizadores')
    return { error: null, success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}

export async function resetUserPassword(email: string) {
  try {
    await assertAdminAccess()

    const adminClient = createAuthAdminClient()
    const { error } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/update-password`,
      },
    })

    if (error) return { error: error.message, success: false }
    return { error: null, success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}
