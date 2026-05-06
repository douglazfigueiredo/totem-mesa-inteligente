# ADR 0002 — PWA Next.js ao inves de React Native (totem / KDS / garcom)

**Status**: Accepted
**Data**: 2026-05-06

## Contexto

Precisamos escolher tecnologia das 3 superficies cliente: totem (tablet Android), KDS (browser fullscreen no monitor da cozinha), app garcom (smartphone).

Opcoes:

1. **React Native** — codigo unico Android+iOS, distribuicao via stores.
2. **Flutter** — Dart, codigo unico Android+iOS+web+desktop.
3. **PWA Next.js** — instalavel via "Add to Home Screen", servido pelo hub local ou cloud.

## Decisao

**PWA Next.js.**

Razoes:

1. **Mesma stack do cloud (Next.js)** — reuso direto de schemas Zod, tipos, lógica de carrinho. Elimina troca de contexto.
2. **1 codebase cobre totem + KDS + garcom + admin** — RN/Flutter cobririam totem+garcom mas nao KDS (que e desktop browser).
3. **Modo kiosk Android** ja comprovado no projeto-irmao `padaria/totem-web` (RPi + Chromium fullscreen).
4. **Iteracao 10× mais rapida** — sem ciclo de build APK / TestFlight / store review.
5. **Atualizacao instantanea** — push novo bundle, recarrega na proxima sessao. Em RN seria OTA com Expo Updates (mais complexo).
6. **Push notifications** funcionam em PWA Android (Web Push + VAPID). Suficiente para app garcom.

## Trade-offs aceitos

- Sem acesso a APIs nativas exclusivas (NFC, Bluetooth nativo). Mitigacao: pagamento via Mercado Pago Point Pro 3 que conecta via API/Bluetooth da propria maquininha, nao precisa do app dialogar com NFC. Print de comanda local via servidor de impressao (CUPS) ou impressora de rede.
- iOS PWA tem limitacoes (Push notifications recente, instalacao menos discoverable). Mitigacao: app garcom roda primariamente em Android (custo do hardware do garcom).

## Consequencias

- Stack uniforme: Next.js em todos os lugares.
- Time pode reusar componentes de design e logica entre superficies.
- Deploy de update e simples (cache busting do PWA).
- Quando crescer a ponto de precisar nativo (provavel: 100+ lojas com hardware mais variado), migracao para Capacitor/RN sera viavel reusando 70% do codigo TS.
