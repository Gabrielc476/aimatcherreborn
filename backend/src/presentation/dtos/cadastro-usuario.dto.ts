// src/presentation/dtos/cadastro-usuario.dto.ts

import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CadastroUsuarioDto {
  @IsNotEmpty({ message: 'O nome completo é obrigatório' })
  @IsString({ message: 'O nome completo deve ser uma string' })
  nomeCompleto: string;

  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  email: string;

  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  senha: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  dataNascimento?: Date;

  @IsOptional()
  @IsString()
  role?: string;
}
