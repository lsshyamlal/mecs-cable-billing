#!/bin/bash
# MECS Cable Billing — local deploy script
# Usage: ./scripts/deploy.sh
# Required env vars: MECS_DB_USER, MECS_DB_PASS, MECS_JWT_SECRET
# Optional:         MECS_CORS_ORIGIN (defaults to http://localhost:3000)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "==> Building frontend..."
cd frontend
npm install --silent
npm run build
cd "$PROJECT_DIR"

echo "==> Building backend JAR..."
mvn clean package -DskipTests -q

JAR=$(ls target/billing-*.jar 2>/dev/null | head -1)
if [[ -z "$JAR" ]]; then
  echo "ERROR: JAR not found in target/. Build may have failed."
  exit 1
fi

echo "==> Build complete: $JAR"
echo ""
echo "Starting server on http://localhost:8080 ..."
echo "Press Ctrl+C to stop."
echo ""

exec java \
  -Duser.timezone=Asia/Kolkata \
  -jar "$JAR"
