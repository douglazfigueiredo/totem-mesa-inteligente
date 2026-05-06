# 04 — Deploy do hub na loja

> Status: Fase 2D ✅. Hub completo e publicado em GHCR como imagem multi-arch (amd64 + arm64).

Este doc cobre como instalar o hub local em uma loja real (RPi 5 ou Mini PC). Para arquitetura conceitual, ver [`00-arquitetura.md`](./00-arquitetura.md). Para detalhes do servidor, ver [`03-hub-local.md`](./03-hub-local.md).

## 1. Hardware recomendado

| Componente | Especificacao minima |
|---|---|
| CPU/SoC | Raspberry Pi 5 (4GB) ou Mini PC x86 com 4+ cores |
| RAM | 4GB (8GB recomendado) |
| Storage | SSD 32GB+ (USB ou NVMe). NUNCA cartao SD em producao — desgaste alto |
| Rede | Ethernet preferencial (Wi-Fi como fallback) |
| Alimentacao | Fonte com no-break minimo de 5min (loja fica fora do ar em queda de luz curta) |

**Importante**: o hub deve ter IP fixo na LAN. Configure DHCP reservation no roteador da loja ou IP estatico no `/etc/dhcpcd.conf`.

## 2. Preparo do SO (Raspberry Pi)

1. **Flash** do Raspberry Pi OS Lite (64-bit) com o Raspberry Pi Imager.
2. Antes de gravar: configurar usuario `pi` + senha + Wi-Fi + SSH habilitado.
3. Boot inicial. SSH na loja: `ssh pi@<ip-do-rpi>`.
4. Atualizar sistema:
   ```bash
   sudo apt update && sudo apt full-upgrade -y
   sudo reboot
   ```

## 3. Instalacao do hub

### Opcao A — script one-liner (recomendado)

```bash
sudo bash <(curl -fsSL https://raw.githubusercontent.com/douglazfigueiredo/totem-mesa-inteligente/main/deploy/hub/install.sh)
```

O script:
1. Detecta arquitetura (arm64/amd64).
2. Instala Docker (via script oficial) se nao houver.
3. Cria `/opt/totemmesa/`.
4. Baixa `docker-compose.yml`.
5. Pede `TENANT_ID`, `DEVICE_API_KEY`, `CLOUD_BASE_URL`.
6. `docker compose pull && docker compose up -d`.
7. Aguarda healthcheck.

Tempo medio: ~10 minutos.

### Opcao B — manual

```bash
sudo mkdir -p /opt/totemmesa
sudo chown $(whoami) /opt/totemmesa
cd /opt/totemmesa

# Baixar arquivos
curl -fsSL https://raw.githubusercontent.com/douglazfigueiredo/totem-mesa-inteligente/main/deploy/hub/docker-compose.yml -o docker-compose.yml
curl -fsSL https://raw.githubusercontent.com/douglazfigueiredo/totem-mesa-inteligente/main/deploy/hub/.env.example -o .env

# Editar .env com valores reais (TENANT_ID, DEVICE_API_KEY, CLOUD_BASE_URL)
nano .env
chmod 600 .env

# Subir
docker compose pull
docker compose up -d

# Validar
curl http://127.0.0.1:4000/health
```

## 4. Pareamento dos devices

Apos o hub estar healthy, conectar totens, KDS e celulares dos garcons.

### 4.1. Gerar codigo no painel cloud (Fase 6) ou via admin direto

Enquanto o painel cloud nao existe (Fase 6), gerar codigo direto via curl:

```bash
ADMIN_SECRET=$(grep ADMIN_SECRET /opt/totemmesa/.env | cut -d= -f2)
curl -X POST http://localhost:4000/admin/pairing-codes \
  -H "x-admin-secret: $ADMIN_SECRET" \
  -H "content-type: application/json" \
  -d '{"role":"totem"}'
# → { "code": "664782", "role": "totem", "expiresAt": ... }
```

### 4.2. Device emparelha

No tablet (PWA totem), informa o codigo e o numero da mesa. App faz:

```http
POST http://hub.local:4000/devices/pair
content-type: application/json

{ "code": "664782", "nome": "Totem Mesa 7", "tableId": "<tableId>" }
```

Resposta:
```json
{
  "device": { "id": "...", "role": "totem", "tableId": "..." },
  "apiKey": "Dnt9Vwq5v9edx444f41pXlgp2GCMT0JaMezoFB-AQp8"
}
```

PWA armazena `apiKey` no `localStorage`. Toda chamada subsequente passa `x-device-api-key`.

## 5. Catalogo

Hub nao vem com catalogo. Duas opcoes para popular:

### 5.1. Seed de dev/demo (rapido)

```bash
docker exec tm-hub node dist/seed.js
# → catalogo v1 instalado: 3 categorias, 4 produtos
# → funcionarios dev criados: 1111/2222/9999
```

