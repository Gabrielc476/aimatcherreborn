// src/domain/use-cases/autenticar-usuario.use-case.ts

import { Usuario } from '../entities/usuario.entity';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { CryptographyService } from '../services/cryptography.service';
import { TokenService } from '../services/token.service';

export interface AutenticarUsuarioInput {
  email: string;
  senhaPlana: string;
}

export interface AutenticarUsuarioOutput {
  token: string;
  usuario: {
    id: string;
    nomeCompleto: string;
    email: string;
    role: string;
  };
}

export class AutenticarUsuarioUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly cryptographyService: CryptographyService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: AutenticarUsuarioInput): Promise<AutenticarUsuarioOutput> {
    // 1. Busca o usuário
    const usuario = await this.usuarioRepository.buscarPorEmail(input.email);
    if (!usuario) {
      throw new Error('Credenciais inválidas');
    }

    // 2. Verifica se o usuário está ativo
    if (usuario.status !== 'ATIVO') {
      throw new Error('Usuário inativo ou bloqueado');
    }

    // 3. Valida a senha
    const senhaValida = await this.cryptographyService.compare(input.senhaPlana, usuario.senhaHash);
    if (!senhaValida) {
      throw new Error('Credenciais inválidas');
    }

    // 4. Atualiza o timestamp de último acesso
    usuario.atualizarUltimoAcesso();
    await this.usuarioRepository.atualizar(usuario.id, { ultimoAcesso: usuario.ultimoAcesso });

    // 5. Gera o token JWT
    const token = this.tokenService.gerarToken({
      userId: usuario.id,
      email: usuario.email,
      role: usuario.role,
    });

    return {
      token,
      usuario: {
        id: usuario.id,
        nomeCompleto: usuario.nomeCompleto,
        email: usuario.email,
        role: usuario.role,
      },
    };
  }
}
