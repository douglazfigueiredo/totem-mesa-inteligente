# @app/totem

PWA do totem de mesa (1 por mesa, tablet landscape).

## Status

- **Fase 3A** ✅ — Foundation: Next.js 15 + design tokens + auth/pairing + Welcome screen.
- **Fase 3B** ⏳ — Cardapio + cart + checkout.
- **Fase 3C** ⏳ — Real-time (Socket.IO + timer + estado pronto).
- **Fase 3D** ⏳ — Edge cases (waiter call, offline, item esgotou).

## Dev

```bash
# 1) Hub local rodando em :4000
cd ../../deploy/hub && docker compose -f docker-compose.dev.yml up -d

# 2) Totem em :3001
cd apps/totem
cp .env.example .env.local
pnpm dev
# -> http://localhost:3001
```

## Pareamento (manual durante dev)

```bash
# Gerar codigo no hub
ADMIN_SECRET="dev-admin-secret-min-20-chars-XX"
curl -X POST http://localhost:4000/admin/pairing-codes \
  -H "x-admin-secret: $ADMIN_SECRET" -H "content-type: application/json" \
  -d '{"role":"totem"}'
# -> { "code": "######", ... }

# Pegar tableId de uma mesa
docker exec tm-hub-dev node -e "console.log(require('better-sqlite3')('/data/hub.db').prepare('SELECT id, numero FROM tables LIMIT 3').all())"

# Acessa http://localhost:3001/pair, informa o code + numero da mesa + tableId
```

## Stack

- Next.js 15 (App Router, RSC + client components)
- React 19
- Zustand 5 (estado client persistido em localStorage)
- Socket.IO Client 4 (real-time, Fase 3C)
- CSS modules + CSS variables (sem Tailwind — fidelidade ao handoff)
- Fonts: Fraunces (display) + Inter (body) + JetBrains Mono (labels) via `next/font`

## Estrutura

```
src/
├── app/
│   ├── layout.tsx       # fonts + globals
│   ├── globals.css      # CSS vars do design system
│   ├── page.tsx         # Welcome (redirect /pair se nao emparelhado)
│   ├── pair/page.tsx    # Pareamento
│   └── menu/page.tsx    # Cardapio (Fase 3B stub)
├── components/
│   ├── PairingForm.tsx
│   └── Welcome.tsx
└── lib/
    ├── auth-store.ts    # Zustand persistido
    └── hub-client.ts    # fetch wrapper tipado
```
