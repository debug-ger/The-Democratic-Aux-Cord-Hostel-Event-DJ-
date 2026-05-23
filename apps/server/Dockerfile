# ── Stage 1: Builder ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
ARG CACHE_BUST=1

# Install ALL workspace dependencies from root
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/types/package*.json ./packages/types/
RUN npm ci --workspace=apps/server --workspace=packages/types --ignore-scripts

# Copy source
COPY apps/server ./apps/server
COPY packages/types ./packages/types

# Generate Prisma client & build
WORKDIR /app/apps/server
RUN npx prisma generate
RUN ./node_modules/.bin/nest build


# ── Stage 2: Runner ──────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy root node_modules (contains hoisted @repo/types and other shared deps)
COPY --from=builder /app/node_modules ./node_modules

# Copy server node_modules, built output, prisma schema & package.json
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/prisma ./prisma
COPY --from=builder /app/apps/server/package.json ./package.json

# Startup: push schema to DB (creates tables if missing), then start server
RUN printf '#!/bin/sh\nset -e\necho "Pushing Prisma schema to database..."\nnode_modules/.bin/prisma db push --schema=/app/prisma/schema.prisma --accept-data-loss\necho "Starting server..."\nexec node dist/main\n' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 3001

CMD ["/app/start.sh"]
