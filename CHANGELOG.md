# Changelog

Registro de mudancas relevantes do TotemMesa Inteligente.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento: `vX.Y-faseN` no fim de cada fase.

---

## [Unreleased] — Fase 2A concluida

### Adicionado (Fase 2A — Hub local: persistencia)

- **Drizzle schema SQLite** (`apps/hub/src/db/schema.ts`) — 12 tabelas: tenants, tables, devices, pairing_codes, employees, catalog_snapshots, orders, preparos, waiter_calls, event_outbox, processed_events, heartbeats. UUID v7 ids, money em centavos, JSON via Drizzle, PRAGMAs WAL+foreign_keys.
- **Migrations** auto-aplicadas no boot via `createDB({ applyMigrations: true })`. Initial migration `0000_many_odin.sql` gerada via drizzle-kit.
- **6 repositories** com pattern uniforme (factory + clock injection):
  - `DeviceRepo` — pair (sha256 da api key), findByApiKey, updateLastSeen, deactivate.
  - `OrderRepo` — create, getById, listActive, updateStatus (sentAt automatico), cancel.
  - `PreparoRepo` — start (guard de unicidade), markReady (atomic), listDue (timer expirado).
  - `OutboxRepo` — enqueue idempotente, listPending, markSent, markFailed (backoff exponencial 1/2/4/8/16/30s).
  - `IdempotencyRepo` — get/has/record/pruneBefore (LRU persistente para event_ids).
  - `PairingRepo` — codigo 6 digitos com TTL, atomic consume.
- **Lib helpers**: ids.ts (UUID v7 via `uuidv7`), clock.ts (system + fixed para tests), errors.ts (DomainError tipados com httpStatus).
- **29 tests vitest** (in-memory SQLite isolado por suite, ~800ms total).
- Hub Dockerfile atualizado: pre-cria `/data` com ownership do user `node`, copia migrations para `dist/db/migrations` no build.
- Doc `docs/03-hub-local.md` (~280 linhas) com arquitetura + schema + repo patterns + timer authoritative + resiliencia.

### Validado

- `pnpm test` em `apps/hub` — 29/29 passando.
- Docker compose dev — hub healthy, DB persistido em volume, migrations aplicadas no boot, `/health` retorna `{ db: {...}, outbox: { pending: 0 } }`.

---

## [Unreleased] — Fase 1 concluida

### Adicionado

- **Schemas Zod completos** em `packages/schemas/src/`:
  - `ids.ts` — branded IDs (Tenant/Device/Table/Order/...) com validacao UUID v1-v8.
  - `money.ts` — PriceCents, Bps, formatBRL, applyBps.
  - `vertical.ts` — Vertical enum + VerticalConfig discriminated union (pizza/lanche/prato/salgado/bebida/sobremesa/simples).
  - `tenant.ts`, `device.ts` (+ PairingCode), `table.ts`, `employee.ts`.
  - `catalog.ts` — Category, Product, ProductVariant, ModifierGroup, Modifier, CatalogSnapshot.
  - `order.ts` — Order, OrderItem, ItemCustomization (pizza meio-a-meio, ponto da carne).
  - `preparo.ts` — Preparo + helpers `computeRemainingSec`/`isReady` (timer authoritative).
  - `waiter.ts` — WaiterCall com escalonamento.
- **Contrato WebSocket** em `events.ts` — 15 eventos como discriminated union por `type`, com envelope `eventId` (idempotency UUID v7) + `tenantId` + `causedBy?`.
- 24 testes vitest cobrindo round-trip, branded types, edge cases, eventos.
- `docs/01-data-model.md` — entidades + tabela completa dos 15 eventos + secoes de idempotencia/reconexao/heartbeat.

### Configuracao

- GitHub Actions write permission habilitado (preparacao Fase 2 GHCR push).
- Default `GH_OWNER` em `docker-compose.yml` atualizado para `douglazfigueiredo`.
- Image name padronizado para `totem-mesa-inteligente-hub`.

---

## [v0.1-fase0] — 2026-05-06

### Fase 0: Fundacao

#### Adicionado

- Monorepo Turborepo + pnpm workspaces.
- Apps esqueleto: `cloud`, `hub`, `totem`, `kds`, `waiter`.
- Packages compartilhados: `schemas`, `ui`, `types`.
- Hub: server Fastify minimo com endpoint `/health` + Dockerfile multi-stage multi-arch.
- Design tokens em `packages/ui/src/tokens.ts` (cores, spacing, radius, fonts, motion) extraidos do handoff.
- Deploy do hub: `docker-compose.yml` (prod) + `docker-compose.dev.yml` (dev) + `install.sh` (one-liner) + `update.sh` (update/rollback).
- CI workflow `ci.yml` (typecheck + lint + test + build).
- CI workflow `hub-image.yml` (build multi-arch para GHCR — desabilitado ate Fase 2).
- Documentacao base:
  - `docs/00-arquitetura.md` — arquitetura geral.
  - `docs/adr/0001-hibrido-local-cloud.md` — decisao de arquitetura hibrida.
  - `docs/adr/0002-pwa-vs-react-native.md` — escolha de PWA Next.js.
  - `docs/adr/0003-fastify-vs-nestjs.md` — escolha de Fastify no hub.
  - `docs/adr/0004-deploy-hub-docker.md` — Docker + .img para deploy do hub.
- Configs de qualidade: `.editorconfig`, `.prettierrc.json`, `tsconfig.base.json`, `.gitignore`.
- README raiz com indice e quickstart.

#### Sem mudancas funcionais

Esta fase e estrutural. Apenas o hub responde em `/health`. Todas as outras apps sao esqueleto reservadas para fases subsequentes.
