-- =============================================================================
-- Mudelar Operations — Row Level Security (RLS)
-- Fase 2: Políticas de acesso por role
--
-- Roles:
--   mario      — gestor, acesso total
--   sofia      — apoio ao cliente, leitura + issues
--   susana     — compras, leitura + actualizar procurement
--   ana        — financeiro, leitura + billing_milestones
--   supervisor — leitura/edição dos seus projectos
--   gustavo    — pós-venda, acesso total a issues
--   admin      — acesso total a tudo
-- =============================================================================

-- =============================================================================
-- FUNÇÃO AUXILIAR: retorna o role do utilizador autenticado
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =============================================================================
-- ACTIVAR RLS EM TODAS AS TABELAS
-- =============================================================================

ALTER TABLE responsible_parties  ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_models          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_milestones   ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues               ENABLE ROW LEVEL SECURITY;
ALTER TABLE apontamentos         ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- responsible_parties
-- =============================================================================

-- Todos os utilizadores autenticados podem ler (necessário para UI)
CREATE POLICY "rp_select_authenticated"
  ON responsible_parties FOR SELECT
  USING (auth.role() = 'authenticated');

-- Apenas mario e admin podem criar/editar/apagar
CREATE POLICY "rp_write_mario_admin"
  ON responsible_parties FOR ALL
  USING (get_user_role() IN ('mario', 'admin'))
  WITH CHECK (get_user_role() IN ('mario', 'admin'));

-- =============================================================================
-- work_models
-- =============================================================================

CREATE POLICY "wm_select_authenticated"
  ON work_models FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "wm_write_mario_admin"
  ON work_models FOR ALL
  USING (get_user_role() IN ('mario', 'admin'))
  WITH CHECK (get_user_role() IN ('mario', 'admin'));

-- =============================================================================
-- profiles
-- =============================================================================

-- Cada utilizador vê o seu próprio perfil
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Mario e admin vêem todos os perfis
CREATE POLICY "profiles_select_mario_admin"
  ON profiles FOR SELECT
  USING (get_user_role() IN ('mario', 'admin'));

-- Cada utilizador actualiza o seu próprio perfil
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Apenas admin pode alterar roles ou criar perfis manualmente
CREATE POLICY "profiles_write_admin"
  ON profiles FOR ALL
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- O sistema (service role) pode inserir via trigger handle_new_user
-- (o SECURITY DEFINER da função já garante isso)

-- =============================================================================
-- projects
-- =============================================================================

-- Mario/Admin: acesso total
CREATE POLICY "projects_all_mario_admin"
  ON projects FOR ALL
  USING (get_user_role() IN ('mario', 'admin'))
  WITH CHECK (get_user_role() IN ('mario', 'admin'));

-- Sofia: leitura de todos os projectos
CREATE POLICY "projects_select_sofia"
  ON projects FOR SELECT
  USING (get_user_role() = 'sofia');

-- Susana: leitura de todos os projectos
CREATE POLICY "projects_select_susana"
  ON projects FOR SELECT
  USING (get_user_role() = 'susana');

-- Susana: pode actualizar campos de procurement
-- (controlo de colunas é feito na camada da aplicação)
CREATE POLICY "projects_update_susana"
  ON projects FOR UPDATE
  USING (get_user_role() = 'susana')
  WITH CHECK (get_user_role() = 'susana');

-- Ana: leitura de todos os projectos
CREATE POLICY "projects_select_ana"
  ON projects FOR SELECT
  USING (get_user_role() = 'ana');

