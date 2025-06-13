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

# Build backend first, then admin explicitly
RUN pnpm run build
RUN echo "Checking admin build..." && ls -la .medusa/ || echo "No .medusa directory"

# Create start script that handles admin build
RUN echo '#!/bin/sh' > /app/start-medusa.sh && \
    echo 'echo "Running migrations..."' >> /app/start-medusa.sh && \
    echo 'npx medusa db:migrate' >> /app/start-medusa.sh && \
    echo 'echo "Checking admin build..."' >> /app/start-medusa.sh && \
    echo 'if [ ! -f ".medusa/admin/index.html" ]; then' >> /app/start-medusa.sh && \
    echo '  echo "Admin not built, building now..."' >> /app/start-medusa.sh && \
    echo '  npx medusa build --admin-only' >> /app/start-medusa.sh && \
    echo 'fi' >> /app/start-medusa.sh && \
    echo 'echo "Starting Medusa..."' >> /app/start-medusa.sh && \
    echo 'exec npx medusa start' >> /app/start-medusa.sh && \
    chmod +x /app/start-medusa.sh

EXPOSE 9000
ENV PORT=9000
ENV HOST=0.0.0.0

CMD ["./start-medusa.sh"]