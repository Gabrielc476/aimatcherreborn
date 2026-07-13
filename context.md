# AI Matcher - System Context & Architecture

Este documento descreve o contexto do sistema, arquitetura, modelo C4, entidades, endpoints e o fluxo geral da plataforma **AI Matcher**.

---

## 1. Visão Geral do Sistema

### Descrição Curta
O **AI Matcher** é uma plataforma inteligente que automatiza o matching de currículos de candidatos com vagas de tecnologia utilizando inteligência artificial generativa avançada (Gemma 4).

### Descrição Longa
O sistema resolve o gargalo de recrutamento em tecnologia extraindo automaticamente o texto de currículos em formato PDF, estruturando os dados profissionais de forma rica (experiências, habilidades, idiomas, projetos) via Inteligência Artificial e executando um matching semântico profundo contra vagas cadastradas.

Além disso, a plataforma conta com um serviço autônomo de garimpo de vagas (Web Scraper) em Python que minera vagas de tecnologia de múltiplos portais (LinkedIn, NerdIn, Indeed, InfoJobs, WeWorkRemotely) e as integra diretamente ao banco de dados.

Ao invés de buscar palavras-chave simples, a IA analisa a compatibilidade real da senioridade, tecnologias e pretensões, atribuindo uma nota de compatibilidade detalhada (score) acompanhada de uma justificativa de pontos fortes, pontos fracos e recomendações de desenvolvimento.

---

## 2. Personas (Usuários)

### Candidato (Profissional)
*   **Tipo**: Usuário Humano
*   **Descrição**: Profissional de tecnologia buscando oportunidades de trabalho.
*   **Objetivos**: Cadastrar seu perfil, fazer upload do seu currículo em PDF e visualizar as vagas compatíveis com suas competências e pretensões.
*   **Funcionalidades Principais**: Registro/Login, Upload de Currículo, Edição de Preferências e Projetos, Visualização de Vagas e Matchings correspondentes.

### Recrutador (RH / Tech Recruiter)
*   **Tipo**: Usuário Humano
*   **Descrição**: Responsável pela aquisição de talentos ou contratação técnica em empresas.
*   **Objetivos**: Criar vagas estruturadas e identificar os candidatos mais qualificados ordenados por pontuação de compatibilidade.
*   **Funcionalidades Principais**: Registro/Login, Criação e Edição de Vagas, Visualização de Matchings e Perfis de Candidatos para uma vaga específica.

---

## 3. Funcionalidades do Sistema

### Autenticação e Gestão de Sessão
*   Autenticação customizada utilizando e-mail/senha com hashing seguro via `bcrypt`.
*   Geração de Tokens JWT no NestJS para autenticação stateless.
*   Passagem de credenciais seguras para o banco de dados via variáveis locais para garantir proteção de dados multi-tenant.

### Processamento Inteligente de Currículo (IA)
*   Extração do conteúdo de arquivos PDF.
*   Uso do **Gemma 4** (Google Gen AI) para estruturar os dados não estruturados do currículo em entidades formais de banco de dados (experiência, formação acadêmica, competências, projetos).
*   Upload seguro do arquivo original em PDF para o Supabase Storage Bucket com geração de links assinados temporários.

### Otimização de Currículos para Vagas (Resume Optimizer)
*   Uso do **Gemma 4** com raciocínio lógico (*thinking mode*) e histórico de gaps identificados em análises de compatibilidade anteriores para reescrever de forma cirúrgica o currículo do candidato com foco nos requisitos da vaga-alvo.
*   Possibilidade de edição manual interativa do currículo otimizado no frontend pelo candidato (edição de resumo profissional, habilidades, experiências, projetos relevantes, certificações, idiomas e formação acadêmica).
*   Simulador de Matching Score: cálculo temporário e comparativo de score de compatibilidade a partir do editor.
*   Exportação de PDF de alta fidelidade e ATS-friendly através de renderização headless com Playwright e Python.

### Estruturação de Vagas (IA)
*   Análise de descrições brutas de vagas.
*   Estruturação automática dos requisitos mínimos, desejáveis e diferenciais da vaga via inteligência artificial.

### Garimpo e Agregação de Vagas (Scraping)
*   Serviço autônomo escrito em Python que extrai vagas de tecnologia em tempo real.
*   Suporte a múltiplos portais externos: LinkedIn, Indeed, InfoJobs, NerdIn e WeWorkRemotely.
*   Agendamento integrado (Cron Job) no NestJS para execução diária automática à meia-noite.
*   Endpoint REST seguro para acionamento sob demanda do orquestrador do scraper.

### Matching Avançado
*   Matching semântico executado pela IA analisando o currículo estruturado em comparação com os requisitos da vaga.
*   Retorno rico contendo score de 0 a 100, justificativa, pontos fortes, pontos fracos e recomendações de desenvolvimento.

