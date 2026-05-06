# 00 — Arquitetura

> Status: Fase 0 (Fundacao). Documento de referencia de alto nivel; detalhes especificos em docs por fase.

## 1. Produto

SaaS multi-tenant de **totem de mesa inteligente** para pequeno e medio empreendedor de:

- Pizzaria
- Restaurante
- Lanchonete
- Hamburgueria

3 superficies sincronizadas em tempo real:

1. **Totem** (tablet landscape, ~1280×800, 1 por mesa) — cliente navega cardapio, faz pedido, acompanha timer real, chama garcom.
2. **KDS** (Kitchen Display System, monitor 21–27") — fila de tickets, botao "iniciar preparo" arma o timer authoritative.
3. **App garcom** (smartphone) — recebe chamados de mesa + pedidos nao-cozinha (bebidas, sobremesas).

Diferencial: timer baseado em momento real que cozinha aceita o ticket (nao estimativa fake), com widget flutuante quando cliente continua pedindo.

## 2. Decisao arquitetural — hibrido local + cloud

3 camadas:

```
┌─ CLOUD (Vercel + Neon Postgres) ────────────────────────┐
│  - Painel SaaS multi-tenant (dono edita cardapio)       │
│  - Catalogo source-of-truth                             │
│  - Historico de pedidos + analytics                     │
│  - Pareamento de hubs locais                            │
│  - Billing                                              │
└────────────── ↕ HTTPS (pull catalogo / push pedidos) ───┘
                            │
┌─ HUB LOCAL (Mini PC ou RPi 5 na loja) ──────────────────┐
│  - Source-of-truth durante o servico                    │
│  - Fastify + Socket.IO + SQLite + BullMQ                │
│  - Roteador WebSocket (totens ↔ KDS ↔ garcons)          │
│  - Authoritative timer (started_at + duration_s)        │
│  - Outbox p/ cloud (sincroniza pedidos finalizados)     │
└──────────── ↕ Wi-Fi local (LAN, latencia <10ms) ────────┘
                            │
┌─ DEVICES (na LAN do hub) ───────────────────────────────┐
│  Totem (tablets, 1 por mesa) — Next.js PWA modo kiosk   │
│  KDS (monitor cozinha)        — Next.js PWA fullscreen  │
│  App Garcom (smartphone)      — PWA com push            │
└─────────────────────────────────────────────────────────┘
```

Justificativa completa: [`adr/0001-hibrido-local-cloud.md`](./adr/0001-hibrido-local-cloud.md).

### Caminho critico do pedido

**Tudo flui na LAN do hub.** Cloud nunca esta no caminho critico do pedido durante o servico.

1. Totem `POST /orders` → hub valida + persiste SQLite + broadcast WebSocket → KDS recebe ticket.
2. KDS `POST /prep/start` → hub registra `started_at` (UTC do servidor) → broadcast `prep:started` → totem mostra timer.
3. Cliente continua pedindo → timer minimiza, novos pedidos somam ao mesmo fluxo.
4. Hub broadcast `prep:ready` quando `now - started_at >= duration_s` → totem overlay "pronto".
5. Garcom finaliza → hub marca pedido pago → outbox empurra para cloud.

### O que cloud faz

- Source-of-truth do **catalogo**. Hub pull a cada 10min (ETag/HTTP cache) ou push imediato em update.
- Recebe pedidos **fechados** via outbox (analytics, historico, billing).
- Pareamento: dono gera codigo no painel → digita no hub durante install → hub recebe API key.
- Auth de funcionario fica **local no hub** (PIN). Cloud nao gerencia sessao de funcionario.

## 3. Stack

| Camada | Tecnologia |
|---|---|
| Cloud | Next.js 16 + Drizzle + Neon Postgres + NextAuth |
| Hub | Fastify + Socket.IO + better-sqlite3 + BullMQ + Drizzle |
| Totem / KDS / Garcom | Next.js 16 PWA + Tailwind + Zustand + Socket.IO client + Dexie (IndexedDB) |
| Pagamento | Mercado Pago Point Pro 3 (Integration API) + fallback "pagar no caixa" via QR Code |
| Observabilidade | Sentry + OpenTelemetry → Grafana Cloud (free) + pino logs |
| Monorepo | Turborepo + pnpm workspaces |
| CI/CD | GitHub Actions; cloud → Vercel; hub → GHCR (imagens multi-arch) |

Stack PWA (em vez de React Native): [`adr/0002-pwa-vs-react-native.md`](./adr/0002-pwa-vs-react-native.md).
Fastify (em vez de NestJS): [`adr/0003-fastify-vs-nestjs.md`](./adr/0003-fastify-vs-nestjs.md).

## 4. Multi-vertical

Diferenca entre verticais e mais nas peculiaridades de produto que no fluxo. Modelo:

```
Tenant
  ├─ vertical: pizzaria | restaurante | lanchonete | hamburgueria
  ├─ features (flags): mesas, comanda, balcao, retirada, delivery, pizza_metade, combo
  └─ catalog
       ├─ Categories
       └─ Products
            ├─ vertical_config: JSONB (config especifica por vertical)
            ├─ ProductVariants (tamanhos)
            └─ ModifierGroups → Modifiers (adicionais, sabores, ponto da carne)
```

Exemplos de `vertical_config`:

- Pizzaria: `{ "tipo": "pizza", "sabores_max": 2, "borda_recheada_disponivel": true }`
- Hamburgueria: `{ "tipo": "lanche", "ponto_da_carne": ["mal", "medio", "bem"] }`
- Restaurante: `{ "tipo": "prato", "acompanhamento_obrigatorio": true }`
- Lanchonete: `{ "tipo": "salgado" }`

Tela de detalhe do produto detecta `tipo` e renderiza componentes especificos (pizza meio-a-meio, ponto, etc). 90% da UI compartilhada entre verticais.

Especificacoes detalhadas por vertical: `14-vertical-recipes.md` (Fase 10).

## 5. Estrutura do monorepo

```
totem-mesa-inteligente/
├── apps/
│   ├── cloud/        Painel SaaS (Next.js + Neon)         [Fase 6]
│   ├── hub/          Servidor da loja (Fastify + SQLite)  [Fase 2]
│   ├── totem/        PWA tablet                           [Fase 3]
│   ├── kds/          PWA monitor cozinha                  [Fase 4]
│   └── waiter/       PWA garcom                           [Fase 5]
├── packages/
│   ├── schemas/      Zod schemas + Drizzle DSL compartilhado [Fase 1]
│   ├── ui/           Design tokens + componentes React        [evolui]
│   └── types/        Types compartilhados                     [evolui]
├── deploy/
│   ├── hub/          Docker Compose + install.sh + update.sh
│   ├── totem-kiosk/  Configuracao kiosk Android         [Fase 3]
│   └── cloud/        Vercel deploy config              [Fase 6]
├── docs/             Esta pasta
└── design_handoff_totem_pizzaria/   Handoff de design (HTMLs)
```

## 6. Estrategia de deploy

| Componente | Deploy | Detalhes |
|---|---|---|
| `apps/cloud` | Vercel (git push → preview/prod) | Neon Postgres separado |
| `apps/hub` | GHCR (image multi-arch) → Docker Compose nas lojas | Watchtower atualiza automatico |
| `apps/totem`/`kds`/`waiter` | Servido pelo hub (assets estaticos) ou Vercel | PWA instalavel; modo kiosk no Android |

Justificativa Docker no hub: [`adr/0004-deploy-hub-docker.md`](./adr/0004-deploy-hub-docker.md).

### Por escala de loja

| Escala | Setup | Tempo por loja |
|---|---|---|
| 1–10 lojas (piloto) | `install.sh` + Docker Compose | ~10 min |
| 10–50 lojas | Imagem `.img` pre-flashada para RPi | ~3 min |
| 50+ lojas | Avaliar Balena.io ou Mender (fleet management) | varia |

## 7. Seguranca (visao geral)

| Camada | Medida |
|---|---|
| Cloud → Hub | API key rotacionavel + IP allowlist por tenant |
| Hub → Devices | API key por device (gerada no pareamento) |
| Auth funcionario | PIN 4-6 digitos + bcrypt + lockout |
| Auth dono (cloud) | NextAuth (magic link / OAuth) + 2FA opcional |
| Token MP | Cifrado em rest (`pgcrypto`) — chave em env |
| WebSocket | JWT curto (15min) + refresh; eventos validados Zod no servidor |
| Idempotencia | `event_id` UUID v7 em toda mutacao |
| Hub LAN | UFW + so portas 80/443/4000 expostas |
| Totem (kiosk) | Lock Task Android, USB debugging desabilitado |
| Updates | Imagens assinadas (cosign) |

Detalhes em cada doc de fase + ADRs especificos quando houver.

## 8. Performance — targets

| Metrica | Target |
|---|---|
| Totem TTI (RPi 4) | <1.5s |
| WebSocket latency p95 (LAN) | <80ms |
| WebSocket latency p99 (LAN) | <150ms |
| Timer drift em 30min | <500ms |
| KDS recebe ticket | <100ms apos "enviar" no totem |
| Hub boot (cold) | <30s |
| Cloud → Hub pull catalogo p95 | <2s |
| Bundle JS gzip (totem) | <300KB |

## 9. Convencoes

- **Linguagem do codigo**: TypeScript strict.
- **Estilo**: Prettier + ESLint. Lint roda em CI.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).
- **Branches**: `main` (estavel) + feature branches.
- **Tags**: `vX.Y-faseN` ao final de cada fase.
- **Documentacao**: cada fase fecha com doc + entrada em CHANGELOG.md + ADR se houver decisao nao-trivial.
- **CI obrigatorio antes de merge**: `typecheck` + `lint` + `test` + `build`.
