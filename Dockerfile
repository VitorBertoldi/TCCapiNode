# ---- Build ----
FROM node:20-alpine AS builder
WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm ci

# Copia Prisma e gera client
COPY prisma ./prisma
RUN npx prisma generate

# Copia código fonte e compila
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

# Cria usuário não-root
RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs
USER nodeuser

# Copia dependências + Prisma Client já gerado
COPY --chown=nodeuser:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=nodeuser:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nodeuser:nodejs --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Start app
CMD ["node", "dist/index.js"]
