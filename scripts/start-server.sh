#!/bin/bash
# Robust server startup for WAFT MAM Farms
# Uses setsid to fully detach from terminal
# Writes PID to file for management

PROJECT="/home/z/my-project"
LOG="/tmp/waft-server.log"
PIDFILE="/tmp/waft-server.pid"
PORT=3000

# Kill any existing server
if [ -f "$PIDFILE" ]; then
  OLD_PID=$(cat "$PIDFILE" 2>/dev/null)
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "Stopping old server (PID $OLD_PID)..."
    kill -9 "$OLD_PID" 2>/dev/null
    sleep 1
  fi
  rm -f "$PIDFILE"
fi

# Also kill anything on our port
fuser -k $PORT/tcp 2>/dev/null
sleep 1

cd "$PROJECT"

# Start server fully detached using setsid
# Redirect all output to log file
echo "[$(date)] Starting WAFT MAM Farms server on port $PORT..." > "$LOG"

setsid npx next dev -p $PORT >> "$LOG" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PIDFILE"
echo "Started with PID $SERVER_PID"

# Wait for server to be ready (up to 30s)
READY=0
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT 2>/dev/null | grep -qE "200|302"; then
    READY=1
    echo "[$(date)] Server ready after ${i}s (PID $SERVER_PID)" >> "$LOG"
    break
  fi
  sleep 1
done

if [ $READY -eq 0 ]; then
  echo "[$(date)] WARNING: Server did not become ready within 30s" >> "$LOG"
  echo "FAILED"
else
  echo "OK"
fi