### Design System & Navegação Global
*   **Identidade Visual (Warm Editorial)**: Interface premium baseada em tipografia serifada (`font-serif`) para títulos de destaque, fontes mono para metadados/badges e uma paleta de cores terrosas refinadas (terracota e brass accents).
*   **Cabeçalho Global Unificado**: Componente de navegação superior (`Header`) integrado em todas as telas principais do candidato e do recrutador, centralizando o controle de abas e o fluxo de encerramento de sessão.
*   **Workspace de Vagas Espaçoso**: Listagem de vagas estruturada em grade ampla de 3 colunas responsivas. A ação de clique no card direciona o usuário diretamente à página dedicada de detalhes da vaga, abolindo o uso de drawers aglomerados nas laterais.
*   **Página Dedicada de Detalhes da Vaga**: Organizada em duas colunas responsivas:
    *   *Coluna da Esquerda (Principal)*: Área generosa e totalmente aberta dedicada à descrição detalhada, requisitos obrigatórios/desejáveis de competências, benefícios e etapas do processo seletivo.
    *   *Coluna da Direita (Sidebar)*: Ficha técnica resumida da vaga (modalidade, regime, senioridade, salário), perfil da empresa e o card de análise do Match com Inteligência Artificial.
*   **Barras de Rolagem Customizadas**: Estilização premium global (`webkit-scrollbar`) fina (6px) e de cores terrosas escuras integradas ao tema dark mode, eliminando barras de rolagem nativas abrasivas.

---

## 4. Diagrama de Contexto de Sistema (C4 Model)

```mermaid
C4Context
    title Diagrama de Contexto do Sistema: AI Matcher

    Person(candidato, "Candidato", "Cadastra perfil, faz upload de currículo e visualiza compatibilidades.")
    Person(recrutador, "Recrutador", "Cadastra vagas manualmente e analisa candidatos mais compatíveis.")

    System(ai_matcher, "AI Matcher Application (NestJS)", "Backend modular contendo regras de negócio, autenticação, orquestração e APIs REST.")
    System(frontend, "AI Matcher Frontend (Next.js)", "Rico painel web interativo para candidatos e recrutadores.")
    System(scraper, "Web Scraper Service (Python)", "Serviço modular que garimpa vagas de tecnologia em portais de emprego externos.")

    System_Ext(google_ai, "Google Gen AI (Gemma 4)", "Processa e estrutura currículos, vagas e realiza a análise semântica de compatibilidade.")
    SystemDb(supabase_db, "Supabase Database (PostgreSQL)", "Armazena usuários, perfis, vagas e resultados de matchings sob Row Level Security (RLS).")
    System_Ext(supabase_storage, "Supabase Storage", "Armazena com segurança os arquivos originais de currículos em formato PDF.")
    System_Ext(portais_vagas, "Portais Externos de Vagas", "Plataformas externas como LinkedIn, Indeed, InfoJobs, NerdIn e WeWorkRemotely.")

    Rel(candidato, frontend, "Interage com", "HTTPS")
    Rel(recrutador, frontend, "Interage com", "HTTPS")
    Rel(frontend, ai_matcher, "Consome endpoints da API", "HTTPS/JSON")

    Rel(ai_matcher, google_ai, "Solicita inferência semântica e estruturação de dados", "Google Gen AI SDK")
    Rel(ai_matcher, supabase_db, "Lê e grava dados aplicando RLS na sessão", "Prisma ORM")
    Rel(ai_matcher, supabase_storage, "Faz upload e gera URLs assinadas de arquivos", "Supabase JS SDK")
    
    Rel(ai_matcher, scraper, "Dispara execução sob demanda", "spawn Subprocesso")
    Rel(scraper, portais_vagas, "Realiza raspagem de dados (Crawler)", "HTTPS/Playwright/BS4")
    Rel(scraper, supabase_db, "Grava vagas extraídas e estruturadas via API", "HTTPS / Token de Integração")
```

---

## 5. Estrutura do Projeto (Monorepo)

O projeto é organizado como um monorepo contendo o frontend web, o servidor backend modular de API, o serviço de raspagem de dados e as configurações de banco.

