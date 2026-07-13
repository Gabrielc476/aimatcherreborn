# Análise de Custos e Faturamento - AI Matcher

Este documento apresenta uma modelagem detalhada de custos (infraestrutura e IA) e projeções de faturamento para a plataforma **AI Matcher**, comparando a arquitetura tradicional da AWS com uma **arquitetura alternativa de ultra-baixo custo** perfeita para se pagar com anúncios logo no início.

---

## 1. Visão Geral da Arquitetura de Custos

O AI Matcher é estruturado como um monorepo que pode rodar em duas topologias de infraestrutura:

1.  **Arquitetura AWS (Escalável / Corporativa)**: Utiliza containers gerenciados sem servidor (AWS ECS Fargate), balanceador de carga (ALB) e banco gerenciado. É ideal para sistemas corporativos robustos, mas tem um custo fixo inicial alto.
2.  **Arquitetura Serverless/PaaS (Ultra-baixo Custo / Bootstrap)**: Utiliza serviços de hospedagem modernos voltados a desenvolvedores (Vercel e Render) e execução do robô de coleta por automações de CI/CD (GitHub Actions). É ideal para validar o MVP e monetizar via anúncios com baixo tráfego.

---

## 2. Detalhe de Custos de Provedores (Tabela Comparativa de Infraestrutura)

Aqui está a comparação entre a infraestrutura padrão baseada na AWS e a alternativa econômica:

