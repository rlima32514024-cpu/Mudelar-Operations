@AGENTS.md

# Mudelar Operations — Especificação Completa

## Stack
- Frontend: Next.js App Router, TypeScript strict, Tailwind CSS, shadcn/ui, Recharts
- Backend: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- Email: Resend
- Hosting: Vercel + Supabase

## Estado das fases
- [x] Fase 1 — Setup, estrutura, Supabase clients, middleware RBAC
- [x] Fase 2 — Schema da base de dados
- [x] Fase 3 — Autenticação e perfis
- [x] Fase 4 — Páginas por perfil (INCOMPLETO — ver secção de pendências)
- [x] Fase 5 — 16 automações
- [x] Fase 6 — Dashboard 15 KPIs
- [x] Fase 7 — Funcionalidades avançadas
- [x] Fase 8 — Deploy Vercel

## Credenciais — estão no .env.local

---

# PRINCÍPIOS DO SISTEMA

- Cada pessoa tem visibilidade apenas do que precisa para o seu papel
- Transições entre fases são automáticas (workflow auto-disparado)
- Comunicação por email automático em momentos críticos
- Histórico permanente — nada se apaga
- Sofia é o único ponto de contacto com o cliente
- Apontamentos = problemas DURANTE obra (status 1-5)
- Issues = reclamações APÓS conclusão (status 6-7)

---

# EQUIPA E ROLES

| Role | Nome | Email | Responsabilidade |
|------|------|-------|-----------------|
| mario | Mário Lima | mario.lima@bmlar.pt | Gestor operacional. Atribui supervisores e equipas. Marca arranque. |
| sofia | Sofia | apoio.cliente@mudelar.pt | Cria obras. Único ponto contacto cliente. Gere pós-venda. |
| susana | Susana | compras@bmlar.pt | Compras materiais. Gere extras com cliente. |
| ana | Ana | financeiro@bmlar.pt | Faturação clientes. Pagamentos equipas. |
| supervisor | (vários) | — | Retificação, execução, apontamentos |
| gustavo | Gustavo | — | Pós-venda interna (defeitos execução) |

---

# TABELA PROJECTS — TODOS OS CAMPOS

## Secção: Identificação e cliente
- contract_number — string única, formato MD-XXXX, gerado automaticamente
- client_name — string (obrigatório)
- client_phone — string
- client_email — string
- address — string longo

## Secção: Tipo de obra
- work_type — enum: Kitchen / Bathroom / Both
- work_model_id — FK para work_models

## Secção: Datas e valores
- contract_signature_date — data
- total_project_value — moeda (€)
- contract_document_url — anexo PDF (upload Supabase Storage)
- project_documents_urls — anexos múltiplos

## Secção: Atribuições e equipa
- initial_supervisor_id — FK responsible_parties (supervisor que faz retificação)
- assigned_supervisor_id — FK responsible_parties (supervisor de execução, pode ser diferente)
- equipa_obras_id — FK responsible_parties
- data_retificacao_marcada — data
- planned_start_date — data
- actual_start_date — data (preenchido pelo supervisor no arranque)
- estimated_completion_date — calculado: actual_start_date + prazo_estimado_dias em dias úteis
- actual_completion_date — data (preenchido pelo supervisor na conclusão)

## Secção: Retificação e medições
- measurements_verified — boolean
- measurements_verified_date — data
- measurements_verified_by_id — FK responsible_parties
- initial_measurements_photos_urls — anexos múltiplos (fotos do levantamento)
- layout_retificado_url — anexo (planta atualizada)
- measurements_notes — texto longo
- procurement_list_url — anexo (mapa de necessidades) — TRIGGER CRÍTICO do workflow G.3
- procurement_status — enum: Submitted / In procurement / Received
- procurement_list_uploaded_date — data

## Secção: Execução por fase
- current_phase — enum: not_started / 1_preparacao_demolicoes / 2_infraestruturas / 3_revestimentos / 4_montagem_final / completed
- photos_phase_1_urls — anexos múltiplos
- photos_phase_2_urls — anexos múltiplos
- photos_phase_3_urls — anexos múltiplos
- photos_phase_4_urls — anexos múltiplos
- notes_phase_1 — texto longo
- notes_phase_2 — texto longo
- notes_phase_3 — texto longo
- notes_phase_4 — texto longo
- auto_entrega_url — anexo (documento de entrega formal)

