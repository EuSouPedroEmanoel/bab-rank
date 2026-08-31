FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build do frontend (gera dist/client e dist/server)
RUN npm run build

EXPOSE 3001

# Healthcheck interno para o compose
HEALTHCHECK --interval=10s --timeout=5s --retries=10 CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "server/index.js"]
