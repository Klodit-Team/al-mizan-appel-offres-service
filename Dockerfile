FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM node:18-alpine
RUN apk add --no-cache openssl
WORKDIR /usr/src/app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npx prisma generate
COPY --from=builder /usr/src/app/dist ./dist
EXPOSE 8003
CMD npx prisma migrate deploy && node dist/main
