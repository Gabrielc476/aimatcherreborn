// src/infrastructure/database/repositories/prisma-usuario.repository.ts

import { Injectable } from '@nestjs/common';
import { UsuarioRepository } from '../../../domain/repositories/usuario.repository';
import { Usuario, StatusUsuario, ModalidadeTrabalho } from '../../../domain/entities/usuario.entity';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(dbUser: any): Usuario | null {
    if (!dbUser) return null;

    return new Usuario(
      dbUser.id,
      dbUser.nomeCompleto,
      dbUser.email,
      dbUser.senhaHash,
      dbUser.status as StatusUsuario,
      dbUser.dataCriacao,
      dbUser.telefone || undefined,
      dbUser.dataNascimento || undefined,
      dbUser.ultimoAcesso || undefined,
      dbUser.perfil
        ? {
            titulo: dbUser.perfil.titulo || undefined,
            resumoProfissional: dbUser.perfil.resumoProfissional || undefined,
            anosExperiencia: dbUser.perfil.anosExperiencia,
            pretensaoSalarial: dbUser.perfil.pretensaoSalarial ? Number(dbUser.perfil.pretensaoSalarial) : undefined,
            disponibilidade: dbUser.perfil.disponibilidade || undefined,
          }
        : undefined,
      (dbUser.experiencias || []).map((exp: any) => ({
        id: exp.id,
        empresa: exp.empresa,
        cargo: exp.cargo,
        descricao: exp.descricao || undefined,
        dataInicio: exp.dataInicio,
        dataFim: exp.dataFim || undefined,
        atual: exp.atual,
        tecnologias: exp.tecnologias,
      })),
      (dbUser.formacoes || []).map((f: any) => ({
        id: f.id,
        instituicao: f.instituicao,
        curso: f.curso,
        grau: f.grau || undefined,
        area: f.area || undefined,
        dataInicio: f.dataInicio || undefined,
        dataFim: f.dataFim || undefined,
        concluido: f.concluido,
      })),
      (dbUser.habilidades || []).map((h: any) => ({
        id: h.id,
        nome: h.nome,
        nivel: h.nivel || undefined,
        anosExperiencia: h.anosExperiencia,
      })),
      (dbUser.certificacoes || []).map((c: any) => ({
        id: c.id,
        nome: c.nome,
        emissor: c.emissor,
        dataObtencao: c.dataObtencao || undefined,
        dataValidade: c.dataValidade || undefined,
        codigoValidade: c.codigoValidade || undefined,
      })),
      (dbUser.idiomas || []).map((i: any) => ({
        id: i.id,
        nome: i.nome,
        nivelLeitura: i.nivelLeitura || undefined,
        nivelEscrita: i.nivelEscrita || undefined,
        nivelConversacao: i.nivelConversacao || undefined,
      })),
      dbUser.preferencias
        ? {
            modalidades: dbUser.preferencias.modalidades as ModalidadeTrabalho[],
            cidades: dbUser.preferencias.cidades,
            cargos: dbUser.preferencias.cargos,
            tipoContrato: dbUser.preferencias.tipoContrato,
            mudanca: dbUser.preferencias.mudanca,
          }
        : undefined,
      (dbUser.projetos || []).map((p: any) => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao || undefined,
        tecnologias: p.tecnologias,
        url: p.url || undefined,
      })),
      dbUser.curriculoUrl || undefined,
      dbUser.curriculoTexto || undefined,
      dbUser.curriculoExtraido || undefined,
    );
  }

  async salvar(usuario: Usuario): Promise<Usuario> {
    return this.prisma.runWithRLS(async (tx) => {
      // Upsert do usuário principal
      const dbUser = await tx.usuario.upsert({
        where: { id: usuario.id },
        update: {
          nomeCompleto: usuario.nomeCompleto,
          email: usuario.email,
          senhaHash: usuario.senhaHash,
          telefone: usuario.telefone,
          dataNascimento: usuario.dataNascimento,
          status: usuario.status,
          ultimoAcesso: usuario.ultimoAcesso,
          curriculoUrl: usuario.curriculoUrl,
          curriculoTexto: usuario.curriculoTexto,
          curriculoExtraido: usuario.curriculoExtraido || undefined,
        },
        create: {
          id: usuario.id,
          nomeCompleto: usuario.nomeCompleto,
          email: usuario.email,
          senhaHash: usuario.senhaHash,
          telefone: usuario.telefone,
          dataNascimento: usuario.dataNascimento,
          status: usuario.status,
          dataCriacao: usuario.dataCriacao,
          ultimoAcesso: usuario.ultimoAcesso,
          curriculoUrl: usuario.curriculoUrl,
          curriculoTexto: usuario.curriculoTexto,
          curriculoExtraido: usuario.curriculoExtraido || undefined,
        },
      });

      // Atualiza ou Cria Perfil
      if (usuario.perfil) {
        await tx.perfil.upsert({
          where: { usuarioId: usuario.id },
          update: {
            titulo: usuario.perfil.titulo,
            resumoProfissional: usuario.perfil.resumoProfissional,
            anosExperiencia: usuario.perfil.anosExperiencia,
            pretensaoSalarial: usuario.perfil.pretensaoSalarial,
            disponibilidade: usuario.perfil.disponibilidade,
          },
          create: {
            usuarioId: usuario.id,
            titulo: usuario.perfil.titulo,
            resumoProfissional: usuario.perfil.resumoProfissional,
            anosExperiencia: usuario.perfil.anosExperiencia,
            pretensaoSalarial: usuario.perfil.pretensaoSalarial,
            disponibilidade: usuario.perfil.disponibilidade,
          },
        });
      }

      // Sincroniza experiências (remove antigas e insere novas)
      await tx.experiencia.deleteMany({ where: { usuarioId: usuario.id } });
      if (usuario.experiencias.length > 0) {
        await tx.experiencia.createMany({
          data: usuario.experiencias.map((exp) => ({
            usuarioId: usuario.id,
            empresa: exp.empresa,
            cargo: exp.cargo,
            descricao: exp.descricao,
            dataInicio: exp.dataInicio,
            dataFim: exp.dataFim,
            atual: exp.atual,
            tecnologias: exp.tecnologias,
          })),
        });
      }

      // Sincroniza formações
      await tx.formacao.deleteMany({ where: { usuarioId: usuario.id } });
      if (usuario.formacoes.length > 0) {
        await tx.formacao.createMany({
          data: usuario.formacoes.map((f) => ({
            usuarioId: usuario.id,
            instituicao: f.instituicao,
            curso: f.curso,
            grau: f.grau,
            area: f.area,
            dataInicio: f.dataInicio,
            dataFim: f.dataFim,
            concluido: f.concluido,
          })),
        });
      }

      // Sincroniza habilidades
      await tx.habilidade.deleteMany({ where: { usuarioId: usuario.id } });
      if (usuario.habilidades.length > 0) {
        await tx.habilidade.createMany({
          data: usuario.habilidades.map((h) => ({
            usuarioId: usuario.id,
            nome: h.nome,
            nivel: h.nivel,
            anosExperiencia: h.anosExperiencia,
          })),
        });
      }

      // Sincroniza certificações
      await tx.certificacao.deleteMany({ where: { usuarioId: usuario.id } });
      if (usuario.certificacoes.length > 0) {
        await tx.certificacao.createMany({
          data: usuario.certificacoes.map((c) => ({
            usuarioId: usuario.id,
            nome: c.nome,
            emissor: c.emissor,
            dataObtencao: c.dataObtencao,
            dataValidade: c.dataValidade,
            codigoValidade: c.codigoValidade,
          })),
        });
      }

      // Sincroniza idiomas
      await tx.idioma.deleteMany({ where: { usuarioId: usuario.id } });
      if (usuario.idiomas.length > 0) {
        await tx.idioma.createMany({
          data: usuario.idiomas.map((i) => ({
            usuarioId: usuario.id,
            nome: i.nome,
            nivelLeitura: i.nivelLeitura,
            nivelEscrita: i.nivelEscrita,
            nivelConversacao: i.nivelConversacao,
          })),
        });
      }

      // Sincroniza preferências
      if (usuario.preferencias) {
        await tx.preferencia.upsert({
          where: { usuarioId: usuario.id },
          update: {
            modalidades: usuario.preferencias.modalidades,
            cidades: usuario.preferencias.cidades,
            cargos: usuario.preferencias.cargos,
            tipoContrato: usuario.preferencias.tipoContrato,
            mudanca: usuario.preferencias.mudanca,
          },
          create: {
            usuarioId: usuario.id,
            modalidades: usuario.preferencias.modalidades,
            cidades: usuario.preferencias.cidades,
            cargos: usuario.preferencias.cargos,
            tipoContrato: usuario.preferencias.tipoContrato,
            mudanca: usuario.preferencias.mudanca,
          },
        });
      }

      // Sincroniza projetos
      await tx.projeto.deleteMany({ where: { usuarioId: usuario.id } });
      if (usuario.projetos && usuario.projetos.length > 0) {
        await tx.projeto.createMany({
          data: usuario.projetos.map((p) => ({
            usuarioId: usuario.id,
            nome: p.nome,
            descricao: p.descricao,
            tecnologias: p.tecnologias,
            url: p.url,
          })),
        });
      }

      // Retorna a entidade atualizada
      const dbUsuarioCompleto = await tx.usuario.findUnique({
        where: { id: usuario.id },
        include: {
          perfil: true,
          experiencias: true,
          formacoes: true,
          habilidades: true,
          certificacoes: true,
          idiomas: true,
          preferencias: true,
          projetos: true,
        },
      });

      return this.mapToDomain(dbUsuarioCompleto)!;
    });
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.prisma.runWithRLS(async (tx) => {
      const dbUser = await tx.usuario.findUnique({
        where: { id },
        include: {
          perfil: true,
          experiencias: true,
          formacoes: true,
          habilidades: true,
          certificacoes: true,
          idiomas: true,
          preferencias: true,
          projetos: true,
        },
      });
      return this.mapToDomain(dbUser);
    });
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    // Busca por email é usada no login (antes do RLS estar disponível ou em contexto público),
    // então roda diretamente no PrismaClient sem RLS.
    const dbUser = await this.prisma.usuario.findUnique({
      where: { email },
      include: {
        perfil: true,
        experiencias: true,
        formacoes: true,
        habilidades: true,
        certificacoes: true,
        idiomas: true,
        preferencias: true,
        projetos: true,
      },
    });
    return this.mapToDomain(dbUser);
  }

  async atualizar(id: string, usuario: Partial<Usuario>): Promise<Usuario> {
    return this.prisma.runWithRLS(async (tx) => {
      // Sincroniza relações se passadas no objeto parcial
      if (usuario.perfil) {
        await tx.perfil.upsert({
          where: { usuarioId: id },
          update: {
            titulo: usuario.perfil.titulo,
            resumoProfissional: usuario.perfil.resumoProfissional,
            anosExperiencia: usuario.perfil.anosExperiencia,
            pretensaoSalarial: usuario.perfil.pretensaoSalarial,
            disponibilidade: usuario.perfil.disponibilidade,
          },
          create: {
            usuarioId: id,
            titulo: usuario.perfil.titulo,
            resumoProfissional: usuario.perfil.resumoProfissional,
            anosExperiencia: usuario.perfil.anosExperiencia,
            pretensaoSalarial: usuario.perfil.pretensaoSalarial,
            disponibilidade: usuario.perfil.disponibilidade,
          },
        });
      }

      if (usuario.experiencias !== undefined) {
        await tx.experiencia.deleteMany({ where: { usuarioId: id } });
        if (usuario.experiencias.length > 0) {
          await tx.experiencia.createMany({
            data: usuario.experiencias.map((exp) => ({
              usuarioId: id,
              empresa: exp.empresa,
              cargo: exp.cargo,
              descricao: exp.descricao,
              dataInicio: exp.dataInicio,
              dataFim: exp.dataFim,
              atual: exp.atual,
              tecnologias: exp.tecnologias,
            })),
          });
        }
      }

      if (usuario.formacoes !== undefined) {
        await tx.formacao.deleteMany({ where: { usuarioId: id } });
        if (usuario.formacoes.length > 0) {
          await tx.formacao.createMany({
            data: usuario.formacoes.map((f) => ({
              usuarioId: id,
              instituicao: f.instituicao,
              curso: f.curso,
              grau: f.grau,
              area: f.area,
              dataInicio: f.dataInicio,
              dataFim: f.dataFim,
              concluido: f.concluido,
            })),
          });
        }
      }

      if (usuario.habilidades !== undefined) {
        await tx.habilidade.deleteMany({ where: { usuarioId: id } });
        if (usuario.habilidades.length > 0) {
          await tx.habilidade.createMany({
            data: usuario.habilidades.map((h) => ({
              usuarioId: id,
              nome: h.nome,
              nivel: h.nivel,
              anosExperiencia: h.anosExperiencia,
            })),
          });
        }
      }

      if (usuario.certificacoes !== undefined) {
        await tx.certificacao.deleteMany({ where: { usuarioId: id } });
        if (usuario.certificacoes.length > 0) {
          await tx.certificacao.createMany({
            data: usuario.certificacoes.map((c) => ({
              usuarioId: id,
              nome: c.nome,
              emissor: c.emissor,
              dataObtencao: c.dataObtencao,
              dataValidade: c.dataValidade,
              codigoValidade: c.codigoValidade,
            })),
          });
        }
      }

      if (usuario.idiomas !== undefined) {
        await tx.idioma.deleteMany({ where: { usuarioId: id } });
        if (usuario.idiomas.length > 0) {
          await tx.idioma.createMany({
            data: usuario.idiomas.map((i) => ({
              usuarioId: id,
              nome: i.nome,
              nivelLeitura: i.nivelLeitura,
              nivelEscrita: i.nivelEscrita,
              nivelConversacao: i.nivelConversacao,
            })),
          });
        }
      }

      if (usuario.preferencias) {
        await tx.preferencia.upsert({
          where: { usuarioId: id },
          update: {
            modalidades: usuario.preferencias.modalidades,
            cidades: usuario.preferencias.cidades,
            cargos: usuario.preferencias.cargos,
            tipoContrato: usuario.preferencias.tipoContrato,
            mudanca: usuario.preferencias.mudanca,
          },
          create: {
            usuarioId: id,
            modalidades: usuario.preferencias.modalidades,
            cidades: usuario.preferencias.cidades,
            cargos: usuario.preferencias.cargos,
            tipoContrato: usuario.preferencias.tipoContrato,
            mudanca: usuario.preferencias.mudanca,
          },
        });
      }

      if (usuario.projetos !== undefined) {
        await tx.projeto.deleteMany({ where: { usuarioId: id } });
        if (usuario.projetos.length > 0) {
          await tx.projeto.createMany({
            data: usuario.projetos.map((p) => ({
              usuarioId: id,
              nome: p.nome,
              descricao: p.descricao,
              tecnologias: p.tecnologias,
              url: p.url,
            })),
          });
        }
      }

      const dbUser = await tx.usuario.update({
        where: { id },
        data: {
          nomeCompleto: usuario.nomeCompleto,
          email: usuario.email,
          senhaHash: usuario.senhaHash,
          telefone: usuario.telefone,
          dataNascimento: usuario.dataNascimento,
          status: usuario.status,
          ultimoAcesso: usuario.ultimoAcesso,
          curriculoUrl: usuario.curriculoUrl,
          curriculoTexto: usuario.curriculoTexto,
          curriculoExtraido: usuario.curriculoExtraido || undefined,
        },
        include: {
          perfil: true,
          experiencias: true,
          formacoes: true,
          habilidades: true,
          certificacoes: true,
          idiomas: true,
          preferencias: true,
          projetos: true,
        },
      });
      return this.mapToDomain(dbUser)!;
    });
  }

  async listar(limite: number, pagina: number): Promise<{ total: number; usuarios: Usuario[] }> {
    return this.prisma.runWithRLS(async (tx) => {
      const skip = (pagina - 1) * limite;

      const [total, dbUsers] = await Promise.all([
        tx.usuario.count(),
        tx.usuario.findMany({
          skip,
          take: limite,
          include: {
            perfil: true,
            experiencias: true,
            formacoes: true,
            habilidades: true,
            certificacoes: true,
            idiomas: true,
            preferencias: true,
            projetos: true,
          },
        }),
      ]);

      return {
        total,
        usuarios: dbUsers.map((u) => this.mapToDomain(u)!),
      };
    });
  }
}
