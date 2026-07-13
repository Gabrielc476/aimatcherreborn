# Dockerfile para o Scraper (Simulador de GitHub Actions)
FROM python:3.11-slim

# Instala dependências básicas de sistema e utilitários
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    --no-install-recommends

# Instala o Google Chrome oficial utilizando gpg moderno sem apt-key
RUN curl -fsSL https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copia os arquivos de dependências
COPY requirements.txt ./

# Instala dependências do Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código fonte do scraper
COPY config.py database.py main.py ./
COPY engines ./engines

# Mapeia as variáveis de ambiente necessárias
ENV HEADLESS=true
ENV INTEGRATION_MODE=API
ENV BACKEND_URL=http://backend:10000

# Executa o Scraper enviando dados para o Backend
CMD ["python", "main.py"]
