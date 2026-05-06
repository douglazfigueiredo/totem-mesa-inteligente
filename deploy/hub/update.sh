#!/usr/bin/env bash
# Update / rollback manual do hub local.
#
# Uso:
#   bash update.sh                       # baixa a tag atual (.env HUB_TAG ou stable) e sobe
#   bash update.sh --tag v0.4.2          # forca tag especifica
#   bash update.sh --rollback            # volta para a tag anterior salva em .env.previous

set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/totemmesa}"
cd "${INSTALL_DIR}"

TAG=""
ROLLBACK=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag) TAG="$2"; shift 2 ;;
    --rollback) ROLLBACK=1; shift ;;
    *) echo "Argumento desconhecido: $1" >&2; exit 1 ;;
  esac
done

current_tag() {
  grep '^HUB_TAG=' .env | cut -d= -f2
}

if [[ "${ROLLBACK}" -eq 1 ]]; then
  if [[ ! -f .env.previous ]]; then
    echo "Sem .env.previous — nada para reverter." >&2
    exit 1
  fi
  echo "==> Revertendo para versao anterior..."
  mv .env .env.failed
  mv .env.previous .env
elif [[ -n "${TAG}" ]]; then
  echo "==> Salvando .env atual em .env.previous"
  cp .env .env.previous
  sed -i.bak "s|^HUB_TAG=.*$|HUB_TAG=${TAG}|" .env
  rm -f .env.bak
fi

echo "==> Tag: $(current_tag)"
docker compose pull
docker compose up -d
docker image prune -f
echo "==> Done."
