-- =============================================================================
-- Mudelar Operations — Dados iniciais (seed)
-- Aplicar após as migrações: supabase db reset  ou  executar no SQL Editor
-- =============================================================================

-- ─── Modelos de obra ──────────────────────────────────────────────────────────

INSERT INTO work_models (nome_modelo, prazo_estimado_dias, categoria, notas) VALUES
  ('WC Simples',           10, 'WC',      'Remodelação básica de casa de banho'),
  ('WC Completo',          15, 'WC',      'Remodelação completa com substituição de todas as infraestruturas'),
  ('WC Premium',           20, 'WC',      'Remodelação premium com materiais de alta gama'),
  ('Cozinha Simples',      12, 'Cozinha', 'Substituição de móveis e bancada'),
  ('Cozinha Standard',     18, 'Cozinha', 'Remodelação standard com infraestruturas novas'),
  ('Cozinha Completa',     25, 'Cozinha', 'Remodelação completa incluindo elétrica e canalização'),
  ('Cozinha Premium',      30, 'Cozinha', 'Remodelação premium com ilha e electrodomésticos de gama alta')
ON CONFLICT DO NOTHING;

-- ─── Nota ─────────────────────────────────────────────────────────────────────
-- Os utilizadores (profiles) são criados automaticamente via trigger
-- handle_new_user() quando cada membro da equipa faz o primeiro login.
-- Os responsible_parties devem ser criados pelo mario/admin no painel.
