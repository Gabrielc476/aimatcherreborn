// src/domain/use-cases/processar-curriculo.use-case.ts

import { Usuario } from '../entities/usuario.entity';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { PDFService } from '../services/pdf.service';
import { StorageService } from '../services/storage.service';
import { AIService } from '../services/ai.service';

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
  };
}

export class ProcessarCurriculoUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly pdfService: PDFService,
    private readonly storageService: StorageService,
    private readonly aiService: AIService,
  ) {}

  async execute(input: ProcessarCurriculoInput): Promise<ProcessarCurriculoOutput> {
    // 1. Verifica se o usuário existe
    const usuario = await this.usuarioRepository.buscarPorId(input.userId);
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    // 2. Extrai o texto do PDF
    const textoExtraido = await this.pdfService.extrairTexto(input.fileBuffer);
    if (!textoExtraido || !textoExtraido.trim()) {
      throw new Error('Não foi possível extrair texto do PDF. O arquivo pode estar vazio ou protegido.');
    }

    // 3. Faz o upload do arquivo PDF para o Storage
    const pathStorage = await this.storageService.uploadCurriculo(
      usuario.id,
      input.fileBuffer,
      input.fileName,
    );

    // 4. Processa o texto com a IA para obter a estrutura JSON
    const dadosEstruturados = await this.aiService.extrairDadosCurriculo(textoExtraido);

    // 5. Atualiza a entidade do usuário com os dados extraídos e metadados
    usuario.nomeCompleto = dadosEstruturados.nome_completo || usuario.nomeCompleto;
    usuario.telefone = dadosEstruturados.telefone || usuario.telefone;
    if (dadosEstruturados.data_nascimento) {
      usuario.dataNascimento = new Date(dadosEstruturados.data_nascimento);
    }
    
    // Atualiza o perfil profissional
    if (dadosEstruturados.perfil) {
      usuario.perfil = {
        titulo: dadosEstruturados.perfil.titulo,
        resumoProfissional: dadosEstruturados.perfil.resumo_profissional,
        anosExperiencia: Number(dadosEstruturados.perfil.anos_experiencia || 0),
        pretensaoSalarial: dadosEstruturados.perfil.pretensao_salarial ? Number(dadosEstruturados.perfil.pretensao_salarial) : undefined,
        disponibilidade: dadosEstruturados.perfil.disponibilidade,
      };
    }

    // Mapeia experiências
    if (dadosEstruturados.experiencias) {
      usuario.experiencias = dadosEstruturados.experiencias.map((exp: any) => ({
        empresa: exp.empresa,
        cargo: exp.cargo,
        descricao: exp.descricao,
        dataInicio: new Date(exp.data_inicio),
        dataFim: exp.data_fim ? new Date(exp.data_fim) : undefined,
        atual: Boolean(exp.atual),
        tecnologias: exp.tecnologias_utilizadas || [],
      }));
    }

    // Mapeia formação
    if (dadosEstruturados.formacao) {
      usuario.formacoes = dadosEstruturados.formacao.map((f: any) => ({
        instituicao: f.instituicao,
        curso: f.curso,
        grau: f.grau,
        area: f.area,
        dataInicio: f.data_inicio ? new Date(f.data_inicio) : undefined,
        dataFim: f.data_fim ? new Date(f.data_fim) : undefined,
        concluido: Boolean(f.concluido),
      }));
    }

    // Mapeia habilidades técnicas
    if (dadosEstruturados.habilidades_tecnicas) {
      usuario.habilidades = dadosEstruturados.habilidades_tecnicas.map((h: any) => ({
        nome: h.nome,
        nivel: h.nivel,
        anosExperiencia: Number(h.anos_experiencia || 0),
      }));
    }

    // Mapeia certificações
    if (dadosEstruturados.certificacoes) {
      usuario.certificacoes = dadosEstruturados.certificacoes.map((c: any) => ({
        nome: c.nome,
        emissor: c.emissor,
        dataObtencao: c.data_obtencao ? new Date(c.data_obtencao) : undefined,
        dataValidade: c.data_validade ? new Date(c.data_validade) : undefined,
        codigoValidade: c.codigo_validacao,
      }));
    }

    // Mapeia idiomas
    if (dadosEstruturados.idiomas) {
      usuario.idiomas = dadosEstruturados.idiomas.map((i: any) => ({
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
        mudanca: Boolean(dadosEstruturados.preferencias.disponibilidade_mudanca),
      };
    }

    usuario.curriculoUrl = pathStorage;
    usuario.curriculoTexto = textoExtraido;
    usuario.curriculoExtraido = dadosEstruturados;

    // 6. Salva as atualizações do perfil do usuário no banco
    await this.usuarioRepository.salvar(usuario);

    return {
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
      },
    };
  }
}
