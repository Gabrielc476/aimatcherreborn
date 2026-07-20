# ==============================================================================
# STAGE 1: Build
# ==============================================================================
FROM node:22-slim AS build

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
FROM node:22-slim AS production

# Instala Python3, pip e dependências de sistema necessárias para o Chromium Headless
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libharfbuzz0b \
    libx11-xcb1 \
    libxcb-dri3-0 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copia apenas as dependências de produção do estágio anterior
COPY --from=build /usr/src/app/node_modules ./node_modules

# Copia a build do NestJS
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package.json ./package.json

# Copia a pasta do Prisma para permitir migrações se necessário
COPY --from=build /usr/src/app/prisma ./prisma

# Cria ambiente virtual Python para isolar as dependências do Playwright
RUN python3 -m venv /usr/src/app/venv
ENV PATH="/usr/src/app/venv/bin:$PATH"

# Instala as dependências Python necessárias para o pdf_generator.py
RUN pip install --no-cache-dir jinja2 playwright

# Instala o navegador Chromium para o Playwright no ambiente Python do Worker
RUN playwright install chromium

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

