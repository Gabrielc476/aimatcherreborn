-- ==========================================
-- SCRIPT DE POLÍTICAS DE RLS (ROW LEVEL SECURITY)
-- Cole este script no SQL Editor do seu painel do Supabase.
-- ==========================================

-- 1. Habilitar RLS em todas as tabelas protegidas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE formacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE habilidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE idiomas ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vagas ENABLE ROW LEVEL SECURITY;

-- 2. Criar políticas para a tabela 'usuarios'
-- Qualquer pessoa pode se registrar (inserir na tabela)
CREATE POLICY usuario_insert_policy ON usuarios
    FOR INSERT
    WITH CHECK (true);

-- Um usuário só pode ver, atualizar ou excluir seu próprio registro.
CREATE POLICY usuario_select_policy ON usuarios
    FOR SELECT
    USING (id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

CREATE POLICY usuario_update_policy ON usuarios
    FOR UPDATE
    USING (id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

CREATE POLICY usuario_delete_policy ON usuarios
    FOR DELETE
    USING (id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 3. Criar políticas para a tabela 'perfis'
CREATE POLICY perfil_rls_policy ON perfis
    FOR ALL
    USING (usuario_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 4. Criar políticas para a tabela 'experiencias'
CREATE POLICY experiencia_rls_policy ON experiencias
    FOR ALL
    USING (usuario_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 5. Criar políticas para a tabela 'formacoes'
CREATE POLICY formacao_rls_policy ON formacoes
    FOR ALL
    USING (usuario_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 6. Criar políticas para a tabela 'habilidades'
CREATE POLICY habilidade_rls_policy ON habilidades
    FOR ALL
    USING (usuario_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 7. Criar políticas para a tabela 'certificacoes'
CREATE POLICY certificacao_rls_policy ON certificacoes
    FOR ALL
    USING (usuario_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 8. Criar políticas para a tabela 'idiomas'
CREATE POLICY idioma_rls_policy ON idiomas
    FOR ALL
    USING (usuario_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 9. Criar políticas para a tabela 'preferencias'
CREATE POLICY preferencia_rls_policy ON preferencias
    FOR ALL
    USING (usuario_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 10. Criar políticas para a tabela 'matchings'
-- O candidato pode ver seus próprios matchings.
CREATE POLICY matching_candidato_policy ON matchings
    FOR ALL
    USING (usuario_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 11. Criar políticas para a tabela 'vagas'
-- Qualquer pessoa autenticada (candidato ou recrutador) pode ver vagas ativas.
CREATE POLICY vaga_select_policy ON vagas
    FOR SELECT
    USING (status = 'ativa' OR recrutador_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- Apenas o recrutador criador da vaga pode inseri-la.
CREATE POLICY vaga_insert_policy ON vagas
    FOR INSERT
    WITH CHECK (recrutador_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- Apenas o recrutador criador da vaga pode atualizá-la.
CREATE POLICY vaga_update_policy ON vagas
    FOR UPDATE
    USING (recrutador_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- Apenas o recrutador criador da vaga pode excluí-la.
CREATE POLICY vaga_delete_policy ON vagas
    FOR DELETE
    USING (recrutador_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);
