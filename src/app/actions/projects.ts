'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import {
  emailObraCriada,
  emailSupervisorAtribuido,
  emailListaComprasSubmetida,
  emailComprasRecebidas,
  emailObraIniciada,
  emailFaseAtualizada,
  emailObraConcluida,
} from '@/lib/email'
import type { Database } from '@/types/database'
import type { CurrentPhase } from '@/types'

type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type ActionResult = {
  error: string | null
  success: boolean
  message?: string
}

export type CreateProjectResult = ActionResult & { projectId?: string }

export async function createProject(
  _prev: CreateProjectResult,
  formData: FormData
): Promise<CreateProjectResult> {
  try {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile) return { error: 'Não autenticado', success: false }

    const client_name = (formData.get('client_name') as string)?.trim()
    const address = (formData.get('address') as string)?.trim()
    const work_type = formData.get('work_type') as string
    const client_phone = (formData.get('client_phone') as string)?.trim() || null
    const client_email = (formData.get('client_email') as string)?.trim() || null
    const contract_signature_date = (formData.get('contract_signature_date') as string) || null
    const total_project_value_raw = formData.get('total_project_value') as string
    const total_project_value = total_project_value_raw ? parseFloat(total_project_value_raw) : null
    const work_model_id = (formData.get('work_model_id') as string) || null

    if (!client_name || !address || !work_type) {
      return { error: 'Nome do cliente, morada e tipo de obra são obrigatórios', success: false }
    }

    const { data: contractNumber, error: rpcError } = await supabase.rpc('get_next_contract_number')
    if (rpcError || !contractNumber) {
      return { error: rpcError?.message ?? 'Erro ao gerar número de contrato', success: false }
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        contract_number: contractNumber,
        client_name,
        client_phone,
        client_email,
        address,
        work_type,
        work_model_id,
        contract_signature_date,
        total_project_value,
        created_by_id: profile.id,
        general_status: '1_aguarda_atribuicao',
        current_phase: 'not_started',
      })
      .select('id')
      .single()

    if (error) return { error: error.message, success: false }

    revalidatePath('/mario')
    revalidatePath('/sofia')

    // Automação 1: obra criada → mario
    void emailObraCriada({
      projectId: data.id,
      contractNumber,
      clientName: client_name,
      address: address ?? null,
      workType: work_type,
      totalValue: total_project_value,
    })

    return { error: null, success: true, projectId: data.id }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}

export async function assignSupervisor(
  projectId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile) return { error: 'Não autenticado', success: false }

    const initial_supervisor_id = (formData.get('initial_supervisor_id') as string)?.trim() || null
    const data_retificacao_marcada = (formData.get('data_retificacao_marcada') as string) || null

    const { error } = await supabase
      .from('projects')
      .update({
        initial_supervisor_id,
        data_retificacao_marcada,
        general_status: '2_aguarda_retificacao',
      })
      .eq('id', projectId)

    if (error) return { error: error.message, success: false }

    revalidatePath('/mario')
    revalidatePath('/obras')

    // Automações 2+3: supervisor atribuído + retificação marcada → supervisor
    if (initial_supervisor_id) {
      const [{ data: project }, { data: supervisor }] = await Promise.all([
        supabase.from('projects').select('contract_number, client_name, address').eq('id', projectId).single(),
        supabase.from('responsible_parties').select('name, email').eq('id', initial_supervisor_id).single(),
      ])
      void emailSupervisorAtribuido({
        projectId,
        contractNumber: project?.contract_number ?? '',
        clientName: project?.client_name ?? '',
        address: project?.address ?? null,
        supervisorEmail: supervisor?.email ?? null,
        supervisorName: supervisor?.name ?? null,
        dataRetificacao: data_retificacao_marcada,
      })
    }

    return { error: null, success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}

export async function assignTeam(
  projectId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile) return { error: 'Não autenticado', success: false }

    const assigned_supervisor_id = (formData.get('assigned_supervisor_id') as string)?.trim() || null
    const equipa_obras_id = (formData.get('equipa_obras_id') as string)?.trim() || null
    const planned_start_date = (formData.get('planned_start_date') as string) || null

    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('projects')
      .update({
        assigned_supervisor_id,
        equipa_obras_id,
        planned_start_date,
        general_status: '5_em_execucao',
        actual_start_date: today,
      })
      .eq('id', projectId)

    if (error) return { error: error.message, success: false }

    revalidatePath('/mario')
    revalidatePath('/obras')

    // Automação 7: obra iniciada → cliente
    const { data: project } = await supabase
      .from('projects')
      .select('contract_number, client_name, client_email')
      .eq('id', projectId)
      .single()

    void emailObraIniciada({
      projectId,
      contractNumber: project?.contract_number ?? '',
      clientName: project?.client_name ?? '',
      clientEmail: project?.client_email ?? null,
      plannedStartDate: planned_start_date,
    })

    return { error: null, success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}

