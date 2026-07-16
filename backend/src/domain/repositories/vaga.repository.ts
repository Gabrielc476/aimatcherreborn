// src/domain/repositories/vaga.repository.ts

import { Vaga } from '../entities/vaga.entity';

export abstract class VagaRepository {
  abstract salvar(vaga: Vaga): Promise<Vaga>;
  abstract buscarPorId(id: string): Promise<Vaga | null>;
  abstract listarAtivas(
    limite: number,
    pagina: number,
  ): Promise<{ total: number; vagas: Vaga[] }>;
  abstract buscarPorPalavrasChave(
    palavrasChave: string[],
    limite: number,
    pagina: number,
  ): Promise<Vaga[]>;
  abstract buscarPorRecrutador(
    recrutadorId: string,
    limite: number,
    pagina: number,
  ): Promise<{ total: number; vagas: Vaga[] }>;
  abstract atualizar(id: string, vaga: Partial<Vaga>): Promise<Vaga>;
  abstract excluir(id: string): Promise<boolean>;
  abstract expirarVagasAntigas(
    recrutadorId: string,
    dataLimite: Date,
  ): Promise<number>;
}
