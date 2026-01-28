#!/usr/bin/env bash
set -euo pipefail

: "${PI_HOST:?Set PI_HOST}"
: "${PI_USER:?Set PI_USER}"
: "${PI_PATH:?Set PI_PATH}"
PI_PORT="${PI_PORT:-22}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${DIST_DIR:-${ROOT_DIR}/dist}"

if [[ ! -x "${DIST_DIR}/tubtub" ]]; then
  echo "missing binary at ${DIST_DIR}/tubtub" >&2
  exit 1
fi

SSH_OPTS=("-p" "${PI_PORT}")

ssh "${SSH_OPTS[@]}" "${PI_USER}@${PI_HOST}" "mkdir -p '${PI_PATH}'"

rsync -az --delete -e "ssh -p ${PI_PORT}" \
  "${DIST_DIR}/" \
  "${ROOT_DIR}/web/" \
  "${PI_USER}@${PI_HOST}:${PI_PATH}/"

ssh "${SSH_OPTS[@]}" "${PI_USER}@${PI_HOST}" "sudo systemctl restart tubtub"

echo "Deploy complete"
