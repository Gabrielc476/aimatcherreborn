// src/domain/use-cases/processar-curriculo.use-case.ts

import { Usuario } from '../entities/usuario.entity';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { PDFService } from '../services/pdf.service';
import { StorageService } from '../services/storage.service';
import { AIService } from '../services/ai.service';
import { JobEventsService } from '../services/job-events.service';
import { JobProcessamentoRepository } from '../repositories/job-processamento.repository';

export interface ProcessarCurriculoInput {
  userId: string;
  fileBuffer: Buffer;
  fileName: string;
}

export interface ProcessarCurriculoOutput {
  mensagem: string;
  nomeArquivo: string;
  dadosExtraidos: {
    nome: string;
    email: string;
    perfil: string;
    experiencias: number;
    formacao: number;
    habilidades: number;
    idiomas: number;
    projetos?: number;
  };
}

/**
 * Converte com segurança uma string de data vinda da IA em um objeto Date.
 * Trata intervalos de anos (ex: "2019-2020") extraindo o ano de início para evitar falhas do Prisma.
 */
function safeDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;

  const normalized = dateStr.replace(/\//g, '-').trim();
  const parts = normalized.split('-');
  const firstPart = parts[0]?.trim() || '';
  const secondPart = parts[1]?.trim() || '';

  const cleanStr =
    parts.length === 2 &&
    firstPart.length === 4 &&
    secondPart.length === 4 &&
    !isNaN(Number(firstPart)) &&
    !isNaN(Number(secondPart))
      ? firstPart
      : normalized;

  const date = new Date(cleanStr);
  if (isNaN(date.getTime())) {
    return undefined;
  }
  return date;
}

