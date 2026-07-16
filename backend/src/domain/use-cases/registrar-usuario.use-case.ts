// src/domain/use-cases/registrar-usuario.use-case.ts

import { randomUUID } from 'crypto';
import { Usuario, StatusUsuario, Role } from '../entities/usuario.entity';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { CryptographyService } from '../services/cryptography.service';

export interface RegistrarUsuarioInput {
  nomeCompleto: string;
  email: string;
  senhaPlana: string;
  telefone?: string;
  dataNascimento?: Date;
  role?: Role;
}

export class RegistrarUsuarioUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly cryptographyService: CryptographyService,
  ) {}

  async execute(input: RegistrarUsuarioInput): Promise<Usuario> {
    // 1. Verifica se o usuário já existe
    const usuarioExistente = await this.usuarioRepository.buscarPorEmail(
      input.email,
    );
    if (usuarioExistente) {
      throw new Error('E-mail já está em uso');
    }

    // 2. Criptografa a senha
    const senhaHash = await this.cryptographyService.hash(input.senhaPlana);

    // 3. Cria a entidade do usuário
    const novoUsuario = new Usuario(
      randomUUID(),
      input.nomeCompleto,
      input.email,
      senhaHash,
      'ATIVO',
      new Date(),
      input.telefone,
      input.dataNascimento,
      undefined,
      undefined,
      [],
      [],
      [],
      [],
      [],
      undefined,
      [],
      undefined,
      undefined,
      undefined,
      input.role || 'CANDIDATO',
    );

    // 4. Salva no repositório
    return this.usuarioRepository.salvar(novoUsuario);
  }
}
