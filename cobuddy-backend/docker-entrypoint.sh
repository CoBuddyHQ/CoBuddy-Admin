#!/bin/sh
set -e

echo "================================================="
echo " CoBuddy Admin Backend — Container Starting      "
echo " Environment: ${NODE_ENV:-development}           "
echo "================================================="

echo "[1/3] Waiting for PostgreSQL database connection..."
node -e '
const net = require("net");
let attempts = 0;
function check() {
  attempts++;
  const host = process.env.POSTGRES_HOST || "postgres";
  const socket = net.createConnection({ host, port: 5432 }, () => {
    console.log("      PostgreSQL is reachable and accepting connections!");
    socket.end();
    process.exit(0);
  });
  socket.on("error", (err) => {
    if (attempts >= 45) {
      console.error("      Timed out waiting for PostgreSQL.");
      process.exit(1);
    }
    setTimeout(check, 1000);
  });
}
check();
'

echo "[2/3] Applying Prisma database migrations..."
npx prisma migrate deploy

echo "[3/3] Starting CoBuddy Admin Backend on port 4000..."
exec node dist/src/main.js
