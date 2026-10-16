-- Desfaz sql/2026-10-16_fechar_leitura_sem_login.sql (P-035 etapa 3).
-- Use só em emergência (algum sistema parou de mostrar dados): devolve a LEITURA sem login.
-- Gravação sem login continua fechada (as travas de editor da etapa 2 seguem valendo).

grant usage on schema gps_mec to anon;
grant select on all tables in schema gps_mec to anon;
alter default privileges for role postgres in schema gps_mec grant select on tables to anon;

notify pgrst, 'reload schema';
