# ADR 0003 — Fastify (em vez de NestJS) no hub local

**Status**: Accepted
**Data**: 2026-05-06

## Contexto

O hub local roda em hardware modesto (RPi 5 8GB ou Mini PC fanless ~$200) e precisa servir WebSocket + REST para 13–37 devices simultaneos por loja.

Opcoes para o framework Node:

1. **Fastify** — leve, schema-first via JSON Schema/Ajv, plugin system, alta performance.
2. **NestJS** — opinativo, DI container, decorators, gigante mas estruturado.
3. **Express** — minimalista, ecossistema maduro, mais lento que Fastify.
4. **Hono** — modernissimo, edge-first, bom para Cloudflare Workers.

## Decisao

**Fastify.**

Razoes:

1. **Performance** — ~2-3x mais rapido que Express, ~5-7x mais rapido que NestJS em benchmarks de throughput.
2. **Plugin Socket.IO oficial** — `@fastify/socket.io` integra naturalmente.
3. **Validacao via Zod** — `fastify-type-provider-zod` da type-safety end-to-end com schemas compartilhados em `@app/schemas`.
4. **Footprint** — node_modules ~100MB; NestJS chega a 200–300MB. Importa em imagem Docker rodando em RPi.
5. **Reuso de conhecimento** — projeto-irmao `padaria/backend-fastify` ja usa Fastify; padroes ja estabelecidos.
6. **Sem ceremonia** — DI container do Nest e overkill para o escopo do hub (servidor focado em WebSocket + uns 10 endpoints REST).

## Trade-offs aceitos

- Sem DI built-in (mitigado: hub e pequeno; passar deps por argumento e suficiente).
- Estrutura menos "enterprisy" — bom para velocidade, exige disciplina para manter organizacao.

## Consequencias

- Hub roda confortavelmente em RPi 5 com folga de RAM (~150MB em idle).
- Integracao Zod direta nas rotas e WebSocket events.
- Manutenibilidade: poucos conceitos, codigo direto.
- Se um dia precisarmos migrar para NestJS (cenario improvavel), a logica de dominio em `packages/schemas` + servicos puros e portavel.

## Referencias

- Padaria backend-fastify: [`/Users/douglasfigueiredo/Development/projects/Flutter/padaria/backend-fastify`](file:///Users/douglasfigueiredo/Development/projects/Flutter/padaria/backend-fastify)
- Fastify benchmarks: https://fastify.dev/benchmarks/
