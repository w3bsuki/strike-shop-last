# THIS DOCKERFILE IS FOR RAILWAY DEPLOYMENT ONLY
# It builds the Medusa backend from the my-medusa-store subdirectory

FROM node:20-alpine

RUN apk add --no-cache python3 g++ make

WORKDIR /app/my-medusa-store

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# First, copy everything to have access to my-medusa-store
COPY . /app/

# Navigate to the medusa directory
WORKDIR /app/my-medusa-store

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the application
RUN pnpm run build

# Expose port
EXPOSE 8000

# Use PORT environment variable from Railway
ENV PORT=8000
ENV NODE_ENV=production

# Start the application
CMD ["pnpm", "run", "start"]