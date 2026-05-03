'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import type { ActionResult } from './projects'

export async function markMilestoneReady(
  milestoneId: string,
  projectId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile) return { error: 'Não autenticado', success: false }

    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('billing_milestones')
      .update({
        status: 'ready_for_validation',
        supervisor_marked_ready: true,
        supervisor_marked_ready_date: today,
      })
      .eq('id', milestoneId)

    if (error) return { error: error.message, success: false }

    revalidatePath('/supervisor')
    revalidatePath('/ana')
    revalidatePath('/mario')
    revalidatePath(`/obras/${projectId}`)
    return { error: null, success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}

export async function validateMilestone(
  milestoneId: string,
  projectId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile) return { error: 'Não autenticado', success: false }

    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('billing_milestones')
      .update({
        status: 'validated',
        manager_validated: true,
        manager_validated_date: today,
      })
      .eq('id', milestoneId)

    if (error) return { error: error.message, success: false }

    revalidatePath('/ana')
    revalidatePath('/mario')
    revalidatePath(`/obras/${projectId}`)
    return { error: null, success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}

export async function updateMilestone(
  milestoneId: string,
  projectId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile) return { error: 'Não autenticado', success: false }

    const invoice_number = (formData.get('invoice_number') as string)?.trim() || null
    const invoice_issued_date = (formData.get('invoice_issued_date') as string) || null
    const payment_due_date = (formData.get('payment_due_date') as string) || null
    const payment_received_date = (formData.get('payment_received_date') as string) || null
    const notes = (formData.get('notes') as string)?.trim() || null

    // Fetch current status
    const { data: current } = await supabase
      .from('billing_milestones')
      .select('status')
      .eq('id', milestoneId)
      .single()

    let status = current?.status ?? 'not_ready'

    if (payment_received_date) {
      status = 'paid'
    } else if (invoice_issued_date && status === 'validated') {
      status = 'invoiced'
    }

    const { error } = await supabase
      .from('billing_milestones')
      .update({
        invoice_number,
        invoice_issued_date,
        payment_due_date,
        payment_received_date,
        notes,
        status,
      })
      .eq('id', milestoneId)

    if (error) return { error: error.message, success: false }

    revalidatePath('/ana')
    revalidatePath('/mario')
    revalidatePath(`/obras/${projectId}`)
    return { error: null, success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}
