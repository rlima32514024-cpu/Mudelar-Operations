'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type ActionResult = { error: string | null; success: boolean }

export async function updateProfileName(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const full_name = (formData.get('full_name') as string)?.trim()
  if (!full_name || full_name.length < 2) {
    return { error: 'Nome obrigatório (mínimo 2 caracteres)', success: false }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', success: false }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name })
    .eq('id', user.id)

  if (error) return { error: 'Erro ao actualizar perfil', success: false }
  revalidatePath('/perfil')
  return { error: null, success: true }
}

export async function changePassword(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || password.length < 8) {
    return { error: 'A password deve ter pelo menos 8 caracteres', success: false }
  }
  if (password !== confirmPassword) {
    return { error: 'As passwords não coincidem', success: false }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: 'Erro ao alterar password', success: false }
  return { error: null, success: true }
}
