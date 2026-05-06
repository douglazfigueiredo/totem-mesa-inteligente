# 01 — Modelo de dados e contrato WebSocket

> Status: Fase 1 (parcial — entidades + eventos). Drizzle DSL compartilhado SQLite/Postgres entra na Fase 2 junto com a implementacao do hub.
>
> Source-of-truth: [`packages/schemas/src/`](../packages/schemas/src/). Toda entidade e Zod-validavel.

## 1. Convencoes

- **IDs**: UUID v1–v8 com Zod brand types (`TenantId`, `OrderId`, etc). Geracao em runtime usa UUID v7 (ordenavel temporal) para `event_id` e principais entidades — mas o schema aceita v1–v8 para flexibilidade.
- **Timestamps**: `number` (ms desde Unix epoch UTC). Nunca confiar no clock do dispositivo cliente — servidor envia `serverTime` em heartbeat e `prep:started` para correcao de drift.
- **Money**: `PriceCents` = inteiro nao-negativo. Nunca usar float. Helpers em `money.ts` (`formatBRL`, `applyBps`).
- **Taxa de servico**: em basis points (`Bps`, 0–10000). 1000 bps = 10%.
- **Discriminated unions**: tudo que tem variantes usa Zod `discriminatedUnion` (e.g. `VerticalConfig`, `WSEvent`).

## 2. Entidades de dominio

### Tenant + features

```ts
Tenant {
  id, slug, nome, vertical: 'pizzaria' | 'restaurante' | 'lanchonete' | 'hamburgueria',
  features: { mesas, comanda, balcao, retirada, delivery, pizzaMetade, combo },
  timezone, createdAt, updatedAt
}
```

**Multi-vertical via `verticalConfig` no produto** (discriminated union por `tipo`):

- `pizza` — `saboresMax`, `bordaRecheadaDisponivel`
- `lanche` — `pontoDaCarneDisponivel: PontoDaCarne[]`
- `prato` — `acompanhamentoObrigatorio`
- `salgado`, `bebida`, `sobremesa`, `simples` — sem campos extras (placeholders pra evolucao)

### Device + Pareamento

```ts
Device { id, tenantId, role: 'totem'|'kds'|'waiter'|'admin', tableId?, apiKeyHash, pairedAt, lastSeenAt? }
PairingCode { code: '######', tenantId, role, expiresAt, consumedAt? }
```

**Auth**: cloud gera `PairingCode` (6 digitos, expira em 10min). Hub recebe API key via `PairingCode.consume()` apos digitacao no install.sh.

### Cardapio

Estrutura hierarquica:

```
Category → Product → ProductVariant (tamanhos)
                  → ModifierGroup (selectionType: single|multi, required, min/max)
                       → Modifier (priceDeltaCents)
```

`CatalogSnapshot` empacota tudo com `version` e `generatedAt` para sync incremental cloud → hub.

### Order

```ts
Order {
  id, tenantId, tableId, status, destino,
  items: OrderItem[],         // qty, unitPriceCents, totalPriceCents, customization
  subtotalCents, taxaServicoBps, taxaServicoCents, totalCents,
  obs?, createdAt, sentAt?, cancelledAt?, cancelReason?
}

OrderItem {
  id, productId, nome, destino: 'cozinha'|'garcom',
  qty, unitPriceCents, totalPriceCents, tempoEstimadoSec,
  customization?: ItemCustomization
}

ItemCustomization {
  variantId?,                          // tamanho selecionado
  modifiers: ModifierSelection[],      // adicionais escolhidos
  obs?,                                // observacao do cliente
  pizzaSabores?: ProductId[max 4],     // pizza meio-a-meio (multi-vertical)
  pontoDaCarne?: PontoDaCarne          // hamburguer/carne (multi-vertical)
}
```

### Preparo (timer authoritative)

```ts
Preparo { id, orderId, status, startedAt, durationSec, startedByEmployeeId, readyAt?, cancelledAt? }
```

**Helpers determinísticos** (mesma semantica em hub e cliente):

- `computeRemainingSec(preparo, nowMs)` — tempo restante calculado com clamp em 0.
- `isReady(preparo, nowMs)` — `true` apos `startedAt + durationSec`.

Cliente nao confia no proprio clock: usa `serverTime` recebido em `prep:started` para sincronizar.

### WaiterCall

```ts
WaiterCall { id, tableId, reason: 'talheres'|'agua'|'ajuda_pedido'|'fechar_conta'|'outros',
             status: 'pending'|'acknowledged'|'resolved'|'escalated',
             createdAt, acknowledgedBy?, acknowledgedAt?, resolvedAt?,
             escalationLevel: 0..2 }
```

Escalonamento: nivel 0 (criado) → 1 (sem ack em 3min) → 2 (sem ack em 6min, alerta gerente). Logica fica no hub.

### Employee

```ts
Employee { id, tenantId, nome, pinHash, roles: ('cozinheiro'|'garcom'|'gerente'|'caixa')[], isActive }
```

Auth de funcionario e **local no hub** (PIN bcrypt). Cloud nao gerencia sessao operacional.

## 3. Contrato WebSocket — 15 eventos

Todos os eventos compartilham envelope:

```ts
{
  eventId: EventId,        // UUID v7 — idempotency key
  tenantId: TenantId,
  ts: TimestampMs,         // sent by client/server
  type: string,            // discriminator
  payload: { ... },        // shape depende do type
  causedBy?: EventId       // chain do evento que originou esse
}
```

