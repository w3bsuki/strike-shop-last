FROM node:20-alpine

WORKDIR /app

# Install deps
RUN apk add --no-cache python3 g++ make
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy everything
COPY . .

# Build
RUN pnpm run build

EXPOSE 9000
ENV PORT=9000
ENV HOST=0.0.0.0

# Run migrations then start with debug
CMD ["sh", "-c", "npx medusa db:migrate && node start.js"]