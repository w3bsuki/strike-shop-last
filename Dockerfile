FROM node:20-alpine

RUN apk add --no-cache python3 g++ make

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy entire project
COPY . .

# Change to medusa directory
WORKDIR /app/my-medusa-store

# Install dependencies
RUN pnpm install --frozen-lockfile

# Set production environment
ENV NODE_ENV=production

# Build the application
RUN NODE_ENV=production pnpm run build

# Expose port (Railway will override this with PORT env var)
EXPOSE 8000

# Start command
CMD ["pnpm", "run", "start"]