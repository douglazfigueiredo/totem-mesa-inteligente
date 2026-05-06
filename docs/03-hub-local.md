# 03 — Hub local

> Status: Fase 2A concluida — persistencia + repositorios. Fase 2B (auth + REST) e 2C (Socket.IO + timer) pendentes.

O hub e o servidor que roda na loja (Mini PC ou RPi 5) e e source-of-truth durante o servico. Devices (totens, KDS, app garcom) conectam apenas ao hub na LAN. Cloud nao e caminho critico do pedido.

## 1. Arquitetura

```
apps/hub/
├── drizzle.config.ts
├── src/
│   ├── server.ts              Fastify entrypoint, expoe /health
│   ├── db/
│   │   ├── schema.ts          Drizzle DSL — 12 tabelas SQLite
│   │   ├── index.ts           createDB() — drizzle + better-sqlite3
│   │   ├── migrate.ts         CLI: aplica migrations standalone
│   │   └── migrations/        SQL gerado via `drizzle-kit generate`
│   ├── lib/
│   │   ├── ids.ts             Geradores UUID v7 + pairing code 6 digitos
│   │   ├── clock.ts           Clock interface (system + fixed para testes)
│   │   └── errors.ts          DomainError + NotFoundError + ConflictError + ...
│   └── repositories/
│       ├── index.ts           makeRepos(db, clock) — factory
│       ├── device.repo.ts     create, findByApiKey (sha256), updateLastSeen
│       ├── order.repo.ts      create, getById, listActive, updateStatus, cancel
│       ├── preparo.repo.ts    start (com guard de unicidade), markReady, listDue
│       ├── outbox.repo.ts     enqueue (idempotent), listPending, markSent/Failed
│       ├── idempotency.repo.ts get/has/record/pruneBefore
│       └── pairing.repo.ts    create code, consume (atomic, expira em 10min)
├── tests/
│   ├── setup.ts               in-memory SQLite + tenant/table/employee seed
│   └── *.test.ts              29 tests cobrindo todos os repos
└── Dockerfile                 multi-stage, multi-arch, USER node, /data volume
```

## 2. Schema do banco (12 tabelas)

| Tabela | Proposito |
|---|---|
| `tenants` | Loja unica que o hub serve (denormalizado em todas as tabelas) |
| `tables` | Mesas (numero, capacidade, status, sessionStartedAt) |
| `devices` | Totens/KDS/garcons emparelhados (apiKeyHash sha256, role) |
| `pairing_codes` | Codigos de 6 digitos com TTL 10min (atomic consume) |
| `employees` | Funcionarios com PIN (bcrypt hash) e roles |
| `catalog_snapshots` | Cache do catalogo puxado do cloud (1 row por tenant) |
| `orders` | Pedidos com items JSON, status, totals, timestamps |
| `preparos` | Timer authoritative — startedAt + durationSec |
| `waiter_calls` | Chamados com escalationLevel 0..2 |
| `event_outbox` | Fila de eventos a empurrar para cloud (retry com backoff) |
| `processed_events` | Cache de event_ids ja processados (idempotencia) |
| `heartbeats` | Ultimo ping de cada device + RTT p95 |

**Regras**:
- `id` em todas as tabelas e UUID v7 (texto). UUID v7 e ordenavel temporalmente — bom para indices B-tree.
- Timestamps sao `INTEGER` (ms desde epoch UTC).
- JSON via `text({ mode: 'json' })` — Drizzle serializa/desserializa.
- Money em centavos (`INTEGER`). Nunca float.
- PRAGMAs: `WAL`, `synchronous=NORMAL`, `foreign_keys=ON`, `busy_timeout=5000`.

## 3. Migrations

```bash
# Gerar migration nova (apos editar schema.ts):
pnpm --filter @app/hub db:generate

# Aplicar migrations standalone (raro — boot do server ja aplica):
pnpm --filter @app/hub db:migrate

# Drizzle Studio (admin GUI local):
pnpm --filter @app/hub db:studio
```

**No boot do server**: `createDB({ applyMigrations: true })` chama `drizzle-kit migrate` automaticamente. Migrations sao SQL puro em `src/db/migrations/*.sql` e sao copiadas para `dist/db/migrations/` no build.

## 4. Repositories — padroes

Todos os repos seguem o mesmo padrao:

```ts
const repo = makeXxxRepo(db, clock);
```

