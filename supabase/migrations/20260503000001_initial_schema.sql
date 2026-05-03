-- =============================================================================
-- Mudelar Operations — Schema inicial
-- Fase 2: Tabelas, funções, triggers e views
-- =============================================================================

-- =============================================================================
-- SECÇÃO 1: FUNÇÕES UTILITÁRIAS
-- =============================================================================

-- Actualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SECÇÃO 2: TABELAS BASE
-- =============================================================================

-- ─── responsible_parties ──────────────────────────────────────────────────────
-- Supervisores, equipas de obra e outros intervenientes externos

CREATE TABLE IF NOT EXISTS responsible_parties (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL,
  email             text,
  phone             text,
  role              text        NOT NULL
                    CHECK (role IN (
                      'supervisor', 'equipa_obras', 'pos_venda_interna',
                      'comercial', 'compras', 'financeiro', 'gestor', 'outro'
                    )),
  active            boolean     NOT NULL DEFAULT true,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── work_models ──────────────────────────────────────────────────────────────
-- Templates de obra (ex: "Cozinha Standard - 15 dias")

CREATE TABLE IF NOT EXISTS work_models (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_modelo           text        NOT NULL,
  prazo_estimado_dias   integer     NOT NULL CHECK (prazo_estimado_dias > 0),
  categoria             text        NOT NULL CHECK (categoria IN ('WC', 'Cozinha')),
  notas                 text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ─── profiles ─────────────────────────────────────────────────────────────────
-- Um perfil por utilizador auth.users

CREATE TABLE IF NOT EXISTS profiles (
  id                    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 text        NOT NULL,
  full_name             text        NOT NULL,
  role                  text        NOT NULL
                        CHECK (role IN (
                          'mario', 'sofia', 'susana', 'ana',
                          'supervisor', 'gustavo', 'admin'
                        )),
  responsible_party_id  uuid        REFERENCES responsible_parties(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── projects ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id                              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number                 text        NOT NULL UNIQUE,
  client_name                     text        NOT NULL,
  client_phone                    text,
  client_email                    text,
  address                         text,
  work_type                       text        NOT NULL
                                  CHECK (work_type IN ('Kitchen', 'Bathroom', 'Both')),
  work_model_id                   uuid        REFERENCES work_models(id) ON DELETE SET NULL,
  contract_signature_date         date,
  total_project_value             numeric(10,2),
  contract_document_url           text,

  -- Equipa
  initial_supervisor_id           uuid        REFERENCES responsible_parties(id) ON DELETE SET NULL,
  assigned_supervisor_id          uuid        REFERENCES responsible_parties(id) ON DELETE SET NULL,
  equipa_obras_id                 uuid        REFERENCES responsible_parties(id) ON DELETE SET NULL,

  -- Datas chave
  data_retificacao_marcada        date,
  planned_start_date              date,
  actual_start_date               date,
  estimated_completion_date       date,
  actual_completion_date          date,

  -- Retificação / medições
  measurements_verified           boolean     NOT NULL DEFAULT false,
  measurements_verified_date      date,
  measurements_verified_by_id     uuid        REFERENCES responsible_parties(id) ON DELETE SET NULL,
  measurements_notes              text,
  layout_retificado_url           text,

  -- Compras
  procurement_list_url            text,
  procurement_status              text
                                  CHECK (procurement_status IN (
                                    'submitted', 'in_procurement', 'received'
                                  )),
  procurement_list_uploaded_date  date,

  -- Fases de execução
  current_phase                   text        NOT NULL DEFAULT 'not_started'
                                  CHECK (current_phase IN (
                                    'not_started',
                                    '1_preparacao_demolicoes',
                                    '2_infraestruturas',
                                    '3_revestimentos',
                                    '4_montagem_final',
                                    'completed'
                                  )),
  notes_phase_1                   text,
  notes_phase_2                   text,
  notes_phase_3                   text,
  notes_phase_4                   text,
  auto_entrega_url                text,

  -- Extras equipa
  has_extras                      boolean     NOT NULL DEFAULT false,
  extras_descricao                text,
  fatura_equipa_enviada_ana       boolean     NOT NULL DEFAULT false,
  fatura_equipa_paga              boolean     NOT NULL DEFAULT false,

  -- Extra orçamento cliente
  orcamento_extra_descricao       text,
  orcamento_extra_valor           numeric(10,2),
  orcamento_extra_estado          text
                                  CHECK (orcamento_extra_estado IN (
                                    'pendente_orcamento', 'em_negociacao',
                                    'aprovado_pelo_cliente', 'recusado'
                                  )),

  -- Estado geral
  general_status                  text        NOT NULL DEFAULT '1_aguarda_atribuicao'
                                  CHECK (general_status IN (
                                    '1_aguarda_atribuicao',
                                    '2_aguarda_retificacao',
                                    '3_aguarda_compras',
                                    '4_aguarda_arranque',
                                    '5_em_execucao',
                                    '6_concluida',
                                    '7_fechada',
                                    'cancelada'
                                  )),

  -- Meta
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now(),
  created_by_id                   uuid        REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── billing_milestones ───────────────────────────────────────────────────────
-- Marcos de faturação: Início (50%), Final (50%), Extras

CREATE TABLE IF NOT EXISTS billing_milestones (
  id                              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                      uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id                    text        NOT NULL,   -- 'start' | 'final' | 'extras'
  billing_stage                   text        NOT NULL
                                  CHECK (billing_stage IN ('Start', 'Final', 'Extras')),
  percentage                      numeric(5,2)
                                  CHECK (percentage IS NULL OR (percentage > 0 AND percentage <= 100)),
  amount                          numeric(10,2),
  status                          text        NOT NULL DEFAULT 'not_ready'
                                  CHECK (status IN (
                                    'not_ready', 'ready_for_validation',
                                    'validated', 'invoiced', 'paid', 'debt'
                                  )),
  supervisor_marked_ready         boolean     NOT NULL DEFAULT false,
  supervisor_marked_ready_date    date,
  manager_validated               boolean     NOT NULL DEFAULT false,
  manager_validated_date          date,
  invoice_number                  text,
  invoice_issued_date             date,
  payment_due_date                date,
  payment_received_date           date,
  notes                           text,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (project_id, milestone_id)
);

CREATE TRIGGER trg_billing_milestones_updated_at
  BEFORE UPDATE ON billing_milestones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── issues ───────────────────────────────────────────────────────────────────
-- Reclamações e problemas pós-obra

CREATE TABLE IF NOT EXISTS issues (
  id                              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_title                     text        NOT NULL,
  project_id                      uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reported_date                   date        NOT NULL DEFAULT CURRENT_DATE,
  priority                        text        NOT NULL DEFAULT 'Normal'
                                  CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
  sla_deadline                    date,
  status                          text        NOT NULL DEFAULT 'open'
                                  CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
  assigned_to_id                  uuid        REFERENCES responsible_parties(id) ON DELETE SET NULL,
  description                     text,
  resolution_notes                text,
  resolution_date                 date,
  tipo_reclamacao                 text
                                  CHECK (tipo_reclamacao IN (
                                    'defeito_execucao', 'acabamento', 'mobiliario',
                                    'gas', 'eletrodomesticos', 'falta_de_algo', 'outro'
                                  )),
  coberto_garantia                text
                                  CHECK (coberto_garantia IN ('sim', 'nao', 'a_avaliar')),
  departamento_responsavel        text
                                  CHECK (departamento_responsavel IN (
                                    'operacao', 'compras', 'comercial', 'cliente_trata_diretamente'
                                  )),
  data_intervencao_prevista       date,
  data_resolucao_real             date,
  cliente_confirmou_resolucao     boolean     NOT NULL DEFAULT false,
  afeta_pagamento                 boolean     NOT NULL DEFAULT false,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── apontamentos ─────────────────────────────────────────────────────────────
-- Registos de ocorrências durante a obra

CREATE TABLE IF NOT EXISTS apontamentos (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  apontamento_title   text        NOT NULL,
  project_id          uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  data_apontamento    date        NOT NULL DEFAULT CURRENT_DATE,
  tipo_problema       text
                      CHECK (tipo_problema IN (
                        'atraso_obra', 'ma_execucao', 'mobiliario', 'acabamentos',
                        'comunicacao', 'limpeza_cuidado', 'falta_de_algo',
                        'material_defeituoso', 'outro'
                      )),
  reportado_por       text
                      CHECK (reportado_por IN ('cliente', 'supervisor', 'outro')),
  descricao           text,
  criado_por_id       uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- SECÇÃO 3: FUNÇÕES DE NEGÓCIO
-- =============================================================================

-- ─── Número de contrato sequencial (ex: MUD-2026-001) ─────────────────────────
CREATE OR REPLACE FUNCTION get_next_contract_number()
RETURNS text AS $$
DECLARE
  year_str  text;
  next_seq  integer;
BEGIN
  year_str := to_char(CURRENT_DATE, 'YYYY');

  SELECT COALESCE(
    MAX(
      CASE
        WHEN contract_number ~ ('^MUD-' || year_str || '-\d+$')
        THEN (regexp_match(contract_number, '(\d+)$'))[1]::integer
        ELSE 0
      END
    ), 0
  ) + 1
  INTO next_seq
  FROM projects;

  RETURN 'MUD-' || year_str || '-' || lpad(next_seq::text, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Criação automática de perfil quando um utilizador se regista ─────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'supervisor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Criação automática de marcos de faturação ao criar projecto ──────────────
CREATE OR REPLACE FUNCTION auto_create_billing_milestones()
RETURNS trigger AS $$
DECLARE
  v_start_amount  numeric;
  v_final_amount  numeric;
BEGIN
  IF NEW.total_project_value IS NOT NULL THEN
    v_start_amount := ROUND(NEW.total_project_value * 0.50, 2);
    v_final_amount := NEW.total_project_value - v_start_amount;
  END IF;

  INSERT INTO billing_milestones
    (project_id, milestone_id, billing_stage, percentage, amount, status)
  VALUES
    (NEW.id, 'start', 'Start', 50, v_start_amount, 'not_ready'),
    (NEW.id, 'final', 'Final', 50, v_final_amount, 'not_ready');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_project_create_milestones
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION auto_create_billing_milestones();

-- ─── Sincronizar montantes quando o valor do projecto muda ────────────────────
CREATE OR REPLACE FUNCTION sync_milestone_amounts()
RETURNS trigger AS $$
BEGIN
  IF NEW.total_project_value IS DISTINCT FROM OLD.total_project_value
     AND NEW.total_project_value IS NOT NULL THEN
    UPDATE billing_milestones
    SET amount = ROUND(NEW.total_project_value * (percentage / 100.0), 2)
    WHERE project_id = NEW.id
      AND milestone_id IN ('start', 'final')
      AND status = 'not_ready';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_project_sync_milestone_amounts
  AFTER UPDATE OF total_project_value ON projects
  FOR EACH ROW EXECUTE FUNCTION sync_milestone_amounts();

-- ─── Criar marco "Extras" quando orçamento extra é aprovado ───────────────────
CREATE OR REPLACE FUNCTION handle_extra_approval()
RETURNS trigger AS $$
BEGIN
  IF NEW.orcamento_extra_estado = 'aprovado_pelo_cliente'
     AND (OLD.orcamento_extra_estado IS DISTINCT FROM 'aprovado_pelo_cliente')
     AND NEW.orcamento_extra_valor IS NOT NULL THEN

    INSERT INTO billing_milestones
      (project_id, milestone_id, billing_stage, percentage, amount, status)
    VALUES
      (NEW.id, 'extras', 'Extras', NULL, NEW.orcamento_extra_valor, 'not_ready')
    ON CONFLICT (project_id, milestone_id) DO UPDATE
      SET amount     = EXCLUDED.amount,
          updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_project_extra_approval
  AFTER UPDATE OF orcamento_extra_estado, orcamento_extra_valor ON projects
  FOR EACH ROW EXECUTE FUNCTION handle_extra_approval();

-- ─── Calcular prazo SLA automaticamente ao criar issue ────────────────────────
CREATE OR REPLACE FUNCTION set_issue_sla()
RETURNS trigger AS $$
BEGIN
  IF NEW.sla_deadline IS NULL THEN
    NEW.sla_deadline := CASE NEW.priority
      WHEN 'Urgent' THEN (NEW.reported_date + interval '1 day')::date
      WHEN 'High'   THEN (NEW.reported_date + interval '3 days')::date
      WHEN 'Normal' THEN (NEW.reported_date + interval '7 days')::date
      WHEN 'Low'    THEN (NEW.reported_date + interval '30 days')::date
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_issue_set_sla
  BEFORE INSERT ON issues
  FOR EACH ROW EXECUTE FUNCTION set_issue_sla();

-- =============================================================================
-- SECÇÃO 4: ÍNDICES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_general_status      ON projects (general_status);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_supervisor ON projects (assigned_supervisor_id);
CREATE INDEX IF NOT EXISTS idx_projects_contract_number     ON projects (contract_number);
CREATE INDEX IF NOT EXISTS idx_projects_created_at          ON projects (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_milestones_project   ON billing_milestones (project_id);
CREATE INDEX IF NOT EXISTS idx_billing_milestones_status    ON billing_milestones (status);

CREATE INDEX IF NOT EXISTS idx_issues_project               ON issues (project_id);
CREATE INDEX IF NOT EXISTS idx_issues_status                ON issues (status);
CREATE INDEX IF NOT EXISTS idx_issues_priority              ON issues (priority);
CREATE INDEX IF NOT EXISTS idx_issues_sla_deadline          ON issues (sla_deadline);

CREATE INDEX IF NOT EXISTS idx_apontamentos_project         ON apontamentos (project_id);
CREATE INDEX IF NOT EXISTS idx_apontamentos_data            ON apontamentos (data_apontamento DESC);

-- =============================================================================
-- SECÇÃO 5: VIEWS COM CAMPOS COMPUTADOS
-- =============================================================================

-- ─── issues_view ──────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW issues_view AS
SELECT
  i.*,
  CASE
    WHEN i.status NOT IN ('resolved', 'cancelled')
    THEN (CURRENT_DATE - i.reported_date)::integer
    ELSE NULL
  END AS days_open,
  (
    i.sla_deadline IS NOT NULL
    AND CURRENT_DATE > i.sla_deadline
    AND i.status NOT IN ('resolved', 'cancelled')
  ) AS sla_breach
FROM issues i;

-- ─── billing_milestones_view ──────────────────────────────────────────────────
CREATE OR REPLACE VIEW billing_milestones_view AS
SELECT
  bm.*,
  CASE
    WHEN bm.payment_due_date IS NOT NULL
     AND bm.status IN ('invoiced', 'debt')
     AND CURRENT_DATE > bm.payment_due_date
    THEN (CURRENT_DATE - bm.payment_due_date)::integer
    ELSE NULL
  END AS days_overdue_payment
FROM billing_milestones bm;

-- ─── projects_view ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW projects_view AS
SELECT
  p.*,

  -- Dias desde a assinatura do contrato
  CASE
    WHEN p.contract_signature_date IS NOT NULL
    THEN (CURRENT_DATE - p.contract_signature_date)::integer
    ELSE NULL
  END AS days_since_signature,

  -- Nível de risco para arranque (verde → crítico)
  CASE
    WHEN p.actual_start_date IS NOT NULL                                    THEN 'started'
    WHEN p.general_status IN ('6_concluida', '7_fechada', 'cancelada')     THEN NULL
    WHEN p.contract_signature_date IS NULL                                  THEN NULL
    WHEN (CURRENT_DATE - p.contract_signature_date) <= 14                  THEN 'green'
    WHEN (CURRENT_DATE - p.contract_signature_date) <= 21                  THEN 'yellow'
    WHEN (CURRENT_DATE - p.contract_signature_date) <= 30                  THEN 'orange'
    WHEN (CURRENT_DATE - p.contract_signature_date) <= 45                  THEN 'red'
    ELSE                                                                         'critical'
  END AS start_risk_level,

  -- Totais de faturação
  COALESCE((
    SELECT SUM(bm.amount)
    FROM billing_milestones bm
    WHERE bm.project_id = p.id
      AND bm.status IN ('invoiced', 'paid', 'debt')
  ), 0) AS total_billed,

  COALESCE((
    SELECT SUM(bm.amount)
    FROM billing_milestones bm
    WHERE bm.project_id = p.id
      AND bm.status = 'paid'
  ), 0) AS total_paid,

  COALESCE((
    SELECT SUM(bm.amount)
    FROM billing_milestones bm
    WHERE bm.project_id = p.id
      AND bm.status IN ('invoiced', 'debt')
  ), 0) AS outstanding_invoiced,

  -- Issues activos
  COALESCE((
    SELECT COUNT(*)
    FROM issues i
    WHERE i.project_id = p.id
      AND i.status IN ('open', 'in_progress')
  ), 0)::integer AS active_issues_count,

  EXISTS (
    SELECT 1
    FROM issues i
    WHERE i.project_id = p.id
      AND i.afeta_pagamento = true
      AND i.status IN ('open', 'in_progress')
  ) AS has_affected_payment_issues,

  -- Pronto para fechar: concluído + sem issues activos + sem marcos por pagar
  (
    p.general_status = '6_concluida'
    AND NOT EXISTS (
      SELECT 1 FROM issues i
      WHERE i.project_id = p.id
        AND i.status IN ('open', 'in_progress')
    )
    AND NOT EXISTS (
      SELECT 1 FROM billing_milestones bm
      WHERE bm.project_id = p.id
        AND bm.status IN ('not_ready', 'ready_for_validation', 'validated', 'invoiced', 'debt')
    )
  ) AS ready_to_close

FROM projects p;
