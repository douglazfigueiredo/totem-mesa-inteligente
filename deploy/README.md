# Deploy

| Caminho                          | Alvo                                           | Status (Fase 0)     |
| -------------------------------- | ---------------------------------------------- | ------------------- |
| [`hub/`](./hub/)                 | Hub local (loja) — Docker Compose + install.sh | ✅ esqueleto pronto |
| [`totem-kiosk/`](./totem-kiosk/) | Tablet Android em modo kiosk                   | ⏳ Fase 3           |
| [`cloud/`](./cloud/)             | Vercel deploy da app `cloud/`                  | ⏳ Fase 6           |

## Hub local — quickstart

```bash
# Producao (numa loja, em mini-PC com Ubuntu Server 24.04 LTS):
curl -fsSL https://raw.githubusercontent.com/douglazfigueiredo/totem-mesa-inteligente/main/deploy/hub/install.sh | bash
# Ou copiando local (clone do repo):
sudo bash deploy/hub/install.sh

# Dev local (no laptop):
cd deploy/hub
docker compose -f docker-compose.dev.yml up --build
# hub disponivel em http://localhost:4000/health
```

Ver [`docs/04-deploy-hub.md`](../docs/04-deploy-hub.md) para guia completo (sera escrito ao final da Fase 2).
