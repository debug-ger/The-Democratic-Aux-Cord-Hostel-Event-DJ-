FROM node:20-alpine
WORKDIR /app

# Install dependencies (keep workspace structure intact)
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/types/package*.json ./packages/types/
RUN npm ci --workspace=apps/server --workspace=packages/types --ignore-scripts

# Copy full source
COPY apps/server ./apps/server
COPY packages/types ./packages/types

# Generate Prisma client & compile TypeScript
WORKDIR /app/apps/server
RUN npx prisma generate
RUN ./node_modules/.bin/nest build

ENV NODE_ENV=production
EXPOSE 3001

# Push schema to DB then start server
CMD ["sh", "-c", "npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss && node dist/main"]
