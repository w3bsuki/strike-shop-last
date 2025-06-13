FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 g++ make
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY my-medusa-store/package.json my-medusa-store/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY my-medusa-store/ .
RUN pnpm run build

EXPOSE 9000
ENV PORT=9000
ENV HOST=0.0.0.0

CMD ["pnpm", "run", "start"]