## Secção: Extras à equipa
- has_extras — boolean
- extras_descricao — texto longo
- fatura_equipa_enviada_ana — boolean
- fatura_equipa_paga — boolean

## Secção: Extras ao cliente
- orcamento_extra_descricao — texto longo
- orcamento_extra_valor — moeda
- orcamento_extra_estado — enum: Pendente orçamento / Em negociação / Aprovado pelo cliente / Recusado

## Secção: Estado e risco
- general_status — enum: 1_aguarda_atribuicao / 2_aguarda_retificacao / 3_aguarda_compras / 4_aguarda_arranque / 5_em_execucao / 6_concluida / 7_fechada / cancelada
- days_since_signature — calculado: TODAY() - contract_signature_date
- start_risk_level — calculado: Green(<30) / Yellow(30-44) / Orange(45-59) / Red(60-89) / Critical(>=90) / Started

## Secção: Financeiro (calculados)
- total_billed — soma billing_milestones faturados/pagos
- total_paid — soma billing_milestones pagos
- outstanding_invoiced — total_billed - total_paid
- active_issues_count — count issues ativas
- has_affected_payment_issues — boolean: existe issue com afeta_pagamento=true
- ready_to_close — calculado: status=6 AND total_billed=total_paid AND active_issues=0

---

# TABELA BILLING MILESTONES — CAMPOS COMPLETOS

- milestone_id — string: [contract_number]-[billing_stage] ex: MD-1234-Start
- project_id — FK projects
- billing_stage — enum: Start / Final / Extras (Adjudicação NÃO é milestone — paga antes do sistema)
- percentage — número (default 25 para Start e Final)
- amount — calculado: se Extras usa orcamento_extra_valor da obra; senão total_project_value × percentage / 100
- status — enum: not_ready / ready_for_validation / validated / invoiced / paid / debt
- supervisor_marked_ready — boolean
- supervisor_marked_ready_date — data
- manager_validated — boolean
- manager_validated_date — data
- invoice_number — string
- invoice_issued_date — data
- payment_due_date — data
- payment_received_date — data
- days_overdue_payment — calculado
- notes — texto

---

# TABELA ISSUES — CAMPOS COMPLETOS
APENAS para obras com status >= 6 (Concluída ou Fechada)

- issue_title — string
- project_id — FK projects
- reported_date — data (default hoje)
- priority — enum: Low / Normal / High / Urgent
- sla_deadline — data (manual)
- status — enum: open / in_progress / resolved / cancelled
- assigned_to_id — FK responsible_parties
- description — texto longo
- photos_urls — anexos múltiplos (fotos do problema)
- resolution_notes — texto longo
- resolution_date — data
- tipo_reclamacao — enum: defeito_execucao / acabamento / mobiliario / gas / eletrodomesticos / falta_de_algo / outro
- coberto_garantia — enum: sim / nao / a_avaliar
- departamento_responsavel — enum: operacao / compras / comercial / cliente_trata_diretamente
- data_intervencao_prevista — data
- data_resolucao_real — data
- fotos_resolucao_urls — anexos múltiplos
- cliente_confirmou_resolucao — boolean
- afeta_pagamento — boolean (Sofia marca quando cliente recusa pagar por causa da reclamação)
- days_open — calculado
- sla_breach — calculado: days_open > sla_deadline
- active_flag — calculado: status not in (resolved, cancelled)

---

# TABELA APONTAMENTOS — CAMPOS COMPLETOS
Problemas DURANTE obra (status 1-5). SEM ciclo de vida (sem Status, Resolução, SLA).

- apontamento_title — string
- project_id — FK projects
- data_apontamento — data (default hoje)
- tipo_problema — enum: atraso_obra / ma_execucao / mobiliario / acabamentos / comunicacao / limpeza_cuidado / falta_de_algo / material_defeituoso / outro
- reportado_por — enum: cliente / supervisor / outro
- descricao — texto longo
- criado_por_id — FK profiles (auto)

---

# TABELA WORK_MODELS — SEED CORRETO

