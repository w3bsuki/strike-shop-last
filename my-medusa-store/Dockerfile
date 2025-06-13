FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies in one layer
RUN apk add --no-cache python3 g++ make && \
    corepack enable && \
    corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 && \
    corepack enable && \
    corepack prepare pnpm@latest --activate

# Copy from builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.medusa ./.medusa
COPY --from=builder /app/src ./src
COPY --from=builder /app/medusa-config.js ./medusa-config.js

EXPOSE 9000

CMD ["pnpm", "run", "start"]