Util para piloto interno. Nao usar em loja real.

### 5.2. Cloud push (Fase 6)

Apos a Fase 6, o painel cloud envia o catalogo via:

```http
POST http://hub.local:4000/admin/catalog
x-admin-secret: <ADMIN_SECRET>
content-type: application/json

{ tenantId, version, categories[], products[] }
```

Cliente (totem) puxa via:
```http
GET http://hub.local:4000/catalog
x-device-api-key: <chave>
if-none-match: "v3"
```

Hub responde `200` com snapshot ou `304` se a versao bate.

## 6. Atualizacoes (OTA)

`docker-compose.yml` inclui Watchtower configurado com poll de 5min. Imagens novas em GHCR sao puxadas automaticamente.

Forçar update manual:
```bash
cd /opt/totemmesa
bash update.sh                    # baixa tag stable
bash update.sh --tag v0.4.2       # versao especifica
bash update.sh --rollback         # volta para versao anterior
```

`update.sh` salva o `.env` atual em `.env.previous` antes de trocar — rollback restaura.

## 7. Monitoramento na loja

```bash
# Status dos containers
docker compose -f /opt/totemmesa/docker-compose.yml ps

# Logs em tempo real
docker compose -f /opt/totemmesa/docker-compose.yml logs -f hub

# Uso de recursos
docker stats --no-stream

# Healthcheck
curl http://localhost:4000/health
```

Observabilidade remota (Sentry + Grafana) entra na Fase 9. Hoje, o dono pode ver via SSH ou via cloud quando estiver pronto.

## 8. Backup do banco

Hub guarda tudo em `/data/hub.db` (volume Docker). Backup simples via cron:

```bash
# /etc/cron.d/totemmesa-backup
0 3 * * * pi docker exec tm-hub sqlite3 /data/hub.db ".backup /data/hub-$(date +\%Y\%m\%d).db" && find /var/backups/totemmesa -mtime +14 -delete
```

Restore: parar hub, substituir `/var/lib/docker/volumes/totemmesa-hub_hub-data/_data/hub.db`, subir.

Em Fase 9 isso vira `borg`/`restic` automatico para storage offsite.

## 9. Recovery

| Falha | Diagnostico | Acao |
|---|---|---|
| `/health` nao responde | `docker compose ps` mostra hub down | `docker compose logs hub` → corrigir + `docker compose up -d` |
| DB locked / disco cheio | `df -h` mostra >90% | `docker exec tm-hub du -sh /data/*`; fazer prune `docker system prune -a` |
| Imagem nova quebrou | `docker compose ps` = unhealthy apos update | `bash update.sh --rollback` |
| Pareamento perdido (key nao funciona mais) | Device deactivated | Gerar novo codigo + repair no totem |
| Watchtower nao pega updates | Container Watchtower nao rodando | `docker compose up -d watchtower` |

Em casos extremos: re-instalar com `bash install.sh` + restore do backup.

## 10. Seguranca operacional

| Item | Recomendacao |
|---|---|
| `ADMIN_SECRET` | 32+ caracteres aleatorios. NUNCA committar. Rotacionar a cada 6 meses |
| Acesso SSH | Apenas via chave (desabilitar password). Apenas IPs do dono |
| Firewall (UFW) | Abrir 4000/tcp APENAS na rede da loja. Bloquear externo |
| Updates do SO | `unattended-upgrades` ativo |
| Acesso fisico | Hub em local trancado, nao em area do cliente |
| `apiKey` dos devices | Trafegar apenas em LAN. Nunca expor o hub na internet sem TLS reverso |

## 11. Checklist de instalacao

- [ ] Hardware na loja, alimentacao com no-break
- [ ] OS instalado e atualizado
- [ ] Wi-Fi/Ethernet configurado, IP fixo
- [ ] SSH por chave, password disabled
- [ ] UFW ativo, porta 4000 so na LAN
- [ ] `bash install.sh` rodado com sucesso
- [ ] `curl /health` retorna 200
- [ ] Pareamento de pelo menos 1 totem testado
- [ ] Catalogo carregado (seed dev ou cloud)
- [ ] Backup cron ativo
- [ ] Watchtower rodando (`docker compose ps`)
- [ ] Documentacao de credenciais (`.env`) entregue ao dono em local seguro

## 12. Imagem GHCR

Imagem oficial: `ghcr.io/douglazfigueiredo/totem-mesa-inteligente-hub:stable`

Tags disponiveis:
- `stable` — main branch (auto-deploy via push em `main`)
- `<sha>` — commit especifico
- `vX.Y.Z` — releases tagged

Pipeline: `.github/workflows/hub-image.yml` builds multi-arch (amd64 + arm64) com `docker buildx` + cache GHA. Cosign signing entra na Fase 9.

Por enquanto repo e privado, entao GHCR exige login. Em prod (futuro), tornar package publico ou usar secret do operador.
