# =============================================================
# CoBuddy Admin Backend — Multi-Stage Dockerfile
# Stage 1 (builder): compile TypeScript, generate Prisma client
# Stage 2 (runner):  production-grade container
# =============================================================

FROM node:24-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma/
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src/

ENV DATABASE_URL="postgresql://audit:audit@localhost:5432/audit?schema=public&sslmode=prefer"
RUN npx prisma generate
RUN npm run build

# ── STAGE 2: RUNNER ───────────────────────────────────────────
FROM node:24-alpine AS runner

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma/
COPY docker-entrypoint.sh ./

RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 4000

CMD ["sh", "docker-entrypoint.sh"]