| Nome | Prazo (dias úteis) | Categoria |
|------|-------------------|-----------|
| WC Modelo 0 | 2 | WC |
| WC Modelo 1 | 2 | WC |
| WC Modelo 2 | 3 | WC |
| WC Modelo 3 | 4 | WC |
| Remodelação completa de WC | 10 | WC |
| Remodelação parcial de cozinha | 10 | Cozinha |
| Remodelação de cozinha completa | 60 | Cozinha |

---

# INTERFACES POR PERFIL — DETALHE COMPLETO

## 6.1 MÁRIO (role: mario / admin)
Tem 3 páginas:

### Página 1: Dashboard KPIs (ver secção KPIs)

### Página 2: Gestor View — todas as obras
Campos visíveis por obra (colunas da tabela):
- Contract number
- Client name
- Work type
- General status (com badge de cor)
- Start risk level (semáforo: Green/Yellow/Orange/Red/Critical)
- Initial supervisor
- Assigned supervisor
- Equipa de obras
- Data retificação marcada
- Planned start date
- Estimated completion date
- Actual completion date
- Total project value
- Total billed / Total paid
- Active issues count
- Ready to close

Ações disponíveis por obra:
- Atribuir supervisor inicial + data retificação (dispara G.2)
- Atribuir supervisor execução + equipa + planned start date (dispara G.5)
- Ver/editar todos os campos
- Criar apontamento

Filtros rápidos: Por status / Por supervisor / Por risco

### Página 3: Apontamentos durante execução
- Tabela de todos os apontamentos
- Agrupado por supervisor por default
- Colunas: Data, Obra, Cliente, Supervisor, Tipo, Descrição, Reportado por
- Botão criar novo apontamento

---

## 6.2 SOFIA (role: sofia)
Tem 2 páginas:

### Página 1: Nova Obra — formulário completo
Campos do formulário (TODOS obrigatórios ou opcionais como indicado):
- Client name (obrigatório)
- Client phone
- Client email
- Address (obrigatório)
- Work type — enum Kitchen/Bathroom/Both (obrigatório)
- Work model — select dos modelos existentes
- Contract signature date
- Total project value
- Contract document — upload PDF
- Project documents — upload múltiplo
- Notas iniciais

Ao submeter: cria obra com status 1_aguarda_atribuicao + dispara G.1 (cria milestones + email Mário)

### Página 2: Pós-venda — Sofia
- Todas as Issues de todas as obras
- Agrupadas por obra
- Colunas: Obra, Cliente, Título, Tipo, Prioridade, Status, Assigned to, SLA, Afeta pagamento
- Pode criar nova Issue
- Pode atribuir Issue a responsável (dispara G.13)
- Pode marcar afeta_pagamento

---

## 6.3 SUSANA (role: susana)
Tem 2 páginas:

### Página 1: Compras e extras
Secção A — Obras em fase 3 (Aguarda compras):
- Lista de obras com status 3_aguarda_compras
- Colunas: Obra, Cliente, Supervisor, Procurement list (download), Procurement status
- Pode atualizar Procurement status para In procurement / Received (Received dispara G.4)

Secção B — Extras com cliente:
- Obras com orcamento_extra_descricao preenchido
- Colunas: Obra, Cliente, Descrição extra, Valor acordado, Estado orçamento
- Pode atualizar orcamento_extra_estado e orcamento_extra_valor

Secção C — Fatura equipa:
- Obras com has_extras = true
- Colunas: Obra, Has extras, Descrição extras, Fatura enviada à Ana, Fatura paga
- Pode marcar fatura_equipa_enviada_ana (dispara G.11)

### Página 2: Pós-venda — Susana
- Issues atribuídas a ela (assigned_to = Susana)
- Pode atualizar status e resolution_notes

---

## 6.4 ANA (role: ana)
Tem 3 páginas:

### Página 1: Faturação a clientes
- Billing Milestones com status: ready_for_validation / validated / invoiced
- Colunas: Obra, Cliente, Stage, Amount, Status, Invoice number, Invoice date, Payment due, Days overdue
- Pode preencher invoice_number, invoice_issued_date, payment_due_date
- Pode marcar payment_received_date (muda status para Paid)
- Pode marcar manager_validated (muda status para Validated)

