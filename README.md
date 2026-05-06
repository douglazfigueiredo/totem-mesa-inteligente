# TotemMesa Inteligente

SaaS multi-tenant de **totem de mesa** para pizzaria, restaurante, lanchonete e hamburgueria. 3 superficies sincronizadas em tempo real: totem (tablet, 1 por mesa) + KDS (cozinha) + app garcom.

> **Status**: Fase 0 — Fundacao. Apps esqueleto, ainda sem implementacao funcional.
>
> Plano de desenvolvimento completo em [`docs/00-arquitetura.md`](./docs/00-arquitetura.md).

---

## Estrutura

```
apps/
  cloud/      Painel SaaS multi-tenant (Next.js + Neon)        [Fase 6]
  hub/        Servidor da loja (Fastify + SQLite + Socket.IO)  [Fase 2]
  totem/      PWA tablet (1 por mesa)                          [Fase 3]
  kds/        PWA monitor cozinha                              [Fase 4]
  waiter/     PWA garcom                                       [Fase 5]

packages/
  schemas/    Zod + Drizzle DSL compartilhado
  ui/         Design tokens + componentes
  types/      Types compartilhados

deploy/
  hub/        Docker Compose + install.sh para hub local
  totem-kiosk/  Configuracao kiosk Android                     [Fase 3]
  cloud/      Vercel deploy                                    [Fase 6]

docs/         Documentacao por fase + ADRs
design_handoff_totem_pizzaria/   Handoff de design (HTMLs hi-fi)
```

## Quickstart (dev)

Pre-requisitos: Node 22, pnpm 9, Docker (opcional para rodar hub).

```bash
pnpm install
pnpm typecheck       # valida tipos em todos os pacotes
pnpm build           # build tudo (apps esqueleto sao no-op por ora)
```

### Hub local (dev)

```bash
cd apps/hub
pnpm dev             # http://localhost:4000/health
```

Ou via Docker (replica o ambiente da loja):

```bash
cd deploy/hub
docker compose -f docker-compose.dev.yml up --build
```

## Documentacao

Indice completo: [`docs/README.md`](./docs/README.md).

Pontos de partida:

| Quem voce e | Comece por |
|---|---|
| Dev novo no projeto | [`docs/00-arquitetura.md`](./docs/00-arquitetura.md) |
| Quer entender uma decisao | [`docs/adr/`](./docs/adr/) |
| Vai instalar hub na loja | `docs/04-deploy-hub.md` (Fase 2) |

## Plano de fases

10 fases, ~14 semanas com 1 dev senior. Cada fase fecha com doc + tag git `vX.Y-faseN`.

| Fase | Tema |
|---|---|
| 0 | Fundacao (monorepo + Docker + docs base) — **atual** |
| 1 | Schemas e contrato WebSocket |
| 2 | Hub local |
| 3 | Totem |
| 4 | KDS |
| 5 | App Garcom |
| 6 | Cloud SaaS |
| 7 | Pagamento (MP Point Pro 3) |
| 8 | Estados de erro & resiliencia |
| 9 | Observabilidade & deploy piloto |
| 10 | Hardening & multi-vertical polish |

Detalhes: [`docs/00-arquitetura.md`](./docs/00-arquitetura.md).

## Convencoes

- Linguagem: **TypeScript strict** em todo lugar.
- Estilo: Prettier + ESLint (CI valida).
- Commits: Conventional Commits.
- Branches: `main` estavel + feature branches.
- **Toda fase fecha com doc** — sem doc, fase nao fecha.

## Licenca

Privado / proprietario. © 2026 Douglas Figueiredo.
