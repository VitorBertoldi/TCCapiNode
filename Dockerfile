# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /TCCAPINODE

# 1) Instala deps de build
COPY package*.json ./
RUN npm ci

# 2) Copia schema e gera Prisma Client (build)
COPY prisma ./prisma
RUN npx prisma generate

# 3) Compila o TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine AS runner
WORKDIR /TCCAPINODE

# Dependências nativas para Prisma no Alpine
RUN apk add --no-cache openssl libc6-compat

# Usuário não-root
RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs
USER nodeuser

# Copia artefatos do builder (note o caminho /TCCAPINODE)
COPY --chown=nodeuser:nodejs --from=builder /TCCAPINODE/node_modules ./node_modules
COPY --chown=nodeuser:nodejs --from=builder /TCCAPINODE/prisma ./prisma
COPY --chown=nodeuser:nodejs --from=builder /TCCAPINODE/dist ./dist
COPY --chown=nodeuser:nodejs package*.json ./

# Variáveis padrão para Cloud Run
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Subida do app (se você NÃO usa migrations no Node, remova a parte do migrate)
CMD ["sh", "-c", "npx prisma migrate deploy || true; node dist/index.js"]
