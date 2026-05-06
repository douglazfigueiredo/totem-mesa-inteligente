#!/usr/bin/env bash
# Bootstrap do hub local TotemMesa.
# Uso:
#   curl -fsSL https://install.totemmesa.app | bash
# Ou local:
#   bash deploy/hub/install.sh

set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/totemmesa}"
COMPOSE_URL="${COMPOSE_URL:-https://raw.githubusercontent.com/totemmesa/totem-mesa-inteligente/main/deploy/hub/docker-compose.yml}"
ENV_EXAMPLE_URL="${ENV_EXAMPLE_URL:-https://raw.githubusercontent.com/totemmesa/totem-mesa-inteligente/main/deploy/hub/.env.example}"

cyan() { printf '\033[36m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
red() { printf '\033[31m%s\033[0m\n' "$*" >&2; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }

if [[ "${EUID}" -ne 0 ]] && ! command -v sudo >/dev/null 2>&1; then
  red "Precisa rodar como root ou ter sudo instalado."
  exit 1
fi

SUDO=""
if [[ "${EUID}" -ne 0 ]]; then
  SUDO="sudo"
fi

cyan "==> TotemMesa Hub — bootstrap"
cyan "==> diretorio de instalacao: ${INSTALL_DIR}"

ARCH="$(uname -m)"
case "${ARCH}" in
  x86_64|amd64) ARCH_LABEL="amd64" ;;
  aarch64|arm64) ARCH_LABEL="arm64" ;;
  armv7l) ARCH_LABEL="armv7" ;;
  *) red "Arquitetura nao suportada: ${ARCH}"; exit 1 ;;
esac
green "==> arquitetura detectada: ${ARCH_LABEL}"

if ! command -v docker >/dev/null 2>&1; then
  yellow "==> Docker nao encontrado. Instalando via script oficial..."
  curl -fsSL https://get.docker.com | ${SUDO} sh
  ${SUDO} systemctl enable --now docker
  green "==> Docker instalado."
else
  green "==> Docker ja instalado: $(docker --version)"
fi

if ! docker compose version >/dev/null 2>&1; then
  red "Docker Compose plugin nao disponivel. Atualize Docker para versao recente."
  exit 1
fi

${SUDO} mkdir -p "${INSTALL_DIR}"
${SUDO} chown "$(id -u):$(id -g)" "${INSTALL_DIR}"

cyan "==> Baixando docker-compose.yml..."
curl -fsSL "${COMPOSE_URL}" -o "${INSTALL_DIR}/docker-compose.yml"

if [[ ! -f "${INSTALL_DIR}/.env" ]]; then
  cyan "==> Baixando .env.example..."
  curl -fsSL "${ENV_EXAMPLE_URL}" -o "${INSTALL_DIR}/.env.example"
  cp "${INSTALL_DIR}/.env.example" "${INSTALL_DIR}/.env"

  echo
  cyan "==> Pareamento — informe os dados gerados no painel cloud:"
  read -r -p "TENANT_ID (slug da loja): " TENANT_ID_INPUT
  read -r -p "DEVICE_API_KEY: " DEVICE_API_KEY_INPUT
  read -r -p "CLOUD_BASE_URL [https://app.totemmesa.com]: " CLOUD_BASE_INPUT
  CLOUD_BASE_INPUT="${CLOUD_BASE_INPUT:-https://app.totemmesa.com}"

  if [[ -z "${TENANT_ID_INPUT}" || -z "${DEVICE_API_KEY_INPUT}" ]]; then
    red "TENANT_ID e DEVICE_API_KEY sao obrigatorios."
    exit 1
  fi

  sed -i.bak \
    -e "s|^TENANT_ID=.*$|TENANT_ID=${TENANT_ID_INPUT}|" \
    -e "s|^DEVICE_API_KEY=.*$|DEVICE_API_KEY=${DEVICE_API_KEY_INPUT}|" \
    -e "s|^CLOUD_BASE_URL=.*$|CLOUD_BASE_URL=${CLOUD_BASE_INPUT}|" \
    "${INSTALL_DIR}/.env"
  rm -f "${INSTALL_DIR}/.env.bak"
  chmod 600 "${INSTALL_DIR}/.env"
else
  yellow "==> .env ja existe em ${INSTALL_DIR}/.env — preservando."
fi

cyan "==> Baixando imagem mais recente..."
cd "${INSTALL_DIR}"
docker compose pull

cyan "==> Subindo servicos..."
docker compose up -d

cyan "==> Aguardando health-check..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fs http://127.0.0.1:4000/health >/dev/null 2>&1; then
    green "==> Hub respondendo em http://127.0.0.1:4000/health"
    break
  fi
  sleep 3
  if [[ "${i}" -eq 10 ]]; then
    red "==> Hub nao respondeu em 30s. Veja: docker compose logs -f"
    exit 1
  fi
done

green "==> Instalacao concluida."
cat <<EOF

Proximos passos:
  - Configurar IP fixo do hub no roteador da loja.
  - Apontar totens / KDS / app garcom para o IP do hub.
  - Logs:    docker compose -f ${INSTALL_DIR}/docker-compose.yml logs -f
  - Status:  docker compose -f ${INSTALL_DIR}/docker-compose.yml ps
  - Update:  bash ${INSTALL_DIR}/update.sh   (ou Watchtower roda a cada 5min)
EOF
