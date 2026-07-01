// src/domain/use-cases/executar-matching.use-case.spec.ts

import { ExecutarMatchingUseCase } from './executar-matching.use-case';
import { MatchingRepository } from '../repositories/matching.repository';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { VagaRepository } from '../repositories/vaga.repository';
import { AIService } from '../services/ai.service';
import { Usuario } from '../entities/usuario.entity';
import { Vaga } from '../entities/vaga.entity';
import { Matching } from '../entities/matching.entity';

describe('ExecutarMatchingUseCase', () => {
  let useCase: ExecutarMatchingUseCase;
  let mockMatchingRepository: jest.Mocked<MatchingRepository>;
  let mockUsuarioRepository: jest.Mocked<UsuarioRepository>;
  let mockVagaRepository: jest.Mocked<VagaRepository>;
  let mockAIService: jest.Mocked<AIService>;

  beforeEach(() => {
    mockMatchingRepository = {
      salvar: jest.fn(),
      buscar: jest.fn(),
      buscarPorUsuario: jest.fn(),
      buscarPorVaga: jest.fn(),
      excluir: jest.fn(),
    };

    mockUsuarioRepository = {
      buscarPorId: jest.fn(),
      buscarPorEmail: jest.fn(),
      salvar: jest.fn(),
      atualizar: jest.fn(),
      listar: jest.fn(),
    } as any;

    mockVagaRepository = {
      buscarPorId: jest.fn(),
      salvar: jest.fn(),
      listarAtivas: jest.fn(),
      buscarPorPalavrasChave: jest.fn(),
      atualizar: jest.fn(),
      excluir: jest.fn(),
    };

    mockAIService = {
      extrairDadosCurriculo: jest.fn(),
      extrairEstruturaVaga: jest.fn(),
      analisarCompatibilidade: jest.fn(),
      gerarPalavrasChave: jest.fn(),
      gerarResumoVaga: jest.fn(),
    };

    useCase = new ExecutarMatchingUseCase(
      mockMatchingRepository,
      mockUsuarioRepository,
      mockVagaRepository,
      mockAIService,
    );
  });

  it('deve realizar e salvar o matching de compatibilidade com sucesso', async () => {
    const input = {
      usuarioId: 'uuid-usuario',
      vagaId: 'uuid-vaga',
    };

    const usuario = new Usuario(
      input.usuarioId,
      'Gabriel Silva',
      'gabriel@email.com',
      'senha_hash',
      'ATIVO',
      new Date(),
    );
    usuario.curriculoExtraido = { dados: 'extraidos' };

    const vaga = new Vaga(
      input.vagaId,
      'uuid-recrutador',
      'Desenvolvedor Backend NestJS',
      'Descrição da vaga...',
      'Resumo da vaga...',
      'ATIVA',
      'Tech Corp',
      'Remoto',
      'REMOTO',
      'CLT',
      'PLENO',
      undefined,
      undefined,
      {},
      ['NestJS', 'TypeScript'],
      new Date(),
    );

    const mockResultadoAnalise = {
      score: 85,
      justificativa: 'Ótima compatibilidade com NestJS.',
      pontosFortes: ['Experiência com TypeScript'],
      pontosFracos: ['Falta conhecimento em docker'],
      recomendacoes: ['Aprender docker'],
    };

    mockUsuarioRepository.buscarPorId.mockResolvedValue(usuario);
    mockVagaRepository.buscarPorId.mockResolvedValue(vaga);
    mockAIService.analisarCompatibilidade.mockResolvedValue(mockResultadoAnalise as any);
    mockMatchingRepository.salvar.mockImplementation(async (matching) => matching);

    const resultado = await useCase.execute(input);

    expect(resultado).toBeInstanceOf(Matching);
    expect(resultado.usuarioId).toBe(input.usuarioId);
    expect(resultado.vagaId).toBe(input.vagaId);
    expect(resultado.score).toBe(85);
    expect(resultado.analise).toEqual(mockResultadoAnalise);
    expect(mockUsuarioRepository.buscarPorId).toHaveBeenCalledWith(input.usuarioId);
    expect(mockVagaRepository.buscarPorId).toHaveBeenCalledWith(input.vagaId);
    expect(mockAIService.analisarCompatibilidade).toHaveBeenCalledWith(usuario.curriculoExtraido, vaga);
    expect(mockMatchingRepository.salvar).toHaveBeenCalled();
  });

  it('deve lançar erro se o usuário não for encontrado', async () => {
    const input = {
      usuarioId: 'uuid-usuario',
      vagaId: 'uuid-vaga',
    };

    mockUsuarioRepository.buscarPorId.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow('Usuário não encontrado');
    expect(mockVagaRepository.buscarPorId).not.toHaveBeenCalled();
  });

  it('deve lançar erro se o usuário não tiver currículo extraído', async () => {
    const input = {
      usuarioId: 'uuid-usuario',
      vagaId: 'uuid-vaga',
    };

    const usuarioSemCurriculo = new Usuario(
      input.usuarioId,
      'Gabriel Silva',
      'gabriel@email.com',
      'senha_hash',
      'ATIVO',
      new Date(),
    );

    mockUsuarioRepository.buscarPorId.mockResolvedValue(usuarioSemCurriculo);

    await expect(useCase.execute(input)).rejects.toThrow('O usuário não possui um currículo processado');
  });

  it('deve lançar erro se a vaga não for encontrada', async () => {
    const input = {
      usuarioId: 'uuid-usuario',
      vagaId: 'uuid-vaga',
    };

    const usuario = new Usuario(
      input.usuarioId,
      'Gabriel Silva',
      'gabriel@email.com',
      'senha_hash',
      'ATIVO',
      new Date(),
    );
    usuario.curriculoExtraido = { dados: 'extraidos' };

    mockUsuarioRepository.buscarPorId.mockResolvedValue(usuario);
    mockVagaRepository.buscarPorId.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow('Vaga não encontrada');
  });
});
