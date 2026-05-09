#!/usr/bin/env bash
# Bootstrap do hub local TotemMesa.
# Uso:
#   curl -fsSL https://raw.githubusercontent.com/douglazfigueiredo/totem-mesa-inteligente/main/deploy/hub/install.sh | bash
# Ou local:
#   bash deploy/hub/install.sh
#
# Este script só sobe o hub e gera ADMIN_SECRET. O pareamento com
# o cloud é feito DEPOIS via UI: abra http://<ip-do-hub>:4000/admin/cloud/pair
# e cole o código gerado em /admin/hubs no painel cloud.
#
# Variáveis de override (todas opcionais):
#   INSTALL_DIR          — destino (default: /opt/totemmesa)
#   TZ                   — timezone (default: America/Sao_Paulo)
#   ADMIN_HTTP_PORT      — porta exposta do hub (default: 4000)
#   SKIP_TIMEZONE=1      — não mexer em timedatectl
#   SKIP_AUTO_UPDATES=1  — não instalar unattended-upgrades
#   SKIP_FIREWALL=1      — não tocar no ufw
#   SKIP_DISK_CHECK=1    — não avisar de espaço baixo
#   MIN_FREE_GB          — limiar do alerta de disco (default: 5)

set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/totemmesa}"
RAW_BASE="${RAW_BASE:-https://raw.githubusercontent.com/douglazfigueiredo/totem-mesa-inteligente/main/deploy/hub}"
COMPOSE_URL="${COMPOSE_URL:-${RAW_BASE}/docker-compose.yml}"
ENV_EXAMPLE_URL="${ENV_EXAMPLE_URL:-${RAW_BASE}/.env.example}"
UPDATE_SCRIPT_URL="${UPDATE_SCRIPT_URL:-${RAW_BASE}/update.sh}"
TZ_TARGET="${TZ:-America/Sao_Paulo}"
ADMIN_HTTP_PORT="${ADMIN_HTTP_PORT:-4000}"
MIN_FREE_GB="${MIN_FREE_GB:-5}"

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

# Detecta se é Debian/Ubuntu (apt) — passos opcionais só rodam nesse caso.
HAS_APT=0
if command -v apt-get >/dev/null 2>&1; then HAS_APT=1; fi

cyan "==> TotemMesa Hub — bootstrap"
cyan "==> diretorio de instalacao: ${INSTALL_DIR}"

