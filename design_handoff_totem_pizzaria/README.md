# Handoff: Totem de Mesa Inteligente — Pizzaria Gigi

## Overview

Sistema de autoatendimento de mesa para pizzarias/lanchonetes, composto por **três superfícies sincronizadas em tempo real**:

1. **Totem** (tablet landscape na mesa) — cliente navega cardápio, faz pedido, acompanha timer de preparo, chama garçom
2. **KDS** (Kitchen Display System, monitor da cozinha) — fila de tickets, botão "iniciar preparo" que dispara o timer
3. **App do garçom** (smartphone) — recebe chamados de mesa + pedidos não-cozinha (bebidas, sobremesas)

O diferencial é o **timer real** baseado no momento em que a cozinha aceita o ticket (não estimativa fake), com UX que nunca trava o fluxo do cliente — o timer vira widget flutuante quando o cliente continua pedindo.

---

## About the Design Files

⚠️ **Os arquivos neste pacote são REFERÊNCIAS de design feitas em HTML** — protótipos navegáveis mostrando o look intencionado, fluxos e comportamento. **Não são código de produção pra copiar direto.**

Sua tarefa é **recriar esses designs no ambiente do seu codebase** (React Native, Flutter, web React, SwiftUI, etc.) usando os padrões e bibliotecas estabelecidas dele. Se ainda não existe codebase, escolha a stack mais apropriada — sugestão no final deste documento.

Os HTMLs usam React 18 via Babel inline + CSS plain. Não levem isso pro produto: usem o sistema de componentes nativo do projeto.

---

## Fidelity

**High-fidelity (hifi)** — paleta final, tipografia final, espaçamentos e interações decididos. O `Hi-Fi Prototype.html` deve ser recriado **pixel-perfect** usando os componentes/estilos do codebase de destino.

Os `Totem Wireframes.html` (lo-fi) servem como menu de variações exploradas — útil para entender alternativas que foram consideradas e descartadas, mas **não para implementar**.

---

## Files in This Bundle

| Arquivo                  | O que é                                                                                                                                | Como usar                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `Handoff Package.html`   | **Documento principal de handoff** — checklist priorizado P0/P1/P2 (68 itens), contrato WebSocket, specs de hardware, telas que faltam | Abrir no navegador. Use o checklist como backlog ordenado.                                           |
| `Hi-Fi Prototype.html`   | Protótipo final navegável (com molduras de tablet)                                                                                     | Abrir e clicar pra ver fluxo end-to-end e micro-interações. **Esta é a referência visual canônica.** |
| `Totem Prototype.html`   | Versão lo-fi sketchy interativa do mesmo fluxo                                                                                         | Útil pra ver lógica/estado sem distração visual                                                      |
| `Totem Wireframes.html`  | Canvas com 13 seções × 3 variações cada                                                                                                | Histórico de exploração — não implementar                                                            |
| `hifi-*.jsx`, `hifi.css` | Código-fonte do hi-fi                                                                                                                  | Referência de espaçamentos/cores/tipo                                                                |
| `proto-*.jsx`            | Código-fonte do protótipo lo-fi com store compartilhada                                                                                | Referência de estado e fluxo                                                                         |

---

## Screens / Views (Hi-Fi — implementar essas)

### TOTEM (tablet landscape, ~1280×800)

#### 1. Welcome / Boas-vindas

- **Propósito**: tela de descanso. Cliente toca pra começar.
- **Layout**: tela centralizada, headline grande "boa noite, mesa 07", subtítulo conversacional, CTA primário "ver cardápio →"
- **Elementos**: logo top-left, identificador da mesa top-right (`m-tag-gold`), CTA centralizado terracota
- **Tipo**: Fraunces 600 italic pra headlines, Inter 400-600 pro corpo

#### 2. Cardápio (browse)

- **Propósito**: descobrir e adicionar itens
- **Layout**: top bar fixo com tabs de categoria (pizzas, lanches, bebidas, sobremesas) + scroll horizontal; grid de cards 2-3 colunas com foto, nome, descrição curta, preço
- **Cards**: aspect ratio ~4:3 na foto, nome em Fraunces 18px, descrição em Inter 13px cor `#4a3525`, preço em Fraunces 700
- **Filtros**: badge "vegetariano", "sem glúten" no canto da foto

