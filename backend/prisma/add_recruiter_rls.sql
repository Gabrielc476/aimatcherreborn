-- Allow recruiters to view profiles of candidates who matched their jobs
CREATE POLICY usuario_recrutador_select_policy ON usuarios
    FOR SELECT
    USING (
        id IN (
            SELECT usuario_id FROM matchings 
            WHERE vaga_id IN (
                SELECT id FROM vagas 
                WHERE recrutador_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
            )
        )
    );

-- Allow recruiters to view matchings for jobs they created
CREATE POLICY matching_recrutador_select_policy ON matchings
    FOR SELECT
    USING (
        vaga_id IN (
            SELECT id FROM vagas 
            WHERE recrutador_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        )
    );
