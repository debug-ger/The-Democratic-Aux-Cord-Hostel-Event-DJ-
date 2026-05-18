# ── Stage 1: Builder ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
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
RUN npm run build

# ── Stage 2: Runner ──────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy production node_modules and built output
COPY --from=builder /app/apps/server/node_modules ./node_modules
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/prisma ./prisma
COPY --from=builder /app/apps/server/package.json ./package.json

EXPOSE 3001

CMD ["node", "dist/main"]
