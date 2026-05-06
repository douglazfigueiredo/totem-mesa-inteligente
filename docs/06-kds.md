# 06 — KDS (Kitchen Display System)

> Status: Fase 4 ✅ (foundation + pareamento + PIN + grid de tickets + iniciar/concluir preparo).

PWA Next.js 15 que roda em monitor de cozinha (tablet ou TV com mini-PC). 1 KDS por estação de
preparo. Tema escuro para contraste sob luz fluorescente.

## 1. Stack

- Next.js 15 (App Router)
- React 19
- Zustand 5 (auth persistido + orders em memória)
- Socket.IO Client (real-time)
- CSS modules + CSS variables (tema escuro)
- Fonts: Fraunces (display) + Inter (body) + JetBrains Mono (timer/labels)

Bundle First Load JS: 136 KB no `/` (com socket.io e timers).

## 2. Decisões de design

| Aspecto         | Decisão                                  | Justificativa                                                                                              |
| --------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Tema            | Escuro (`#1a0f08`)                       | Cozinha bem iluminada — escuro reduz fadiga visual em turno longo. Acentos terracota/dourado para alarmes. |
| Identidade      | PIN do funcionário                       | Tablet compartilhado. Toda ação fica registrada por employee. Logout rápido (botão sair na top bar).       |
| Layout          | Grid auto-fill (280–320px)               | Adapta de 4 colunas em monitor 24" até 2 colunas em tablet 10". Sem scroll horizontal.                     |
| Sort            | Atrasados → Novos → Preparando → Prontos | Cozinheiro vê primeiro o que vai estourar. Prontos descem (esperando garçom retirar).                      |
| Iniciar preparo | Modal com presets (5–30min)              | 95% dos casos cabem em 5 cliques. Campo livre em segundos para casos especiais.                            |
| Concluir        | Click direto (sem confirmação)           | Operação reversível pelo gerente. Velocidade > segurança aqui — engano custa só 1 ping no garçom.          |

## 3. Auth e pareamento (2 etapas)

KDS tem dupla camada de identidade: o **dispositivo** (apiKey, persistido) + o **funcionário**
(employeeId, em sessão).

```
1. Sem pair    → /pair      (gerente passa código de 6 dígitos role=kds)
2. Pair OK     → /login     (funcionário digita PIN no teclado numérico)
3. PIN OK      → /          (grid de tickets)
```

Fluxo de geração de código (gerente, fora do KDS):

```bash
curl -X POST http://localhost:4000/admin/pairing-codes \
  -H "x-admin-secret: $HUB_ADMIN_SECRET" \
  -H "content-type: application/json" \
  -d '{"tenantId":"<uuid>","role":"kds","ttlSec":600}'
```

Diferenças vs totem:

- **Sem `tableId`**: o KDS opera sobre todos os pedidos do tenant.
- **role no código**: o gerente cria com `role:"kds"` ao invés de `"totem"`.
- **PIN obrigatório**: o totem é anônimo (cliente). O KDS exige funcionário.

Auth store: `tm-kds-auth` em localStorage (apiKey + deviceId + tenantId persistidos; employeeId só
em memória — limpa em logout/restart).

## 4. Real-time

Pattern idêntico ao totem (`useSocketLifecycle`), com 1 diferença chave:

`state:sync` no hub agora é **role-aware**:

```ts
// apps/hub/src/sockets/server.ts
if (device.role === 'kds' || device.role === 'admin') {
  // tenant-wide: todos os pedidos ativos + lista de mesas (para resolver número)
  return ack({ scope: 'tenant', activeOrders, activePreparos, tables, pendingWaiterCalls });
}
// totem: filtra por tableId (escopo da mesa)
```

A lista de `tables` vem no snapshot e é guardada num `Map<TableId, Table>` no `orders-store` para
resolver `order.tableId → table.numero` ao renderizar tickets.

Eventos consumidos pela KDS (todos do `WSEvent` discriminated union):

