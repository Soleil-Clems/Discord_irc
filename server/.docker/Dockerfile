ARG NODE_VERSION="22"

FROM node:${NODE_VERSION} AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .
RUN npm run build

FROM node:${NODE_VERSION}-alpine AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist/ ./dist

EXPOSE 8080

CMD ["node", "dist/main"]


