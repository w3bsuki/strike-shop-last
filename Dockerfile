# Root Dockerfile for Railway - Builds Medusa Backend
FROM node:20-alpine

# Install build dependencies
RUN apk add --no-cache python3 g++ make

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy medusa backend files
COPY my-medusa-store/package.json my-medusa-store/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy rest of medusa backend
COPY my-medusa-store/ .

# Build the application
RUN pnpm run build

# Runtime configuration
EXPOSE 8000
ENV NODE_ENV=production

# Start command with explicit port
CMD ["sh", "-c", "PORT=${PORT:-8000} pnpm run start"]