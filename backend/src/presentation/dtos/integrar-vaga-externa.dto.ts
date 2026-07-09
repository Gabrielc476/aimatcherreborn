// src/presentation/dtos/integrar-vaga-externa.dto.ts

import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class IntegrarVagaExternaDto {
  @IsNotEmpty({ message: 'O título da vaga é obrigatório' })
  @IsString()
  titulo: string;

  @IsNotEmpty({ message: 'O nome da empresa é obrigatório' })
  @IsString()
  empresaNome: string;

  @IsNotEmpty({ message: 'A descrição da vaga é obrigatória' })
  @IsString()
  descricao: string;

  @IsOptional()
  @IsString()
  localizacao?: string;

  @IsOptional()
  @IsString()
  modalidade?: string;

  @IsOptional()
  @IsString()
  tipoContrato?: string;

  @IsOptional()
  @IsString()
  nivel?: string;

  @IsOptional()
  @IsNumber()
  salarioMin?: number;

  @IsOptional()
  @IsNumber()
  salarioMax?: number;

  @IsOptional()
  @IsString()
  link?: string;
}
