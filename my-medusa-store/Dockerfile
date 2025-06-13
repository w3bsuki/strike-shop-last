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

# Build everything including admin
RUN pnpm run build
RUN npx medusa build --admin-only
RUN echo "Admin build check:" && ls -la .medusa/admin/ || echo "Admin build failed"

EXPOSE 9000
ENV PORT=9000
ENV HOST=0.0.0.0

CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]