```
/aimatcher
  ├── /backend                      # Servidor de API (NestJS/TypeScript)
  │     ├── prisma/                 # Schema relacional e migrações do banco (Prisma)
  │     └── src/
  │         ├── domain/             # Domínio Puro (Entidades, Repositórios, Casos de Uso)
  │         ├── infrastructure/     # Conectores de infraestrutura (IA, PDF, BD, Storage, Scraper)
  │         └── presentation/       # Camada REST (Controllers, Guards, Middlewares)
  │
  ├── /frontend                     # Interface do Usuário (Next.js/React/Tailwind CSS)
  │     ├── public/                 # Recursos estáticos
  │     └── src/
  │         ├── app/                # Rotas da aplicação (Dashboard, Jobs, Resume)
  │         ├── components/         # Componentes interativos e estruturais (Shadcn UI)
  │         ├── lib/                # Funções de integração de API
  │         └── types/              # Definições de tipos TypeScript do domínio
  │
  ├── /scraper                      # Robô de Coleta de Vagas (Python)
  │     ├── engines/                # Scripts específicos de coleta por plataforma
  │     ├── config.py               # Configurações de chaves e variáveis do scraper
  │     ├── database.py             # Script de comunicação com a API de destino do banco
  │     └── main.py                 # CLI/Orquestrador do garimpo
  │
  └── /supabase                     # Configurações locais/em nuvem do Supabase
```

---

## 6. Entidades de Domínio

As entidades de negócio estão contidas em `src/domain/entities`:

1.  **Usuario**: Classe raiz que representa a conta do usuário. Armazena dados cadastrais, preferências de trabalho e referências aos dados de currículo.
2.  **Perfil**: Detalhes profissionais principais do usuário (título do cargo, resumo, anos de experiência, pretensão salarial).
3.  **Experiencia**: Histórico profissional do candidato (empresa, cargo, descrição, datas e tecnologias).
4.  **Formacao**: Histórico educacional e acadêmico (instituição, curso, grau e datas).
5.  **Habilidade**: Competências e competências técnicas com nível e tempo de experiência.
6.  **Certificacao**: Certificados profissionais obtidos (nome, emissor, validade).
7.  **Idioma**: Idiomas dominados e níveis de proficiência (leitura, escrita, conversação).
8.  **Preferencia**: Filtros e preferências de trabalho (modalidades desejadas, cidades, cargos e contrato).
9.  **Projeto**: Portfólio de projetos desenvolvidos (nome, descrição, tecnologias e link).
10. **Vaga**: Representa uma oportunidade criada manualmente ou integrada pelo scraper, com requisitos estruturados pela IA.
11. **Matching**: Registro da compatibilidade semântica calculada entre candidato e vaga, com score de 0 a 100 e justificativa.
12. **CurriculoOtimizado**: Versão customizada do currículo do candidato reescrita pela IA com foco em uma vaga específica. Mantém o perfil original intacto e permite edições em tempo real de resumo, competências, experiências, projetos, certificações, idiomas e formações acadêmicas.

---

## 7. Mecanismo Row Level Security (RLS)

Diferente de abordagens tradicionais onde o backend opera com total liberdade, o AI Matcher utiliza **Row Level Security (RLS)** nativo no PostgreSQL do Supabase para garantir isolamento absoluto de dados.

### Como funciona:
1.  O cliente faz uma requisição HTTP enviando seu token JWT customizado.
2.  O **`RlsMiddleware`** intercepta a requisição, valida o token, extrai o ID do usuário (`userId`) e o define em um fluxo de contexto isolado por thread utilizando o **`AsyncLocalStorage`** do Node.js.
3.  Toda query executada pelos repositórios do Prisma é envelopada em `this.prisma.runWithRLS()`.
4.  Esta função executa a query dentro de uma transação PostgreSQL iniciando com a instrução:
    ```sql
    SELECT set_config('request.jwt.claims', '{"sub": "USER_ID", "role": "authenticated"}', true);
    ```
5.  O Postgres lê o ID contido em `request.jwt.claims` e a função nativa **`auth.uid()`** do Supabase é alimentada. As tabelas bloqueadas por RLS no Supabase filtram os resultados automaticamente, garantindo que usuários comuns só tenham acesso a dados que lhes pertencem (`id = auth.uid()` ou `usuario_id = auth.uid()`).

---

## 8. Endpoints HTTP da API

Abaixo estão os endpoints reais expostos pelo servidor backend:

### Autenticação & Usuário (`/usuario`)
*   `POST /usuario/cadastro`: Registra um novo usuário no sistema.
*   `POST /usuario/login`: Valida as credenciais e retorna o token JWT do usuário.
*   `GET /usuario/verificar-token`: Verifica se o token enviado é válido.
*   `GET /usuario/:id`: Retorna os dados completos do usuário logado (requer token correspondente).
*   `PUT /usuario/:id`: Atualiza dados cadastrais ou currículo estruturado do usuário.