-- Supervisor: leitura dos projectos onde está atribuído
CREATE POLICY "projects_select_supervisor"
  ON projects FOR SELECT
  USING (
    get_user_role() = 'supervisor'
    AND assigned_supervisor_id = (
      SELECT responsible_party_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Supervisor: pode actualizar os seus projectos
CREATE POLICY "projects_update_supervisor"
  ON projects FOR UPDATE
  USING (
    get_user_role() = 'supervisor'
    AND assigned_supervisor_id = (
      SELECT responsible_party_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    get_user_role() = 'supervisor'
    AND assigned_supervisor_id = (
      SELECT responsible_party_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Gustavo: leitura de todos os projectos (precisa para associar issues)
CREATE POLICY "projects_select_gustavo"
  ON projects FOR SELECT
  USING (get_user_role() = 'gustavo');

-- Mario pode criar projectos (coberto por projects_all_mario_admin)
-- Sofia pode criar projectos também (apoio ao cliente)
CREATE POLICY "projects_insert_sofia"
  ON projects FOR INSERT
  WITH CHECK (get_user_role() = 'sofia');

-- =============================================================================
-- billing_milestones
-- =============================================================================

-- Mario/Admin: acesso total
CREATE POLICY "bm_all_mario_admin"
  ON billing_milestones FOR ALL
  USING (get_user_role() IN ('mario', 'admin'))
  WITH CHECK (get_user_role() IN ('mario', 'admin'));

-- Ana: acesso total aos marcos de faturação
CREATE POLICY "bm_all_ana"
  ON billing_milestones FOR ALL
  USING (get_user_role() = 'ana')
  WITH CHECK (get_user_role() = 'ana');

-- Supervisor: leitura dos marcos dos seus projectos
CREATE POLICY "bm_select_supervisor"
  ON billing_milestones FOR SELECT
  USING (
    get_user_role() = 'supervisor'
    AND project_id IN (
      SELECT id FROM projects
      WHERE assigned_supervisor_id = (
        SELECT responsible_party_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Supervisor: pode marcar marcos como prontos para validação
CREATE POLICY "bm_update_supervisor"
  ON billing_milestones FOR UPDATE
  USING (
    get_user_role() = 'supervisor'
    AND project_id IN (
      SELECT id FROM projects
      WHERE assigned_supervisor_id = (
        SELECT responsible_party_id FROM profiles WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    get_user_role() = 'supervisor'
    AND project_id IN (
      SELECT id FROM projects
      WHERE assigned_supervisor_id = (
        SELECT responsible_party_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Sofia/Susana/Gustavo: leitura apenas
CREATE POLICY "bm_select_others"
  ON billing_milestones FOR SELECT
  USING (get_user_role() IN ('sofia', 'susana', 'gustavo'));

-- =============================================================================
-- issues
-- =============================================================================

-- Mario/Admin: acesso total
CREATE POLICY "issues_all_mario_admin"
  ON issues FOR ALL
  USING (get_user_role() IN ('mario', 'admin'))
  WITH CHECK (get_user_role() IN ('mario', 'admin'));

-- Gustavo: acesso total a issues (pós-venda)
CREATE POLICY "issues_all_gustavo"
  ON issues FOR ALL
  USING (get_user_role() = 'gustavo')
  WITH CHECK (get_user_role() = 'gustavo');

-- Sofia: leitura + criar + actualizar issues
CREATE POLICY "issues_select_sofia"
  ON issues FOR SELECT
  USING (get_user_role() = 'sofia');

CREATE POLICY "issues_insert_sofia"
  ON issues FOR INSERT
  WITH CHECK (get_user_role() = 'sofia');

CREATE POLICY "issues_update_sofia"
  ON issues FOR UPDATE
  USING (get_user_role() = 'sofia')
  WITH CHECK (get_user_role() = 'sofia');

-- Supervisor: leitura dos issues dos seus projectos
CREATE POLICY "issues_select_supervisor"
  ON issues FOR SELECT
  USING (
    get_user_role() = 'supervisor'
    AND project_id IN (
      SELECT id FROM projects
      WHERE assigned_supervisor_id = (
        SELECT responsible_party_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Ana/Susana: leitura apenas
CREATE POLICY "issues_select_ana_susana"
  ON issues FOR SELECT
  USING (get_user_role() IN ('ana', 'susana'));

-- =============================================================================
-- apontamentos
-- =============================================================================

-- Mario/Admin: acesso total
CREATE POLICY "apon_all_mario_admin"
  ON apontamentos FOR ALL
  USING (get_user_role() IN ('mario', 'admin'))
  WITH CHECK (get_user_role() IN ('mario', 'admin'));

-- Supervisor: acesso total aos apontamentos dos seus projectos
CREATE POLICY "apon_all_supervisor"
  ON apontamentos FOR ALL
  USING (
    get_user_role() = 'supervisor'
    AND project_id IN (
      SELECT id FROM projects
      WHERE assigned_supervisor_id = (
        SELECT responsible_party_id FROM profiles WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    get_user_role() = 'supervisor'
    AND project_id IN (
      SELECT id FROM projects
      WHERE assigned_supervisor_id = (
        SELECT responsible_party_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Sofia: leitura de todos os apontamentos
CREATE POLICY "apon_select_sofia"
  ON apontamentos FOR SELECT
  USING (get_user_role() = 'sofia');

-- Gustavo: leitura de todos os apontamentos
CREATE POLICY "apon_select_gustavo"
  ON apontamentos FOR SELECT
  USING (get_user_role() = 'gustavo');

-- Ana/Susana: leitura apenas
CREATE POLICY "apon_select_ana_susana"
  ON apontamentos FOR SELECT
  USING (get_user_role() IN ('ana', 'susana'));

-- =============================================================================
-- GRANTS PARA O ANON E AUTHENTICATED ROLES
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON responsible_parties TO authenticated;
GRANT SELECT ON work_models         TO authenticated;
GRANT SELECT ON profiles            TO authenticated;
GRANT SELECT ON projects            TO authenticated;
GRANT SELECT ON billing_milestones  TO authenticated;
GRANT SELECT ON issues              TO authenticated;
GRANT SELECT ON apontamentos        TO authenticated;

GRANT SELECT ON projects_view           TO authenticated;
GRANT SELECT ON billing_milestones_view TO authenticated;
GRANT SELECT ON issues_view             TO authenticated;

GRANT INSERT, UPDATE, DELETE ON responsible_parties TO authenticated;
GRANT INSERT, UPDATE, DELETE ON work_models         TO authenticated;
GRANT INSERT, UPDATE          ON profiles           TO authenticated;
GRANT INSERT, UPDATE, DELETE  ON projects           TO authenticated;
GRANT INSERT, UPDATE, DELETE  ON billing_milestones TO authenticated;
GRANT INSERT, UPDATE, DELETE  ON issues             TO authenticated;
GRANT INSERT, UPDATE, DELETE  ON apontamentos       TO authenticated;
