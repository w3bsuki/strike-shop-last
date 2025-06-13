FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 g++ make

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set Node.js memory limit for build process
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build backend and admin with increased memory
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm run build
RUN echo "Backend build completed"

# Build admin panel with increased memory
RUN NODE_OPTIONS="--max-old-space-size=4096" npx medusa build --admin-only
RUN echo "Admin build check:" && ls -la .medusa/admin/ || echo "Admin build not found"

# Expose port
EXPOSE 9000

# Set runtime environment variables
ENV PORT=9000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

# Use Railway's recommended approach - predeploy script handles migrations
CMD ["sh", "-c", "npm run predeploy && npm run start"]