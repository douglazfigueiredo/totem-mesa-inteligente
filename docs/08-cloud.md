# 08 — Cloud SaaS (Painel)

> Status: 6A ✅ · 6B ✅ · 6C ✅ (cardápio completo). 6D–6F nas próximas sessões.

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

## 7. Fase 6B — Auth real

Magic-link por e-mail (NextAuth/Auth.js v5 + Nodemailer + Drizzle adapter).

### Fluxo

1. usuário entra em `/login`, digita e-mail
2. server action chama `signIn('nodemailer', { email, redirectTo: '/login/check-email' })`
3. Auth.js gera token, grava em `verification_tokens`, dispara e-mail via SMTP (Mailtrap em dev)
4. usuário clica no link → Auth.js valida, cria/recupera `owner` e abre `session`
5. middleware (`/admin/:path*`) checa cookie `authjs.session-token`; sem cookie → `/login?callbackUrl=…`
6. layout `/admin` chama `requireOwner()` que junta owner + tenants. Se sem tenant linkado, mostra "conta sem acesso"

### Arquivos novos / atualizados

| Arquivo                            | Papel                                                |
| ---------------------------------- | ---------------------------------------------------- |
| `src/lib/auth.ts`                  | NextAuth com Nodemailer provider                     |
| `src/lib/email/magic-link.ts`      | template HTML/texto + envio via SMTP                 |
| `src/lib/tenant.ts`                | `getCurrentOwner()` / `requireOwner()` server-side   |
| `src/app/login/page.tsx`           | tela de login (server action)                        |
| `src/app/login/check-email/page.tsx` | confirmação "link enviado"                         |
| `src/middleware.ts`                | gate por cookie de sessão                            |
| `src/components/AdminHeader.tsx`   | mostra e-mail do owner + botão sair                  |
| `src/app/admin/layout.tsx`         | usa `requireOwner` + estado "sem loja vinculada"     |
| `src/db/seed.ts`                   | cria tenant `dev` + linka `EMAIL_DEV_OWNER`          |

### Setup inicial (dev)

```bash
# 1) configurar .env.local (DATABASE_URL Neon, AUTH_SECRET, EMAIL_SERVER_*)
cp apps/cloud/.env.example apps/cloud/.env.local

# 2) aplicar schema no Neon
pnpm --filter @app/cloud db:migrate

# 3) seed: cria tenant 'dev' + linka douglasarts@gmail.com (ou EMAIL_DEV_OWNER)
pnpm --filter @app/cloud db:seed

# 4) subir
pnpm --filter @app/cloud dev
```

### Notas técnicas

- **Session strategy**: `database` (não JWT) — cada login persiste em `sessions`. Logout via `signOut()` apaga a row.
- **Middleware Edge-friendly**: não valida sessão no banco (Drizzle não roda em Edge), só checa presença do cookie. Validação real acontece no `requireOwner()` do layout. Worst case: cookie zumbi ⇒ extra round-trip pra `/login`.
- **Tenant ativo**: cookie `active_tenant_slug`. Se não setado, usa o primeiro tenant do owner. Switching de tenants chega quando owner com >1 loja for caso real.
- **DrizzleAdapter exige snake_case**: as colunas em `accounts` (refresh_token, access_token, expires_at, etc) são as **JS prop names**, não só nomes de coluna SQL. Isso já está aplicado no `schema.ts`.

## 8. Fase 6C — Cardápio (em andamento)

Cloud é o **source of truth relacional** do cardápio. Hub apenas armazena snapshot JSON
puxado por `/api/catalog/snapshot` (chega na 6C.4). Tipos canônicos em `@app/schemas`
(`Category`, `Product`, `ProductVariant`, `ModifierGroup`, `Modifier`, `CatalogSnapshot`).

### 6C.1 ✅ — Categorias

Tabela `categories(id, tenant_id, nome, ordem, is_active, created_at, updated_at)` com index
composto `(tenant_id, ordem)`. UI em `/admin/cardapio` com:

- formulário inline pra criar (auto-incrementa `ordem`)
- lista ordenada com renomear inline, ativar/desativar, mover ↑/↓, excluir
- escopo automático por `activeTenant` via `requireOwner()`

Server actions em `src/app/admin/cardapio/actions.ts`, validação Zod (nome 1–80 chars,
id uuid). Reorder usa swap de `ordem` em duas updates sequenciais (neon-http não suporta
transactions; sem unique constraint em `ordem` o swap é seguro).

### 6C.2 ✅ — Produtos

Tabela `products(id, tenant_id, category_id, nome, descricao?, image_url?,
base_price_cents, destino, tempo_estimado_sec, is_available, is_vegetarian,
is_gluten_free, ordem, ...)` com index `(category_id, ordem)`.

UI em `/admin/cardapio/[categoryId]`:

- breadcrumb pra voltar pro cardápio
- formulário inline pra criar (nome + preço em R$)
- lista com row colapsado (foto, nome, preço, destino, tempo) + `<details>` pra editar
- editor expandido: nome, preço, descrição, URL da foto, destino (cozinha/garçom),
  tempo estimado, flags vegetariano/sem glúten
- pausar (toggle isAvailable), reorder ↑/↓, excluir
- contador de produtos por categoria na lista de categorias (subquery)

