FROM node:20-alpine

WORKDIR /app

# Copy medusa files
COPY my-medusa-store/package*.json ./
COPY my-medusa-store/pnpm-lock.yaml ./
COPY my-medusa-store/yarn.lock ./

# Install dependencies using npm (more reliable for Railway)
RUN npm install

# Copy rest of medusa
COPY my-medusa-store/ .

# Build
RUN npm run build

EXPOSE 8000

CMD ["npm", "run", "start"]