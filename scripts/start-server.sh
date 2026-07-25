#!/bin/bash
# WAFT MAM Farms - Production Server Startup
# Handles: fresh start, seeding, auto-restart on crash

PROJECT="/home/z/my-project"
SERVER_JS=".next/standalone/server.js"
PORT=3000
LOG="/tmp/waft-server.log"
PIDFILE="/tmp/waft-server.pid"
SEED_DONE="/tmp/waft-seeded-$(date +%Y%m%d)"

cd "$PROJECT"

# --- FUNCTIONS ---

stop_server() {
  if [ -f "$PIDFILE" ]; then
    OLD_PID=$(cat "$PIDFILE" 2>/dev/null)
    if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
      kill -9 "$OLD_PID" 2>/dev/null
      sleep 1
    fi
    rm -f "$PIDFILE"
  fi
  fuser -k ${PORT}/tcp 2>/dev/null
  sleep 1
}

seed_database() {
  echo "[$(date)] Seeding database..." >> "$LOG"
  SEED_RESULT=$(curl -s -X POST http://localhost:${PORT}/api/seed 2>&1)
  echo "[$(date)] Seed result: $SEED_RESULT" >> "$LOG"
  touch "$SEED_DONE"
}

start_server() {
  echo "[$(date)] Starting WAFT MAM Farms on port $PORT..." >> "$LOG"
  
  HOSTNAME="0.0.0.0" PORT=$PORT nohup node "$SERVER_JS" >> "$LOG" 2>&1 &
  SERVER_PID=$!
  echo "$SERVER_PID" > "$PIDFILE"
  disown $SERVER_PID 2>/dev/null
  
  # Wait for ready
  for i in $(seq 1 20); do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT 2>/dev/null | grep -qE "200|302"; then
      echo "[$(date)] Server ready (PID $SERVER_PID) after ${i}s" >> "$LOG"
      return 0
    fi
    sleep 1
  done
  echo "[$(date)] WARNING: Server did not start within 20s" >> "$LOG"
  return 1
}

# --- MAIN ---

stop_server

if ! start_server; then
  echo "FAILED"
  exit 1
fi

# Auto-seed on first run of the day
if [ ! -f "$SEED_DONE" ]; then
  sleep 2
  seed_database
fi

# Verify auth endpoint
AUTH_TEST=$(curl -s -X POST http://localhost:$PORT/api/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"ceo","password":"ceo123"}' 2>&1)
  
echo "[$(date)] Auth test: $(echo $AUTH_TEST | head -c 100)" >> "$LOG"

if echo "$AUTH_TEST" | grep -q '"success":true'; then
  echo "OK - Server running on port $PORT"
else
  echo "WARNING - Auth test failed, check logs at $LOG"
fi
