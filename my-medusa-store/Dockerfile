# Medusa Backend Dockerfile
FROM node:20-alpine

# Install build dependencies
RUN apk add --no-cache python3 g++ make

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application files
COPY . .

# Build the application
RUN pnpm run build

# Runtime configuration
EXPOSE 8000
ENV NODE_ENV=production
ENV PORT=8000

# Start command
CMD ["pnpm", "run", "start"]