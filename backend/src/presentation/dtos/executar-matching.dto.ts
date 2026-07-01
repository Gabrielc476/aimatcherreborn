// src/presentation/dtos/executar-matching.dto.ts

import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class ExecutarMatchingDto {
  @IsOptional()
  @IsUUID('all', { message: 'O ID do usuário deve ser um UUID válido' })
  usuarioId?: string;

  @IsNotEmpty({ message: 'O ID da vaga é obrigatório' })
  @IsUUID('all', { message: 'O ID da vaga deve ser um UUID válido' })
  vagaId: string;
}
