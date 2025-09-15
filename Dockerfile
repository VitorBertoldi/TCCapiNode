# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /TCCAPINODE

# 1) Instala deps de build
COPY package*.json ./
RUN npm ci

# 2) Gera Prisma Client durante o build
COPY prisma ./prisma
RUN npx prisma generate

# 3) Compila o TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine AS runner
WORKDIR /TCCAPINODE

# Libs necessárias pros engines do Prisma no Alpine
RUN apk add --no-cache openssl libc6-compat

# (Opcional) Se quiser usar HEALTHCHECK com curl, descomente a linha abaixo
# RUN apk add --no-cache curl

# Usuário não-root
RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs
USER nodeuser

# Copia apenas o que precisa em produção (paths corrigidos!)
COPY --chown=nodeuser:nodejs --from=builder /TCCAPINODE/node_modules ./node_modules
COPY --chown=nodeuser:nodejs --from=builder /TCCAPINODE/prisma ./prisma
COPY --chown=nodeuser:nodejs --from=builder /TCCAPINODE/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# (Opcional) healthcheck – só use se instalou curl lá em cima
# HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -fsS http://127.0.0.1:${PORT}/health || exit 1

# Migrations + start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