#### 3. Detalhe do produto + customização

- **Propósito**: ajustar item antes de adicionar
- **Layout**: 2 colunas — esquerda foto grande full-bleed, direita scroll com nome, descrição longa, seções de adicionais (checkbox), tamanho (radio), observações (textarea), seletor de quantidade ± e CTA "adicionar ao carrinho"
- **Adicionais**: cada um com nome + delta de preço (`+ R$ 4`)

#### 4. Carrinho

- **Propósito**: revisar antes de enviar
- **Layout**: lista de itens com thumb, nome, customizações em cinza, qtd ±, preço, botão remover; rodapé com subtotal, taxa de serviço (toggle), total grande, CTA "enviar pedido →"
- **Empty state**: ilustração + "carrinho vazio" + "voltar ao cardápio"

#### 5. Confirmação do pedido

- **Propósito**: feedback de envio + tempo estimado inicial
- **Layout**: tela centrada, ícone de confirmação, headline "pedido enviado!", "tempo estimado: ~22 min", CTA "acompanhar →" e secundário "pedir mais"

#### 6. Timer ativo (full)

- **Propósito**: acompanhar preparo
- **Layout**: anel de progresso central grande (>60% da altura), número MM:SS dentro em Fraunces 600 ~96px, status "preparando..." abaixo; lista de itens do pedido na lateral; CTA secundário "pedir mais" + "🛎 chamar garçom" no rodapé
- **Animação**: anel gira via `stroke-dashoffset` linear, recalculado do servidor a cada segundo
- **Cor**: anel terracota `#c14a26`, fundo do anel `#efe5d2`

#### 7. Timer minimizado (widget flutuante)

- **Propósito**: continuar pedindo sem perder o timer
- **Layout**: pill flutuante bottom-right, anel pequeno (40×40px) + tempo restante + nome do item curto
- **Comportamento**: clique expande pra timer full; arrastável (opcional)

#### 8. Estado "Pronto"

- **Propósito**: avisar que chegou
- **Layout**: overlay full-screen com fade-in, ícone de sino animado (treme leve), headline "tá pronto! 🎉", "seu pedido está saindo da cozinha", botão "fechar"
- **Som**: bell curto (~600ms), respeitar mute do device

#### 9. Histórico da mesa (pedidos múltiplos)

- **Propósito**: ver tudo que a mesa pediu na sessão
- **Layout**: lista de cards de pedido com timestamp, status (preparando/pronto/entregue), itens, total parcial; rodapé com "total da mesa" e CTA "pedir conta"

#### 10. Chamar garçom

- **Propósito**: atendimento humano
- **Layout**: modal centrado, headline "precisa de algo?", grid de 2×2 com motivos (talheres, água, ajuda no pedido, fechar conta), CTA "chamar garçom"
- **Pós-envio**: substituir conteúdo por "garçom a caminho..." + animação de espera

### TELAS QUE FALTAM (mockups na aba "telas que faltam" do Handoff Package.html)

11. **Login funcionário (PIN)** — cozinha/garçom/gerente. PIN 4-6 dígitos, avatares.
12. **Sem conexão / offline** — banner vermelho persistente, cardápio esmaecido, fallback "chamar garçom manual".
13. **Item esgotou no meio** — modal amigável sugerindo substitutos.
14. **Pagamento — dividir conta** — modos (igual / por item / valores), tracking de quem já pagou.
15. **Admin — cadastro de cardápio** — CRUD básico, toggle "esgotado" com sync em tempo real.
16. **Pedido pronto + alarme escalonado** — escalonamento progressivo se garçom não pega.

### KDS (monitor da cozinha, 21-27" landscape, dark theme)

- **Layout**: grid de tickets 3-4 colunas; cada ticket = card com mesa, itens, tempo desde criação, botão "iniciar"
- **Estados**: aguardando (borda dourada), preparando (borda terracota), pronto (borda verde + pulse)
- **Tema**: fundo `#1a0f08` (couro escuro), texto `#f7f1e6`, acentos dourados

### App do Garçom (smartphone, retrato)

- **Layout**: lista vertical de cards — chamados (vermelho/laranja), pedidos não-cozinha (neutro)
- **Cada card**: mesa, motivo/itens, tempo desde criação, swipe-to-resolve
- **Notificação**: push + vibração curta + som <500ms

