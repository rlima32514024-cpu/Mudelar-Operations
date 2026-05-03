// ─── User Roles ──────────────────────────────────────────────────────────────

export type UserRole =
  | 'mario'
  | 'sofia'
  | 'susana'
  | 'ana'
  | 'supervisor'
  | 'gustavo'
  | 'admin'

// ─── General Status ───────────────────────────────────────────────────────────

export type GeneralStatus =
  | '1_aguarda_atribuicao'
  | '2_aguarda_retificacao'
  | '3_aguarda_compras'
  | '4_aguarda_arranque'
  | '5_em_execucao'
  | '6_concluida'
  | '7_fechada'
  | 'cancelada'

export const GENERAL_STATUS_LABELS: Record<GeneralStatus, string> = {
  '1_aguarda_atribuicao': '1 — Aguarda atribuição',
  '2_aguarda_retificacao': '2 — Aguarda retificação',
  '3_aguarda_compras': '3 — Aguarda compras',
  '4_aguarda_arranque': '4 — Aguarda arranque',
  '5_em_execucao': '5 — Em execução',
  '6_concluida': '6 — Concluída',
  '7_fechada': '7 — Fechada',
  'cancelada': 'Cancelada',
}

// ─── Work Types ───────────────────────────────────────────────────────────────

export type WorkType = 'Kitchen' | 'Bathroom' | 'Both'

// ─── Current Phase ────────────────────────────────────────────────────────────

export type CurrentPhase =
  | 'not_started'
  | '1_preparacao_demolicoes'
  | '2_infraestruturas'
  | '3_revestimentos'
  | '4_montagem_final'
  | 'completed'

export const CURRENT_PHASE_LABELS: Record<CurrentPhase, string> = {
  'not_started': 'Não iniciada',
  '1_preparacao_demolicoes': '1 — Preparação e Demolições',
  '2_infraestruturas': '2 — Infraestruturas',
  '3_revestimentos': '3 — Revestimentos',
  '4_montagem_final': '4 — Montagem Final',
  'completed': 'Concluída',
}

// ─── Procurement Status ───────────────────────────────────────────────────────

export type ProcurementStatus = 'submitted' | 'in_procurement' | 'received'

// ─── Start Risk Level ─────────────────────────────────────────────────────────

export type StartRiskLevel = 'green' | 'yellow' | 'orange' | 'red' | 'critical' | 'started'

export const RISK_LEVEL_LABELS: Record<StartRiskLevel, string> = {
  green: 'Verde',
  yellow: 'Amarelo',
  orange: 'Laranja',
  red: 'Vermelho',
  critical: 'Crítico',
  started: 'Iniciada',
}

export const RISK_LEVEL_COLORS: Record<StartRiskLevel, string> = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  orange: 'bg-orange-100 text-orange-800',
  red: 'bg-red-100 text-red-800',
  critical: 'bg-red-900 text-white',
  started: 'bg-blue-100 text-blue-800',
}

// ─── Billing Milestone ────────────────────────────────────────────────────────

export type BillingStage = 'Start' | 'Final' | 'Extras'

export type MilestoneStatus =
  | 'not_ready'
  | 'ready_for_validation'
  | 'validated'
  | 'invoiced'
  | 'paid'
  | 'debt'

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  not_ready: 'Não pronto',
  ready_for_validation: 'Pronto para validação',
  validated: 'Validado',
  invoiced: 'Faturado',
  paid: 'Pago',
  debt: 'Dívida',
}

// ─── Issues ───────────────────────────────────────────────────────────────────

export type IssuePriority = 'Low' | 'Normal' | 'High' | 'Urgent'

export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled'

export type TipoReclamacao =
  | 'defeito_execucao'
  | 'acabamento'
  | 'mobiliario'
  | 'gas'
  | 'eletrodomesticos'
  | 'falta_de_algo'
  | 'outro'

export type DepartamentoResponsavel =
  | 'operacao'
  | 'compras'
  | 'comercial'
  | 'cliente_trata_diretamente'

export type CobertoGarantia = 'sim' | 'nao' | 'a_avaliar'

// ─── Apontamentos ─────────────────────────────────────────────────────────────

export type TipoProblema =
  | 'atraso_obra'
  | 'ma_execucao'
  | 'mobiliario'
  | 'acabamentos'
  | 'comunicacao'
  | 'limpeza_cuidado'
  | 'falta_de_algo'
  | 'material_defeituoso'
  | 'outro'

