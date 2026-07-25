#!/bin/bash
# WAFT MAM Farms - Persistent Dev Server Watchdog
# Uses dev server (more stable in this environment)
# Checks every 5s, restarts if down

PROJECT="/home/z/my-project"
PORT=3000
LOG="/tmp/waft-server.log"
WATCHDOG_LOG="/tmp/waft-watchdog.log"
PIDFILE="/tmp/waft-server.pid"
SEED_FLAG="/tmp/waft-seeded"

cd "$PROJECT"

echo "[$(date)] Watchdog started (dev mode)" >> "$WATCHDOG_LOG"

while true; do
  # Check if server responds
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT 2>/dev/null)
  
  if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "302" ]; then
    echo "[$(date)] Server down (HTTP $HTTP_CODE). Restarting..." >> "$WATCHDOG_LOG"
    
    # Kill any stale process
    fuser -k ${PORT}/tcp 2>/dev/null
    pkill -f "next-server" 2>/dev/null
    sleep 2
    
    # Start dev server
    nohup npx next dev -p $PORT >> "$LOG" 2>&1 &
    SERVER_PID=$!
    echo "$SERVER_PID" > "$PIDFILE"
    disown $SERVER_PID 2>/dev/null
    
    # Wait for ready (dev server takes longer to start)
    READY=0
    for i in $(seq 1 30); do
      if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT 2>/dev/null | grep -qE "200|302"; then
        echo "[$(date)] Server ready (PID $SERVER_PID) after ${i}s" >> "$WATCHDOG_LOG"
        READY=1
        break
      fi
      sleep 1
    done
    
    # Seed on first start
    if [ $READY -eq 1 ] && [ ! -f "$SEED_FLAG" ]; then
      sleep 2
      SEED_RESULT=$(curl -s -X POST http://localhost:$PORT/api/seed 2>&1)
      echo "[$(date)] Seed: $SEED_RESULT" >> "$WATCHDOG_LOG"
      touch "$SEED_FLAG"
    fi
  fi
  
  sleep 5
done
