# 10 — Instalação do hub na loja piloto

> Guia operacional passo-a-passo para instalar o hub TotemMesa em mini-PC com Ubuntu Server 24.04 LTS. Pensado pra primeira loja real (piloto). Para arquitetura conceitual ver [`00-arquitetura.md`](./00-arquitetura.md); para runbook geral ver [`09-deploy.md`](./09-deploy.md).

## 0. Pré-requisitos

### 0.1 Hardware mínimo (já validado)

- CPU: Intel i3 (qualquer geração recente) ou equivalente
- RAM: 8 GB
- Storage: SSD 250 GB (NVMe ou SATA — **nunca HDD**)
- Rede: Ethernet ligado ao roteador da loja
- Energia: idealmente atrás de no-break (5min basta — quedas curtas não derrubam o hub)

### 0.2 No teu laptop, antes de ir pra loja

- [ ] Pen-drive USB de 8 GB+ (vai virar instalador)
- [ ] ISO do **Ubuntu Server 24.04.2 LTS** baixada (~3 GB):
  https://ubuntu.com/download/server
- [ ] Ferramenta pra gravar o pen-drive: [Balena Etcher](https://etcher.balena.io/) (Mac/Win/Linux)
- [ ] Cabo de rede + monitor + teclado USB pra primeira instalação
- [ ] Acesso ao roteador da loja (admin) pra configurar IP fixo
- [ ] Acesso ao painel cloud em produção
  (`https://totem-mesa-inteligente-cloud.vercel.app`)

---

## 1. Preparar o pen-drive instalador

No teu laptop:

1. Abre o **Balena Etcher**
2. **Flash from file** → seleciona o ISO `ubuntu-24.04.2-live-server-amd64.iso`
3. **Select target** → escolhe o pen-drive (cuidado pra não escolher disco do laptop!)
4. **Flash!** — ~5-10 min
5. Pronto. Não ejeta, só remove com segurança.

---

## 2. BIOS do mini-PC

Liga o mini-PC com o pen-drive plugado, aperta a tecla de boot menu (varia por fabricante: `F2`, `F10`, `F12`, `Del`, `Esc`).

**Verificar e ajustar:**

- [ ] **Boot order**: USB primeiro
- [ ] **Secure Boot**: pode deixar ligado (Ubuntu 24.04 suporta)
- [ ] **Wake on LAN** (opcional): habilita se quiser ligar remotamente
- [ ] **AC Power Recovery / Restore on Power Loss**: **Always On** ou **Last State** — pra hub ligar sozinho se cair luz

Salva (`F10` geralmente) e deixa bootar do USB.

---

## 3. Instalação do Ubuntu Server 24.04

Tela a tela:

| Tela | O que fazer |
|---|---|
| **Language** | English (recomendado — manter logs/comandos em inglês) |
| **Installer update** | "Continue without updating" se aparecer |
| **Keyboard** | Portuguese (Brazil) — variant default |
| **Type of install** | **Ubuntu Server** (NÃO o "minimized") |
| **Network** | A interface ethernet vai pegar IP via DHCP automaticamente. Anota o IP que aparece — você vai precisar dele. |
| **Proxy** | Em branco |
| **Mirror** | Default |
| **Storage** | "Use entire disk" → marca **"Set up this disk as an LVM group"**. ⚠️ Vai apagar tudo no SSD. |
| **Storage confirmation** | Confirma "Continue" |
| **Profile setup** | • Your name: `Loja Piloto` (ou nome do cliente) <br> • Server's name: `totemmesa-hub` <br> • Username: `tm` (curto, fácil) <br> • Password: forte (anota num gerenciador!) |
| **SSH Setup** | ✅ **Install OpenSSH server** (essencial pra você administrar remoto depois) |
| **Featured snaps** | NADA marcado — pula |

**Aguarda instalação** (~5-15 min). No final, "Reboot Now". Remove o pen-drive quando avisar.

---

## 4. Primeiro boot e setup básico

Faz login no console com `tm` / senha que você criou.

```bash
# Atualizar sistema (5-10 min)
sudo apt update && sudo apt upgrade -y

# Reiniciar pra aplicar kernel novo se houve atualização
sudo reboot
```

Login de novo após o reboot. Verifica IP:

```bash
ip -4 addr show | grep inet
```

Anota o IP da interface ethernet (algo como `192.168.1.50`). Esse é o **IP do hub** — vai ser referenciado em todo lugar daqui pra frente.

---

## 5. Configurar IP fixo no roteador (recomendado)

> Por que: se o IP mudar, os tablets perdem conexão e você precisa reconfigurar cada um. Com DHCP reservation, o roteador SEMPRE atribui o mesmo IP pro hub.

1. No roteador da loja, busca **DHCP Reservation** ou **Static IP** ou **Address Reservation**
2. Adiciona uma regra:
   - **MAC address**: o do hub. Pega rodando no hub:
     ```bash
     ip link show | grep ether
     ```
   - **IP**: o que o hub já pegou (ex: `192.168.1.50`) — assim nada muda
   - **Hostname**: `totemmesa-hub`
3. Salva.

**Alternativa** (sem mexer no roteador): IP estático via netplan. Pula essa seção e configura assim no hub:

```bash
sudo nano /etc/netplan/50-cloud-init.yaml
```

Edita pra ficar:

```yaml
network:
  ethernets:
    enp1s0:               # nome da interface — verifica com `ip link`
      dhcp4: false
      addresses: [192.168.1.50/24]
      routes:
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses: [1.1.1.1, 8.8.8.8]
  version: 2
```

Aplica:

```bash
sudo netplan apply
```

⚠️ Cuidado: errar netmask/gateway pode te tirar da rede. Faça com monitor ligado.

---

## 6. Acesso SSH a partir do laptop (opcional mas útil)

A partir desse ponto você pode fechar monitor/teclado da loja e administrar remoto.

No teu laptop:

```bash
ssh tm@192.168.1.50    # IP do hub
```

Para evitar digitar senha toda vez:

```bash
# No laptop, se ainda não tem chave SSH:
ssh-keygen -t ed25519

# Copia chave pública pro hub:
ssh-copy-id tm@192.168.1.50
```

---

## 7. Instalar o hub

No hub (via SSH ou direto):

```bash
curl -fsSL https://raw.githubusercontent.com/douglazfigueiredo/totem-mesa-inteligente/main/deploy/hub/install.sh | bash
```

O script faz tudo automaticamente (~5 min em rede decente):

1. Instala `curl`, `sed`, `openssl` se faltarem
2. Seta timezone para `America/Sao_Paulo`
3. Instala `unattended-upgrades` (security patches automáticos)
4. Instala Docker
5. Configura `ufw` (firewall) — libera só `22/tcp` (SSH) e `4000/tcp` (hub)
6. Avisa se há pouco espaço em disco
7. Cria `/opt/totemmesa/{docker-compose.yml,update.sh,.env}`
8. Gera `ADMIN_SECRET` aleatório
9. Sobe o hub e aguarda health-check passar

**No final**, o script imprime um bloco com:
- URL de pareamento: `http://192.168.1.50:4000/admin/cloud/pair`
- `ADMIN_SECRET`: uma string hex de 64 caracteres

📌 **Anota esse `ADMIN_SECRET`** — você vai usar agora e nas próximas administrações.

### Verificar que subiu

```bash
curl http://127.0.0.1:4000/health
```

Deve retornar JSON com `"status": "ok"` e `"cloud": { "paired": false }`.

---

## 8. Parear o hub com o cloud (produção)

### 8.1 No painel cloud

No teu laptop, navega para:

```
https://totem-mesa-inteligente-cloud.vercel.app/admin/hubs
```

Faz login (magic-link via email).

1. Clica em **"gerar código"**
2. Copia o **código de 6 dígitos** que aparece (TTL 10 min)

### 8.2 No hub

A partir do laptop ou direto no hub:

```bash
ADMIN_SECRET="cole-aqui-o-secret-anotado-no-passo-7"
CODIGO="123456"   # cola o código de 6 dígitos

curl -s -X POST http://192.168.1.50:4000/admin/cloud/pair \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: ${ADMIN_SECRET}" \
  -d "{\"code\":\"${CODIGO}\",\"cloudBaseUrl\":\"https://totem-mesa-inteligente-cloud.vercel.app\"}"
```

Resposta esperada:

```json
{
  "paired": true,
  "tenantId": "...",
  "tenantNome": "Pizzaria do João",
  "hubId": "...",
  "hubNome": "hub-loja-piloto",
  "pairedAt": 1778000000000
}
```

### 8.3 Aguardar primeira sync

Em até 60s o hub puxa cardápio + mesas + funcionários + config. Acompanhe:

```bash
docker compose -f /opt/totemmesa/docker-compose.yml logs -f hub
```

Espera ver no log:

```
[catalog-poller] snapshot atualizado     (cardápio)
[catalog-poller] tables sincronizadas    (mesas)
[catalog-poller] employees sincronizados (PINs)
[catalog-poller] tenant config atualizada
```

Sai do log com `Ctrl-C`.

---

## 9. Configurar tablets (totem / KDS / waiter)

Cada tablet vira um device com role específica.

### 9.1 Cadastrar funcionários (uma vez, no cloud)

Em `https://totem-mesa-inteligente-cloud.vercel.app/admin/funcionarios`:

- Cria 1+ funcionários por papel (cozinheiro, garçom, gerente)
- **Anota o PIN gerado** (aparece UMA vez no toast — 12s)

### 9.2 Pareamento de cada tablet

No tablet (Android, modo paisagem), abre Chrome e navega pra:

```
https://totem.totemmesa.app/?hub=http://192.168.1.50:4000     # tablet de mesa
https://kds.totemmesa.app/?hub=http://192.168.1.50:4000       # tablet da cozinha
https://waiter.totemmesa.app/?hub=http://192.168.1.50:4000    # tablet do garçom
```

> A URL do hub fica salva no `localStorage` do tablet — você só precisa abrir com `?hub=...` **uma vez**.

Em cada tablet, na tela `/pair`:

1. No hub admin (`http://192.168.1.50:4000/admin`, login com `ADMIN_SECRET`), gera um código por role:
   - `totem`
   - `kds`
   - `waiter`
2. Digita o código no tablet
3. Para o **totem**: escolhe a mesa correspondente
4. Para **KDS / waiter**: vai pra tela de PIN — funcionário entra com seu PIN

### 9.3 Salvar como app na home screen do tablet (opcional)

No Chrome do tablet → menu (⋮) → **"Adicionar à tela inicial"**. Vira ícone, abre fullscreen.

---

## 10. Operação diária

### Comandos úteis

```bash
# Ver logs em tempo real
docker compose -f /opt/totemmesa/docker-compose.yml logs -f hub

# Ver últimas 100 linhas
docker compose -f /opt/totemmesa/docker-compose.yml logs --tail 100 hub

# Status dos containers
docker compose -f /opt/totemmesa/docker-compose.yml ps

# Reiniciar (sem perder dados — volume Docker preserva DB)
docker compose -f /opt/totemmesa/docker-compose.yml restart hub

# Atualizar pra última versão estável
sudo bash /opt/totemmesa/update.sh

# Atualizar pra versão específica
sudo bash /opt/totemmesa/update.sh --tag v0.5.0

# Reverter última atualização
sudo bash /opt/totemmesa/update.sh --rollback
```

### Health-check rápido

```bash
curl -s http://127.0.0.1:4000/health | python3 -m json.tool
```

Confere `cloud.paired: true` e `cloud.lastSyncAt` recente (últimos minutos).

### Backup automático

Já configurado: 1×/dia, mantém últimos 7 backups em `/var/lib/docker/volumes/totemmesa-hub_hub-data/_data/backups/`. Pra mexer:

```bash
sudo ls -la /var/lib/docker/volumes/totemmesa-hub_hub-data/_data/backups/
```

Pra restaurar um backup específico, abre suporte (procedimento envolve parar o hub, copiar o `.db`, reiniciar — não-trivial pra cliente fazer sozinho).

---

## 11. Troubleshooting

### "Hub não responde" (curl falha)

```bash
docker compose -f /opt/totemmesa/docker-compose.yml ps
# Se "Exited" — sobe de novo:
docker compose -f /opt/totemmesa/docker-compose.yml up -d
# Ainda falha? Olha o log:
docker compose -f /opt/totemmesa/docker-compose.yml logs --tail 50 hub
```

### Tablets mostram "sem conexão com hub"

1. Confirma que o tablet está na mesma rede WiFi da loja (não no 4G/dados móveis!)
2. No tablet, abre Chrome → digita `http://192.168.1.50:4000/health` — se retornar JSON, hub OK; problema é no app
3. Verifica `localStorage`: abre DevTools → Application → Local Storage → vê se `hubUrl` tá certo. Se errado, abre de novo com `?hub=http://192.168.1.50:4000`

### "PIN inválido" repetidamente

1. Confirma que o funcionário foi cadastrado no cloud em `/admin/funcionarios`
2. Espera ~60s pro hub sincronizar (`[catalog-poller] employees sincronizados` no log)
3. Se persistir, regenera o PIN no painel cloud (botão "regenerar PIN")

### Cardápio/mesas não aparecem

1. Confirma cloud está pareado: `curl http://127.0.0.1:4000/health | grep paired`
2. Olha último sync: `curl http://127.0.0.1:4000/health | python3 -m json.tool | grep lastSync`
3. Força sync imediato: `docker compose -f /opt/totemmesa/docker-compose.yml restart hub`

### IP do hub mudou (DHCP)

Configurar IP fixo (passo 5) deveria evitar isso. Se aconteceu, reabre cada tablet com `?hub=http://NOVO_IP:4000` uma vez.

### Mini-PC sem internet temporariamente

Hub continua funcionando local (totem → KDS → garçom): **NÃO depende do cloud em runtime**. Pedidos ficam acumulados no outbox e são enviados pro cloud quando voltar a conexão. Cardápio/mesas/funcionários continuam disponíveis (vêm do SQLite local).

---

## 12. Checklist de entrega ao cliente

- [ ] Hub instalado, rodando, pareado com cloud
- [ ] IP fixo configurado no roteador
- [ ] 1+ totem em cada mesa, em modo fullscreen
- [ ] 1 KDS na cozinha (alarme sonoro funcionando)
- [ ] 1+ tablet de garçom (chamadas chegam em tempo real)
- [ ] Pelo menos 1 cozinheiro e 1 garçom cadastrados com PIN
- [ ] Pedido de teste: criar no totem → ver no KDS → marcar como pronto → ver no waiter → marcar entregue → conferir no `/admin/pedidos` do cloud
- [ ] Cliente recebe `ADMIN_SECRET` num lugar seguro (gerenciador de senhas dele)
- [ ] Documentar: IP do hub, MAC, login `tm`/senha do mini-PC

---

## 13. Contato em caso de problema

- Logs detalhados: `docker compose -f /opt/totemmesa/docker-compose.yml logs --tail 200 hub > /tmp/hub.log` e envia o arquivo
- Health snapshot: `curl http://127.0.0.1:4000/health > /tmp/health.json` e envia
- Versão atual: `grep HUB_TAG /opt/totemmesa/.env`
