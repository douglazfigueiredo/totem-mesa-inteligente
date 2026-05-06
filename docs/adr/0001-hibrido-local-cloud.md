# ADR 0001 — Arquitetura hibrida local + cloud

**Status**: Accepted
**Data**: 2026-05-06
**Decisores**: Douglas Figueiredo

## Contexto

O sistema TotemMesa precisa atender pequeno e medio empreendedor (pizzaria, restaurante, lanchonete, hamburgueria) com 3 superficies sincronizadas em tempo real: totem de mesa, KDS de cozinha, app de garcom.

Tres opcoes consideradas:

1. **100% online (cloud-only)** — todas as superficies se comunicam via WebSocket com servidor cloud.
2. **100% offline (local-only)** — servidor local na loja, sem cloud.
3. **Hibrido** — servidor local na loja para tempo-real + cloud para gestao multi-tenant.

## Restricoes

- Latencia totem ↔ KDS deve ser <100ms (UX de timer real).
- Servico nao pode parar quando internet cai.
- Dono quer editar cardapio remotamente.
- Custo de operacao precisa caber em SaaS para pequeno empreendedor.
- 1 loja media tem ~13–37 conexoes WebSocket simultaneas (10–30 totens + 1–2 KDS + 2–5 garcons).

## Opcoes

### Opcao 1 — Cloud-only

**Pros**: zero infra na loja, deploy unico, dado sempre acessivel.
**Cons**: WebSocket atravessa internet (latencia 50–200ms variavel); 3.700 conexoes persistentes em 100 lojas e caro em serverless; falha de internet = restaurante para; cliente final nunca aceita "sem internet, sem pedido".

### Opcao 2 — Local-only

**Pros**: latencia minima, autonomo da internet.
**Cons**: dono nao acessa cardapio de casa; atualizar 50 lojas via pendrive nao escala; sem analytics multi-loja; sem upsell SaaS.

### Opcao 3 — Hibrido

**Pros**: tempo-real local (LAN <10ms), gestao remota via cloud, internet caindo nao quebra servico, cloud nao e caminho critico.
**Cons**: 2 codebases para manter (mitigado por monorepo + schemas compartilhados); operadores tem que instalar hub na loja (mitigado por Docker + imagem .img).

## Decisao

**Opcao 3 — Hibrido.**

3 camadas:

1. **Cloud (Vercel + Neon Postgres)** — painel SaaS multi-tenant, catalogo source-of-truth, analytics, billing.
2. **Hub local (Mini PC ou RPi 5)** — Fastify + Socket.IO + SQLite. Source-of-truth durante o servico.
3. **Devices (Next.js PWA)** — totem, KDS, garcom — conectam apenas ao hub local via Socket.IO.

Fluxo critico (pedido) e 100% local. Fluxo de gestao (cardapio, analytics) e cloud.

Sincronizacao cloud ↔ hub:
- **Pull** catalogo: hub puxa a cada 10min (ETag) ou recebe push imediato em update.
- **Push** pedidos: hub envia via outbox + retry.

## Consequencias

### Positivas

- Servico continua mesmo com internet caida.
- Latencia interna garantida (LAN).
- Escala bem: cloud nao precisa de WebSocket persistente x lojas.
- Monorepo permite reuso de schemas (Drizzle DSL → Postgres no cloud, SQLite no hub) e tipos.
- Dono tem painel remoto.

### Negativas

- Custo de operar hub na loja (mitigado por imagem .img + Docker auto-update).
- Overhead inicial de criar duas codebases (mitigado por turborepo + tipos compartilhados).
- Sincronizacao de catalogo introduz latencia eventual (10min); aceitavel para o dominio.

## Referencias

- Padaria (projeto irmao): [`/Users/douglasfigueiredo/Development/projects/Flutter/padaria`](file:///Users/douglasfigueiredo/Development/projects/Flutter/padaria)
- Design handoff: [`design_handoff_totem_pizzaria/README.md`](../../design_handoff_totem_pizzaria/README.md)