export class ProcessarCurriculoUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly pdfService: PDFService,
    private readonly storageService: StorageService,
    private readonly aiService: AIService,
    private readonly jobRepository: JobProcessamentoRepository,
    private readonly jobEventsService: JobEventsService,
  ) {}

  private async updateJob(
    jobId: string | undefined,
    status: string,
    passoAtual: string,
    mensagem: string,
    resultado?: any,
  ) {
    if (!jobId) return;
    try {
      await this.jobRepository.atualizar(jobId, {
        status,
        passoAtual,
        mensagem,
        resultado,
        itensProcessados: status === 'CONCLUIDO' ? 1 : undefined,
      });
      this.jobEventsService.emit(jobId, {
        id: jobId,
        status,
        passoAtual,
        mensagem,
        resultado,
        totalItens: 1,
        itensProcessados: status === 'CONCLUIDO' ? 1 : 0,
      });
    } catch (err) {
      console.error('Failed to update job status:', err);
    }
  }

  async execute(
    input: ProcessarCurriculoInput,
    jobId?: string,
  ): Promise<ProcessarCurriculoOutput> {
    try {
      await this.updateJob(jobId, 'PROCESSANDO', 'extraindo_pdf', 'Extraindo texto do PDF...');

      // 1. Verifica se o usuário existe
      const usuario = await this.usuarioRepository.buscarPorId(input.userId);
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }

    // 2. Extrai o texto do PDF
    const textoExtraido = await this.pdfService.extrairTexto(input.fileBuffer);
    if (!textoExtraido || !textoExtraido.trim()) {
      throw new Error(
        'Não foi possível extrair texto do PDF. O arquivo pode estar vazio ou protegido.',
      );
    }

      await this.updateJob(jobId, 'PROCESSANDO', 'armazenando_pdf', 'Enviando arquivo PDF para o storage...');

      // 3. Faz o upload do arquivo PDF para o Storage
      const pathStorage = await this.storageService.uploadCurriculo(
        usuario.id,
        input.fileBuffer,
        input.fileName,
      );

      await this.updateJob(jobId, 'PROCESSANDO', 'analise_ia', 'IA estruturando dados do currículo...');

      // 4. Processa o texto com a IA para obter a estrutura JSON
      const dadosEstruturados =
        await this.aiService.extrairDadosCurriculo(textoExtraido);

      await this.updateJob(jobId, 'PROCESSANDO', 'finalizando', 'Salvando perfil do candidato...');

    // 5. Atualiza a entidade do usuário com os dados extraídos e metadados
    usuario.nomeCompleto =
      dadosEstruturados.nome_completo || usuario.nomeCompleto;
    usuario.telefone = dadosEstruturados.telefone || usuario.telefone;
    if (dadosEstruturados.data_nascimento) {
      usuario.dataNascimento = safeDate(dadosEstruturados.data_nascimento);
    }

    // Atualiza o perfil profissional
    if (dadosEstruturados.perfil) {
      usuario.perfil = {
        titulo: dadosEstruturados.perfil.titulo,
        resumoProfissional: dadosEstruturados.perfil.resumo_profissional,
        anosExperiencia: Number(dadosEstruturados.perfil.anos_experiencia || 0),
        pretensaoSalarial: dadosEstruturados.perfil.pretensao_salarial
          ? Number(dadosEstruturados.perfil.pretensao_salarial)
          : undefined,
        disponibilidade: dadosEstruturados.perfil.disponibilidade,
      };
    }

    // Mapeia experiências
    if (dadosEstruturados.experiencias) {
      usuario.experiencias = dadosEstruturados.experiencias
        .filter((exp: any) => exp && exp.empresa && exp.cargo)
        .map((exp: any) => {
          let descricaoCompleta = exp.descricao || '';
          if (
            exp.principais_realizacoes &&
            Array.isArray(exp.principais_realizacoes) &&
            exp.principais_realizacoes.length > 0
          ) {
            const realizacoesTexto = exp.principais_realizacoes
              .map((r: string) => `• ${r.trim()}`)
              .join('\n');
            descricaoCompleta = descricaoCompleta
              ? `${descricaoCompleta}\n\n**Principais Realizações:**\n${realizacoesTexto}`
              : `**Principais Realizações:**\n${realizacoesTexto}`;
          }

          return {
            empresa: exp.empresa,
            cargo: exp.cargo,
            descricao: descricaoCompleta,
            dataInicio: safeDate(exp.data_inicio) || new Date(),
            dataFim: safeDate(exp.data_fim),
            atual: Boolean(exp.atual),
            tecnologias: exp.tecnologias_utilizadas || [],
          };
        });
    }

    // Mapeia formação
    if (dadosEstruturados.formacao) {
      usuario.formacoes = dadosEstruturados.formacao
        .filter((f: any) => f && f.instituicao && f.curso)
        .map((f: any) => ({
          instituicao: f.instituicao,
          curso: f.curso,
          grau: f.grau,
          area: f.area,
          dataInicio: safeDate(f.data_inicio),
          dataFim: safeDate(f.data_fim),
          concluido: Boolean(f.concluido),
        }));
    }

    // Mapeia habilidades técnicas
    if (dadosEstruturados.habilidades_tecnicas) {
      usuario.habilidades = dadosEstruturados.habilidades_tecnicas
        .filter((h: any) => h && h.nome)
        .map((h: any) => ({
          nome: h.nome,
          nivel: h.nivel,
          anosExperiencia: Number(h.anos_experiencia || 0),
        }));
    }

    // Mapeia certificações
    if (dadosEstruturados.certificacoes) {
      usuario.certificacoes = dadosEstruturados.certificacoes
        .filter((c: any) => c && c.nome && c.emissor)
        .map((c: any) => ({
          nome: c.nome,
          emissor: c.emissor,
          dataObtencao: safeDate(c.data_obtencao),
          dataValidade: safeDate(c.data_validade),
          codigoValidade: c.codigo_validacao,
        }));
    }

    // Mapeia idiomas
    if (dadosEstruturados.idiomas) {
      usuario.idiomas = dadosEstruturados.idiomas
        .filter((i: any) => i && i.nome)
        .map((i: any) => ({
          nome: i.nome,
          nivelLeitura: i.nivel_leitura,
          nivelEscrita: i.nivel_escrita,
          nivelConversacao: i.nivel_conversacao,
        }));
    }

    // Mapeia preferências
    if (dadosEstruturados.preferencias) {
      usuario.preferencias = {
        modalidades: dadosEstruturados.preferencias.modalidades || [],
        cidades: dadosEstruturados.preferencias.cidades_interesse || [],
        cargos: dadosEstruturados.preferencias.cargos_interesse || [],
        tipoContrato: dadosEstruturados.preferencias.tipo_contrato || [],
        mudanca: Boolean(
          dadosEstruturados.preferencias.disponibilidade_mudanca,
        ),
      };
    }

    // Mapeia projetos
    if (dadosEstruturados.projetos) {
      usuario.projetos = dadosEstruturados.projetos
        .filter((p: any) => p && p.nome)
        .map((p: any) => ({
          nome: p.nome,
          descricao: p.descricao,
          tecnologias: p.tecnologias || [],
          url: p.url,
        }));
    }

    usuario.curriculoUrl = pathStorage;
    usuario.curriculoTexto = textoExtraido;
    usuario.curriculoExtraido = dadosEstruturados;
    console.log(usuario.preferencias);

      // 6. Salva as atualizações do perfil do usuário no banco
      await this.usuarioRepository.salvar(usuario);

      const output = {
        mensagem: 'Currículo processado e salvo com sucesso',
        nomeArquivo: input.fileName,
        dadosExtraidos: {
          nome: usuario.nomeCompleto,
          email: usuario.email,
          perfil: usuario.perfil?.titulo || '',
          experiencias: usuario.experiencias.length,
          formacao: usuario.formacoes.length,
          habilidades: usuario.habilidades.length,
          idiomas: usuario.idiomas.length,
          projetos: usuario.projetos.length,
        },
      };

      await this.updateJob(jobId, 'CONCLUIDO', 'finalizado', 'Processamento concluído com sucesso!', output);

      return output;
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : 'Erro interno ao processar currículo';
      await this.updateJob(jobId, 'ERRO', 'erro', errorMsg);
      throw error;
    }
  }
}