export async function updateProcurement(
  projectId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile) return { error: 'Não autenticado', success: false }

    const procurement_status = formData.get('procurement_status') as string
    const procurement_list_url = (formData.get('procurement_list_url') as string)?.trim() || null
    const procurement_list_uploaded_date = (formData.get('procurement_list_uploaded_date') as string) || null

    const updateData: ProjectUpdate = {
      procurement_status,
      procurement_list_url,
      procurement_list_uploaded_date,
    }

    if (procurement_status === 'received') {
      updateData.general_status = '4_aguarda_arranque'
    }

    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)

    if (error) return { error: error.message, success: false }

    revalidatePath('/susana')
    revalidatePath('/mario')

    if (procurement_status === 'submitted') {
      // Automação 5: lista de compras submetida → susana
      const { data: project } = await supabase
        .from('projects')
        .select('contract_number, client_name')
        .eq('id', projectId)
        .single()
      void emailListaComprasSubmetida({
        projectId,
        contractNumber: project?.contract_number ?? '',
        clientName: project?.client_name ?? '',
        listUrl: procurement_list_url,
      })
    } else if (procurement_status === 'received') {
      // Automação 6: compras recebidas → mario + supervisor
      const { data: project } = await supabase
        .from('projects')
        .select('contract_number, client_name, initial_supervisor_id')
        .eq('id', projectId)
        .single()

      let supervisorEmail: string | null = null
      if (project?.initial_supervisor_id) {
        const { data: supervisor } = await supabase
          .from('responsible_parties')
          .select('email')
          .eq('id', project.initial_supervisor_id)
          .single()
        supervisorEmail = supervisor?.email ?? null
      }

      void emailComprasRecebidas({
        projectId,
        contractNumber: project?.contract_number ?? '',
        clientName: project?.client_name ?? '',
        supervisorEmail,
      })
    }

    return { error: null, success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}

export async function updatePhase(
  projectId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile) return { error: 'Não autenticado', success: false }

    const current_phase = formData.get('current_phase') as CurrentPhase
    const notes = (formData.get('notes') as string)?.trim() || null

    const updateData: ProjectUpdate = { current_phase }

    if (notes) {
      if (current_phase === '1_preparacao_demolicoes') updateData.notes_phase_1 = notes
      else if (current_phase === '2_infraestruturas') updateData.notes_phase_2 = notes
      else if (current_phase === '3_revestimentos') updateData.notes_phase_3 = notes
      else if (current_phase === '4_montagem_final') updateData.notes_phase_4 = notes
    }

    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)

    if (error) return { error: error.message, success: false }

    revalidatePath('/supervisor')
    revalidatePath('/obras')

    // Automação 8: fase atualizada → mario
    if (current_phase !== 'not_started' && current_phase !== 'completed') {
      const { data: project } = await supabase
        .from('projects')
        .select('contract_number, client_name')
        .eq('id', projectId)
        .single()
      void emailFaseAtualizada({
        projectId,
        contractNumber: project?.contract_number ?? '',
        clientName: project?.client_name ?? '',
        phase: current_phase,
      })
    }

    return { error: null, success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}

export async function markCompleted(projectId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile) return { error: 'Não autenticado', success: false }

    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('projects')
      .update({
        general_status: '6_concluida',
        actual_completion_date: today,
        current_phase: 'completed',
      })
      .eq('id', projectId)

    if (error) return { error: error.message, success: false }

    revalidatePath('/supervisor')
    revalidatePath('/mario')

    // Automação 9: obra concluída → cliente + mario
    const { data: project } = await supabase
      .from('projects')
      .select('contract_number, client_name, client_email')
      .eq('id', projectId)
      .single()

    void emailObraConcluida({
      projectId,
      contractNumber: project?.contract_number ?? '',
      clientName: project?.client_name ?? '',
      clientEmail: project?.client_email ?? null,
    })

    return { error: null, success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message, success: false }
  }
}
