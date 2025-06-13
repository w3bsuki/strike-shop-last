FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Build
RUN pnpm run build

# Expose port
EXPOSE 9000

# Start directly without migrations (they might be causing the timeout)
CMD ["pnpm", "run", "start"]