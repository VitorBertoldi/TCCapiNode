# ---- Build ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma

# 👇 Usa uma DATABASE_URL "dummy" só para o prisma generate no build
ENV DATABASE_URL="mysql://root:root@localhost:3306/dummy"
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

# 👇 Agora o Prisma vai usar a DATABASE_URL real definida no Cloud Run
CMD ["node", "dist/index.js"]