---

## Interactions & Behavior

### Fluxo principal

1. Cliente toca welcome → cardápio
2. Adiciona itens → carrinho → enviar
3. Backend separa pedido por destino (cozinha vs garçom)
4. Cozinha recebe ticket no KDS, clica "iniciar"
5. Backend registra `started_at` + `duration_s` e faz broadcast pro totem
6. Totem mostra timer full; se cliente toca "pedir mais", vira widget minimizado
7. Quando `now - started_at >= duration`: overlay "pronto" + som + KDS muda pra verde
8. Garçom pega no balcão e leva pra mesa

### Animações

- Transições entre telas: fade-up 300ms, easing `cubic-bezier(0.2, 0, 0, 1)`
- Anel de progresso: linear (não easing — representa tempo real)
- Sino "pronto": shake 600ms, 3 oscilações
- Pulse de "esperando muito": 1s infinite

### Estados de erro críticos (P0)

- **Offline**: banner vermelho topo, cart funciona local (IndexedDB), envio bloqueado
- **Item esgotou**: modal substituto
- **Cozinha sobrecarregada**: tempo estimado maior + badge "alta demanda"
- **Garçom não responde em 3 min**: escala pra outro; em 6 min, alerta gerente
- **Pronto há 5 min sem garçom**: alarme sonoro recorrente + push

---

## State Management

### Modelo de dados (do PRD)

```typescript
type Order = {
  id: string;
  table_id: string;
  items: Item[];
  status: 'criado' | 'enviado' | 'preparando' | 'pronto';
  tipo_envio: 'cozinha' | 'garcom' | 'ambos';
  created_at: number;
};

type Item = {
  id: string;
  nome: string;
  tipo: 'cozinha' | 'garcom';
  tempo_estimado: number; // segundos
  customizations?: { adicionais: string[]; tamanho: string; obs: string };
  qty: number;
  price: number;
};

type Preparo = {
  pedido_id: string;
  started_at: number; // timestamp UTC do servidor
  duration_s: number;
};
```

### Estado do totem (cliente)

- `cart: Item[]`
- `activeOrders: Order[]` (com Preparo se started)
- `timerState: 'hidden' | 'active_full' | 'active_minimized'`
- `connectionState: 'connected' | 'reconnecting' | 'offline'`
- `waiterCallStatus: 'idle' | 'pending' | 'acknowledged'`

### ⚠️ Regra crítica do timer

**Nunca confiar no clock do tablet.** Servidor envia `started_at` + `duration_s`. Cliente calcula display:

```js
const remaining = Math.max(duration_s - (Date.now() - started_at) / 1000, 0);
```

Sincronizar com `server_time` retornado no heartbeat (drift correction).

---

## WebSocket Contract

Aba completa em `Handoff Package.html` → **🔌 contrato websocket**. 15 eventos definidos:

`order:create`, `order:created`, `prep:start`, `prep:started`, `prep:ready`, `order:cancel`, `item:unavailable`, `waiter:call`, `waiter:ack`, `waiter:resolved`, `table:close`, `payment:request`, `payment:confirmed`, `state:sync`, `heartbeat`.

**Resilência (todos P0)**:

- Retry exponencial 1s/2s/4s/8s/16s, max 30s
- Snapshot de estado ao reconectar (`state:sync` com `last_event_id`)
- Queue offline em IndexedDB
- Idempotência via `event_id` único por mensagem
- Heartbeat 15s pra detectar clientes mortos

---

## Design Tokens

### Cores

```css
--bg-cream: #ebe2ce; /* fundo principal */
--bg-paper: #fffaf0; /* cards */
--bg-soft: #faf3e2; /* cards aninhados */
--bg-warm: #efe5d2; /* botões secundários */
--ink: #2b1b10; /* texto principal */
--ink-soft: #4a3525; /* texto secundário */
--ink-mute: #7a614c; /* texto terciário / labels mono */
--terracota: #c14a26; /* CTA primário, acento quente */
--terracota-deep: #9c3819; /* hover/dark variant */
--gold: #d4a13b; /* divisores, badges, mesa */
--gold-deep: #a87b22; /* texto em badge dourado */
--green: #6b7b3a; /* pronto, sucesso */
--green-soft: #cde8e1; /* fundo sucesso suave */
--kds-dark: #1a0f08; /* fundo KDS */
--kds-text: #f7f1e6; /* texto KDS */
```

