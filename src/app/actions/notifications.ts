'use server'

import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import type { ActionResult } from './projects'

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile) return { error: 'Não autenticado', success: false }

    await supabase.rpc('mark_notification_read', { p_notification_id: notificationId })
    return { error: null, success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}

export async function markAllNotificationsRead(notificationIds: string[]): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile) return { error: 'Não autenticado', success: false }

    await Promise.all(
      notificationIds.map((id) =>
        supabase.rpc('mark_notification_read', { p_notification_id: id })
      )
    )
    return { error: null, success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}
