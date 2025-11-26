#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="pedagogy-postgres"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-localdev}"
DB_NAME="pedagogy"
POSTGRES_IMAGE="postgres:16"

echo "Ensuring Docker container '${CONTAINER_NAME}' is running..."
if ! docker ps -a --format '{{.Names}}' | grep -qw "${CONTAINER_NAME}"; then
  docker run --name "${CONTAINER_NAME}" \
    -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
    -p 5432:5432 \
    -d "${POSTGRES_IMAGE}"
elif ! docker inspect -f '{{.State.Running}}' "${CONTAINER_NAME}" | grep -qw true; then
  docker start "${CONTAINER_NAME}" >/dev/null
fi

echo "Waiting for Postgres to accept connections..."
until docker exec "${CONTAINER_NAME}" pg_isready -U postgres >/dev/null 2>&1; do
  sleep 1
done

echo "Ensuring database '${DB_NAME}' exists..."
docker exec "${CONTAINER_NAME}" psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}';" | grep -qw 1 \
  || docker exec "${CONTAINER_NAME}" psql -U postgres -c "CREATE DATABASE ${DB_NAME};"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

echo "Installing dependencies..."
npm install >/dev/null

echo "Generating Prisma client..."
npx prisma generate >/dev/null

echo "Applying migrations..."
npx prisma migrate deploy >/dev/null

echo "Seeding database..."
npx prisma db seed >/dev/null

echo
echo "Local environment is ready."
echo "   Docker container: ${CONTAINER_NAME}"
echo "   Database: ${DB_NAME}"
echo "   Run 'npm run dev' and open http://localhost:3000 to view the seeded site."

