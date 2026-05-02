#!/bin/bash
# Start API server in background
node api/server.js &
API_PID=$!

# Start frontend dev server in background
cd frontend && npm run dev &
FRONT_PID=$!

# Start WhatsApp bot
cd ..
node index.js