export type ReportadoPor = 'cliente' | 'supervisor' | 'outro'

// ─── Responsible Party ────────────────────────────────────────────────────────

export type ResponsiblePartyRole =
  | 'supervisor'
  | 'equipa_obras'
  | 'pos_venda_interna'
  | 'comercial'
  | 'compras'
  | 'financeiro'
  | 'gestor'
  | 'outro'

// ─── Work Model ───────────────────────────────────────────────────────────────

export type ModeloCategoria = 'WC' | 'Cozinha'

// ─── Extra Budget Status ──────────────────────────────────────────────────────

export type OrcamentoExtraEstado =
  | 'pendente_orcamento'
  | 'em_negociacao'
  | 'aprovado_pelo_cliente'
  | 'recusado'

// ─── Database Entity Types ────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  responsible_party_id: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  contract_number: string
  client_name: string
  client_phone: string | null
  client_email: string | null
  address: string | null
  work_type: WorkType
  work_model_id: string | null
  contract_signature_date: string | null
  total_project_value: number | null
  contract_document_url: string | null
  // Team
  initial_supervisor_id: string | null
  assigned_supervisor_id: string | null
  equipa_obras_id: string | null
  // Dates
  data_retificacao_marcada: string | null
  planned_start_date: string | null
  actual_start_date: string | null
  estimated_completion_date: string | null
  actual_completion_date: string | null
  // Measurements
  measurements_verified: boolean
  measurements_verified_date: string | null
  measurements_verified_by_id: string | null
  measurements_notes: string | null
  layout_retificado_url: string | null
  // Procurement
  procurement_list_url: string | null
  procurement_status: ProcurementStatus | null
  procurement_list_uploaded_date: string | null
  // Phases
  current_phase: CurrentPhase
  notes_phase_1: string | null
  notes_phase_2: string | null
  notes_phase_3: string | null
  notes_phase_4: string | null
  auto_entrega_url: string | null
  // Extras (team)
  has_extras: boolean
  extras_descricao: string | null
  fatura_equipa_enviada_ana: boolean
  fatura_equipa_paga: boolean
  // Extras (client)
  orcamento_extra_descricao: string | null
  orcamento_extra_valor: number | null
  orcamento_extra_estado: OrcamentoExtraEstado | null
  // Status
  general_status: GeneralStatus
  // Computed (from DB)
  days_since_signature: number | null
  start_risk_level: StartRiskLevel | null
  total_billed: number | null
  total_paid: number | null
  outstanding_invoiced: number | null
  active_issues_count: number | null
  has_affected_payment_issues: boolean
  ready_to_close: boolean
  // Meta
  created_at: string
  updated_at: string
  created_by_id: string | null
}

export interface BillingMilestone {
  id: string
  milestone_id: string
  project_id: string
  billing_stage: BillingStage
  percentage: number | null
  amount: number | null
  status: MilestoneStatus
  supervisor_marked_ready: boolean
  supervisor_marked_ready_date: string | null
  manager_validated: boolean
  manager_validated_date: string | null
  invoice_number: string | null
  invoice_issued_date: string | null
  payment_due_date: string | null
  payment_received_date: string | null
  days_overdue_payment: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Issue {
  id: string
  issue_title: string
  project_id: string
  reported_date: string
  priority: IssuePriority
  sla_deadline: string | null
  status: IssueStatus
  assigned_to_id: string | null
  description: string | null
  resolution_notes: string | null
  resolution_date: string | null
  tipo_reclamacao: TipoReclamacao | null
  coberto_garantia: CobertoGarantia | null
  departamento_responsavel: DepartamentoResponsavel | null
  data_intervencao_prevista: string | null
  data_resolucao_real: string | null
  cliente_confirmou_resolucao: boolean
  afeta_pagamento: boolean
  days_open: number | null
  sla_breach: boolean
  created_at: string
  updated_at: string
}

export interface Apontamento {
  id: string
  apontamento_title: string
  project_id: string
  data_apontamento: string
  tipo_problema: TipoProblema | null
  reportado_por: ReportadoPor | null
  descricao: string | null
  criado_por_id: string | null
  created_at: string
}

export interface ResponsibleParty {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: ResponsiblePartyRole
  active: boolean
  notes: string | null
  created_at: string
}

export interface WorkModel {
  id: string
  nome_modelo: string
  prazo_estimado_dias: number
  categoria: ModeloCategoria
  notas: string | null
  created_at: string
}
