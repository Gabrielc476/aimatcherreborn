// src/domain/repositories/matching.repository.ts

import { Matching } from '../entities/matching.entity';

export abstract class MatchingRepository {
  abstract salvar(matching: Matching): Promise<Matching>;
  abstract buscar(usuarioId: string, vagaId: string): Promise<Matching | null>;
  abstract buscarPorUsuario(
    usuarioId: string,
    limite: number,
    pagina: number,
  ): Promise<{ total: number; matchings: Matching[] }>;
  abstract buscarPorVaga(
    vagaId: string,
    scoreMinimo: number,
    limite: number,
    pagina: number,
  ): Promise<{ total: number; matchings: Matching[] }>;
  abstract excluir(usuarioId: string, vagaId: string): Promise<boolean>;
}
