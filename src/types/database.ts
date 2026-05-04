export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          responsible_party_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: string
          responsible_party_id?: string | null
        }
        Update: {
          email?: string
          full_name?: string
          role?: string
          responsible_party_id?: string | null
        }
        Relationships: []
      }
      responsible_parties: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          role: string
          active: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          name: string
          email?: string | null
          phone?: string | null
          role: string
          active?: boolean
          notes?: string | null
        }
        Update: {
          name?: string
          email?: string | null
          phone?: string | null
          role?: string
          active?: boolean
          notes?: string | null
        }
        Relationships: []
      }
      work_models: {
        Row: {
          id: string
          nome_modelo: string
          prazo_estimado_dias: number
          categoria: string
          notas: string | null
          created_at: string
        }
        Insert: {
          nome_modelo: string
          prazo_estimado_dias: number
          categoria: string
          notas?: string | null
        }
        Update: {
          nome_modelo?: string
          prazo_estimado_dias?: number
          categoria?: string
          notas?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          contract_number: string
          client_name: string
          client_phone: string | null
          client_email: string | null
          address: string | null
          work_type: string
          work_model_id: string | null
          contract_signature_date: string | null
          total_project_value: number | null
          contract_document_url: string | null
          initial_supervisor_id: string | null
          assigned_supervisor_id: string | null
          equipa_obras_id: string | null
          data_retificacao_marcada: string | null
          planned_start_date: string | null
          actual_start_date: string | null
          estimated_completion_date: string | null
          actual_completion_date: string | null
          measurements_verified: boolean
          measurements_verified_date: string | null
          measurements_verified_by_id: string | null
          measurements_notes: string | null
          layout_retificado_url: string | null
          procurement_list_url: string | null
          procurement_status: string | null
          procurement_list_uploaded_date: string | null
          current_phase: string
          notes_phase_1: string | null
          notes_phase_2: string | null
          notes_phase_3: string | null
          notes_phase_4: string | null
          auto_entrega_url: string | null
          initial_measurements_photos_url: string | null
          photos_phase_1_url: string | null
          photos_phase_2_url: string | null
          photos_phase_3_url: string | null
          photos_phase_4_url: string | null
          has_extras: boolean
          extras_descricao: string | null
          fatura_equipa_enviada_ana: boolean
          fatura_equipa_paga: boolean
          orcamento_extra_descricao: string | null
          orcamento_extra_valor: number | null
          orcamento_extra_estado: string | null
          general_status: string
          created_at: string
          updated_at: string
          created_by_id: string | null
        }
        Insert: {
          contract_number: string
          client_name: string
          client_phone?: string | null
          client_email?: string | null
          address?: string | null
          work_type: string
          work_model_id?: string | null
          contract_signature_date?: string | null
          total_project_value?: number | null
          contract_document_url?: string | null
          initial_supervisor_id?: string | null
          assigned_supervisor_id?: string | null
          equipa_obras_id?: string | null
          data_retificacao_marcada?: string | null
          planned_start_date?: string | null
          actual_start_date?: string | null
          estimated_completion_date?: string | null
          actual_completion_date?: string | null
          measurements_verified?: boolean
          measurements_verified_date?: string | null
          measurements_verified_by_id?: string | null
          measurements_notes?: string | null
          layout_retificado_url?: string | null
          procurement_list_url?: string | null
          procurement_status?: string | null
          procurement_list_uploaded_date?: string | null
          current_phase?: string
          notes_phase_1?: string | null
          notes_phase_2?: string | null
          notes_phase_3?: string | null
          notes_phase_4?: string | null
          auto_entrega_url?: string | null
          initial_measurements_photos_url?: string | null
          photos_phase_1_url?: string | null
          photos_phase_2_url?: string | null
          photos_phase_3_url?: string | null
          photos_phase_4_url?: string | null
          has_extras?: boolean
          extras_descricao?: string | null
          fatura_equipa_enviada_ana?: boolean
          fatura_equipa_paga?: boolean
          orcamento_extra_descricao?: string | null
          orcamento_extra_valor?: number | null
          orcamento_extra_estado?: string | null
          general_status?: string
          created_by_id?: string | null
        }
        Update: {
          contract_number?: string
          client_name?: string
          client_phone?: string | null
          client_email?: string | null
          address?: string | null
          work_type?: string
          work_model_id?: string | null
          contract_signature_date?: string | null
          total_project_value?: number | null
          contract_document_url?: string | null
          initial_supervisor_id?: string | null
          assigned_supervisor_id?: string | null
          equipa_obras_id?: string | null
          data_retificacao_marcada?: string | null
          planned_start_date?: string | null
          actual_start_date?: string | null
          estimated_completion_date?: string | null
          actual_completion_date?: string | null
          measurements_verified?: boolean
          measurements_verified_date?: string | null
          measurements_verified_by_id?: string | null
          measurements_notes?: string | null
          layout_retificado_url?: string | null
          procurement_list_url?: string | null
          procurement_status?: string | null
          procurement_list_uploaded_date?: string | null
          current_phase?: string
          notes_phase_1?: string | null
          notes_phase_2?: string | null
          notes_phase_3?: string | null
          notes_phase_4?: string | null
          auto_entrega_url?: string | null
          initial_measurements_photos_url?: string | null
          photos_phase_1_url?: string | null
          photos_phase_2_url?: string | null
          photos_phase_3_url?: string | null
          photos_phase_4_url?: string | null
          has_extras?: boolean
          extras_descricao?: string | null
          fatura_equipa_enviada_ana?: boolean
          fatura_equipa_paga?: boolean
          orcamento_extra_descricao?: string | null
          orcamento_extra_valor?: number | null
          orcamento_extra_estado?: string | null
          general_status?: string
          created_by_id?: string | null
        }
        Relationships: []
      }
      billing_milestones: {
        Row: {
          id: string
          project_id: string
          milestone_id: string
          billing_stage: string
          percentage: number | null
          amount: number | null
          status: string
          supervisor_marked_ready: boolean
          supervisor_marked_ready_date: string | null
          manager_validated: boolean
          manager_validated_date: string | null
          invoice_number: string | null
          invoice_issued_date: string | null
          payment_due_date: string | null
          payment_received_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          project_id: string
          milestone_id: string
          billing_stage: string
          percentage?: number | null
          amount?: number | null
          status?: string
          supervisor_marked_ready?: boolean
          supervisor_marked_ready_date?: string | null
          manager_validated?: boolean
          manager_validated_date?: string | null
          invoice_number?: string | null
          invoice_issued_date?: string | null
          payment_due_date?: string | null
          payment_received_date?: string | null
          notes?: string | null
        }
        Update: {
          milestone_id?: string
          billing_stage?: string
          percentage?: number | null
          amount?: number | null
          status?: string
          supervisor_marked_ready?: boolean
          supervisor_marked_ready_date?: string | null
          manager_validated?: boolean
          manager_validated_date?: string | null
          invoice_number?: string | null
          invoice_issued_date?: string | null
          payment_due_date?: string | null
          payment_received_date?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      issues: {
        Row: {
          id: string
          issue_title: string
          project_id: string
          reported_date: string
          priority: string
          sla_deadline: string | null
          status: string
          assigned_to_id: string | null
          description: string | null
          resolution_notes: string | null
          resolution_date: string | null
          tipo_reclamacao: string | null
          coberto_garantia: string | null
          departamento_responsavel: string | null
          data_intervencao_prevista: string | null
          data_resolucao_real: string | null
          cliente_confirmou_resolucao: boolean
          afeta_pagamento: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          issue_title: string
          project_id: string
          reported_date?: string
          priority?: string
          sla_deadline?: string | null
          status?: string
          assigned_to_id?: string | null
          description?: string | null
          resolution_notes?: string | null
          resolution_date?: string | null
          tipo_reclamacao?: string | null
          coberto_garantia?: string | null
          departamento_responsavel?: string | null
          data_intervencao_prevista?: string | null
          data_resolucao_real?: string | null
          cliente_confirmou_resolucao?: boolean
          afeta_pagamento?: boolean
        }
        Update: {
          issue_title?: string
          reported_date?: string
          priority?: string
          sla_deadline?: string | null
          status?: string
          assigned_to_id?: string | null
          description?: string | null
          resolution_notes?: string | null
          resolution_date?: string | null
          tipo_reclamacao?: string | null
          coberto_garantia?: string | null
          departamento_responsavel?: string | null
          data_intervencao_prevista?: string | null
          data_resolucao_real?: string | null
          cliente_confirmou_resolucao?: boolean
          afeta_pagamento?: boolean
        }
        Relationships: []
      }
      project_audit_log: {
        Row: {
          id: string
          project_id: string
          user_id: string | null
          user_name: string | null
          action: string
          details: { [key: string]: Json } | null
          created_at: string
        }
        Insert: {
          project_id: string
          user_id?: string | null
          user_name?: string | null
          action: string
          details?: { [key: string]: Json } | null
        }
        Update: {
          details?: { [key: string]: Json } | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          recipient_role: string
          message: string
          action_type: string
          link_url: string | null
          project_id: string | null
          read_by: string[]
          created_at: string
        }
        Insert: {
          recipient_role: string
          message: string
          action_type: string
          link_url?: string | null
          project_id?: string | null
          read_by?: string[]
        }
        Update: {
          read_by?: string[]
        }
        Relationships: []
      }
      apontamentos: {
        Row: {
          id: string
          apontamento_title: string
          project_id: string
          data_apontamento: string
          tipo_problema: string | null
          reportado_por: string | null
          descricao: string | null
          criado_por_id: string | null
          created_at: string
        }
        Insert: {
          apontamento_title: string
          project_id: string
          data_apontamento?: string
          tipo_problema?: string | null
          reportado_por?: string | null
          descricao?: string | null
          criado_por_id?: string | null
        }
        Update: {
          apontamento_title?: string
          data_apontamento?: string
          tipo_problema?: string | null
          reportado_por?: string | null
          descricao?: string | null
          criado_por_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      projects_view: {
        Row: {
          id: string
          contract_number: string
          client_name: string
          client_phone: string | null
          client_email: string | null
          address: string | null
          work_type: string
          work_model_id: string | null
          contract_signature_date: string | null
          total_project_value: number | null
          contract_document_url: string | null
          initial_supervisor_id: string | null
          assigned_supervisor_id: string | null
          equipa_obras_id: string | null
          data_retificacao_marcada: string | null
          planned_start_date: string | null
          actual_start_date: string | null
          estimated_completion_date: string | null
          actual_completion_date: string | null
          measurements_verified: boolean
          measurements_verified_date: string | null
          measurements_verified_by_id: string | null
          measurements_notes: string | null
          layout_retificado_url: string | null
          procurement_list_url: string | null
          procurement_status: string | null
          procurement_list_uploaded_date: string | null
          current_phase: string
          notes_phase_1: string | null
          notes_phase_2: string | null
          notes_phase_3: string | null
          notes_phase_4: string | null
          auto_entrega_url: string | null
          has_extras: boolean
          extras_descricao: string | null
          fatura_equipa_enviada_ana: boolean
          fatura_equipa_paga: boolean
          orcamento_extra_descricao: string | null
          orcamento_extra_valor: number | null
          orcamento_extra_estado: string | null
          general_status: string
          created_at: string
          updated_at: string
          created_by_id: string | null
          days_since_signature: number | null
          start_risk_level: string | null
          total_billed: number
          total_paid: number
          outstanding_invoiced: number
          active_issues_count: number
          has_affected_payment_issues: boolean
          ready_to_close: boolean
        }
        Relationships: []
      }
      billing_milestones_view: {
        Row: {
          id: string
          project_id: string
          milestone_id: string
          billing_stage: string
          percentage: number | null
          amount: number | null
          status: string
          supervisor_marked_ready: boolean
          supervisor_marked_ready_date: string | null
          manager_validated: boolean
          manager_validated_date: string | null
          invoice_number: string | null
          invoice_issued_date: string | null
          payment_due_date: string | null
          payment_received_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
          days_overdue_payment: number | null
        }
        Relationships: []
      }
      issues_view: {
        Row: {
          id: string
          issue_title: string
          project_id: string
          reported_date: string
          priority: string
          sla_deadline: string | null
          status: string
          assigned_to_id: string | null
          description: string | null
          resolution_notes: string | null
          resolution_date: string | null
          tipo_reclamacao: string | null
          coberto_garantia: string | null
          departamento_responsavel: string | null
          data_intervencao_prevista: string | null
          data_resolucao_real: string | null
          cliente_confirmou_resolucao: boolean
          afeta_pagamento: boolean
          created_at: string
          updated_at: string
          days_open: number | null
          sla_breach: boolean
        }
        Relationships: []
      }
    }
    Functions: {
      get_next_contract_number: {
        Args: Record<string, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<string, never>
        Returns: string
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
