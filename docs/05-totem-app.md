# 05 — Totem PWA

> Status: Fase 3A ✅ (foundation + pairing + welcome). 3B/3C/3D pendentes.

PWA Next.js 15 que roda em tablets em modo kiosk. 1 totem por mesa.

## 1. Stack

- Next.js 15 (App Router, RSC + client components)
- React 19
- Zustand 5 (estado client persistido em localStorage)
- Socket.IO Client (real-time, Fase 3C)
- CSS modules + CSS variables (sem Tailwind — fidelidade ao handoff hi-fi)
- Fonts: Fraunces (display) + Inter (body) + JetBrains Mono (labels), via `next/font` (auto-host)

Bundle First Load JS: ~105KB (target era <300KB ✅).

## 2. Decisao de design

| Aspecto                 | Decisao                | Justificativa                                                                                              |
| ----------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| Tailwind vs CSS modules | CSS modules + CSS vars | Handoff e pixel-perfect — Tailwind atrapalharia fidelidade. CSS vars = tokens diretos do `@app/ui/tokens`. |
| Fonts                   | `next/font/google`     | Self-hosted automatico, zero CLS, sem rede em runtime.                                                     |
| State client            | Zustand                | Mais simples que Redux/Jotai, persist via localStorage built-in.                                           |
| Pareamento              | Manual via UI          | Cliente nao confia em deep link. Funcionario digita codigo no totem na hora de instalar.                   |

## 3. Auth e pareamento

`apiKey` do device fica em `localStorage` chave `tm-totem-auth` (Zustand persist). Limpar = "desemparelhar".

Fluxo:

1. App carrega → `useAuthStore` hidrata do localStorage.
2. Se nao paired → redirect `/pair`.
3. Em `/pair`: input codigo 6 dig + numero mesa + tableId.
4. `POST /devices/pair` no hub → recebe `{ device, apiKey }`.
5. Salva no store + redirect `/`.

```ts
// auth-store.ts
useAuthStore.setPaired({ apiKey, deviceId, tenantId, tableId, tableNumero });
```

## 4. Hub client (`lib/hub-client.ts`)

Wrapper tipado de `fetch` com:

- `apiKey` automatico via header `x-device-api-key`.
- Idempotency via `x-event-id` opcional.
- ETag/`if-none-match` para catalog.
- `HubError` tipada (status + code + message).

## 5. Estrutura

```
apps/totem/
├── next.config.ts          transpilePackages para @app/* monorepo
├── tsconfig.json           strict + paths @/*
├── public/manifest.json    PWA fullscreen landscape
├── src/
│   ├── app/
│   │   ├── layout.tsx      fonts + globals
│   │   ├── globals.css     CSS variables do design system (cores/spacing/fonts/motion)
│   │   ├── page.tsx        Welcome (redirect /pair se nao emparelhado)
│   │   ├── pair/page.tsx   Pareamento
│   │   └── menu/page.tsx   stub (Fase 3B)
│   ├── components/
│   │   ├── PairingForm.tsx + .module.css
│   │   └── Welcome.tsx + .module.css
│   └── lib/
│       ├── auth-store.ts
│       └── hub-client.ts
```

## 6. Validacao Fase 3A

- `pnpm typecheck` ✅
- `pnpm build` ✅ (4 rotas, 105KB First Load)
- Dev server em :3001 → `/`, `/pair`, `/menu`, `/manifest.json` retornam 200.
- Pareamento real validado: hub gera codigo → totem POST /devices/pair → recebe apiKey 43 chars.

## 7. Pendente — Fases 3B/3C/3D

| Fase   | Escopo                                                                                                                                                                 |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **3B** | Cardapio (categories + grid) + product detail (multi-vertical: pizza meio-a-meio, ponto carne) + cart Zustand + IndexedDB persist (Dexie) + POST /orders + confirmacao |
| **3C** | Socket.IO connect + timer ativo (anel SVG, server-authoritative) + minimizado (widget flutuante) + estado pronto (overlay + sino) + state:sync na reconexao            |
| **3D** | Chamar garcom (modal 2x2) + banner offline + modal item esgotou + acessibilidade WCAG AA                                                                               |