### Página 2: Pagamentos a equipas
- Obras com fatura_equipa_enviada_ana = true
- Colunas: Obra, Cliente, Supervisor, Equipa, Extras descrição, Fatura enviada, Fatura paga
- Pode marcar fatura_equipa_paga

### Página 3: Bloqueios pós-venda
- Billing Milestones com status invoiced/debt E a obra tem has_affected_payment_issues = true
- Alerta: "Esta fatura pode estar bloqueada por reclamação em aberto"
- Link para ver a Issue relacionada

---

## 6.5 SUPERVISOR (role: supervisor)
Mobile-first — usado no telemóvel no terreno.

### Página única: Obras do Supervisor
Mostra apenas obras onde current user = initial_supervisor OU assigned_supervisor

Para cada obra, o supervisor pode:

**Fase retificação (status 2):**
- Ver data de retificação marcada
- Upload initial_measurements_photos (fotos do levantamento)
- Upload layout_retificado
- Preencher measurements_notes
- Marcar measurements_verified
- Upload procurement_list (mapa de necessidades) — dispara G.3

**Fase execução (status 5):**
- Ver estimated_completion_date (saber quando deve acabar)
- Preencher actual_start_date (dispara G.6)
- Atualizar current_phase
- Upload fotos por fase (photos_phase_1 a 4)
- Preencher notas por fase
- Preencher actual_completion_date (dispara G.7)
- Upload auto_entrega
- Criar Apontamento (dispara G.16)

**Para marcar milestone Start:**
- Marcar supervisor_marked_ready no milestone Start

---

## 6.6 GUSTAVO (role: gustavo)
### Página única: Pós-venda Gustavo
- Issues atribuídas a ele (assigned_to = Gustavo)
- Colunas: Obra, Cliente, Título, Tipo, Prioridade, Status, Data intervenção prevista, SLA
- Pode atualizar status, resolution_notes, data_resolucao_real, fotos_resolucao
- Pode marcar cliente_confirmou_resolucao

---

# 16 AUTOMAÇÕES

## G.1 — Sofia cria obra
Trigger: INSERT em projects
Actions:
- Criar 2 Billing Milestones: Start (25%) e Final (25%) com status = not_ready
- Email a Mário com link à obra

## G.2 — Mário atribui supervisor inicial
Watch: initial_supervisor_id + data_retificacao_marcada
Condition: ambos preenchidos
Actions:
- general_status → 2_aguarda_retificacao
- Email ao supervisor com data marcada e info da obra

## G.3 — Supervisor entrega mapa de necessidades
Watch: procurement_list_url
Condition: não vazio
Actions:
- general_status → 3_aguarda_compras
- assigned_supervisor_id → null (será re-atribuído)
- procurement_status → submitted
- Email a Susana com link à obra

## G.4 — Susana marca material recebido
Watch: procurement_status
Condition: = received
Actions:
- general_status → 4_aguarda_arranque
- Email a Mário para marcar arranque

## G.5 — Mário marca arranque
Watch: assigned_supervisor_id + equipa_obras_id + planned_start_date
Condition: os 3 preenchidos
Actions:
- general_status → 5_em_execucao
- Email ao supervisor com nome da equipa e data prevista

## G.6 — Obra arranca → faturação Start
Watch: actual_start_date
Condition: preenchido
Actions:
- Milestone Start → ready_for_validation
- Email a Ana para emitir fatura de início

## G.7 — Obra concluída → faturação Final
Watch: actual_completion_date
Condition: preenchido
Actions:
- general_status → 6_concluida
- Milestones Final + Extras → ready_for_validation
- Email a Ana para emitir fatura final

## G.8 — Orçamento extra para cliente
Watch: orcamento_extra_descricao
Condition: preenchido
Actions:
- Email a Susana para orçamentar com cliente

## G.9 — Orçamento extra aprovado
Watch: orcamento_extra_estado
Condition: = aprovado_pelo_cliente
Actions:
- Criar milestone Extras se não existe
- Email ao supervisor para executar trabalho extra
- Email a Ana a avisar

## G.10 — Has extras à equipa
Watch: has_extras
Condition: = true
Actions:
- Email a Susana a avisar que vai receber fatura de equipa

