// src/presentation/dtos/login-usuario.dto.ts

import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUsuarioDto {
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  email: string;

  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @IsString()
  senha: string;
}
