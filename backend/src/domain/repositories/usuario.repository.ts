// src/domain/repositories/usuario.repository.ts

import { Usuario } from '../entities/usuario.entity';

export abstract class UsuarioRepository {
  abstract salvar(usuario: Usuario): Promise<Usuario>;
  abstract buscarPorId(id: string): Promise<Usuario | null>;
  abstract buscarPorEmail(email: string): Promise<Usuario | null>;
  abstract atualizar(id: string, usuario: Partial<Usuario>): Promise<Usuario>;
  abstract listar(
    limite: number,
    pagina: number,
  ): Promise<{ total: number; usuarios: Usuario[] }>;
}
