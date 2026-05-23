#!/bin/sh
set -e

# ── Required environment variables ──────────────────────────
#
# See selfhost.md for setup instructions.

missing=""

check_env() {
  var="$1"
  name="$2"
  hint="${3:-}"
  eval "val=\$$var"
  if [ -z "$val" ]; then
    missing="$missing  • $name  (env: $var)"
    if [ -n "$hint" ]; then
      missing="$missing  → $hint"
    fi
    missing="$missing\n"
  fi
}

check_env "DATABASE_URL"         "PostgreSQL connection string"
check_env "BETTER_AUTH_SECRET"   "Session encryption secret" \
  "Generate with: openssl rand -hex 32"
check_env "BETTER_AUTH_URL"      "Public URL of this instance" \
  "e.g. http://localhost:3000"
check_env "GOOGLE_CLIENT_ID"     "Google OAuth client ID"
check_env "GOOGLE_CLIENT_SECRET" "Google OAuth client secret" \
  "Create credentials at Google Cloud Console → APIs & Services → Credentials"

if [ -n "$missing" ]; then
  echo ""
  echo "  ╔══════════════════════════════════════════════════════╗"
  echo "  ║  Missing required environment variables              ║"
  echo "  ╚══════════════════════════════════════════════════════╝"
  printf "%b" "$missing"
  echo ""
  echo ""
  exit 1
fi

# ── Database migrations ─────────────────────────────────────

echo "  → Running database migrations..."
bun prisma migrate deploy 2>&1 || {
  echo ""
  echo "  Database migration failed."
  echo "  Make sure your PostgreSQL server is running and DATABASE_URL is correct."
  echo ""
  exit 1
}

# ── Start application ───────────────────────────────────────

echo "  → Starting server..."
exec node server.js
