# ---- Build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

# Usuário não-root
RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs
USER nodeuser

# Copia artefatos do build
COPY --chown=nodeuser:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nodeuser:nodejs --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Sobe migrations (se tiver) + inicia
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
