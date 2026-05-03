# Mudelar Operations

Sistema de gestão de obras de remodelação da Mudelar (cozinhas e WCs). Substitui o Airtable.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Email | Resend |
| Hosting | Vercel (frontend) + Supabase (backend) |
| Gráficos | Recharts |

## Perfis de utilizador

| Perfil | Papel |
|--------|-------|
| Mario | Gestor operacional — atribui supervisores, marca arranque, KPIs |
| Sofia | Apoio ao cliente — cria obras, gere pós-venda |
| Susana | Compras — materiais, extras com cliente |
| Ana | Financeiro — faturação a clientes, pagamentos a equipas |
| Supervisor | Retificação, execução de obras, apontamentos |
| Gustavo | Pós-venda interna — defeitos de execução |

## Setup local

### Pré-requisitos
- Node.js 18+
- Conta Supabase com projeto criado
- Conta Resend

### Instalação

```bash
git clone https://github.com/[org]/mudelar-operations.git
cd mudelar-operations
npm install
cp .env.example .env.local
# Preencher .env.local com credenciais reais
npm run dev
```

### Variáveis de ambiente

Ver `.env.example` para lista completa. Preencher `.env.local` com valores reais.

**Nunca commitar `.env.local` ou qualquer ficheiro com credenciais.**

## Estrutura

```
src/
├── app/
│   ├── (auth)/login/          # Login
│   ├── (dashboard)/           # Dashboards por perfil
│   │   ├── mario/
│   │   ├── sofia/
│   │   ├── susana/
│   │   ├── ana/
│   │   ├── supervisor/
│   │   └── gustavo/
│   └── api/automations/       # API routes para automações
├── components/
│   ├── ui/                    # shadcn/ui components
│   └── shared/                # Componentes reutilizáveis
├── lib/
│   ├── supabase/              # Clientes Supabase (browser, server, admin)
│   ├── validations/           # Schemas Zod
│   └── utils/                 # Utilitários
├── services/                  # Lógica de negócio
├── types/                     # TypeScript types globais
└── middleware.ts               # Auth + proteção de rotas por role
```

## Fases de desenvolvimento

- [x] **Fase 1** — Setup, estrutura, Supabase client, middleware
- [ ] **Fase 2** — Schema da base de dados (PostgreSQL + RLS + triggers)
- [ ] **Fase 3** — Autenticação e gestão de perfis
- [ ] **Fase 4** — Páginas por perfil
- [ ] **Fase 5** — 16 automações (Edge Functions + Resend)
- [ ] **Fase 6** — Dashboard KPIs do Mário (15 KPIs + gráficos)
- [ ] **Fase 7** — Funcionalidades avançadas (PDF, Gantt, pesquisa)
- [ ] **Fase 8** — Deploy Vercel + CI/CD
- [ ] **Fase 9** — Testes unitários e E2E
- [ ] **Fase 10** — Documentação e migração Airtable

## Princípios de qualidade

- TypeScript strict em todo o código
- Server Components por defeito; Client Components só onde necessário
- Validação com Zod em todos os inputs
- RLS (Row Level Security) no Supabase para cada perfil
- Mobile-first (especialmente para supervisores)
- WCAG AA acessibilidade básica
- Páginas a abrir em <2s
