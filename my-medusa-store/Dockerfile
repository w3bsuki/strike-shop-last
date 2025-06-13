FROM node:20-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 g++ make

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy all files
COPY . .

# Build
RUN pnpm run build

# Expose port
EXPOSE 9000

# Start command
CMD ["pnpm", "run", "start"]