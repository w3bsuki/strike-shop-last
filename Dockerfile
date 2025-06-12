FROM node:20-alpine AS base

RUN apk add --no-cache python3 g++ make

WORKDIR /app

FROM base AS deps

RUN corepack enable pnpm

COPY my-medusa-store/package.json my-medusa-store/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

FROM base AS builder

RUN corepack enable pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY my-medusa-store/ .

ENV NODE_ENV=production

RUN pnpm run build

FROM base AS runtime

RUN corepack enable pnpm

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.medusa ./.medusa
COPY --from=builder /app/medusa-config.production.ts ./medusa-config.production.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src
COPY --from=builder /app/static ./static
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 8000

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["pnpm", "run", "start"]