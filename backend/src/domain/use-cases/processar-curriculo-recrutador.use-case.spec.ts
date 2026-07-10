// src/domain/use-cases/processar-curriculo-recrutador.use-case.spec.ts

import { ProcessarCurriculoRecrutadorUseCase } from './processar-curriculo-recrutador.use-case';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { VagaRepository } from '../repositories/vaga.repository';
import { PDFService } from '../services/pdf.service';
import { StorageService } from '../services/storage.service';
import { AIService } from '../services/ai.service';
import { CryptographyService } from '../services/cryptography.service';
import { ExecutarMatchingUseCase } from './executar-matching.use-case';
import { Vaga } from '../entities/vaga.entity';
import { Matching } from '../entities/matching.entity';

describe('ProcessarCurriculoRecrutadorUseCase', () => {
  let useCase: ProcessarCurriculoRecrutadorUseCase;
  let mockUsuarioRepository: jest.Mocked<UsuarioRepository>;
  let mockVagaRepository: jest.Mocked<VagaRepository>;
  let mockPDFService: jest.Mocked<PDFService>;
  let mockStorageService: jest.Mocked<StorageService>;
  let mockAIService: jest.Mocked<AIService>;
  let mockCryptographyService: jest.Mocked<CryptographyService>;
  let mockExecutarMatchingUseCase: jest.Mocked<ExecutarMatchingUseCase>;

  beforeEach(() => {
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

    mockPDFService = {
      extrairTexto: jest.fn(),
    };

    mockStorageService = {
      uploadCurriculo: jest.fn(),
      obterUrlDownload: jest.fn(),
      excluirCurriculo: jest.fn(),
    };

    mockAIService = {
      extrairDadosCurriculo: jest.fn(),
      extrairEstruturaVaga: jest.fn(),
      analisarCompatibilidade: jest.fn(),
      gerarPalavrasChave: jest.fn(),
      gerarResumoVaga: jest.fn(),
    };

    mockCryptographyService = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    mockExecutarMatchingUseCase = {
      execute: jest.fn(),
    } as any;

    useCase = new ProcessarCurriculoRecrutadorUseCase(
      mockUsuarioRepository,
      mockVagaRepository,
      mockPDFService,
      mockStorageService,
      mockAIService,
      mockCryptographyService,
      mockExecutarMatchingUseCase,
    );
  });

  it('deve processar o curriculo e executar o matching com sucesso', async () => {
    const input = {
      vagaId: 'vaga-uuid',
      fileBuffer: Buffer.from('PDF_CONTENT'),
      fileName: 'curriculo.pdf',
    };

    const vaga = new Vaga(
      'vaga-uuid',
      'recrutador-uuid',
      'Dev',
      'Dev Java',
      'ATIVA',
      'Empresa',
      'REMOTO',
      'CLT',
      'PLENO',
      new Date(),
    );

    const dadosEstruturados = {
      nome_completo: 'Candidato Teste',
      email: 'candidato@teste.com',
      telefone: '11999999999',
      data_nascimento: '1995-10-10',
      perfil: {
        titulo: 'Desenvolvedor Java',
        resumo_profissional: 'Bio',
        anos_experiencia: 3,
        pretensao_salarial: 8000,
        disponibilidade: 'Imediata',
      },
    };

    mockVagaRepository.buscarPorId.mockResolvedValue(vaga);
    mockPDFService.extrairTexto.mockResolvedValue('Texto extraido do curriculo');
    mockAIService.extrairDadosCurriculo.mockResolvedValue(dadosEstruturados);
    mockUsuarioRepository.buscarPorEmail.mockResolvedValue(null);
    mockCryptographyService.hash.mockResolvedValue('senha_encriptada');
    mockStorageService.uploadCurriculo.mockResolvedValue('/path/to/storage');
    mockUsuarioRepository.salvar.mockImplementation(async (user) => user);

    const mockMatching = new Matching('match-id', 'candidato-id', 'vaga-uuid', 90, {} as any, new Date());
    mockExecutarMatchingUseCase.execute.mockResolvedValue(mockMatching);

    const result = await useCase.execute(input);

    expect(result).toBe(mockMatching);
    expect(mockVagaRepository.buscarPorId).toHaveBeenCalledWith('vaga-uuid');
    expect(mockPDFService.extrairTexto).toHaveBeenCalledWith(input.fileBuffer);
    expect(mockAIService.extrairDadosCurriculo).toHaveBeenCalledWith('Texto extraido do curriculo');
    expect(mockUsuarioRepository.buscarPorEmail).toHaveBeenCalledWith('candidato@teste.com');
    expect(mockStorageService.uploadCurriculo).toHaveBeenCalled();
    expect(mockUsuarioRepository.salvar).toHaveBeenCalled();
    expect(mockExecutarMatchingUseCase.execute).toHaveBeenCalledWith({
      usuarioId: expect.any(String),
      vagaId: 'vaga-uuid',
    });
  });

  it('deve gerar e-mail alternativo se houver colisão de e-mail no banco', async () => {
    const input = {
      vagaId: 'vaga-uuid',
      fileBuffer: Buffer.from('PDF_CONTENT'),
      fileName: 'curriculo.pdf',
    };

    const vaga = new Vaga(
      'vaga-uuid',
      'recrutador-uuid',
      'Dev',
      'Dev Java',
      'ATIVA',
      'Empresa',
      'REMOTO',
      'CLT',
      'PLENO',
      new Date(),
    );

    const dadosEstruturados = {
      nome_completo: 'Candidato Colisao',
      email: 'existente@email.com',
    };

    const existenteUser = {} as any;

    mockVagaRepository.buscarPorId.mockResolvedValue(vaga);
    mockPDFService.extrairTexto.mockResolvedValue('Texto extraido');
    mockAIService.extrairDadosCurriculo.mockResolvedValue(dadosEstruturados);
    // Simula que o e-mail já existe
    mockUsuarioRepository.buscarPorEmail.mockResolvedValue(existenteUser);
    mockCryptographyService.hash.mockResolvedValue('senha_hash');
    mockStorageService.uploadCurriculo.mockResolvedValue('/path');
    
    let savedUser: any = null;
    mockUsuarioRepository.salvar.mockImplementation(async (user) => {
      savedUser = user;
      return user;
    });

    mockExecutarMatchingUseCase.execute.mockResolvedValue({} as any);

    await useCase.execute(input);

    expect(savedUser).not.toBeNull();
    expect(savedUser.email).toContain('existente+rec_');
    expect(savedUser.email).toContain('@email.com');
  });

  it('deve lancar erro se a vaga nao for encontrada', async () => {
    const input = {
      vagaId: 'vaga-inexistente',
      fileBuffer: Buffer.from('PDF'),
      fileName: 'c.pdf',
    };

    mockVagaRepository.buscarPorId.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow('Vaga não encontrada');
  });
});