### Currículo (`/curriculo`)
*   `POST /curriculo/upload`: Endpoint multipart (form-data) que recebe o arquivo PDF, envia-o para o bucket privado do Supabase Storage, extrai o texto bruto e utiliza a IA (Gemma 4) para estruturar o perfil (requer token).
*   `POST /curriculo/otimizar`: Envia o currículo original e a vaga para a IA otimizar e reescrever o currículo especificamente para aquela vaga, salvando a versão customizada.
*   `GET /curriculo/otimizados`: Lista todos os currículos otimizados gerados pelo candidato.
*   `GET /curriculo/otimizados/:id`: Busca as informações de um currículo otimizado específico.
*   `POST /curriculo/otimizados/:id/pdf`: Gera e exporta o currículo otimizado no formato PDF binário utilizando o gerador headless Python com Playwright.
*   `POST /curriculo/simular-matching`: Simula temporariamente o score de compatibilidade de um currículo sendo editado no workspace do candidato em relação aos requisitos da vaga.

### Vaga (`/vaga`)
*   `POST /vaga/adicionar`: Cria e analisa semântica de uma nova vaga de trabalho (requer token de recrutador).
*   `POST /vaga/integrar-externo`: Permite a inserção direta de vagas vindas de coletores externos (protegido por token secreto `x-scraper-token`).
*   `GET /vaga/listar`: Retorna a lista de vagas ativas (paginado).
*   `GET /vaga/:id`: Retorna os detalhes de uma vaga específica.

### Matching (`/matching`)
*   `POST /matching/analisar`: Executa a análise de compatibilidade e gera ou atualiza o score de matching (requer token).
*   `POST /matching/recalcular/:usuarioId/:vagaId`: Força o recálculo do matching entre um candidato e vaga (requer token/admin).
*   `GET /matching/usuario/:usuarioId`: Lista todos os matchings vinculados àquele candidato.
*   `GET /matching/vaga/:vagaId`: Retorna os candidatos com matchings ordenados pelo score mais alto para a vaga especificada.
*   `GET /matching/:usuarioId/:vagaId`: Obtém a ficha detalhada de matching de um par específico de candidato e vaga.
*   `DELETE /matching/:usuarioId/:vagaId`: Remove um matching existente.

### Scraper (`/scraper`)
*   `POST /scraper/disparar`: Dispara de forma assíncrona o orquestrador do Web Scraper em Python a partir do backend (requer parâmetro `engine`, `query` e limite).

---

## 9. Simulação de Infraestrutura Local & Preparação para Deploy (Docker)

Para validar a integridade da aplicação sob condições reais de servidores de produção e custos econômicos, o sistema foi dockerizado simulando as restrições e timeouts das plataformas de hospedagem gratuitas e de baixo custo:

### 9.1. Backend NestJS (Simulando Render Starter)
*   **Limites de Recursos**: Restrito fisicamente a **512MB de RAM** e **0.5 de CPU** no `docker-compose.yml`.
*   **Controle de Heap V8**: O container roda Node com a flag `--max-old-space-size=450` para forçar o Garbage Collector a atuar ativamente antes de atingir o limite físico da máquina virtual, eliminando riscos de Out-Of-Memory (OOM).
*   **Prevenção de IPv6 do Prisma**: Bancos de dados recentes do Supabase usam conexões diretas IPv6-only na porta 5432. Como redes locais de desenvolvimento Docker/WSL2 raramente possuem roteamento IPv6 ativo para a internet, configuramos a aplicação para conectar através do **Session Pooler IPv4** (`aws-1-us-east-2.pooler.supabase.com:5432`) injetando o mapeamento estático do IP correspondente no arquivo `/etc/hosts` do container via `extra_hosts` do Docker Compose (para impedir que o Prisma Query Engine em Rust tente a conexão via IPv6).

### 9.2. Frontend NextJS (Simulando Vercel Hobby)
*   **Build Multi-Stage**: O frontend Next.js é compilado em ambiente isolado e roda na porta 3000 de forma otimizada para produção.
*   **Bypass de Timeout (10s)**: A Vercel Hobby impõe um timeout estrito de 10 segundos em funções Serverless. Para evitar que chamadas pesadas de inteligência artificial falhem por timeout, o Next.js realiza as requisições de IA e PDF diretamente do navegador do usuário (Client-side) para a API do backend exposta no Render (onde o limite de requisição é de 10 minutos).

### 9.3. Execução do Scraper (Bypass de Captchas)
*   Embora o scraper possua Dockerfile preparado, a estratégia recomendada para burlar barreiras contra bots do LinkedIn e Gupy é executá-lo diretamente no **host físico (Windows)**.
*   Isso permite que o script utilize o perfil real do Chrome local do usuário (mantendo cookies e logins ativos) e permite a **resolução manual na tela de Captchas** que possam surgir durante a raspagem. As vagas extraídas localmente são enviadas via requisição HTTP POST para `http://localhost:10000/vaga/integrar-externo` (porta do backend mapeada do Docker Compose).

