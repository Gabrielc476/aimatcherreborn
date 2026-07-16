// src/domain/use-cases/registrar-usuario.use-case.spec.ts

import { RegistrarUsuarioUseCase } from './registrar-usuario.use-case';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { CryptographyService } from '../services/cryptography.service';
import { Usuario } from '../entities/usuario.entity';

describe('RegistrarUsuarioUseCase', () => {
  let useCase: RegistrarUsuarioUseCase;
  let mockUsuarioRepository: jest.Mocked<UsuarioRepository>;
  let mockCryptographyService: jest.Mocked<CryptographyService>;

  beforeEach(() => {
    mockUsuarioRepository = {
      salvar: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorEmail: jest.fn(),
      atualizar: jest.fn(),
      listar: jest.fn(),
    };

    mockCryptographyService = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    useCase = new RegistrarUsuarioUseCase(
      mockUsuarioRepository,
      mockCryptographyService,
    );
  });

  it('deve cadastrar um novo usuário com sucesso', async () => {
    const input = {
      nomeCompleto: 'Gabriel Silva',
      email: 'gabriel@email.com',
      senhaPlana: 'senha123',
      telefone: '11999999999',
    };

    mockUsuarioRepository.buscarPorEmail.mockResolvedValue(null);
    mockCryptographyService.hash.mockResolvedValue('senha_hash');
    mockUsuarioRepository.salvar.mockImplementation(async (user) => user);

    const resultado = await useCase.execute(input);

    expect(resultado).toBeInstanceOf(Usuario);
    expect(resultado.nomeCompleto).toBe(input.nomeCompleto);
    expect(resultado.email).toBe(input.email);
    expect(resultado.senhaHash).toBe('senha_hash');
    expect(resultado.telefone).toBe(input.telefone);
    expect(resultado.status).toBe('ATIVO');
    expect(mockUsuarioRepository.buscarPorEmail).toHaveBeenCalledWith(
      input.email,
    );
    expect(mockCryptographyService.hash).toHaveBeenCalledWith(input.senhaPlana);
    expect(mockUsuarioRepository.salvar).toHaveBeenCalled();
  });

  it('deve lançar erro se o e-mail já estiver em uso', async () => {
    const input = {
      nomeCompleto: 'Gabriel Silva',
      email: 'gabriel@email.com',
      senhaPlana: 'senha123',
    };

    const usuarioExistente = new Usuario(
      'uuid-existente',
      'Outro Usuário',
      input.email,
      'hash_qualquer',
      'ATIVO',
      new Date(),
    );

    mockUsuarioRepository.buscarPorEmail.mockResolvedValue(usuarioExistente);

    await expect(useCase.execute(input)).rejects.toThrow(
      'E-mail já está em uso',
    );
    expect(mockUsuarioRepository.salvar).not.toHaveBeenCalled();
  });
});
