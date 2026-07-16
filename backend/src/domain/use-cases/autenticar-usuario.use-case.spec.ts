// src/domain/use-cases/autenticar-usuario.use-case.spec.ts

import { AutenticarUsuarioUseCase } from './autenticar-usuario.use-case';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { CryptographyService } from '../services/cryptography.service';
import { TokenService } from '../services/token.service';
import { Usuario } from '../entities/usuario.entity';

describe('AutenticarUsuarioUseCase', () => {
  let useCase: AutenticarUsuarioUseCase;
  let mockUsuarioRepository: jest.Mocked<UsuarioRepository>;
  let mockCryptographyService: jest.Mocked<CryptographyService>;
  let mockTokenService: jest.Mocked<TokenService>;

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

    mockTokenService = {
      gerarToken: jest.fn(),
      validarToken: jest.fn(),
    };

    useCase = new AutenticarUsuarioUseCase(
      mockUsuarioRepository,
      mockCryptographyService,
      mockTokenService,
    );
  });

  it('deve autenticar usuário e retornar token com sucesso', async () => {
    const input = {
      email: 'gabriel@email.com',
      senhaPlana: 'senha123',
    };

    const usuario = new Usuario(
      'uuid-user',
      'Gabriel Silva',
      input.email,
      'senha_hash',
      'ATIVO',
      new Date(),
    );

    mockUsuarioRepository.buscarPorEmail.mockResolvedValue(usuario);
    mockCryptographyService.compare.mockResolvedValue(true);
    mockTokenService.gerarToken.mockReturnValue('jwt-token-valido');
    mockUsuarioRepository.atualizar.mockResolvedValue(usuario);

    const resultado = await useCase.execute(input);

    expect(resultado.token).toBe('jwt-token-valido');
    expect(resultado.usuario.id).toBe(usuario.id);
    expect(resultado.usuario.nomeCompleto).toBe(usuario.nomeCompleto);
    expect(resultado.usuario.email).toBe(usuario.email);
    expect(mockUsuarioRepository.buscarPorEmail).toHaveBeenCalledWith(
      input.email,
    );
    expect(mockCryptographyService.compare).toHaveBeenCalledWith(
      input.senhaPlana,
      'senha_hash',
    );
    expect(mockTokenService.gerarToken).toHaveBeenCalledWith({
      userId: usuario.id,
      email: usuario.email,
      role: usuario.role,
    });
    expect(mockUsuarioRepository.atualizar).toHaveBeenCalled();
  });

  it('deve lançar erro para credenciais inválidas (email inexistente)', async () => {
    const input = {
      email: 'inexistente@email.com',
      senhaPlana: 'senha123',
    };

    mockUsuarioRepository.buscarPorEmail.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(
      'Credenciais inválidas',
    );
    expect(mockCryptographyService.compare).not.toHaveBeenCalled();
  });

  it('deve lançar erro se o usuário estiver inativo ou bloqueado', async () => {
    const input = {
      email: 'bloqueado@email.com',
      senhaPlana: 'senha123',
    };

    const usuarioBloqueado = new Usuario(
      'uuid-user',
      'Gabriel Bloqueado',
      input.email,
      'senha_hash',
      'BLOQUEADO',
      new Date(),
    );

    mockUsuarioRepository.buscarPorEmail.mockResolvedValue(usuarioBloqueado);

    await expect(useCase.execute(input)).rejects.toThrow(
      'Usuário inativo ou bloqueado',
    );
  });

  it('deve lançar erro se a senha estiver incorreta', async () => {
    const input = {
      email: 'gabriel@email.com',
      senhaPlana: 'senha_errada',
    };

    const usuario = new Usuario(
      'uuid-user',
      'Gabriel Silva',
      input.email,
      'senha_hash',
      'ATIVO',
      new Date(),
    );

    mockUsuarioRepository.buscarPorEmail.mockResolvedValue(usuario);
    mockCryptographyService.compare.mockResolvedValue(false);

    await expect(useCase.execute(input)).rejects.toThrow(
      'Credenciais inválidas',
    );
  });
});
