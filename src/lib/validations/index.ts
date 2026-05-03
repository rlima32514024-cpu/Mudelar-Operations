import { z } from 'zod'

// ─── Project schemas ──────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  client_name: z.string().min(2, 'Nome do cliente obrigatório'),
  client_phone: z.string().optional().nullable(),
  client_email: z.string().email('Email inválido').optional().nullable(),
  address: z.string().min(5, 'Morada obrigatória'),
  work_type: z.enum(['Kitchen', 'Bathroom', 'Both']),
  work_model_id: z.string().uuid().optional().nullable(),
  contract_signature_date: z.string().optional().nullable(),
  total_project_value: z.number().positive('Valor deve ser positivo').optional().nullable(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

export const assignSupervisorSchema = z.object({
  initial_supervisor_id: z.string().uuid('Supervisor obrigatório'),
  data_retificacao_marcada: z.string().min(1, 'Data de retificação obrigatória'),
})

export type AssignSupervisorInput = z.infer<typeof assignSupervisorSchema>

export const assignTeamSchema = z.object({
  assigned_supervisor_id: z.string().uuid('Supervisor obrigatório'),
  equipa_obras_id: z.string().uuid('Equipa obrigatória'),
  planned_start_date: z.string().min(1, 'Data de arranque obrigatória'),
})

export type AssignTeamInput = z.infer<typeof assignTeamSchema>

// ─── Issue schemas ────────────────────────────────────────────────────────────

export const createIssueSchema = z.object({
  issue_title: z.string().min(3, 'Título obrigatório'),
  project_id: z.string().uuid('Obra obrigatória'),
  priority: z.enum(['Low', 'Normal', 'High', 'Urgent']),
  description: z.string().optional().nullable(),
  tipo_reclamacao: z.enum([
    'defeito_execucao', 'acabamento', 'mobiliario', 'gas',
    'eletrodomesticos', 'falta_de_algo', 'outro'
  ]).optional().nullable(),
  coberto_garantia: z.enum(['sim', 'nao', 'a_avaliar']).optional().nullable(),
  departamento_responsavel: z.enum([
    'operacao', 'compras', 'comercial', 'cliente_trata_diretamente'
  ]).optional().nullable(),
  afeta_pagamento: z.boolean().default(false),
})

export type CreateIssueInput = z.infer<typeof createIssueSchema>

// ─── Apontamento schemas ──────────────────────────────────────────────────────

export const createApontamentoSchema = z.object({
  apontamento_title: z.string().min(3, 'Título obrigatório'),
  project_id: z.string().uuid('Obra obrigatória'),
  data_apontamento: z.string().default(() => new Date().toISOString().split('T')[0]),
  tipo_problema: z.enum([
    'atraso_obra', 'ma_execucao', 'mobiliario', 'acabamentos',
    'comunicacao', 'limpeza_cuidado', 'falta_de_algo', 'material_defeituoso', 'outro'
  ]).optional().nullable(),
  reportado_por: z.enum(['cliente', 'supervisor', 'outro']).optional().nullable(),
  descricao: z.string().optional().nullable(),
})

export type CreateApontamentoInput = z.infer<typeof createApontamentoSchema>

// ─── Billing Milestone schemas ────────────────────────────────────────────────

export const updateMilestoneSchema = z.object({
  invoice_number: z.string().optional().nullable(),
  invoice_issued_date: z.string().optional().nullable(),
  payment_due_date: z.string().optional().nullable(),
  payment_received_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>