| Evento          | Ação no store                                                           |
| --------------- | ----------------------------------------------------------------------- |
| `order:created` | Adiciona ao `Map`. Incrementa `newOrderTick` (gatilho de som — Fase 8). |
| `prep:started`  | Cria/atualiza preparo. Order vai para `preparando`.                     |
| `prep:ready`    | Preparo → `pronto`. Order → `pronto`. Ticket pulsa verde.               |
| `order:cancel`  | Order → `cancelado`. Some do grid.                                      |

## 5. Componentes

```
src/components/
├── SocketProvider.tsx      # mount-only, dispara useSocketLifecycle
├── ConnectionBadge.tsx     # banner sticky em connecting/reconnecting/offline
├── TopBar.tsx              # KDS · device · clock · drift badge · employee · sair
├── PairingForm.tsx         # input 6-dig + nome → POST /devices/pair
├── PinForm.tsx             # teclado numérico 12 botões → POST /auth/pin
├── TicketCard.tsx          # mesa, items, status (border 6px), timer, ação
├── TicketGrid.tsx          # grid + sort + dialog state + handler concluir
└── StartPrepDialog.tsx     # presets duração + custom + POST /prep/start
```

### TicketCard — estados visuais

| Estado           | Borda left | Animação   | Timer mostra         | Botão           |
| ---------------- | ---------- | ---------- | -------------------- | --------------- |
| `criado/enviado` | gold       | nenhuma    | "aberto há mm:ss"    | iniciar preparo |
| `preparando`     | terracota  | nenhuma    | tempo restante mm:ss | concluir        |
| atrasado         | vermelho   | pulse 1.4s | "atrasou"            | concluir        |
| `pronto`         | verde      | pulse 2s   | "aguardando garçom"  | ocultar         |

`hide()` apenas adiciona o `orderId` ao `Set hiddenIds` local — útil para pedidos que ficam prontos
mas o garçom demora a retirar. Resetado a cada reload.

## 6. Idempotência

`POST /prep/start` e `POST /prep/:id/ready` ambos passam por `requireRole(['kds'])`. O start usa
header `x-event-id` (UUID v4) gerado client-side via `crypto.randomUUID()` — se a rede engasgar e o
cozinheiro reclica, o hub serve a resposta cached.

## 7. Drift de timer

A `TopBar` mostra um badge "drift Ns" quando `|driftMs| > 2s`. O `TicketCard` usa
`correctedNow(driftMs)` para calcular o tempo restante, ou seja:

- Servidor é a fonte canônica de tempo.
- Cliente compensa offset descoberto via heartbeat (a cada 15s).
- Se um KDS estiver com relógio adiantado em 30s, o ticket ainda vira "atrasado" no momento certo.

## 8. Próximos passos (não-bloqueantes)

- **Som de "ding"** quando `newOrderTick` incrementa (Fase 8 — resiliência/UX).
- **Filtros**: por `destino` (`cozinha`/`garcom`) — útil quando o KDS é compartilhado entre estações.
- **Bump bar real**: dispositivo físico Hatco/Logic mapeado em hotkey do teclado USB.
- **Modo dia/noite**: light theme opcional.

## 9. Como rodar

```bash
# 1. Hub local
cd apps/hub
pnpm dev   # :4000

# 2. KDS PWA
cd apps/kds
pnpm dev   # :3002 (totem usa :3001)

# 3. Gerar código KDS (em outro terminal)
HUB_ADMIN_SECRET=$(grep HUB_ADMIN_SECRET apps/hub/.env | cut -d= -f2)
TENANT_ID=$(sqlite3 apps/hub/data/hub.db "SELECT id FROM tenants LIMIT 1")
curl -X POST http://localhost:4000/admin/pairing-codes \
  -H "x-admin-secret: $HUB_ADMIN_SECRET" \
  -H "content-type: application/json" \
  -d "{\"tenantId\":\"$TENANT_ID\",\"role\":\"kds\",\"ttlSec\":600}"
```

PINs do seed:

| Função     | PIN  |
| ---------- | ---- |
| cozinheiro | 1111 |
| garçom     | 2222 |
| gerente    | 9999 |

## 10. Validação

- ✅ Typecheck + build (136 KB First Load JS)
- ✅ 80 testes do hub passando após mudança em `state:sync`
- ⏳ Smoke test manual: criar pedido no totem → ver no KDS → iniciar preparo → marcar pronto → ver no totem
