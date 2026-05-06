# Documentação — TotemMesa Inteligente

Indice de docs do projeto. Cada fase de desenvolvimento fecha com um doc novo aqui.

## Por papel

| Quem voce e | Comece por |
|---|---|
| Dev novo no projeto | [`00-arquitetura.md`](./00-arquitetura.md) |
| Quer entender uma decisao | [`adr/`](./adr/) — Architecture Decision Records |
| Vai instalar hub na loja | [`04-deploy-hub.md`](./04-deploy-hub.md) |
| Vai operar o painel cloud | `08-cloud-saas.md` (Fase 6) |

## Indice por fase

| Fase | Doc | Status |
|---|---|---|
| 0 — Fundacao | [`00-arquitetura.md`](./00-arquitetura.md) | ✅ |
| 1 — Schemas e WebSocket | [`01-data-model.md`](./01-data-model.md) | ✅ |
| 2 — Hub local | [`03-hub-local.md`](./03-hub-local.md) + [`04-deploy-hub.md`](./04-deploy-hub.md) | ✅ (2A+2B+2C+2D) |
| 3 — Totem | `05-totem-app.md` | ⏳ |
| 4 — KDS | `06-kds.md` | ⏳ |
| 5 — App Garcom | `07-waiter-app.md` | ⏳ |
| 6 — Cloud SaaS | `08-cloud-saas.md`, `09-pareamento.md` | ⏳ |
| 7 — Pagamento | `10-pagamento.md` | ⏳ |
| 8 — Erros & resiliencia | `11-error-states.md` | ⏳ |
| 9 — Observabilidade & piloto | `12-observability.md`, `13-runbook-piloto.md` | ⏳ |
| 10 — Hardening & multi-vertical | `14-vertical-recipes.md`, `15-test-strategy.md` | ⏳ |

## ADRs

| ADR | Decisao |
|---|---|
| [0001](./adr/0001-hibrido-local-cloud.md) | Arquitetura hibrida local + cloud |
| [0002](./adr/0002-pwa-vs-react-native.md) | PWA (Next.js) ao inves de React Native |
| [0003](./adr/0003-fastify-vs-nestjs.md) | Fastify (em vez de NestJS) no hub local |
| [0004](./adr/0004-deploy-hub-docker.md) | Docker Compose + imagem .img para deploy do hub |
