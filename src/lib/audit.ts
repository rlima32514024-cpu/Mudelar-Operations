import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type AuditAction =
  | 'project_created'
  | 'supervisor_assigned'
  | 'team_assigned'
  | 'procurement_updated'
  | 'phase_updated'
  | 'project_completed'
  | 'issue_created'
  | 'issue_resolved'
  | 'milestone_ready'
  | 'milestone_validated'
  | 'milestone_updated'

export async function logAudit(
  supabase: SupabaseClient<Database>,
  projectId: string,
  userId: string,
  userName: string,
  action: AuditAction,
  details?: Record<string, unknown>
) {
  try {
    await supabase.from('project_audit_log').insert({
      project_id: projectId,
      user_id: userId,
      user_name: userName,
      action,
      details: details as { [key: string]: import('@/types/database').Json } | undefined,
    })
  } catch {
    // audit failures must never block the main operation
  }
}
