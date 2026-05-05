'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import type { ActionResult } from './projects'

export async function createApontamento(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile) return { error: 'Não autenticado', success: false }

    const apontamento_title = (formData.get('apontamento_title') as string)?.trim()
    const project_id = (formData.get('project_id') as string)?.trim()
    const data_apontamento = (formData.get('data_apontamento') as string) || new Date().toISOString().split('T')[0]
    const tipo_problema = (formData.get('tipo_problema') as string) || null
    const reportado_por = (formData.get('reportado_por') as string) || null
    const descricao = (formData.get('descricao') as string)?.trim() || null

    if (!apontamento_title || !project_id) {
      return { error: 'Título e obra são obrigatórios', success: false }
    }

    const { error } = await supabase
      .from('apontamentos')
      .insert({
        apontamento_title,
        project_id,
        data_apontamento,
        tipo_problema,
        reportado_por,
        descricao,
        criado_por_id: profile.id,
      })

    if (error) return { error: error.message, success: false }

    revalidatePath('/supervisor')
    revalidatePath('/mario')
    revalidatePath('/mario/apontamentos')
    revalidatePath(`/obras/${project_id}`)
    return { error: null, success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}