## G.11 — Susana encaminha fatura à Ana
Watch: fatura_equipa_enviada_ana
Condition: = true
Actions:
- Email a Ana para pagar à equipa

## G.12 — Pós-venda resolvida + afeta pagamento
Watch: issues.status
Conditions: = resolved AND afeta_pagamento = true
Actions:
- Email a Ana para retomar cobrança

## G.13 — Sofia atribui Issue
Watch: issues.assigned_to_id
Condition: preenchido
Actions:
- Email à pessoa atribuída com info da reclamação e contactos cliente
- Mário em CC

## G.14 — Issue resolvida → confirmar com cliente
Watch: issues.status
Condition: = resolved
Actions:
- Email a Sofia para contactar cliente e confirmar resolução (inclui client_email e client_phone)
- Mário em CC

## G.15 — Obra pronta a fechar
Watch: ready_to_close
Condition: = true
Actions:
- general_status → 7_fechada
- Email a Mário (informativo)

## G.16 — Apontamento criado → notificar parte oposta
Trigger: INSERT em apontamentos
Logic:
- Se criado por Mário → email ao assigned_supervisor da obra
- Se criado por supervisor → email a Mário
- Email contém info completa e link à obra

---

# 15 KPIs DASHBOARD MÁRIO

## Secção 1: Operacional do dia
1. Total Active Projects — obras status 1-6
2. Aguarda atribuição — status 1
3. Aguarda arranque — status 4
4. Em execução — status 5
5. Concluídas a fechar — status 6

## Secção 2: Riscos e atrasos
6. Obras em risco de atraso — estimated_completion_date < hoje, sem actual_completion_date
7. % obras atrasadas mês corrente
8. Atraso médio em dias mês corrente
9. Distribuição atrasos por modelo — gráfico barras Recharts

## Secção 3: Performance equipa e supervisor
10. Atrasos por equipa de obras — gráfico barras
11. Atrasos por supervisor — gráfico barras
12. Apontamentos por supervisor mês corrente — gráfico barras

## Secção 4: Pós-venda e tendências
13. Reclamações ativas — issues status != resolved/cancelled
14. Apontamentos durante obra mês corrente
15. Tempo médio real vs estimado por modelo — gráfico comparativo Recharts

---

# SISTEMA DE PRAZOS

## Estimated completion date
Calculado quando actual_start_date é preenchido:
estimated_completion_date = actual_start_date + prazo_estimado_dias (dias ÚTEIS, sem fins de semana)

## Atraso real
Quando actual_completion_date preenchido:
atraso_real = actual_completion_date - estimated_completion_date
Positivo = atrasado, Negativo = adiantado, 0 = no prazo

## Em risco de atraso
actual_start_date preenchido AND actual_completion_date vazio AND estimated_completion_date < TODAY()

---

# O QUE ESTÁ INCOMPLETO E PRECISA DE SER FEITO

## Formulários incompletos:
1. **Nova Obra (Sofia)** — faltam campos: upload contrato, upload project_documents, todos os campos listados na secção 6.2
2. **Gestor View (Mário)** — falta: atribuir supervisor inline, atribuir equipa inline, filtros por status/supervisor/risco
3. **Obras do Supervisor** — falta: upload de fotos por fase, upload procurement_list, upload layout_retificado, marcar actual_start_date, marcar actual_completion_date, upload auto_entrega
4. **Pós-venda Sofia** — falta: criar Issue com todos os campos, marcar afeta_pagamento
5. **Faturação Ana** — falta: preencher invoice_number, invoice_issued_date, payment_due_date, marcar received
6. **Compras Susana** — falta: download procurement_list, atualizar procurement_status

## Upload de ficheiros:
- Todos os uploads devem usar Supabase Storage
- Bucket: mudelar-operations
- Pastas: contracts/, documents/, measurements/, layouts/, procurement/, phases/, delivery/

## Campos calculados a verificar:
- estimated_completion_date (dias úteis sem fins de semana)
- start_risk_level (5 níveis)
- ready_to_close (3 condições)
- days_overdue_payment
- active_issues_count

## Work models — verificar seed:
Os 7 modelos devem estar com os prazos corretos (ver tabela acima).