Foto via **URL externa** (campo `image_url` validado). Upload via Vercel Blob fica
pra fase posterior (provavelmente 6C.5 ou config da loja).

Server actions em `[categoryId]/actions.ts` validam tudo com Zod e parse de preço
em reais → cents (aceita vírgula ou ponto).

### 6C.3 ✅ — Variants + Modifier groups + Modifiers

3 tabelas relacionais (migration `0003`):

- `product_variants(id, product_id, nome, price_cents, is_default, is_available, ordem)`
- `modifier_groups(id, product_id, nome, selection_type 'single'|'multi', required, min_select, max_select?, ordem)`
- `modifiers(id, group_id, nome, price_delta_cents ≥0, is_available, ordem)`

Tudo aninhado dentro do `<details>` do produto. Carregamento eficiente: 3 queries em paralelo
(`Promise.all`) + agrupamento em JS por `productId`/`groupId`. Server actions em arquivos
separados:

- `actions.ts` (produto)
- `variant-actions.ts` (variants)
- `modifier-actions.ts` (groups + modifiers)

**Decisões aplicadas:**
- `priceDeltaCents` em modifier sempre **≥ 0** (sem desconto via modifier — produto é responsável pelo preço)
- `basePriceCents` continua editável quando há variants — vira label "preço base (fallback)"
- `isDefault` por variant: server action limpa `isDefault` das outras antes de marcar a nova (sem unique constraint)

UI por nível:
- Linha do produto exibe sumário: `R$ X · destino · Nmin · K var · M grp`
- 3 `<details>` siblings: editar detalhes, variantes, modificadores
- Cada modifier group é um sub-card com sua própria config colapsável + lista de modifiers

### 6C.4 ✅ — Endpoint `GET /api/catalog/snapshot`

Endpoint público autenticado por `Authorization: Bearer <apiKey>` que devolve o `CatalogSnapshot`
no formato canônico do `@app/schemas` (mesmo shape consumido pelo hub local).

**Auth**: lookup direto em `hubs.api_key`. Retorna 401 se não casar.

**Side effect**: atualiza `hubs.last_seen_at` em paralelo (fire-and-forget — não bloqueia a resposta).

**Carregamento** (5 queries):
1. Categorias do tenant
2. Produtos do tenant (em paralelo com 1)
3. Variants `WHERE product_id IN (productIds)` (em paralelo com 4)
4. Modifier groups `WHERE product_id IN (productIds)`
5. Modifiers `WHERE group_id IN (groupIds)` (sequencial — depende de 4)

**Validação**: passa o objeto montado por `CatalogSnapshot.safeParse()` antes de devolver.
Se o shape do cloud divergir do `@app/schemas`, retorna 500 com `issues` ao invés de
mandar lixo pro hub.

**Headers**: `Cache-Control: no-store` + `X-Catalog-Version: <epoch>` (versão = `Date.now()`
no momento da geração — invalidação proper chega quando o hub passar a cachear).

**Testar localmente**:

```bash
# 1) gerar uma apiKey de dev
echo "DEV_HUB_API_KEY=\"$(openssl rand -hex 32)\"" >> apps/cloud/.env.local

# 2) seed cria/atualiza o hub
pnpm --filter @app/cloud db:seed

# 3) curl com a chave
curl -H "Authorization: Bearer <DEV_HUB_API_KEY>" \
  http://localhost:3000/api/catalog/snapshot | jq

## 9. Próximas fases gerais

| Fase   | Escopo                                                                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **6D** | Pareamento hub ↔ cloud: cloud gera token, hub `/admin/pair-with-cloud` registra-se, recebe `cloudApiKey` + `tenantId`. Cloud puxa cardápio. Hub envia outbox. |
| **6E** | Histórico/analytics: timeline de pedidos, ticket médio, prato campeão, hora de pico                                                                           |
| **6F** | Tenant config UI — substitui as env vars do totem (`TENANT_BRAND`, `TENANT_AREA`, `TENANT_SINCE`, `TENANT_HERO_IMG`, `WIFI_*`)                                |

## 10. Validação

### 6A
- ✅ Typecheck (`pnpm typecheck`)
- ✅ Build (`pnpm build`) — passa mesmo sem `DATABASE_URL`
- ✅ Migrations geradas e committadas

### 6B
- ✅ Typecheck (`pnpm typecheck`)
- ✅ Login flow estruturado (server action + redirect → check-email)
- ✅ Middleware gating ativo
- ⏳ Smoke test E2E (login real → admin) depende de SMTP config no `.env.local`

### 6C.1
- ✅ Typecheck + Build
- ✅ Migration `0001` gerada
- ⏳ Smoke test (criar/renomear/reorder/excluir) depende de DB local

### 6C.2
- ✅ Typecheck + Build
- ✅ Migration `0002` gerada
- ⏳ Smoke test (criar produto, editar campos, pausar, reorder, excluir)

### 6C.3
- ✅ Typecheck + Build
- ✅ Migration `0003` gerada e aplicada no Neon
- ⏳ Smoke test (variants P/M/G, grupo "adicionais" com modifiers)

### 6C.4
- ✅ Typecheck + Build (rota `/api/catalog/snapshot` aparece no manifest)
- ✅ Validação Zod do snapshot antes de retornar
- ⏳ Smoke test com curl + DEV_HUB_API_KEY
