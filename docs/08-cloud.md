# 08 — Cloud SaaS (Painel)

> Status: Fase 6A ✅ (foundation). 6B–6F nas próximas sessões.

App Next.js 15 hospedado na Vercel. Painel multi-tenant para gerentes/donos de loja
gerenciarem cardápio, mesas, hubs locais, pedidos e config.

## 1. Stack

| Camada    | Escolha                                          | Versão |
| --------- | ------------------------------------------------ | ------ |
| Framework | Next.js (App Router)                             | 15.1+  |
| UI        | React                                            | 19     |
| Estilo    | Tailwind v4 (CSS-first config via `@theme`)      | 4.0+   |
| DB        | Neon Postgres (serverless http driver)           | —      |
| ORM       | Drizzle                                          | 0.36+  |
| Auth      | NextAuth v5 + Drizzle adapter (email magic-link) | beta   |
| Deploy    | Vercel                                           | —      |

Bundle First Load JS:

| Rota                      | Size    |
| ------------------------- | ------- |
| `/`                       | 106 KB  |
| `/admin`                  | 102 KB  |
| `/api/auth/[...nextauth]` | dynamic |
| Middleware                | 34 KB   |

## 2. Decisões de design

| Aspecto                        | Decisão                            | Justificativa                                                                                                                                        |
| ------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tailwind v4 vs CSS modules** | Tailwind v4                        | Painel é denso em formulários/tabelas/dashboards — produtividade > fidelidade pixel-perfect. Totem/KDS/Garçom seguem CSS modules pelo handoff hi-fi. |
| **Multi-tenant routing**       | path `/t/[slug]/...` (ainda na 6B) | Sem custo de DNS/wildcard cert. Trivial em dev.                                                                                                      |
| **Auth**                       | NextAuth v5 email magic-link       | Sem password reset, OWASP-safer, UX simples. Sessão `database` (não JWT) pra invalidar logout server-side.                                           |
| **DB driver**                  | `@neondatabase/serverless` (http)  | Funciona em Edge runtime (futuro), zero connection pool config. `neon-http` driver é http-lazy.                                                      |
| **Build sem DB**               | URL placeholder                    | Vercel preview pode buildar sem DATABASE_URL set ainda. Queries reais falham só em runtime.                                                          |

## 3. Schema (Postgres)

```
tenants          (loja)
  ├─ id (uuid, pk)
  ├─ slug (unique) → URL /t/[slug]
  ├─ nome, vertical, brand, area, since_label
  ├─ hero_image_url, wifi_ssid, wifi_pass     (substitui env vars do totem)
  └─ created_at, updated_at

owners           (autenticados via NextAuth)
  ├─ id, email (unique), name, image
  └─ email_verified, created_at

tenant_owners    (m2m owner ↔ tenant + role)
  └─ pk (tenant_id, owner_id), role default 'owner'

hubs             (instâncias do hub local registradas)
  ├─ id, tenant_id, nome, api_key (unique)
  └─ paired_at, last_seen_at, version

hub_pairings     (códigos one-shot p/ parear hub novo)
  ├─ id, tenant_id, code, expires_at
  ├─ consumed_at, consumed_by_hub_id
  └─ created_by_owner_id

# NextAuth tables (drizzle adapter — props snake_case obrigatório)
accounts, sessions, verification_tokens
```

> ⚠ As props camelCase em Drizzle Postgres normalmente mapeiam pra snake_case na DB.
> **Exceção:** as auth-tables exigem JS prop names em snake_case (`refresh_token`,
> `access_token`, etc) porque o `DrizzleAdapter` lê os campos por nome literal.

## 4. Estrutura

```
apps/cloud/
├── drizzle.config.ts          # config drizzle-kit
├── postcss.config.mjs         # tailwind v4 plugin
├── next.config.ts
├── package.json
├── public/
└── src/
    ├── middleware.ts          # gate /admin /t (stub na 6A)
    ├── app/
    │   ├── globals.css        # @import 'tailwindcss' + @theme tokens
    │   ├── layout.tsx         # fonts, body
    │   ├── page.tsx           # landing pública (CTA → /admin)
    │   ├── admin/
    │   │   ├── layout.tsx     # Sidebar + AdminHeader + main
    │   │   └── page.tsx       # cards placeholder das próximas fases
    │   └── api/auth/[...nextauth]/route.ts
    ├── components/
    │   ├── Sidebar.tsx
    │   └── AdminHeader.tsx
    ├── db/
    │   ├── schema.ts          # tabelas Drizzle Postgres
    │   ├── index.ts           # neon http + drizzle (lazy DB)
    │   ├── migrate.ts         # runner CLI
    │   └── migrations/        # geradas via drizzle-kit
    └── lib/
        ├── auth.ts            # NextAuth v5 config (providers vazios na 6A)
        └── auth-route.ts      # re-export {GET, POST} pro app router
```

## 5. Setup local

```bash
# 1. Criar projeto Neon (https://neon.tech) e copiar a connection string
# 2. Configurar .env.local em apps/cloud/
cp apps/cloud/.env.example apps/cloud/.env.local
# Editar: DATABASE_URL, AUTH_SECRET (openssl rand -base64 32)

# 3. Gerar e aplicar migrations
cd apps/cloud
pnpm db:generate    # gera SQL em src/db/migrations/
pnpm db:migrate     # aplica no DB Neon

# 4. Rodar dev
pnpm dev            # :3000
```

Em prod (Vercel):

- Setar env vars `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `EMAIL_*`
- Build automático no `git push`

## 6. Commands

| Cmd                | O que faz                                                |
| ------------------ | -------------------------------------------------------- |
| `pnpm dev`         | Next dev em :3000                                        |
| `pnpm build`       | Build de prod (passa sem DATABASE_URL — usa placeholder) |
| `pnpm typecheck`   | tsc --noEmit                                             |
| `pnpm db:generate` | gera SQL migrations a partir do schema                   |
| `pnpm db:migrate`  | aplica migrations pendentes no Neon                      |
| `pnpm db:studio`   | UI Drizzle Studio (visualizador)                         |

## 7. Próximas sub-fases

| Fase   | Escopo                                                                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **6B** | NextAuth Email provider real, login funcional, tenant context server-side                                                                                     |
| **6C** | CRUD cardápio (categorias / produtos / variantes / modificadores / fotos) — source-of-truth do menu                                                           |
| **6D** | Pareamento hub ↔ cloud: cloud gera token, hub `/admin/pair-with-cloud` registra-se, recebe `cloudApiKey` + `tenantId`. Cloud puxa cardápio. Hub envia outbox. |
| **6E** | Histórico/analytics: timeline de pedidos, ticket médio, prato campeão, hora de pico                                                                           |
| **6F** | Tenant config UI — substitui as env vars do totem (`TENANT_BRAND`, `TENANT_AREA`, `TENANT_SINCE`, `TENANT_HERO_IMG`, `WIFI_*`)                                |

## 8. Validação 6A

- ✅ Typecheck (`pnpm typecheck`)
- ✅ Build (`pnpm build`) — passa mesmo sem `DATABASE_URL`
- ⏳ Migrations aplicadas — depende do user configurar `.env.local` com Neon
- ⏳ Login real — Fase 6B
