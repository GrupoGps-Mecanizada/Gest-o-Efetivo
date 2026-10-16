-- 2026-10-16 · Gestão de Efetivo · P-035 (Movimentar do Efetivo), etapa 3
-- Fecha a leitura SEM LOGIN (anon) de tudo o que fica no schema gps_mec.
-- Antes disso, os 5 sistemas que usam essas tabelas passaram para o login novo da Central
-- (Gestão de Efetivo, Relatório de Turno, Etilômetro, Controle de Presença, Controle de Medição),
-- que lê com a sessão de quem entrou. Quem tem login continua vendo como hoje.
-- Pode rodar mais de uma vez sem estragar.
-- Para desfazer: sql/voltar/2026-10-16_fechar_leitura_sem_login_voltar.sql

-- 1) Sem login, não entra no schema (nem lê, nem grava, nem chama função)
revoke usage on schema gps_mec from anon;
revoke all on all tables    in schema gps_mec from anon;
revoke all on all sequences in schema gps_mec from anon;
revoke all on all functions in schema gps_mec from anon;

-- 2) Tabelas criadas no futuro também nascem fechadas para quem não tem login
alter default privileges for role postgres in schema gps_mec revoke all on tables    from anon;
alter default privileges for role postgres in schema gps_mec revoke all on sequences from anon;
alter default privileges for role postgres in schema gps_mec revoke all on functions from anon;

-- 3) Tira as regras de leitura temporárias da etapa 2 (só existem se alguma tabela estava sem RLS)
do $$
declare
    r record;
begin
    for r in
        select schemaname, tablename, policyname from pg_policies
        where schemaname = 'gps_mec' and policyname = 'temporario: leitura (sai na etapa 3)'
    loop
        execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    end loop;
end $$;

notify pgrst, 'reload schema';

-- ── Conferência (só leitura; rode depois e veja o resultado) ─
-- Deve voltar "false" (sem login não entra mais):
-- select has_schema_privilege('anon', 'gps_mec', 'usage') as sem_login_entra;
-- Deve voltar 0 linhas (nenhuma tabela aberta para quem não tem login):
-- select table_name from information_schema.role_table_grants
--   where table_schema = 'gps_mec' and grantee = 'anon';