| #   | Evento              | Origem       | Destino              | Payload essencial                                                                                                        |
| --- | ------------------- | ------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | `order:create`      | Totem        | Hub                  | `tableId`, `items[]`, `obs?`, `taxaServicoBps`                                                                           |
| 2   | `order:created`     | Hub          | Totem (echo)         | `order` (Order completo com `id`/`createdAt`)                                                                            |
| 3   | `prep:start`        | KDS          | Hub                  | `orderId`, `employeeId`, `durationSec`                                                                                   |
| 4   | `prep:started`      | Hub          | Totem + KDS          | `preparo` (com `startedAt` server-side) + `serverTime`                                                                   |
| 5   | `prep:ready`        | Hub          | Totem + KDS + Garcom | `orderId`, `preparoId`, `readyAt`                                                                                        |
| 6   | `order:cancel`      | Totem/Admin  | Hub                  | `orderId`, `reason`, `cancelledBy?`                                                                                      |
| 7   | `item:unavailable`  | Hub          | Totem                | `productId`, `suggestedSubstitutes[]`, `affectedOrderIds[]`                                                              |
| 8   | `waiter:call`       | Totem        | Hub                  | `tableId`, `reason`, `obs?`                                                                                              |
| 9   | `waiter:ack`        | Garcom       | Hub                  | `callId`, `employeeId`                                                                                                   |
| 10  | `waiter:resolved`   | Garcom       | Hub                  | `callId`, `employeeId`                                                                                                   |
| 11  | `table:close`       | Admin/Hub    | Totem                | `tableId`, `closedBy`                                                                                                    |
| 12  | `payment:request`   | Totem        | Hub                  | `tableId`, `amountCents`, `method`, `splitMode`                                                                          |
| 13  | `payment:confirmed` | Hub          | Totem                | `tableId`, `amountCents`, `method`, `receiptUrl?`                                                                        |
| 14  | `state:sync`        | bidirecional | reconexao            | `tableId`, `lastEventId?`, `serverTime`, `activeOrders[]`, `activePreparos[]`, `pendingWaiterCalls[]`, `orderStatuses[]` |
| 15  | `heartbeat`         | bidirecional | 15s                  | `serverTime`, `deviceClientTime?` (drift correction)                                                                     |

### Idempotencia

Todo evento tem `eventId` UUID v7. Servidor mantem cache LRU dos ultimos N event_ids por device — duplicatas sao silenciosamente ignoradas (resposta replay). Resolve:

- Cliente envia `order:create`, perde resposta antes de receber `order:created` → reenvia → servidor identifica `eventId` repetido → retorna `order:created` original.
- KDS clica "iniciar" 2× rapidamente → segundo `prep:start` com mesmo `eventId` ignorado.

### Conflito (corrida)

Quando 2 KDS clicam "iniciar" no mesmo ticket simultaneamente (eventos diferentes, mesmo orderId):

- Primeiro vence (`prep:started` broadcast).
- Segundo recebe HTTP 409 com `Preparo` atual (quem assumiu, quando) — KDS redesenha.

### Reconexao

Cliente desconectado tenta reconectar com backoff exp 1s/2s/4s/8s/16s, max 30s. Ao reconectar, envia `state:sync` com `lastEventId` recebido. Hub responde com `state:sync` contendo:

- snapshot completo do estado da mesa (orders + preparos + calls)
- ou diff desde `lastEventId` (otimizacao futura)

### Heartbeat

Cliente pinga 15s. Se hub nao recebe ping em 60s, KDS marca mesa como "offline" (badge vermelho). Cliente usa `serverTime` retornado pra corrigir drift do clock local.

## 4. Validacao end-to-end

Servidor (hub) usa `WSEvent.parse(envelope)` em todo evento entrante (Zod). Cliente faz o mesmo na recepcao. Tipo `WSEventByType<'prep:started'>` extrai variant especifica do union.

Exemplo (tipado):

```ts
import { WSEvent, type WSEventByType } from '@app/schemas';

socket.on('event', (raw) => {
  const ev = WSEvent.parse(raw);
  if (ev.type === 'prep:started') {
    handle(ev as WSEventByType<'prep:started'>);
  }
});
```

## 5. O que ainda nao esta neste doc

Reservado para Fase 2:

- **Drizzle DSL compartilhado** — schema das tabelas SQLite (hub) e Postgres (cloud). Mesma fonte → 2 banks.
- **Indexes recomendados** — order_status, table_id+status, etc.
- **Outbox** — schema da tabela `event_outbox` no hub para sync com cloud.
- **Migracoes** — Drizzle Kit + Neon branching.

## 6. Tests

`packages/schemas/tests/schemas.test.ts` cobre:

- IDs (UUID validation, brand types).
- Slug regex.
- Money helpers (formatBRL, applyBps).
- Tenant round-trip.
- VerticalConfig discriminated union.
- ItemCustomization (pizza meio-a-meio, ponto da carne, limites).
- Order (round-trip, items min/max).
- Preparo helpers (computeRemainingSec, isReady — semantica determinística).
- WaiterCall basico.
- WSEvent (15 tipos, rejeicao de tipo desconhecido, heartbeat valida payload).

`pnpm --filter @app/schemas test` — 24 tests, ~40ms.