- **Pure functions**: factory recebe `db` (DBClient) e `clock` (Clock interface).
- **No singletons**: cada teste cria seu proprio DB + repos isolados.
- **Idempotencia**: ops que devem ser idempotentes usam `onConflictDoNothing()`.
- **Tempo via clock**: nunca `Date.now()` direto. Tests usam `fixedClock(t)`.
- **Errors tipados**: `NotFoundError` (404), `ConflictError` (409), `ValidationError` (422).
- **Type-safe via Zod**: rows de saida sao parseados via Zod (`Order.parse(...)`) — falhas no parse indicam corrupcao de schema.

### Exemplo — criar um pedido
```ts
const order = repos.orders.create({
  tenantId,
  tableId,
  destino: 'cozinha',
  items: [...],
  subtotalCents: 4500,
  taxaServicoBps: 1000,
  taxaServicoCents: 450,
  totalCents: 4950,
});
// → status 'criado', createdAt = clock.now()
```

### Exemplo — outbox com retry
```ts
repos.outbox.enqueue({ eventId, tenantId, type: 'order:created', payload });
// ... worker pega da pending queue:
const pending = repos.outbox.listPending(50);
for (const ev of pending) {
  try {
    await pushToCloud(ev);
    repos.outbox.markSent(ev.eventId);
  } catch (e) {
    repos.outbox.markFailed(ev.eventId, String(e));  // backoff 1/2/4/8/16/30s
  }
}
```

### Exemplo — idempotency guard em handler
```ts
if (repos.idempotency.has(event.eventId)) {
  return repos.idempotency.get(event.eventId)?.resultJson;
}
const result = handle(event);
repos.idempotency.record({ eventId: event.eventId, type: event.type, result });
return result;
```

## 5. Authoritative timer

O hub e a unica fonte de verdade do tempo:

```ts
// KDS clica "iniciar":
const preparo = repos.preparos.start({
  orderId,
  employeeId,
  durationSec: 1320,  // 22min
});
// preparo.startedAt = hub clock — server-side authoritative

// broadcast WebSocket prep:started com preparo + serverTime
// totem usa server-side startedAt e serverTime para corrigir drift do clock local

// 22min depois (job BullMQ ou polling):
const due = repos.preparos.listDue();  // todos com startedAt + duration < now
for (const p of due) {
  repos.preparos.markReady(p.id);  // atomic: so atualiza se status='preparando'
  repos.outbox.enqueue({ ... type: 'prep:ready' ... });
}
```

`computeRemainingSec(preparo, nowMs)` em `@app/schemas` e deterministico — mesma semantica no hub e cliente.

## 6. Setup local

### Dev sem Docker

```bash
cd apps/hub
pnpm install
pnpm db:generate            # so se editar schema.ts
pnpm dev                    # http://localhost:4000/health
```

`./data/hub.db` e criado no diretorio do hub. Testes usam in-memory SQLite isolado por suite.

### Dev com Docker

```bash
cd deploy/hub
docker compose -f docker-compose.dev.yml up --build
# hub em http://localhost:4000, DB persistido em volume hub-dev-data
```

Volume `hub-dev-data` preserva `/data/hub.db` entre restarts.

## 7. Resiliencia

| Falha | Mitigacao |
|---|---|
| Container crash | `restart: unless-stopped` + healthcheck (wget /health a cada 30s) |
| DB corrompido (raro com WAL) | Recovery: backup automatico via `sqlite3 .backup` (Fase 9) |
| Disco cheio | OS sysctl + alerta via cloud heartbeat (Fase 9) |
| Crash durante write | WAL + synchronous=NORMAL = consistencia transacional ate o ultimo commit |
| Restart entre o `prep:start` e `prep:ready` | Hub recalcula `due` na inicializacao (recovery automatico) |

## 8. O que NAO esta na Fase 2A (proximas etapas)

| Reservado | Fase |
|---|---|
| Auth API key middleware (`x-device-api-key`) | 2B |
| REST endpoints (`/orders`, `/prep`, `/waiter`, `/state/sync`) | 2B |
| Socket.IO server + handlers | 2C |
| BullMQ workers (timer due, outbox push) | 2C |
| Pull catalog do cloud | 2D |
| Push outbox para cloud | 2D |
| GHCR image publishing (ativar `hub-image.yml`) | 2D |

## 9. Tests

```bash
cd apps/hub
pnpm test          # 29 tests, ~800ms
```

Cobertura atual:

- `device.repo.test.ts` — 4 tests
- `idempotency.repo.test.ts` — 3 tests
- `order.repo.test.ts` — 6 tests
- `outbox.repo.test.ts` — 5 tests (incluindo backoff exponencial)
- `pairing.repo.test.ts` — 5 tests (TTL, double-consume, expiracao)
- `preparo.repo.test.ts` — 6 tests (timer determinismo, conflicts)

In-memory SQLite por suite (`mkdtempSync`), aplicacao de migrations isolada.