| Serviço / Recurso | Opção Padrão (AWS) | Opção Econômica (PaaS / Serverless) | Plataforma Proposta |
| :--- | :--- | :--- | :--- |
| **Frontend (NextJS)** | $18.00 / mês (Fargate) | **$0.00** (Free Tier Hobby) | [Vercel](https://vercel.com) |
| **Backend (NestJS)** | $18.00 / mês (Fargate) | **$7.00 / mês** (Starter - sem sleep) | [Render](https://render.com) |
| **Application Load Balancer**| $22.50 / mês (ALB) | **$0.00** (Incluso no Render/Vercel) | Render / Vercel SSL nativo |
| **Banco & Storage (Postgres)**| $25.00 / mês (Supabase Pro) | **$0.00** (Supabase Free Tier) | [Supabase](https://supabase.com) |
| **Web Scraper (Python)** | $1.48 / mês (ECS Job) | **$0.00** (Actions Cron Workflow) | [GitHub Actions](https://github.com) |
| **Tráfego / Rede (Egress)** | $4.50 / mês | **$0.00** (Incluso nas cotas grátis) | Vercel / Render |
| **Inteligência Artificial (Gemma 4)**| $0.00 (AI Studio Free Tier) | **$0.00** (AI Studio Free Tier) | [Google AI Studio](https://ai.google.dev) |
| **CUSTO MENSAL FIXO** | **~$64.48 / mês (R$ 354,64)**| **~$7.00 / mês (R$ 38,50)** | **Economia de 89%** |

---

## 3. Estratégia de Hospedagem Ultra-Econômica (MVP)

Para atingir o custo de **R$ 38,50 por mês ($7.00)**, configure o projeto da seguinte forma:

### 3.1. Frontend na Vercel (R$ 0,00)
A Vercel foi criada pelos criadores do Next.js. Ela oferece hospedagem gratuita (Hobby Tier) para projetos pessoais que inclui:
*   Build automático a cada push no GitHub.
*   SSL gratuito.
*   Serverless Functions integradas para o backend do Next.js (SSR).
*   Rede global de CDN, garantindo carregamento instantâneo da página inicial.

### 3.2. Backend no Render (R$ 38,50)
O Render permite hospedar o servidor NestJS (API) em containers de forma simples:
*   **Por que o plano Starter ($7.00/mês) em vez do Free ($0.00)?**
    No plano gratuito do Render, o container entra em modo de suspensão (*sleep*) após 15 minutos sem receber requisições. Se um novo usuário acessa o app, o servidor demora cerca de 30 a 50 segundos para acordar (cold start), o que prejudica a experiência e causa perda de usuários. O plano Starter elimina o sleep e mantém a API ativa 24/7.
*   **Capacidade**: O plano inclui 512 MB de RAM e 0.5 vCPU, o que é suficiente para gerenciar centenas de conexões simultâneas de usuários no NestJS.

### 3.3. Banco de Dados e Storage no Supabase (R$ 0,00)
O Free Tier do Supabase é extremamente generoso para iniciar:
*   **PostgreSQL**: 500 MB de armazenamento. Como o AI Matcher armazena currículos estruturados em tabelas leves de JSON, 500 MB é suficiente para armazenar mais de **10.000 perfis estruturados** e históricos de matching.
*   **File Storage**: 1 GB de espaço. Permite armazenar cerca de **1.000 currículos em PDF originais** (tamanho médio de 1 MB por arquivo).

### 3.4. Web Scraper no GitHub Actions (R$ 0,00)
O scraper de vagas em Python com Playwright consome muitos recursos (RAM e CPU) ao rodar um navegador automatizado. Em vez de pagar um servidor na AWS para rodá-lo, utilize o **GitHub Actions**:
*   O GitHub disponibiliza **2.000 minutos grátis por mês** de execução de workflows em repositórios privados.
*   Configure um arquivo de workflow `.github/workflows/scraper.yml` agendado via cron para rodar diariamente à meia-noite.
*   O scraper executa nos servidores gratuitos do GitHub por cerca de 30 minutos diários (15 horas por mês = 900 minutos), restando ainda 1.100 minutos grátis de cota.
*   Após raspar as vagas, o robô faz uma chamada HTTP autenticada enviando os dados para a API do seu backend no Render (`POST /vaga/integrar-externo`).

---

## 4. Viabilidade Financeira e Monetização com Anúncios (AdSense)

Para se sustentar utilizando anúncios do Google AdSense, a meta é cobrir o custo operacional de **R$ 38,50/mês**.

### 4.1. Estimativa de Receita por Anúncio (CPM)
No nicho de tecnologia/carreiras, o CPM (Custo por Mil impressões de anúncios) no Brasil gira em torno de **R$ 5,00 a R$ 12,00**. 
Assumindo uma média conservadora de **R$ 6,00 CPM** (R$ 6,00 de receita para cada 1.000 visualizações de páginas com anúncios):

$$\text{Receita Mensal} = \left(\frac{\text{Pageviews Mensais}}{1000}\right) \times \text{CPM}$$

### 4.2. Ponto de Equilíbrio (Breakeven)

Para cobrir a infraestrutura:
*   **Na AWS (Custo R$ 354,64)**:
    $$\text{Pageviews Necessários} = \frac{\text{R\$ 354,64}}{\text{R\$ 6,00}} \times 1.000 \approx \mathbf{59.100 \text{ visualizações/mês}}$$
    *Dificuldade*: Exige tráfego de médio porte logo no lançamento, difícil de atingir sem investimento em marketing.
    
*   **Na Opção Econômica (Custo R$ 38,50)**:
    $$\text{Pageviews Necessários} = \frac{\text{R\$ 38,50}}{\text{R\$ 6,00}} \times 1.000 \approx \mathbf{6.400 \text{ visualizações/mês}}$$
    *Dificuldade*: **Extremamente simples**. Equivale a cerca de **213 visualizações de página por dia**. Um único post viral em comunidades de tecnologia (LinkedIn, Reddit, WhatsApp de vagas) é capaz de gerar esse tráfego mensal em um único dia.

### 4.3. Projeção de Margem com Anúncios em Crescimento

Se o site atingir **30.000 pageviews/mês** (cerca de 1.000 por dia):
*   **Faturamento AdSense**: $30 \times \text{R\$ 6,00} = \text{R\$ 180,00}$
*   **Custo de Infraestrutura**: R$ 38,50 (Render) + R$ 0,00 (Outros) = R$ 38,50
*   **Lucro Líquido**: **+R$ 141,50 / mês** (O site passa a se autofinanciar e gera caixa para reinvestimento).

---

## 5. Recomendações Técnicas para Rodar no Modo Econômico

1.  **Compactação dos PDFs**: No endpoint de upload, configure um limite de tamanho de currículo (máximo de 2 MB) para evitar que o limite de 1 GB do Supabase Storage seja atingido rapidamente.
2.  **Otimização do Prisma**: O NestJS no Render Starter (512 MB RAM) deve ter o Prisma Client instanciado de forma otimizada (sem conexões extras desnecessárias com o banco) para evitar estouro de memória. Configure a conexão de banco para usar o pooler do Supabase.
3.  **Ad Blocks**: Como o seu público-alvo são profissionais de tecnologia (que costumam usar extensões de bloqueio de anúncios), implemente uma notificação amigável solicitando para desativar o AdBlock para ajudar a manter o serviço gratuito no ar.
