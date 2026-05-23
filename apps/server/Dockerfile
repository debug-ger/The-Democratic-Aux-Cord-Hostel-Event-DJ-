# ── Stage 1: Builder ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install workspace dependencies
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/types/package*.json ./packages/types/
RUN npm ci --workspace=apps/server --workspace=packages/types --ignore-scripts

# Copy source
COPY apps/server ./apps/server
COPY packages/types ./packages/types

# Generate Prisma client & bundle build with webpack
WORKDIR /app/apps/server
RUN npx prisma generate
RUN ./node_modules/.bin/nest build


# ── Stage 2: Runner ──────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Only need prisma binary + @prisma/client (not bundled by webpack)
COPY --from=builder /app/apps/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/server/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/apps/server/node_modules/prisma ./node_modules/prisma

# Copy bundled output and prisma schema
COPY --from=builder /app/apps/server/dist/main.js ./dist/main.js
COPY --from=builder /app/apps/server/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/apps/server/package.json ./package.json

# Startup: push schema to DB then start server
RUN printf '#!/bin/sh\nset -e\necho "Pushing schema to database..."\n./node_modules/.bin/prisma db push --schema=/app/prisma/schema.prisma --accept-data-loss\necho "Starting server..."\nexec node dist/main.js\n' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 3001

CMD ["/app/start.sh"]
