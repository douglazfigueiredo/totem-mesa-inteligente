# Deploy

| Caminho                          | Alvo                                           | Status (Fase 0)     |
| -------------------------------- | ---------------------------------------------- | ------------------- |
| [`hub/`](./hub/)                 | Hub local (loja) — Docker Compose + install.sh | ✅ esqueleto pronto |
| [`totem-kiosk/`](./totem-kiosk/) | Tablet Android em modo kiosk                   | ⏳ Fase 3           |
| [`cloud/`](./cloud/)             | Vercel deploy da app `cloud/`                  | ⏳ Fase 6           |

## Hub local — quickstart

```bash
# Producao (numa loja, no RPi 5 ou Mini PC):
curl -fsSL https://install.totemmesa.app | bash
# (ainda nao publicado — usar copia local enquanto isso:)
sudo bash deploy/hub/install.sh

# Dev local (no laptop):
cd deploy/hub
docker compose -f docker-compose.dev.yml up --build
# hub disponivel em http://localhost:4000/health
```

Ver [`docs/04-deploy-hub.md`](../docs/04-deploy-hub.md) para guia completo (sera escrito ao final da Fase 2).
