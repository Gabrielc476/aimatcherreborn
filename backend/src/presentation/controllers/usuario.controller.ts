// src/presentation/controllers/usuario.controller.ts

import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RegistrarUsuarioUseCase } from '../../domain/use-cases/registrar-usuario.use-case';
import { AutenticarUsuarioUseCase } from '../../domain/use-cases/autenticar-usuario.use-case';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { CadastroUsuarioDto } from '../dtos/cadastro-usuario.dto';
import { LoginUsuarioDto } from '../dtos/login-usuario.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('usuario')
export class UsuarioController {
  constructor(
    private readonly registrarUsuarioUseCase: RegistrarUsuarioUseCase,
    private readonly autenticarUsuarioUseCase: AutenticarUsuarioUseCase,
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  @Post('cadastro')
  @HttpCode(HttpStatus.CREATED)
  async cadastro(@Body() dto: CadastroUsuarioDto) {
    const usuario = await this.registrarUsuarioUseCase.execute({
      nomeCompleto: dto.nomeCompleto,
      email: dto.email,
      senhaPlana: dto.senha,
      telefone: dto.telefone,
      dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : undefined,
      role: dto.role as any,
    });

    return {
      mensagem: 'Usuário cadastrado com sucesso',
      usuarioId: usuario.id,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginUsuarioDto) {
    const result = await this.autenticarUsuarioUseCase.execute({
      email: dto.email,
      senhaPlana: dto.senha,
    });

    return {
      mensagem: 'Login realizado com sucesso',
      token: result.token,
      usuario: result.usuario,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('verificar-token')
  @HttpCode(HttpStatus.OK)
  verificarToken(@Req() req: any) {
    return {
      mensagem: 'Token válido',
      usuarioId: req.user.userId,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('listar')
  @HttpCode(HttpStatus.OK)
  async listar(
    @Query('pagina') pagina = 1,
    @Query('limite') limite = 20,
  ) {
    const result = await this.usuarioRepository.listar(Number(limite), Number(pagina));
    
    // Remove as senhas antes de retornar
    const usuariosSemSenha = result.usuarios.map((u) => {
      const { senhaHash, ...resto } = u;
      return resto;
    });

    return {
      total: result.total,
      pagina: Number(pagina),
      limite: Number(limite),
      usuarios: usuariosSemSenha,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async obterPorId(@Param('id') id: string, @Req() req: any, @Query('admin') admin?: string) {
    // Garante que o usuário só pode acessar os próprios dados (a menos que seja passado admin)
    if (req.user.userId !== id && !admin) {
      throw new ForbiddenException('Acesso não autorizado');
    }

    const usuario = await this.usuarioRepository.buscarPorId(id);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const { senhaHash, ...usuarioSemSenha } = usuario;
    return usuarioSemSenha;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async atualizar(@Param('id') id: string, @Body() dados: any, @Req() req: any, @Query('admin') admin?: string) {
    if (req.user.userId !== id && !admin) {
      throw new ForbiddenException('Acesso não autorizado');
    }

    // Impede alteração de campos sensíveis diretamente por esta rota
    delete dados.senhaHash;
    delete dados.senha;
    delete dados.id;
    delete dados.email;

    const usuarioAtualizado = await this.usuarioRepository.atualizar(id, dados);
    const { senhaHash, ...usuarioSemSenha } = usuarioAtualizado;
    
    return usuarioSemSenha;
  }
}
