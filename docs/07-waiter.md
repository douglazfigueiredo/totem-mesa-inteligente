# 07 — App Garçom (PWA mobile)

> Status: Fase 5 ✅ (foundation + pareamento + PIN + chamados + entregas).

PWA Next.js 15 mobile-first (smartphone vertical, max-width 480px), tema light. Roda no celular do
garçom. Recebe chamados de mesa em tempo real e mostra pedidos prontos para entregar.

## 1. Stack

- Next.js 15 (App Router)
- React 19
- Zustand 5 (auth persistido + waiter store em memória)
- Socket.IO Client
- CSS modules + CSS variables (tema light)
- Fonts: Fraunces (display) + Inter (body) + JetBrains Mono (mono labels)

Bundle First Load JS: 121 KB no `/` (com socket.io, chamados, entregas).

## 2. Decisões de design

| Aspecto    | Decisão                          | Justificativa                                                                                           |
| ---------- | -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Tema       | Light (`#fafaf6`)                | Smartphone usado em ambiente variado (sol/luz forte). Light dá legibilidade. Cor só carrega estado.     |
| Layout     | Max-width 480px + tab bar bottom | Padrão app nativo. Polegar alcança botões na parte inferior. 2 abas (Chamados / Entregar) — sem fluff.  |
| Identidade | PIN                              | Compartilhamento de turno. Toda ack/resolve registrada por employee.                                    |
| Sort       | Pendentes → Atendendo            | Chamado pendente sempre no topo. Mesmo padrão de KDS: trabalho atrasado primeiro.                       |
| Servir     | Hide local                       | "servir ✓" só esconde do app. Status real só vai pra `entregue` quando garçom confirmar conta (Fase 7). |

## 3. Auth e pareamento (idêntico KDS)

```
1. Sem pair    → /pair      (gerente passa código de 6 dígitos role=waiter)
2. Pair OK     → /login     (funcionário digita PIN)
3. PIN OK      → /          (tab Chamados / Entregar)
```

Geração de código (gerente):

```bash
curl -X POST http://localhost:4000/admin/pairing-codes \
  -H "x-admin-secret: $HUB_ADMIN_SECRET" \
  -H "content-type: application/json" \
  -d '{"tenantId":"<uuid>","role":"waiter","ttlSec":600}'
```

Auth store: `tm-waiter-auth` em localStorage.

## 4. Real-time

Hub `state:sync` agora trata 3 escopos:

| role            | snapshot retornado                                                 |
| --------------- | ------------------------------------------------------------------ |
| `totem`         | activeOrders + activePreparos + pendingWaiterCalls (filtra mesa)   |
| `kds` / `admin` | activeOrders + activePreparos + tables + pendingWaiterCalls        |
| `waiter`        | orders (pronto/destino=garcom/ambos) + pendingWaiterCalls + tables |

Eventos consumidos:

| Evento            | Ação no waiter-store                                                    |
| ----------------- | ----------------------------------------------------------------------- |
| `waiter:call`     | Insere call no Map. Incrementa `newCallTick` (gatilho de som — Fase 8). |
| `waiter:ack`      | Marca call como `acknowledged`.                                         |
| `waiter:resolved` | Marca call como `resolved` (some da lista).                             |
| `order:created`   | Adiciona ao Map (relevante quando destino=garcom).                      |
| `prep:ready`      | Order → `pronto` (entra na lista de entregar).                          |
| `order:cancel`    | Order → `cancelado` (sai da lista).                                     |

### Mudança de schema necessária

`WaiterCallCreateEvent.payload` agora carrega `callId` + `createdAt` (opcional pra compat com
emissores client-side). O hub sempre popula esses campos ao publicar — sem eles o waiter não tem
como rastrear o chamado pelo id quando recebe um evento novo.

```ts
// packages/schemas/src/events.ts
payload: z.object({
  tableId: TableId,
  reason: WaiterCallReason,
  obs: z.string().max(200).optional(),
  callId: WaiterCallId.optional(),       // ← novo
  createdAt: TimestampMs.optional(),     // ← novo
}),
```

## 5. Componentes

```
src/components/
├── SocketProvider.tsx       # mount-only, useSocketLifecycle
├── ConnectionBadge.tsx      # banner sticky em connecting/reconnecting/offline
├── TopBar.tsx               # nome + badge pendente + sair
├── TabBar.tsx               # 2 abas fixed bottom (Chamados / Entregar) + badges
├── PairingForm.tsx          # 6-dig code + nome → POST /devices/pair
├── PinForm.tsx              # teclado numérico → POST /auth/pin
├── CallCard.tsx             # mesa, motivo, idade, atender/resolver
├── CallsList.tsx            # lista filtrada + sort + handlers ack/resolve
├── DeliveryCard.tsx         # mesa, items, "servir ✓"
└── DeliveryList.tsx         # filtra status=pronto + destino=garcom
```

### CallCard — estados visuais

| Estado         | Borda left      | Background                                     | Botão       |
| -------------- | --------------- | ---------------------------------------------- | ----------- |
| `pending`      | terracota       | terracota-soft (chama atenção, animação nudge) | atender     |
| `acknowledged` | gold            | branco                                         | resolvido ✓ |
| `resolved`     | (some da lista) |

### DeliveryCard — estados visuais

| Status order                                 | Borda left | Background | Botão           |
| -------------------------------------------- | ---------- | ---------- | --------------- |
| `pronto`                                     | green      | green-soft | servir ✓        |
| `enviado/preparando` (apenas destino=garcom) | gold       | branco     | (apenas mostra) |

## 6. Hide local (servidos)

`markDelivered(orderId)` adiciona ao `Set deliveredIds` em memória (não persiste). É reset a cada
reload — por design: se o garçom recarregou, ele talvez precise rever o que servia. Quando a Fase 7
(pagamento) entrar, o status real do pedido vai virar `entregue` no hub e isso vira inútil — mantemos
por enquanto pra ter feedback imediato.

## 7. Próximos passos (não-bloqueantes)

- **Som/vibração** quando `newCallTick` incrementa (Fase 8 — UX/resiliência).
- **Notificação push** real (PWA + Web Push) — exige cert/cloud, fica pra Fase 6+.
- **Histórico de chamados resolvidos hoje** (lista expansível, opcional).
- **Filtro por mesa atribuída** quando tivermos turnos com mesas atribuídas a garçons específicos.

## 8. Como rodar

```bash
# 1. Hub
cd apps/hub && pnpm dev   # :4000

# 2. App Garçom
cd apps/waiter && pnpm dev   # :3003

# 3. Gerar código waiter
curl -X POST http://localhost:4000/admin/pairing-codes \
  -H "x-admin-secret: dev-admin-secret-min-20-chars-XX" \
  -H "content-type: application/json" \
  -d '{"tenantId":"<uuid>","role":"waiter","ttlSec":600}'
```

Abrir `http://localhost:3003` no celular (mesma rede) ou no devtools mobile do desktop.

PINs do seed:

| Função     | PIN  |
| ---------- | ---- |
| cozinheiro | 1111 |
| garçom     | 2222 |
| gerente    | 9999 |

## 9. Validação

- ✅ Typecheck + build (121 KB First Load JS no `/`)
- ✅ 80 testes do hub passando após mudanças em `state:sync` + `waiter:call` payload
- ⏳ Smoke test E2E: totem chama garçom → app vibra/badge → ack → resolve → some
- ⏳ Smoke test E2E: KDS marca pedido pronto → entrega aparece no app → "servir" → some
