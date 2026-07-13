# ==============================================================================
# STAGE 1: Build
# ==============================================================================
FROM node:22-alpine AS build

WORKDIR /usr/src/app

# Copia arquivos de pacotes
COPY package*.json ./

# Instala dependências (usando npm install para resolver inconsistências no lockfile)
RUN npm install --no-audit --no-fund

# Copia código fonte do frontend NextJS
COPY src ./src
COPY public ./public
COPY next.config.ts ./
COPY tsconfig.json ./
COPY postcss.config.mjs ./
COPY eslint.config.mjs ./
COPY components.json ./

# Variável de ambiente durante o build para injetar a URL da API (usada pelo NextJS no bundle)
ARG NEXT_PUBLIC_API_URL=http://localhost:10000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Executa a compilação do NextJS
RUN npm run build

# Remove dependências de dev
RUN npm prune --production

# ==============================================================================
# STAGE 2: Run
# ==============================================================================
FROM node:22-alpine AS production

WORKDIR /usr/src/app

# Copia dependências de produção compiladas
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/.next ./.next
COPY --from=build /usr/src/app/public ./public
COPY --from=build /usr/src/app/package.json ./package.json

# Define a porta padrão do NextJS
ENV PORT=3000
EXPOSE 3000

ENV NODE_ENV=production

# Inicia o servidor de produção do NextJS (next start)
CMD ["npm", "run", "start"]
