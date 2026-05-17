# 09 — Deploy production (Fase 9B)

Runbook completo pra colocar uma loja no ar. Topologia:

```
                 ┌──────────────────────────┐
                 │  Vercel (Cloud + PWAs)   │
                 │  ─────────────────────── │
                 │  app.totemmesa.com       │ ← admin (Next.js + Neon)
                 │  totem.totemmesa.app     │
                 │  kds.totemmesa.app       │
                 │  waiter.totemmesa.app    │
                 └──────────┬───────────────┘
                            │   eventos via outbox
                            │   /api/{catalog,tables,employees,...}
                            ▼
                 ┌──────────────────────────┐
                 │   Hub local (mini-PC)    │
                 │   docker compose         │
                 │   ────────────────────   │
                 │   Fastify :4000          │ ← real-time da loja
                 │   SQLite + Socket.IO     │
                 └──────────┬───────────────┘
                            │ rede WiFi da loja
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
          tablet totem   tablet KDS   tablet garçom
          (PWA Vercel)   (PWA Vercel) (PWA Vercel)
                         + cache SW
```

---

## 1. Provisionar banco — Neon

1. Criar conta em [neon.tech](https://neon.tech), criar projeto.
2. Copiar a connection string com `?sslmode=require`.
3. Guardar pra usar no Vercel.

## 2. Cloud no Vercel

### 2.1. Importar repo

1. [vercel.com/new](https://vercel.com/new) → Import Git Repository → escolher o repo.
2. **Root Directory**: `apps/cloud`.
3. **Framework Preset**: detectar como Next.js (`vercel.json` já configura).
4. **Build Command**: `pnpm vercel-build` (default — roda `pnpm db:migrate && next build`).
5. **Install Command**: deixar default (`pnpm install`).

### 2.2. Environment Variables (Production)

| Var | Valor |
|---|---|
| `DATABASE_URL` | connection string do Neon |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://app.totemmesa.com` (sua URL pública) |
| `AUTH_TRUST_HOST` | `true` |
| `EMAIL_SERVER_HOST` | smtp do provedor (Resend/Postmark/Mailtrap) |
| `EMAIL_SERVER_PORT` | tipicamente 587 ou 2525 |
| `EMAIL_SERVER_USER` | usuário SMTP |
| `EMAIL_SERVER_PASSWORD` | senha SMTP |
| `EMAIL_FROM` | `noreply@totemmesa.com` |

> **Não definir** `EMAIL_DEV_OWNER` nem `DEV_HUB_API_KEY` em produção — esses são só pra seed em dev.

### 2.3. Domínio

1. Adicionar domínio em **Project Settings → Domains**: `app.totemmesa.com`.
2. Configurar DNS apontando pro Vercel (CNAME ou A record conforme instruções).

### 2.4. Primeiro owner

Em produção, o seed (`db:seed`) **não roda automaticamente**. Pra criar o primeiro owner:

```bash
# Localmente, com DATABASE_URL apontando pra Neon prod:
cd apps/cloud
DATABASE_URL="postgres://..." pnpm tsx -e "
import { db, schema } from './src/db';
const tenant = await db.insert(schema.tenants).values({
  slug: 'demo', nome: 'Pizzaria Demo', vertical: 'pizzaria',
}).returning();
const owner = await db.insert(schema.owners).values({
  email: 'douglasarts@gmail.com',
}).returning();
await db.insert(schema.tenantOwners).values({
  tenantId: tenant[0].id, ownerId: owner[0].id,
});
"
```

Daí em diante, novos owners se autenticam via magic-link no `/login`.

## 3. PWAs no Vercel (3 projetos)

Cada PWA é um projeto Vercel separado apontando pro mesmo monorepo, com `Root Directory` diferente:

| PWA | Root Directory | Domínio sugerido |
|---|---|---|
| Totem | `apps/totem` | `totem.totemmesa.app` |
| KDS | `apps/kds` | `kds.totemmesa.app` |
| Waiter | `apps/waiter` | `waiter.totemmesa.app` |

### 3.1. Env vars por PWA (Production)

| Var | Valor |
|---|---|
| `NEXT_PUBLIC_HUB_URL` | placeholder (`http://localhost:4000`) — **usuário sobrescreve via `?hub=` na 1ª visita** |

> **Por que placeholder?** Cada loja tem hub com IP diferente. O PWA aceita `?hub=http://192.168.x.x:4000` na URL e salva em `localStorage`. Daí em diante, o tablet abre direto.

### 3.2. Sub-domínios

Mesmo padrão: configurar 3 domínios distintos no DNS, apontando pro Vercel.

## 4. Hub local na loja (mini-PC ou Pi 5)

### 4.1. Requisitos do mini-PC

- Linux (Ubuntu Server 24.04 LTS recomendado — i3/8GB/250GB roda folgado)
- Docker Engine 24+ com plugin compose (instalado pelo script se faltar)
- ≥ 2 GB RAM, 16 GB disco
- IP fixo na LAN (configurar no roteador)

### 4.2. Instalação

```bash
# Numa primeira máquina nova:
curl -fsSL https://raw.githubusercontent.com/douglazfigueiredo/totem-mesa-inteligente/main/deploy/hub/install.sh | bash

# Ou copiando local (clone do repo):
sudo bash deploy/hub/install.sh
```

O script:
1. Verifica pré-reqs (`curl`/`sed`/`openssl`) e instala via apt se faltar
2. Seta timezone (`America/Sao_Paulo` por default; override com `TZ=...`)
3. Instala `unattended-upgrades` (security patches automáticos)
4. Instala Docker (se faltar)
5. Configura `ufw` liberando só `22/tcp` (SSH) e `4000/tcp` (hub)
6. Verifica espaço em disco (alerta se < 5GB livre)
7. **Instala mkcert + gera CA local + cert pro hub** (cobre IP da LAN, `hub.local`, `localhost`). Pula com `SKIP_HTTPS=1`.
8. Cria `/opt/totemmesa/{docker-compose.yml,update.sh,.env,certs/}`
9. Gera `ADMIN_SECRET` aleatório (openssl ou fallback `/dev/urandom`)
10. Popula `HTTPS_CERT_PATH` / `HTTPS_KEY_PATH` no `.env`
11. Sobe o hub (HTTPS na 4000) e aguarda health-check
12. Imprime URL de pareamento + ADMIN_SECRET + caminho do `rootCA.pem` pra instalar nos tablets

**Flags de override** (env vars, opcionais):
- `SKIP_TIMEZONE=1` — não tocar em `timedatectl`
- `SKIP_AUTO_UPDATES=1` — pular `unattended-upgrades`
- `SKIP_FIREWALL=1` — não configurar `ufw` (use se a rede já tem firewall externo)
- `SKIP_DISK_CHECK=1` — pular alerta de espaço
- `SKIP_HTTPS=1` — não instalar mkcert / gerar certs (hub sobe em HTTP plano)
- `HUB_HOSTNAMES="hub.local 192.168.1.10"` — sobrescreve SANs do cert (default detecta IP + `hub.local`)
- `MIN_FREE_GB=10` — ajustar limiar do alerta de disco
- `ADMIN_HTTP_PORT=4000` — trocar a porta exposta do hub

### 4.2.1. Instalar CA nos tablets (uma vez por device)

Com HTTPS ativo, cada tablet precisa confiar na CA local da mkcert pra abrir o hub sem erro de segurança e pra que o PWA (Vercel HTTPS) consiga falar com o hub sem mixed content. Sem isso, o Chrome bloqueia a comunicação e mostra a barra de "Not Secure" em cima do app.

1. Copia o `rootCA.pem` do mini-PC pra um lugar acessível:
   ```bash
   scp hub@<ip-do-mini-pc>:/opt/totemmesa/certs/rootCA.pem ~/Downloads/
   ```
2. Compartilha o arquivo com cada tablet (AirDrop, WhatsApp, Drive, e-mail).
3. **Android**: Configurações → Segurança e privacidade → Mais → Criptografia e credenciais → Instalar certificado → CA certificate → seleciona `rootCA.pem` → confirma o aviso ("Sua rede pode ser monitorada" — é esperado, é uma CA sua mesmo).
4. **iOS** (se aplicável): instala perfil pelo Safari → Configurações → Geral → VPN e gerenciamento de dispositivo → confia no perfil → Configurações → Geral → Sobre → Configurações de Confiança de Certificado → habilita confiança total.

Depois disso, o Chrome do tablet abre `https://<ip-do-hub>:4000` normalmente, e o PWA na Vercel consegue fazer `fetch`/WebSocket sem mixed content.

### 4.3. Pareamento com cloud

1. No painel cloud (`app.totemmesa.com/admin/hubs`) → "gerar código" → copia 6 dígitos.
2. No mini-PC: abrir `http://<ip-do-hub>:4000/admin/cloud/pair`.
3. Login com `ADMIN_SECRET` (impresso no install.sh).
4. Cola o código de 6 dígitos. Cloud responde com apiKey, hub salva em `cloud_link`.
5. Em até 60s, hub puxa cardápio + mesas + funcionários + tenant config.

### 4.4. Validar

```bash
# No mini-PC:
docker compose -f /opt/totemmesa/docker-compose.yml logs -f hub

# Espera ver:
# [catalog-poller] snapshot atualizado
# [catalog-poller] tables sincronizadas
# [catalog-poller] employees sincronizados
# [catalog-poller] tenant config atualizada
```

E no cloud, em `/admin/hubs`, o hub aparece **online** com "último evento" recente.

## 5. Tablets na loja

### Totem (uma vez por mesa)

1. No tablet, abrir Chrome em `https://totem-mesa-inteligente-totem.vercel.app/?hub=https://192.168.1.10:4000` (substituir IP; se rodando hub em HTTP, usar `http://`).
2. "Adicionar à tela inicial" pra virar PWA.
3. Service worker da fase 8.5 cacheia shell — funciona offline depois da 1ª carga.
4. Pareamento: usuário abre o totem, escolhe a mesa, recebe código no totem cloud → digita... (já implementado em fase 3).

### KDS (cozinha)

1. `https://totem-mesa-inteligente-kds.vercel.app/?hub=https://192.168.1.10:4000`
2. PIN do funcionário (gerado em `/admin/funcionarios`).

### Waiter (garçom)

1. `https://totem-mesa-inteligente-waiter.vercel.app/?hub=https://192.168.1.10:4000`
2. PIN do funcionário.

## 6. Operação contínua

### Atualização do hub

```bash
# Manual (recomendado em loja):
ssh hub@<ip>
sudo bash /opt/totemmesa/update.sh           # pega tag corrente
sudo bash /opt/totemmesa/update.sh --tag abc1234  # pin em SHA específico
sudo bash /opt/totemmesa/update.sh --rollback     # volta versão
```

### Atualização do cloud / PWAs

Auto-deploy via Vercel Git integration. Push em `main` → produção. Push em qualquer branch → preview URL.

### Monitoring básico

- Cloud: `/admin/hubs` mostra hubs online/offline + eventos 24h.
- Hub: `docker compose logs -f` no mini-PC.
- Vercel: Logs no dashboard de cada projeto.

## 7. Troubleshooting

| Sintoma | Causa provável | Fix |
|---|---|---|
| Hub fica "offline" no cloud | Internet caiu na loja, ou `cloud_link.apiKey` foi revogado | Verificar internet; re-parear se preciso |
| Totem mostra "sem conexão com hub" | IP do hub mudou, tablet com URL antiga | Reabrir com `?hub=novo-ip` |
| KDS/garçom: "PIN inválido" | Sync ainda não rodou, ou funcionário desativado no cloud | Aguardar 60s ou checar status no cloud |
| Mesa nova não aparece pra parear no totem | Sync não rodou ainda | `docker compose logs hub \| grep tables` |
| Pedidos não aparecem em `/admin/pedidos` | Outbox do hub não está enviando | Conferir log do hub: `outbox push failed`? Pareamento expirou? |
| Migration falhou no deploy do cloud | DB está incompatível com migrations | Rollback do deploy via `vercel rollback` |

---

## Checklist de produção (1ª loja)

- [ ] Neon DB criado, `DATABASE_URL` em mãos.
- [ ] Cloud no Vercel deployado, `app.totemmesa.com` acessível.
- [ ] Owner criado manualmente no banco, login funcionando.
- [ ] PWAs (totem/KDS/waiter) deployadas, sub-domínios apontando.
- [ ] Cardápio + mesas + funcionários cadastrados pelo cloud.
- [ ] Mini-PC instalado com `install.sh`, hub respondendo em `:4000/health`.
- [ ] Hub pareado via UI, sync funcionando (logs do poller).
- [ ] Tablets configurados com `?hub=...` e adicionados à tela inicial.
- [ ] Totem testa pedido completo: pareamento → menu → carrinho → enviar.
- [ ] KDS recebe ticket, marca pronto.
- [ ] Garçom recebe pronto, marca entregue.
- [ ] Pedido aparece no `/admin/pedidos` do cloud.
- [ ] Som do garçom funcionando ao chamar.
