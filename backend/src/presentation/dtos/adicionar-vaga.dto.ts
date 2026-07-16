// src/presentation/dtos/adicionar-vaga.dto.ts

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdicionarVagaDto {
  @IsNotEmpty({ message: 'O texto da vaga é obrigatório' })
  @IsString()
  textoVaga: string;

  @IsOptional()
  @IsString()
  empresaNome?: string;

  @IsOptional()
  @IsString()
  localizacao?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  etapas?: any;
}