# ─── (4) Pré-requisitos: curl, openssl, sed ────────────────────────
ensure_prereqs() {
  local missing=()
  for cmd in curl sed; do
    command -v "${cmd}" >/dev/null 2>&1 || missing+=("${cmd}")
  done
  # openssl é só "preferencial" — temos fallback via /dev/urandom
  if (( ${#missing[@]} > 0 )); then
    if [[ "${HAS_APT}" -eq 1 ]]; then
      yellow "==> Pré-requisitos faltando (${missing[*]}). Instalando..."
      ${SUDO} apt-get update -qq
      ${SUDO} apt-get install -y -qq "${missing[@]}"
    else
      red "Faltam pré-requisitos: ${missing[*]}. Instale manualmente e rode de novo."
      exit 1
    fi
  fi
  # openssl é só warning — fallback existe
  if ! command -v openssl >/dev/null 2>&1; then
    yellow "==> openssl ausente — usarei fallback /dev/urandom para gerar ADMIN_SECRET."
  fi
  green "==> Pré-requisitos OK."
}
ensure_prereqs

# ─── (5) Timezone ──────────────────────────────────────────────────
setup_timezone() {
  if [[ "${SKIP_TIMEZONE:-0}" -eq 1 ]]; then return; fi
  if ! command -v timedatectl >/dev/null 2>&1; then
    yellow "==> timedatectl ausente — pulando ajuste de timezone."
    return
  fi
  local current
  current="$(timedatectl show -p Timezone --value 2>/dev/null || echo 'unknown')"
  if [[ "${current}" == "${TZ_TARGET}" ]]; then
    green "==> Timezone já em ${TZ_TARGET}."
    return
  fi
  cyan "==> Setando timezone para ${TZ_TARGET} (atual: ${current})..."
  ${SUDO} timedatectl set-timezone "${TZ_TARGET}" || yellow "==> Falhou ajustar timezone — siga manual."
}
setup_timezone

# ─── (6) unattended-upgrades ───────────────────────────────────────
setup_auto_updates() {
  if [[ "${SKIP_AUTO_UPDATES:-0}" -eq 1 ]]; then return; fi
  if [[ "${HAS_APT}" -ne 1 ]]; then return; fi
  if dpkg -s unattended-upgrades >/dev/null 2>&1; then
    green "==> unattended-upgrades já instalado."
  else
    cyan "==> Instalando unattended-upgrades (security patches automáticos)..."
    ${SUDO} apt-get install -y -qq unattended-upgrades
  fi
  # Habilita config padrão se ainda não tiver
  if ! ${SUDO} test -f /etc/apt/apt.conf.d/20auto-upgrades; then
    ${SUDO} dpkg-reconfigure -f noninteractive unattended-upgrades >/dev/null 2>&1 || true
  fi
}
setup_auto_updates

# ─── Docker ────────────────────────────────────────────────────────
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

# ─── (9) Aviso sobre grupo docker ──────────────────────────────────
if [[ "${EUID}" -ne 0 ]]; then
  if ! id -nG | tr ' ' '\n' | grep -qx docker; then
    yellow "==> Aviso: usuário '$(id -un)' não está no grupo 'docker'."
    yellow "    Pra rodar 'docker'/'update.sh' sem sudo no futuro:"
    yellow "      sudo usermod -aG docker $(id -un) && newgrp docker"
  fi
fi

# ─── (10) Espaço em disco ──────────────────────────────────────────
check_disk() {
  if [[ "${SKIP_DISK_CHECK:-0}" -eq 1 ]]; then return; fi
  local target="/var/lib/docker"
  [[ -d "${target}" ]] || target="/var/lib"
  [[ -d "${target}" ]] || target="/"
  local free_kb
  free_kb="$(df -P "${target}" | awk 'NR==2 {print $4}')"
  local free_gb=$((free_kb / 1024 / 1024))
  if (( free_gb < MIN_FREE_GB )); then
    yellow "==> Aviso: apenas ${free_gb}GB livres em ${target} (mínimo recomendado: ${MIN_FREE_GB}GB)."
    yellow "    Backups SQLite + imagens Docker crescem ao longo do tempo."
  else
    green "==> Espaço em disco OK (${free_gb}GB livres em ${target})."
  fi
}
check_disk

# ─── (7) Firewall (ufw) ────────────────────────────────────────────
setup_firewall() {
  if [[ "${SKIP_FIREWALL:-0}" -eq 1 ]]; then return; fi
  if [[ "${HAS_APT}" -ne 1 ]]; then return; fi
  if ! command -v ufw >/dev/null 2>&1; then
    cyan "==> Instalando ufw..."
    ${SUDO} apt-get install -y -qq ufw
  fi
  cyan "==> Configurando ufw (permite SSH/22 e hub/${ADMIN_HTTP_PORT})..."
  ${SUDO} ufw allow 22/tcp >/dev/null
  ${SUDO} ufw allow "${ADMIN_HTTP_PORT}/tcp" >/dev/null
  if ! ${SUDO} ufw status | grep -q "Status: active"; then
    yellow "==> Habilitando ufw — pode pedir confirmação se via SSH (porta 22 já liberada acima)."
    ${SUDO} ufw --force enable
  fi
  green "==> Firewall ativo (22/tcp, ${ADMIN_HTTP_PORT}/tcp)."
}
setup_firewall

# ─── Filesystem do install ─────────────────────────────────────────
${SUDO} mkdir -p "${INSTALL_DIR}"
${SUDO} chown "$(id -u):$(id -g)" "${INSTALL_DIR}"

cyan "==> Baixando docker-compose.yml..."
curl -fsSL "${COMPOSE_URL}" -o "${INSTALL_DIR}/docker-compose.yml"

cyan "==> Baixando update.sh..."
curl -fsSL "${UPDATE_SCRIPT_URL}" -o "${INSTALL_DIR}/update.sh"
chmod +x "${INSTALL_DIR}/update.sh"

# ─── (8) Geração de ADMIN_SECRET com fallback ──────────────────────
gen_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    head -c 32 /dev/urandom | xxd -p -c 64
  fi
}

if [[ ! -f "${INSTALL_DIR}/.env" ]]; then
  cyan "==> Baixando .env.example..."
  curl -fsSL "${ENV_EXAMPLE_URL}" -o "${INSTALL_DIR}/.env.example"
  cp "${INSTALL_DIR}/.env.example" "${INSTALL_DIR}/.env"

  ADMIN_SECRET_GEN="$(gen_secret)"
  if [[ -z "${ADMIN_SECRET_GEN}" || "${#ADMIN_SECRET_GEN}" -lt 32 ]]; then
    red "Falha ao gerar ADMIN_SECRET (vazio/curto demais). Abortando — edite manualmente ${INSTALL_DIR}/.env e rode de novo."
    exit 1
  fi
  sed -i.bak \
    -e "s|^ADMIN_SECRET=.*$|ADMIN_SECRET=${ADMIN_SECRET_GEN}|" \
    "${INSTALL_DIR}/.env"
  rm -f "${INSTALL_DIR}/.env.bak"
  chmod 600 "${INSTALL_DIR}/.env"
  green "==> ADMIN_SECRET gerado e salvo em ${INSTALL_DIR}/.env"
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
  if curl -fs "http://127.0.0.1:${ADMIN_HTTP_PORT}/health" >/dev/null 2>&1; then
    green "==> Hub respondendo em http://127.0.0.1:${ADMIN_HTTP_PORT}/health"
    break
  fi
  sleep 3
  if [[ "${i}" -eq 10 ]]; then
    red "==> Hub nao respondeu em 30s. Veja: docker compose logs -f"
    exit 1
  fi
done

# Detectar IP local pra exibir nas instruções
LOCAL_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || echo '<ip-do-hub>')"
ADMIN_SECRET_VAL="$(grep '^ADMIN_SECRET=' "${INSTALL_DIR}/.env" | cut -d= -f2-)"

green "==> Instalacao concluida."
cat <<EOF

═══════════════════════════════════════════════════════════════════
 PROXIMOS PASSOS — pareamento com cloud:

  1. No painel cloud, vá em /admin/hubs e clique em "gerar código".
  2. Acesse a UI admin do hub:
       http://${LOCAL_IP}:${ADMIN_HTTP_PORT}/admin/cloud/pair
  3. Use ADMIN_SECRET pra autenticar:
       ${ADMIN_SECRET_VAL}
  4. Cole o código de 6 dígitos. O hub puxa cardápio, mesas e
     funcionários automaticamente em até 60s.

 Apontar tablets (totem/KDS/garçom) pro hub:
       https://totem.totemmesa.app/?hub=http://${LOCAL_IP}:${ADMIN_HTTP_PORT}
       https://kds.totemmesa.app/?hub=http://${LOCAL_IP}:${ADMIN_HTTP_PORT}
       https://waiter.totemmesa.app/?hub=http://${LOCAL_IP}:${ADMIN_HTTP_PORT}
   (a URL fica salva no localStorage do tablet — só precisa abrir
    com ?hub=... uma vez)

 Logs:    docker compose -f ${INSTALL_DIR}/docker-compose.yml logs -f
 Status:  docker compose -f ${INSTALL_DIR}/docker-compose.yml ps
 Update:  bash ${INSTALL_DIR}/update.sh
═══════════════════════════════════════════════════════════════════
EOF
