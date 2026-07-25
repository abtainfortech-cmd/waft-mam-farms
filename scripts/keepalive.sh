#!/bin/bash
# Keepalive script for WAFT MAM Farms production server
# Starts the server on port 8080 and restarts it if it dies

SERVER_DIR="/home/z/my-project"
SERVER_CMD="node .next/standalone/server.js"
PORT=8080
LOG="/tmp/prod-8080.log"

cd "$SERVER_DIR"

while true; do
  # Check if server is already running on our port
  if lsof -i :$PORT > /dev/null 2>&1; then
    sleep 10
    continue
  fi

  echo "[$(date)] Server not running. Starting on port $PORT..." >> "$LOG"
  HOSTNAME="0.0.0.0" PORT=$PORT nohup $SERVER_CMD >> "$LOG" 2>&1 &
  sleep 5

  # Verify it started
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT 2>/dev/null | grep -q "200\|302"; then
    echo "[$(date)] Server started successfully on port $PORT" >> "$LOG"
  else
    echo "[$(date)] WARNING: Server failed to start" >> "$LOG"
  fi

  sleep 10
done
