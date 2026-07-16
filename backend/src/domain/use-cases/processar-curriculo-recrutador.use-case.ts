// src/domain/use-cases/processar-curriculo-recrutador.use-case.ts

import { randomUUID } from 'crypto';
import { Usuario } from '../entities/usuario.entity';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { VagaRepository } from '../repositories/vaga.repository';
import { PDFService } from '../services/pdf.service';
import { StorageService } from '../services/storage.service';
import { AIService } from '../services/ai.service';
import { CryptographyService } from '../services/cryptography.service';
import { ExecutarMatchingUseCase } from './executar-matching.use-case';
import { Matching } from '../entities/matching.entity';

export interface ProcessarCurriculoRecrutadorInput {
  vagaId: string;
  fileBuffer: Buffer;
  fileName: string;
}

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

export class ProcessarCurriculoRecrutadorUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly vagaRepository: VagaRepository,
    private readonly pdfService: PDFService,
    private readonly storageService: StorageService,
    private readonly aiService: AIService,
    private readonly cryptographyService: CryptographyService,
    private readonly executarMatchingUseCase: ExecutarMatchingUseCase,
  ) {}

  async execute(input: ProcessarCurriculoRecrutadorInput): Promise<Matching> {
    // 1. Verifica se a vaga existe
    const vaga = await this.vagaRepository.buscarPorId(input.vagaId);
    if (!vaga) {
      throw new Error('Vaga não encontrada');
    }

    // 2. Extrai o texto do PDF
    const textoExtraido = await this.pdfService.extrairTexto(input.fileBuffer);
    if (!textoExtraido || !textoExtraido.trim()) {
      throw new Error(
        'Não foi possível extrair texto do PDF. O arquivo pode estar vazio ou protegido.',
      );
    }

    // 3. Processa o texto com a IA para obter a estrutura JSON
    const dadosEstruturados =
      await this.aiService.extrairDadosCurriculo(textoExtraido);

    // 4. Determina um e-mail único
    let email =
      dadosEstruturados.email ||
      `candidato_${randomUUID().slice(0, 8)}@aimatcher.com`;
    email = email.trim().toLowerCase();

    // Verifica se já existe um usuário com esse e-mail
    const usuarioExistente = await this.usuarioRepository.buscarPorEmail(email);
    if (usuarioExistente) {
      if (email.includes('@')) {
        const [username, domain] = email.split('@');
        email = `${username}+rec_${randomUUID().slice(0, 8)}@${domain}`;
      } else {
        email = `${email}+rec_${randomUUID().slice(0, 8)}@aimatcher.com`;
      }
    }

    // 5. Criptografa uma senha aleatória
    const senhaHash = await this.cryptographyService.hash(randomUUID());
    const candidatoId = randomUUID();

    // 6. Faz o upload do arquivo PDF para o Storage
    const pathStorage = await this.storageService.uploadCurriculo(
      candidatoId,
      input.fileBuffer,
      input.fileName,
    );

    // 7. Mapeia a entidade do usuário com os dados extraídos
    const nomeCompleto =
      dadosEstruturados.nome_completo || input.fileName.replace(/\.pdf$/i, '');

    const novoUsuario = new Usuario(
      candidatoId,
      nomeCompleto,
      email,
      senhaHash,
      'ATIVO',
      new Date(),
      dadosEstruturados.telefone || undefined,
      dadosEstruturados.data_nascimento
        ? safeDate(dadosEstruturados.data_nascimento)
        : undefined,
      undefined,
      undefined,
      [],
      [],
      [],
      [],
      [],
      undefined,
      [],
      pathStorage,
      textoExtraido,
      dadosEstruturados,
      'CANDIDATO',
    );

    // Mapeia perfil profissional
    if (dadosEstruturados.perfil) {
      novoUsuario.perfil = {
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
      novoUsuario.experiencias = dadosEstruturados.experiencias
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
      novoUsuario.formacoes = dadosEstruturados.formacao
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
      novoUsuario.habilidades = dadosEstruturados.habilidades_tecnicas
        .filter((h: any) => h && h.nome)
        .map((h: any) => ({
          nome: h.nome,
          nivel: h.nivel,
          anosExperiencia: Number(h.anos_experiencia || 0),
        }));
    }

    // Mapeia certificações
    if (dadosEstruturados.certificacoes) {
      novoUsuario.certificacoes = dadosEstruturados.certificacoes
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
      novoUsuario.idiomas = dadosEstruturados.idiomas
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
      novoUsuario.preferencias = {
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
      novoUsuario.projetos = dadosEstruturados.projetos
        .filter((p: any) => p && p.nome)
        .map((p: any) => ({
          nome: p.nome,
          descricao: p.descricao,
          tecnologias: p.tecnologias || [],
          url: p.url,
        }));
    }

    // 8. Salva o novo candidato no banco
    await this.usuarioRepository.salvar(novoUsuario);

    // 9. Executa o matching do candidato contra a vaga
    return this.executarMatchingUseCase.execute({
      usuarioId: candidatoId,
      vagaId: input.vagaId,
    });
  }
}
