// src/domain/services/ai.service.ts

import { DetalhesMatching } from '../entities/matching.entity';
import { RequisitosVaga } from '../entities/vaga.entity';

export abstract class AIService {
  abstract extrairDadosCurriculo(textoCurriculo: string): Promise<any>;
  abstract extrairEstruturaVaga(textoVaga: string): Promise<Partial<RequisitosVaga> & any>;
  abstract analisarCompatibilidade(dadosCurriculo: any, dadosVaga: any): Promise<DetalhesMatching & { score: number }>;
  abstract gerarPalavrasChave(dadosVaga: any): Promise<string[]>;
  abstract gerarResumoVaga(dadosVaga: any): Promise<string>;
}
