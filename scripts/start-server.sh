#!/bin/bash
# WAFT MAM Farms - Server startup script
# Usage: bash /home/z/my-project/scripts/start-server.sh

cd /home/z/my-project

# Kill any existing server
pkill -f "standalone/server" 2>/dev/null
sleep 1

# Ensure standalone build exists
if [ ! -f ".next/standalone/server.js" ]; then
  echo "Building production app..."
  npm run build
  cp -r .next/static .next/standalone/.next/
  cp -r public .next/standalone/ 2>/dev/null
fi

# Start with bun (persistent runtime)
PORT=3000 NODE_ENV=production setsid nohup bun .next/standalone/server.js </dev/null > /tmp/waft-bun.log 2>&1 & disown

# Wait and verify
sleep 3
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
  echo "✅ WAFT MAM Farms server running on port 3000"
else
  echo "❌ Server failed to start. Check /tmp/waft-bun.log"
fi
