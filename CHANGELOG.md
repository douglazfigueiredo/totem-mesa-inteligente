# Changelog

Registro de mudancas relevantes do TotemMesa Inteligente.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento: `vX.Y-faseN` no fim de cada fase.

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