### Tipografia

- **Display**: Fraunces (Google Fonts), pesos 500/600/700, italic disponível
- **Body / UI**: Inter, pesos 400/500/600/700
- **Mono**: JetBrains Mono, peso 400, uppercase letter-spacing 0.08em pra labels

### Escala

- Spacing: 4 / 8 / 12 / 14 / 18 / 22 / 28 / 40 px
- Border radius: 4 / 6 / 8 / 10 / 12 / 14 / 18 px (cards grandes 18px)
- Shadows: `0 1px 2px rgba(43,27,16,0.04), 0 8px 20px rgba(43,27,16,0.05)` (card padrão)

### Tipografia escala

- Mono micro: 9-10px (labels uppercase)
- Body small: 11-13px
- Body: 14px
- Subtitle: 16-18px
- Title (Fraunces): 22-30px
- Display (Fraunces): 36-96px (timer)

---

## Assets

- **Fontes**: Google Fonts (Fraunces, Inter, JetBrains Mono)
- **Imagens**: Unsplash públicas no protótipo (placeholder). **Em produção**, usar fotos próprias do estabelecimento — substituir todos os `unsplash.com/...` por CDN próprio
- **Ícones**: emojis no protótipo (🛎️ 🍕 etc). **Em produção**, substituir por icon set consistente (Lucide, Phosphor, Tabler)
- **Sons**: bell `pronto.wav` (600ms, normalizado -3dB), notificação garçom curta (300ms)

---

## Hardware & Ops

Detalhado na aba **📱 hardware & ops** do `Handoff Package.html`. Resumo:

- **Tablet do totem**: 10-12" landscape, ≥400 nits, modo quiosque (Single App / Lock Task), suporte de mesa antifurto, capa silicone
- **KDS**: monitor 21-27", à prova de respingos, alto-falante 60-70dB, braço articulado
- **App garçom**: PWA ou nativo, push + vibração + som curto, login PIN

---

## Sugestão de Stack

Sem codebase pré-existente, sugestão razoável:

- **Backend**: Node.js + Fastify + Socket.IO + PostgreSQL + Redis (pra estado em tempo real e pub/sub entre totens)
- **Totem**: React Native (Android quiosque) ou Flutter — mesmo código pode rodar em iPad/Tab
- **KDS**: React web (browser fullscreen no monitor) — mais simples de iterar
- **App garçom**: React Native + push (FCM/APNS)
- **Auth**: JWT curto + refresh, PIN local pra funcionários
- **TEF**: Cielo LIO ou Stone Connect SDK (Android nativo, depende de homologação)
- **Observabilidade**: Sentry + um log estruturado simples

---

## Implementation Order (do checklist P0)

1. WebSocket contract + heartbeat + reconexão (sem isso, nada funciona)
2. Backend timer authoritative (`started_at` + `duration_s` source of truth)
3. Totem: welcome → cardápio → carrinho → enviar pedido
4. KDS: receber ticket, botão iniciar
5. Totem: timer full + minimizado + estado pronto
6. App garçom: receber chamados + pedidos não-cozinha
7. Pagamento (TEF) — começar com fallback "pagar no caixa" (QR code)
8. Estados de erro (offline, item esgotado, cancelamento)
9. Auth + PIN funcionário
10. Admin de cardápio
11. Métricas + observabilidade

Os 68 itens completos em `Handoff Package.html` → **📋 checklist**.

---

## How to Use This Bundle with Claude Code

1. Coloque `design_handoff_totem_pizzaria/` na raiz do seu repositório
2. No `CLAUDE.md` do repo, adicione:
   ```md
   # Pizzaria Gigi — Totem Inteligente

   Specs e protótipos em `design_handoff_totem_pizzaria/`. Comece pelo `README.md`.
   Visual canônico: `Hi-Fi Prototype.html` (abrir no navegador).
   Backlog ordenado: aba "📋 checklist" do `Handoff Package.html`.
   ```
3. Comando inicial sugerido pro Claude Code:
   > Leia `design_handoff_totem_pizzaria/README.md` e proponha estrutura de pastas + escolha de stack. Depois, comece pelo item 1 da seção "Implementation Order" (WebSocket contract).
