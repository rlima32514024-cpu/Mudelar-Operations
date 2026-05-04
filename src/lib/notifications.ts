import { createAuthAdminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/types'

type RecipientRole = UserRole | 'all'

interface NotificationInput {
  recipientRole: RecipientRole
  message: string
  actionType: 'project_update' | 'issue' | 'milestone' | 'sla_alert'
  linkUrl?: string
  projectId?: string
}

export async function createNotification(input: NotificationInput) {
  try {
    const admin = createAuthAdminClient()
    await admin.from('notifications').insert({
      recipient_role: input.recipientRole,
      message: input.message,
      action_type: input.actionType,
      link_url: input.linkUrl ?? null,
      project_id: input.projectId ?? null,
    })
  } catch {
    // notification failures must never block the main operation
  }
}
