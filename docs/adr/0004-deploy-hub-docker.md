# ADR 0004 — Docker Compose + imagem .img para deploy do hub

**Status**: Accepted
**Data**: 2026-05-06

## Contexto

O hub local precisa rodar em hardware heterogeneo (RPi 5, Mini PC x86, Intel NUC) em centenas de lojas eventualmente. Provisionamento manual nao escala. Atualizacoes precisam ser seguras (rollback se quebrar).

Opcoes:

1. **Script bash de bootstrap** (curl | bash + apt install + systemd).
2. **Docker Compose** — imagens versionadas, ambiente isolado, mesmo runtime em qualquer host.
3. **Pacote .deb / .snap** — distribuicao Debian-style.
4. **Imagem completa do SO** (.img) — flash com Raspberry Pi Imager, boota pronto.
5. **Ansible** — provisionamento idempotente via SSH.
6. **Balena.io / Mender** — fleet management profissional para IoT.

## Decisao

**Docker Compose como runtime + script `install.sh` no Estagio 1, depois imagem `.img` pre-configurada no Estagio 2; Balena/Mender so se passar de 50 lojas (Estagio 3).**

### Estagios

| Escala                  | Setup                                              | Tempo por loja | Implementacao                 |
| ----------------------- | -------------------------------------------------- | -------------- | ----------------------------- |
| 1–10 lojas (Estagio 1)  | `install.sh` + Docker Compose                      | ~10 min        | Fase 0 + ajustes na Fase 2    |
| 10–50 lojas (Estagio 2) | Imagem `.img` (RPi OS Lite + Docker pre-instalado) | ~3 min         | Apos Fase 9 (piloto validado) |
| 50+ lojas (Estagio 3)   | Avaliar Balena.io ou Mender                        | varia          | Decisao futura                |

### Por que Docker Compose como base

| Criterio                       | Sem Docker                | Com Docker Compose          |
| ------------------------------ | ------------------------- | --------------------------- |
| Reproduzir bug "so na loja X"  | versao do node difere     | imagem identica             |
| Rollback de update quebrado    | git checkout + reinstall  | `docker compose up old-tag` |
| Adicionar Redis/Postgres local | apt + systemd manual      | +5 linhas no compose        |
| Update atomic                  | janela com app fora do ar | pull → up zero-downtime     |
| Overhead RPi 5 (8GB)           | —                         | ~80MB RAM, irrelevante      |
| Dev local identico ao prod     | macOS≠RPi                 | mesmo `docker compose up`   |

### Por que NAO Balena/Mender no v1

- Custo: Balena ~$3/device/mes — em 100 lojas = $300/mes.
- Lock-in: arquitetura especifica.
- Overhead inicial: integracao com pipeline atual exige tempo desproporcional para 10 lojas.

Manter compatibilidade futura: imagem .img do Estagio 2 sera adaptavel para Balena/Mender (eles suportam apps em Docker).

## Implementacao Fase 0

- `apps/hub/Dockerfile` (multi-stage, Node 22 alpine, multi-arch via buildx).
- `deploy/hub/docker-compose.yml` (hub + redis + watchtower).
- `deploy/hub/docker-compose.dev.yml` (override para dev local).
- `deploy/hub/install.sh` (one-liner de instalacao na loja).
- `deploy/hub/update.sh` (update / rollback manual).
- `deploy/hub/.env.example`.
- CI: `.github/workflows/hub-image.yml` (build multi-arch + push para GHCR; desabilitado no Fase 0, ativado na Fase 2).

## Atualizacoes automaticas

- Watchtower configurado com `WATCHTOWER_POLL_INTERVAL=300` (5 min).
- Apenas tags assinadas (cosign) — implementacao na Fase 9.
- Rollback: `update.sh --rollback` reverte para `.env.previous` salvo automaticamente.

## Consequencias

### Positivas

- Operador da loja nao precisa conhecer Node/npm/git.
- Update zero-downtime e auditavel.
- Mesma stack roda no dev e prod.
- Migracao para imagem .img / Balena no futuro nao quebra runtime.

### Negativas

- Build CI mais lento (multi-arch ARM64 + AMD64 ~5min com cache, ~15min sem).
- Operador precisa entender minimo de `docker compose ps` / `logs` para debug — mitigado com runbook em `docs/04-deploy-hub.md`.
- Watchtower auto-update sem assinatura no Estagio 1 e risco de baixa probabilidade (dependencia em GHCR + nossa pipeline). Mitigado por testes E2E + canary release na Fase 9.
