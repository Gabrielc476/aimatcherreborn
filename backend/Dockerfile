# ==============================================================================
# STAGE 1: Build
# ==============================================================================
FROM node:22-alpine AS build

WORKDIR /usr/src/app

# Copia arquivos de definição de pacotes
COPY package*.json ./

# Instala todas as dependências (usando npm install para resolver inconsistências no lockfile)
RUN npm install --no-audit --no-fund

# Copia o schema do Prisma e gera o Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# Copia o restante do código fonte
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Compila o projeto NestJS
RUN npm run build

# Remove as dependências de desenvolvimento para economizar espaço
RUN npm prune --production

# ==============================================================================
# STAGE 2: Run
# ==============================================================================
FROM node:22-alpine AS production

WORKDIR /usr/src/app

# Copia apenas as dependências de produção do estágio anterior
COPY --from=build /usr/src/app/node_modules ./node_modules

# Copia a build do NestJS
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package.json ./package.json

# Copia a pasta do Prisma para permitir migrações se necessário
COPY --from=build /usr/src/app/prisma ./prisma

# Porta padrão de execução do Render
ENV PORT=10000
EXPOSE 10000

# Variáveis padrão de produção do NodeJS
ENV NODE_ENV=production

# --max-old-space-size=450: Limita a heap do Node.js a 450MB (evita estouros no Render Starter 512MB RAM).
# --dns-result-order=ipv4first: Força a resolução DNS a preferir IPv4. Isso impede que o Node.js
# tente se conectar via IPv6 a serviços externos (como Supabase ou Google AI) em ambientes
# Docker/WSL2 onde o IPv6 não está totalmente roteado.
CMD ["node", "--max-old-space-size=450", "--dns-result-order=ipv4first", "dist/main.js"]
