FROM node:20-alpine

RUN apk add --no-cache python3 g++ make

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files from my-medusa-store
COPY my-medusa-store/package.json my-medusa-store/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application from my-medusa-store
COPY my-medusa-store/ .

# Build the application
RUN pnpm run build

# Expose port
EXPOSE 8000

# Use PORT environment variable from Railway
ENV PORT=8000

# Start the application
CMD ["pnpm", "run", "start"]