# 10 — Aplicar HTTPS na loja piloto (mini-PC 192.168.0.103)

Runbook pra migrar o hub piloto de HTTP→HTTPS sem reinstalar do zero. Resolve a barra "Not Secure" que aparece no PWA do garçom no Android (mixed content HTTPS→HTTP).

## Pré-requisitos

- Acesso SSH ao mini-PC (`ssh tm@192.168.0.103` ou pelo monitor+teclado)
- Commit com suporte a HTTPS já em `main` e imagem `stable` rebuildada no GHCR
- Mac/Windows do operador na mesma LAN da loja (pra transferir o `rootCA.pem` pros tablets)

## 1. Espera a imagem nova ficar pronta

```bash
# No seu Mac:
gh run watch -R douglazfigueiredo/totem-mesa-inteligente
# Ou olha: github.com/douglazfigueiredo/totem-mesa-inteligente/actions
```

A action `hub-image.yml` faz build multi-arch e empurra como `:stable`. Aguarda o "✓ build" antes de seguir.

## 2. Atualizar o hub no mini-PC

Caminho rápido — re-rodar o install.sh com `SKIP_*` pra pular o que já foi feito:

```bash
ssh tm@192.168.0.103
SKIP_TIMEZONE=1 SKIP_AUTO_UPDATES=1 SKIP_DISK_CHECK=1 \
  curl -fsSL https://raw.githubusercontent.com/douglazfigueiredo/totem-mesa-inteligente/main/deploy/hub/install.sh \
  | bash
```

O script vai:
- Detectar Docker/ufw já instalados → pular
- Baixar **mkcert** binário, rodar `mkcert -install`, gerar `hub.pem`/`hub-key.pem` cobrindo `192.168.0.103`, `hub.local`, `localhost`, `127.0.0.1`
- Copiar `rootCA.pem` pra `/opt/totemmesa/certs/`
- Baixar o `docker-compose.yml` novo (com volume `./certs:/certs:ro`)
- Preservar o `.env` existente, só **anexar** `HTTPS_CERT_PATH=/certs/hub.pem` + `HTTPS_KEY_PATH=/certs/hub-key.pem`
- `docker compose pull` pega imagem nova com suporte a HTTPS
- `docker compose up -d` reinicia o hub em HTTPS

Confirma:

```bash
docker compose -f /opt/totemmesa/docker-compose.yml logs --tail 30 hub | grep -i "hub ready"
# Espera ver:  protocol: "https"
curl -k https://127.0.0.1:4000/health
# Deve retornar JSON com status:"ok"
```

## 3. Transferir a CA pro seu Mac

```bash
# Do seu Mac, na mesma rede:
scp tm@192.168.0.103:/opt/totemmesa/certs/rootCA.pem ~/Downloads/totemmesa-rootCA.pem
```

## 4. Instalar a CA em cada tablet Android

Pra cada tablet (totem da mesa 1, mesa 2, ..., KDS, garçom):

1. Envia `totemmesa-rootCA.pem` pro tablet (WhatsApp Web pra si mesmo, Google Drive, AirDrop, ou cabo USB).
2. No tablet, salva o arquivo em Downloads.
3. **Configurações → Segurança e privacidade → (Mais) → Criptografia e credenciais → Instalar um certificado → Certificado de CA**.
4. Aparece aviso "Sua rede pode ser monitorada" → **Instalar mesmo assim**.
5. Seleciona o `totemmesa-rootCA.pem`. Confirma com PIN/biometria do tablet se pedir.
6. Daí em diante o Chrome desse tablet confia em qualquer cert assinado pela CA da mkcert do mini-PC.

> Caminho de menu pode variar entre fabricantes (Samsung, Xiaomi, etc) — busca por "Instalar certificado" nas Configurações se não achar.

## 5. Re-emparelhar os tablets com URL HTTPS

Pra cada tablet, abre o Chrome e cola a URL nova (mude o app conforme o role):

```
https://totem-mesa-inteligente-totem.vercel.app/?hub=https://192.168.0.103:4000
https://totem-mesa-inteligente-kds.vercel.app/?hub=https://192.168.0.103:4000
https://totem-mesa-inteligente-waiter.vercel.app/?hub=https://192.168.0.103:4000
```

O `hub-client.ts` atualiza `localStorage.hubUrl` no primeiro `?hub=`, então da próxima vez basta abrir a URL sem query.

**Desinstala o PWA antigo** do garçom antes (segura ícone → Desinstalar) e instala de novo pelo Chrome com a URL nova — assim o WebAPK pega manifest fresh e a conexão começa em HTTPS desde o pareamento.

## 6. Validar fim-a-fim

- Abre o PWA garçom no tablet → não deve aparecer a barra escura "Not Secure" no topo
- Pareia (PIN de funcionário)
- Loga e olha a tela principal → tudo standalone, só barra de status do Android
- Faz um pedido no totem, marca pronto no KDS, entrega no garçom — ciclo completo

## Rollback (se necessário)

Em qualquer momento dá pra voltar pro HTTP:

```bash
ssh tm@192.168.0.103
sed -i.bak -e 's|^HTTPS_CERT_PATH=.*|HTTPS_CERT_PATH=|' -e 's|^HTTPS_KEY_PATH=.*|HTTPS_KEY_PATH=|' /opt/totemmesa/.env
docker compose -f /opt/totemmesa/docker-compose.yml restart hub
```

Os tablets continuam com a CA instalada (inócuo, não atrapalha) — só precisam ser abertos com `?hub=http://...` de novo.

## Troubleshooting

| Sintoma | Causa | Fix |
|---|---|---|
| `curl https://127.0.0.1:4000` retorna `Connection reset` | Hub subiu sem HTTPS_CERT_PATH (env não foi lida) | `docker compose down && docker compose up -d` (re-leitura .env); verifica `grep HTTPS /opt/totemmesa/.env` |
| Tablet ainda mostra "Not Secure" | CA não foi instalada **como CA certificate** (foi como user cert) | Refaz passo 4, escolhendo "CA certificate" no diálogo |
| PWA conecta mas socket falha (`wss://`) | CA instalada só pro Chrome mas Android < 7 separa CA system/user | Atualiza Android, ou (workaround) usa WebView Chrome com flag |
| Cert expirou | mkcert gera certs com validade ~2 anos | `ssh` no mini-PC, `rm /opt/totemmesa/certs/*.pem`, re-roda install.sh |
