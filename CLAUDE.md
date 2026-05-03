@AGENTS.md

# Mudelar Operations — Briefing para Claude Code

## O que é este projeto
Sistema de gestão de obras de remodelação (cozinhas e WCs) da empresa Mudelar. Substitui o Airtable. Desenvolvido em fases validadas com o cliente (Renato Lima).

## Stack obrigatória
- **Frontend:** Next.js (App Router), TypeScript strict, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Email:** Resend
- **Hosting:** Vercel + Supabase

## Estado atual
- [x] Fase 1 — Setup, estrutura, Supabase clients, middleware RBAC (CONCLUÍDA)
- [x] Fase 2 — Schema da base de dados (CONCLUÍDA)
- [x] Fase 3 — Autenticação e perfis (CONCLUÍDA)
- [x] Fase 4 — Páginas por perfil (CONCLUÍDA)
- [ ] Fase 5 — 16 automações (PRÓXIMA)
- [ ] Fase 5 — 16 automações
- [ ] Fase 6 — Dashboard 15 KPIs
- [ ] Fase 7 — Funcionalidades avançadas
- [ ] Fase 8 — Deploy
- [ ] Fase 9 — Testes
- [ ] Fase 10 — Migração Airtable

## Equipa / roles
mario (gestor) | sofia (apoio cliente) | susana (compras) | ana (financeiro) | supervisor | gustavo (pos-venda) | admin

## Credenciais — estao no .env.local. NAO alterar.
