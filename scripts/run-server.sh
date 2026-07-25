#!/bin/bash
# Auto-restart server on crash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting server..."
  rm -f db/custom.db-shm db/custom.db-wal
  npx next start -p 3000 2>&1
  EXIT=$?
  echo "[$(date)] Server exited with code $EXIT. Restarting in 2s..."
  sleep 2
done
