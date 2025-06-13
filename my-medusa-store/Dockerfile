FROM node:20-alpine

# Install dependencies for node-gyp
RUN apk add --no-cache python3 g++ make

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Create startup script that handles everything
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Starting Medusa..."' >> /app/start.sh && \
    echo 'echo "DATABASE_URL: ${DATABASE_URL:0:30}..."' >> /app/start.sh && \
    echo 'echo "PORT: ${PORT}"' >> /app/start.sh && \
    echo 'echo "HOST: ${HOST}"' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Initialize database' >> /app/start.sh && \
    echo 'echo "Initializing database..."' >> /app/start.sh && \
    echo 'node scripts/init-database.js || echo "Database init failed, continuing..."' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start Medusa with explicit host binding' >> /app/start.sh && \
    echo 'echo "Starting Medusa server..."' >> /app/start.sh && \
    echo 'exec npx medusa start' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose the port
EXPOSE 9000
ENV PORT=9000
ENV HOST=0.0.0.0

# Use the Express server for health checks
CMD ["node", "server.js"]