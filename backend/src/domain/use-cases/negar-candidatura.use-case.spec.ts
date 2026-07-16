// src/domain/use-cases/negar-candidatura.use-case.spec.ts

import { NegarCandidaturaUseCase } from './negar-candidatura.use-case';
import { MatchingRepository } from '../repositories/matching.repository';
import { VagaRepository } from '../repositories/vaga.repository';
import { Vaga } from '../entities/vaga.entity';
import { Matching } from '../entities/matching.entity';

describe('NegarCandidaturaUseCase', () => {
  let useCase: NegarCandidaturaUseCase;
  let mockMatchingRepository: jest.Mocked<MatchingRepository>;
  let mockVagaRepository: jest.Mocked<VagaRepository>;

  beforeEach(() => {
    mockMatchingRepository = {
      salvar: jest.fn(),
      buscar: jest.fn(),
      buscarPorUsuario: jest.fn(),
      buscarPorVaga: jest.fn(),
      excluir: jest.fn(),
    };

    mockVagaRepository = {
      buscarPorId: jest.fn(),
      salvar: jest.fn(),
      listarAtivas: jest.fn(),
      buscarPorPalavrasChave: jest.fn(),
      atualizar: jest.fn(),
      excluir: jest.fn(),
    };

    useCase = new NegarCandidaturaUseCase(
      mockMatchingRepository,
      mockVagaRepository,
    );
  });

  it('deve rejeitar a candidatura com sucesso', async () => {
    const input = {
      usuarioId: 'candidato-uuid',
      vagaId: 'vaga-uuid',
      recrutadorId: 'recrutador-uuid',
    };

    const vaga = new Vaga(
      'vaga-uuid',
      'recrutador-uuid', // Recrutador correspondente
      'Dev Java',
      'Desc',
      'ATIVA',
      'Empresa',
      'REMOTO',
      'CLT',
      'PLENO',
      new Date(),
    );

    const matching = new Matching(
      'matching-uuid',
      'candidato-uuid',
      'vaga-uuid',
      85,
      {} as any,
      new Date(),
      'pendente',
    );

    mockVagaRepository.buscarPorId.mockResolvedValue(vaga);
    mockMatchingRepository.buscar.mockResolvedValue(matching);
    mockMatchingRepository.salvar.mockImplementation(async (m) => m);

    const result = await useCase.execute(input);

    expect(result.status).toBe('rejeitado');
    expect(mockVagaRepository.buscarPorId).toHaveBeenCalledWith('vaga-uuid');
    expect(mockMatchingRepository.buscar).toHaveBeenCalledWith(
      'candidato-uuid',
      'vaga-uuid',
    );
    expect(mockMatchingRepository.salvar).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'rejeitado' }),
    );
  });

  it('deve lancar erro se a vaga nao for encontrada', async () => {
    const input = {
      usuarioId: 'candidato-uuid',
      vagaId: 'vaga-uuid',
      recrutadorId: 'recrutador-uuid',
    };

    mockVagaRepository.buscarPorId.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow('Vaga não encontrada');
  });

  it('deve lancar erro se o recrutador nao for o dono da vaga', async () => {
    const input = {
      usuarioId: 'candidato-uuid',
      vagaId: 'vaga-uuid',
      recrutadorId: 'outro-recrutador-uuid',
    };

    const vaga = new Vaga(
      'vaga-uuid',
      'recrutador-uuid', // Outro recrutador
      'Dev Java',
      'Desc',
      'ATIVA',
      'Empresa',
      'REMOTO',
      'CLT',
      'PLENO',
      new Date(),
    );

    mockVagaRepository.buscarPorId.mockResolvedValue(vaga);

    await expect(useCase.execute(input)).rejects.toThrow(
      'Não autorizado a negar candidaturas para esta vaga',
    );
  });

  it('deve lancar erro se a candidatura nao for encontrada', async () => {
    const input = {
      usuarioId: 'candidato-uuid',
      vagaId: 'vaga-uuid',
      recrutadorId: 'recrutador-uuid',
    };

    const vaga = new Vaga(
      'vaga-uuid',
      'recrutador-uuid',
      'Dev Java',
      'Desc',
      'ATIVA',
      'Empresa',
      'REMOTO',
      'CLT',
      'PLENO',
      new Date(),
    );

    mockVagaRepository.buscarPorId.mockResolvedValue(vaga);
    mockMatchingRepository.buscar.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(
      'Candidatura não encontrada',
    );
  });
});
