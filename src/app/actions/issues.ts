'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import { emailIssueUrgente, emailIssueResolvido } from '@/lib/email'
import type { ActionResult } from './projects'
import type { IssueStatus } from '@/types'

export type CreateIssueResult = ActionResult & { issueId?: string }

export async function createIssue(
  _prev: CreateIssueResult,
  formData: FormData
): Promise<CreateIssueResult> {
  try {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile) return { error: 'Não autenticado', success: false }

    const issue_title = (formData.get('issue_title') as string)?.trim()
    const project_id = (formData.get('project_id') as string)?.trim()
    const priority = (formData.get('priority') as string) || 'Normal'
    const description = (formData.get('description') as string)?.trim() || null
    const tipo_reclamacao = (formData.get('tipo_reclamacao') as string) || null
    const coberto_garantia = (formData.get('coberto_garantia') as string) || null
    const departamento_responsavel = (formData.get('departamento_responsavel') as string) || null
    const afeta_pagamento = formData.get('afeta_pagamento') === 'on'
    const assigned_to_id = (formData.get('assigned_to_id') as string) || null
    const data_intervencao_prevista = (formData.get('data_intervencao_prevista') as string) || null

    if (!issue_title || !project_id) {
      return { error: 'Título e obra são obrigatórios', success: false }
    }

    const { data, error } = await supabase
      .from('issues')
      .insert({
        issue_title,
        project_id,
        priority,
        description,
        tipo_reclamacao,
        coberto_garantia,
        departamento_responsavel,
        afeta_pagamento,
        assigned_to_id,
        data_intervencao_prevista,
        status: 'open',
      })
      .select('id')
      .single()

    if (error) return { error: error.message, success: false }

    revalidatePath('/gustavo')
    revalidatePath('/sofia')
    revalidatePath('/mario')
    revalidatePath(`/obras/${project_id}`)

    // Automação 14: issue urgente ou alta prioridade → mario + gustavo
    if (priority === 'High' || priority === 'Urgent') {
      const { data: project } = await supabase
        .from('projects')
        .select('contract_number, client_name')
        .eq('id', project_id)
        .single()
      void emailIssueUrgente({
        projectId: project_id,
        contractNumber: project?.contract_number ?? '',
        clientName: project?.client_name ?? '',
        issueTitle: issue_title,
        priority,
        description,
      })
    }

    return { error: null, success: true, issueId: data.id }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}

export async function updateIssueStatus(
  issueId: string,
  status: IssueStatus
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile) return { error: 'Não autenticado', success: false }

    const { data: issue } = await supabase
      .from('issues')
      .select('project_id')
      .eq('id', issueId)
      .single()

    const { error } = await supabase
      .from('issues')
      .update({ status })
      .eq('id', issueId)

    if (error) return { error: error.message, success: false }

    revalidatePath('/gustavo')
    revalidatePath('/mario')
    if (issue?.project_id) revalidatePath(`/obras/${issue.project_id}`)
    return { error: null, success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}

export async function resolveIssue(
  issueId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile) return { error: 'Não autenticado', success: false }

    const resolution_notes = (formData.get('resolution_notes') as string)?.trim() || null
    const data_resolucao_real = (formData.get('data_resolucao_real') as string) || null
    const cliente_confirmou_resolucao = formData.get('cliente_confirmou_resolucao') === 'on'
    const coberto_garantia = (formData.get('coberto_garantia') as string) || null
    const departamento_responsavel = (formData.get('departamento_responsavel') as string) || null

    const { data: issue } = await supabase
      .from('issues')
      .select('project_id, issue_title')
      .eq('id', issueId)
      .single()

    const { error } = await supabase
      .from('issues')
      .update({
        resolution_notes,
        data_resolucao_real,
        cliente_confirmou_resolucao,
        coberto_garantia,
        departamento_responsavel,
        status: 'resolved',
      })
      .eq('id', issueId)

    if (error) return { error: error.message, success: false }

    revalidatePath('/gustavo')
    revalidatePath('/sofia/pos-venda')
    revalidatePath('/mario')
    if (issue?.project_id) revalidatePath(`/obras/${issue.project_id}`)

    // Automação 15: issue resolvido → cliente
    if (issue?.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('contract_number, client_name, client_email')
        .eq('id', issue.project_id)
        .single()
      void emailIssueResolvido({
        projectId: issue.project_id,
        contractNumber: project?.contract_number ?? '',
        clientName: project?.client_name ?? '',
        clientEmail: project?.client_email ?? null,
        issueTitle: issue.issue_title ?? '',
        resolutionNotes: resolution_notes,
      })
    }

    return { error: null, success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}

export async function toggleAfetaPagamento(
  issueId: string,
  currentValue: boolean
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile) return { error: 'Não autenticado', success: false }

    const { data: issue, error: fetchError } = await supabase
      .from('issues')
      .select('project_id')
      .eq('id', issueId)
      .single()

    if (fetchError) return { error: fetchError.message, success: false }

    const { error } = await supabase
      .from('issues')
      .update({ afeta_pagamento: !currentValue })
      .eq('id', issueId)

    if (error) return { error: error.message, success: false }

    revalidatePath('/sofia/pos-venda')
    revalidatePath('/ana')
    revalidatePath('/mario')
    if (issue.project_id) revalidatePath(`/obras/${issue.project_id}`)
    return { error: null, success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}
