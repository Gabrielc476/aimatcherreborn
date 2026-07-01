-- CreateEnum
CREATE TYPE "StatusUsuario" AS ENUM ('ATIVO', 'INATIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "ModalidadeTrabalho" AS ENUM ('REMOTO', 'HIBRIDO', 'PRESENCIAL');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nome_completo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "telefone" TEXT,
    "data_nascimento" TIMESTAMP(3),
    "status" "StatusUsuario" NOT NULL DEFAULT 'ATIVO',
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimo_acesso" TIMESTAMP(3),
    "curriculo_url" TEXT,
    "curriculo_texto" TEXT,
    "curriculo_extraido" JSONB,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfis" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "titulo" TEXT,
    "resumo_profissional" TEXT,
    "anos_experiencia" INTEGER NOT NULL DEFAULT 0,
    "pretensao_salarial" DECIMAL(10,2),
    "disponibilidade" TEXT,

    CONSTRAINT "perfis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiencias" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "empresa" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "descricao" TEXT,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3),
    "atual" BOOLEAN NOT NULL DEFAULT false,
    "tecnologias" TEXT[],

    CONSTRAINT "experiencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formacoes" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "instituicao" TEXT NOT NULL,
    "curso" TEXT NOT NULL,
    "grau" TEXT,
    "area" TEXT,
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),
    "concluido" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "formacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habilidades" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "nivel" TEXT,
    "anos_experiencia" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "habilidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificacoes" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "emissor" TEXT NOT NULL,
    "data_obtencao" TIMESTAMP(3),
    "data_validade" TIMESTAMP(3),
    "codigo_validade" TEXT,

    CONSTRAINT "certificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idiomas" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "nivel_leitura" TEXT,
    "nivel_escrita" TEXT,
    "nivel_conversacao" TEXT,

    CONSTRAINT "idiomas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferencias" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "modalidades" "ModalidadeTrabalho"[],
    "cidades" TEXT[],
    "cargos" TEXT[],
    "tipo_contrato" TEXT[],
    "mudanca" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "preferencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vagas" (
    "id" UUID NOT NULL,
    "recrutador_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "resumo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativa',
    "empresa_nome" TEXT NOT NULL,
    "localizacao" TEXT,
    "modalidade" "ModalidadeTrabalho" NOT NULL,
    "tipo_contrato" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "salario_min" DECIMAL(10,2),
    "salario_max" DECIMAL(10,2),
    "requisitos" JSONB,
    "palavras_chave" TEXT[],
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vagas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matchings" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "vaga_id" UUID NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "analise" JSONB NOT NULL,
    "data_matching" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matchings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "perfis_usuario_id_key" ON "perfis"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "preferencias_usuario_id_key" ON "preferencias"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "matchings_usuario_id_vaga_id_key" ON "matchings"("usuario_id", "vaga_id");

-- AddForeignKey
ALTER TABLE "perfis" ADD CONSTRAINT "perfis_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiencias" ADD CONSTRAINT "experiencias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formacoes" ADD CONSTRAINT "formacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habilidades" ADD CONSTRAINT "habilidades_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificacoes" ADD CONSTRAINT "certificacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idiomas" ADD CONSTRAINT "idiomas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferencias" ADD CONSTRAINT "preferencias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vagas" ADD CONSTRAINT "vagas_recrutador_id_fkey" FOREIGN KEY ("recrutador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchings" ADD CONSTRAINT "matchings_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchings" ADD CONSTRAINT "matchings_vaga_id_fkey" FOREIGN KEY ("vaga_id") REFERENCES "vagas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
