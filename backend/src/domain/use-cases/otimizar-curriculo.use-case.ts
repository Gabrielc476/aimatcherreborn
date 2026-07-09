import { Injectable } from '@nestjs/common';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { VagaRepository } from '../repositories/vaga.repository';
import { AIService } from '../services/ai.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface OtimizarCurriculoInput {
  usuarioId: string;
  vagaId?: string;
  vagaDescricao?: string;
  tituloPersonalizado?: string;
}

@Injectable()
export class OtimizarCurriculoUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly vagaRepository: VagaRepository,
    private readonly aiService: AIService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: OtimizarCurriculoInput): Promise<any> {
    // 1. Fetch user profile and details
    const usuario = await this.usuarioRepository.buscarPorId(input.usuarioId);
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    // 2. Fetch target vacancy details
    let targetDescription = '';
    let vagaTitulo = '';
    
    if (input.vagaId) {
      const vaga = await this.vagaRepository.buscarPorId(input.vagaId);
      if (vaga) {
        vagaTitulo = vaga.titulo;
        targetDescription = `Título: ${vaga.titulo}\nDescrição:\n${vaga.descricao}`;
      }
    } else if (input.vagaDescricao) {
      targetDescription = input.vagaDescricao;
      // Get first line or generic title
      vagaTitulo = input.vagaDescricao.split('\n')[0]?.substring(0, 50) || 'Vaga Externa';
    } else {
      throw new Error('É necessário fornecer o ID da vaga ou a descrição da vaga alvo');
    }

    // 3. Check for existing Matching analysis to address compatibility gaps
    let feedbackMatching = '';
    if (input.vagaId) {
      const targetVagaId = input.vagaId;
      const matching = await this.prisma.runWithRLS(async (tx) => {
        return tx.matching.findUnique({
          where: {
            usuarioId_vagaId: {
              usuarioId: input.usuarioId,
              vagaId: targetVagaId,
            },
          },
        });
      });

      if (matching && matching.analise) {
        const analise = matching.analise as any;
        const pontosFortes = analise.diferenciais?.pontosFortes || [];
        const pontosFracos = analise.diferenciais?.pontosFracos || [];
        const recomendacoes = analise.recomendacoes?.gerais || '';
        
        feedbackMatching = `
- Pontos Fortes do Candidato: ${pontosFortes.join(', ')}
- Pontos Fracos/Gaps no Currículo Atual: ${pontosFracos.join(', ')}
- Recomendações de Melhoria: ${recomendacoes}
`;
      }
    }

    // 4. Compile current resume data into a structured format
    const resumeData = {
      nome: usuario.nomeCompleto,
      titulo_profissional: usuario.perfil?.titulo || 'Profissional de Tecnologia',
      email: usuario.email,
      telefone: usuario.telefone || '',
      localizacao: usuario.preferencias?.cidades?.[0] || '',
      resumo_profissional: usuario.perfil?.resumoProfissional || '',
      experiencias: usuario.experiencias.map(exp => ({
        empresa: exp.empresa,
        cargo: exp.cargo,
        descricao: exp.descricao || '',
        periodo: `${this.formatDate(exp.dataInicio)} - ${exp.atual ? 'Atual' : this.formatDate(exp.dataFim)}`,
        tecnologias_utilizadas: exp.tecnologias || []
      })),
      habilidades: usuario.habilidades.map(h => h.nome),
      projetos: usuario.projetos.map(p => ({
        nome: p.nome,
        descricao: p.descricao || '',
        tecnologias: p.tecnologias || []
      })),
      certificacoes: usuario.certificacoes.map(c => ({
        nome: c.nome,
        instituicao: c.emissor,
        dataEmissao: c.dataObtencao ? this.formatDate(c.dataObtencao) : '',
        dataValidade: c.dataValidade ? this.formatDate(c.dataValidade) : ''
      })),
      idiomas: usuario.idiomas.map(i => ({
        nome: i.nome,
        nivelLeitura: i.nivelLeitura || '',
        nivelEscrita: i.nivelEscrita || '',
        nivelConversacao: i.nivelConversacao || ''
      })),
      formacoes: usuario.formacoes.map(f => ({
        instituicao: f.instituicao,
        curso: f.curso,
        grau: f.grau || '',
        periodo: `${f.dataInicio ? this.formatDate(f.dataInicio) : ''} - ${f.concluido ? 'Concluído' : f.dataFim ? this.formatDate(f.dataFim) : 'Em Andamento'}`
      }))
    };

    // 5. Invoke AI Service (Gemma 4) to perform reasoning and optimization
    const optimizedJson = await this.aiService.otimizarCurriculo(
      resumeData, 
      targetDescription, 
      feedbackMatching || undefined
    );

    // 5. Save the optimized resume to the database using RLS context
    const titulo = input.tituloPersonalizado || `Currículo Otimizado - ${vagaTitulo}`;
    
    return this.prisma.runWithRLS(async (tx) => {
      const dbRecord = await tx.curriculoOtimizado.create({
        data: {
          usuarioId: usuario.id,
          vagaId: input.vagaId || null,
          vagaDescricao: input.vagaDescricao || null,
          titulo,
          resumoProfissional: optimizedJson.resumo_profissional || '',
          experiencias: optimizedJson.experiencias || [],
          habilidades: optimizedJson.habilidades || [],
          projetos: optimizedJson.projetos || [],
          certificacoes: optimizedJson.certificacoes || [],
          idiomas: optimizedJson.idiomas || [],
          formacoes: optimizedJson.formacoes || [],
        }
      });
      return dbRecord;
    });
  }

  private formatDate(date: Date | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }
}
