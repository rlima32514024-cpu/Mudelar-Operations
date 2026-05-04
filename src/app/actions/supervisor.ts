'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import { logAudit } from '@/lib/audit'
import { createNotification } from '@/lib/notifications'
import type { ActionResult } from './projects'

export async function verifyMeasurements(
  projectId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile) return { error: 'Não autenticado', success: false }

    const measurements_verified_date =
      (formData.get('measurements_verified_date') as string) ||
      new Date().toISOString().split('T')[0]
    const measurements_notes = (formData.get('measurements_notes') as string)?.trim() || null
    const layout_retificado_url = (formData.get('layout_retificado_url') as string)?.trim() || null
    const initial_measurements_photos_url = (formData.get('initial_measurements_photos_url') as string)?.trim() || null
    const procurement_list_url = (formData.get('procurement_list_url') as string)?.trim() || null

    const { error } = await supabase
      .from('projects')
      .update({
        measurements_verified: true,
        measurements_verified_date,
        measurements_notes,
        layout_retificado_url,
        initial_measurements_photos_url,
        ...(procurement_list_url && {
          procurement_list_url,
          procurement_list_uploaded_date: measurements_verified_date,
          procurement_status: 'submitted',
        }),
        general_status: '3_aguarda_compras',
      })
      .eq('id', projectId)

    if (error) return { error: error.message, success: false }

    revalidatePath('/supervisor')
    revalidatePath('/mario')
    revalidatePath(`/obras/${projectId}`)

    const { data: project } = await supabase
      .from('projects')
      .select('contract_number, client_name')
      .eq('id', projectId)
      .single()

    void Promise.all([
      logAudit(supabase, projectId, profile.id, profile.full_name, 'phase_updated', {
        action: 'measurements_verified',
        date: measurements_verified_date,
      }),
      createNotification({
        recipientRole: 'mario',
        message: `Medições verificadas — obra pronta para compras: ${project?.contract_number}`,
        actionType: 'project_update',
        linkUrl: `/obras/${projectId}`,
        projectId,
      }),
      createNotification({
        recipientRole: 'susana',
        message: `Obra ${project?.contract_number} aguarda lista de compras`,
        actionType: 'project_update',
        linkUrl: `/obras/${projectId}`,
        projectId,
      }),
    ])

    return { error: null, success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}
