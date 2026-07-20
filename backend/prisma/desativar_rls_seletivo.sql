-- Script para desativar RLS seletivamente no Supabase
-- Desativa RLS de todas as tabelas privadas de usuários para otimizar o pool de conexões do Prisma
-- Apenas a tabela de 'vagas' manterá RLS ativado no nível de banco de dados por segurança sensível.

ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE perfis DISABLE ROW LEVEL SECURITY;
ALTER TABLE experiencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE formacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE habilidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE idiomas DISABLE ROW LEVEL SECURITY;
ALTER TABLE preferencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE matchings DISABLE ROW LEVEL SECURITY;
ALTER TABLE curriculos_otimizados DISABLE ROW LEVEL SECURITY;
ALTER TABLE jobs_processamento DISABLE ROW LEVEL SECURITY;
