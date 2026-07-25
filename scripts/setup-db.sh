#!/usr/bin/env bash
# ============================================================
# WAFT MAM Farms — First-time database setup
# Run this ONCE after creating your Neon database.
# ============================================================
# Usage:
#   export DATABASE_URL="postgresql://...pgbouncer=true..."
#   export DIRECT_URL="postgresql://...direct..."
#   bash scripts/setup-db.sh
# ============================================================

set -e

cd "$(dirname "$0")/.."

if [ -z "$DATABASE_URL" ] || [ -z "$DIRECT_URL" ]; then
  echo "ERROR: Both DATABASE_URL and DIRECT_URL must be set."
  echo ""
  echo "Get them from your Neon dashboard (https://neon.tech):"
  echo "  - Pooled connection  -> DATABASE_URL"
  echo "  - Direct connection  -> DIRECT_URL"
  echo ""
  echo "Then run:"
  echo "  export DATABASE_URL='...'"
  echo "  export DIRECT_URL='...'"
  echo "  bash scripts/setup-db.sh"
  exit 1
fi

echo "==> Generating Prisma client..."
npx prisma generate

echo ""
echo "==> Pushing schema to Neon (creates all tables)..."
npx prisma migrate deploy

echo ""
echo "==> Verifying tables exist..."
npx prisma db execute --stdin <<EOF
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
EOF

echo ""
echo "==> Database setup complete."
echo ""
echo "Next steps:"
echo "  1. Deploy the app to Vercel (see DEPLOY.md)"
echo "  2. Visit your Vercel URL to auto-seed sample data"
echo "  3. Log in with ceo / ceo123"
