-- 2026-10-08 · Gestão de Efetivo v2.5.0
-- Vagas por supervisor: cada linha da aba de um supervisor na Matriz (supervisor + equipamento).
-- Um equipamento é compartilhado entre turnos (AP 01 tem gente de vários supervisores), por isso a vaga
-- é o par supervisor + equipamento. A vaga aparece na Matriz mesmo vazia (sem ninguém alocado).
-- Acesso só com login (authenticated). Sem leitura anônima.

create table if not exists gps_mec.efetivo_gps_mec_vagas (
    id            uuid primary key default gen_random_uuid(),
    supervisor_id uuid not null references gps_mec.efetivo_gps_mec_supervisores (id) on delete cascade,
    equipment_id  uuid not null references gps_mec.efetivo_gps_mec_equipamentos (id) on delete cascade,
    ordem         integer not null default 0,
    criado_em     timestamptz not null default now(),
    criado_por    text,
    constraint efetivo_gps_mec_vagas_unica unique (supervisor_id, equipment_id)
);

comment on table gps_mec.efetivo_gps_mec_vagas is 'Vagas (linhas) de cada supervisor na Matriz do Efetivo: supervisor + equipamento.';

-- índice da chave estrangeira do equipamento (a do supervisor já é coberta pela restrição única)
create index if not exists efetivo_gps_mec_vagas_equipment_idx on gps_mec.efetivo_gps_mec_vagas (equipment_id);

alter table gps_mec.efetivo_gps_mec_vagas enable row level security;

revoke all on table gps_mec.efetivo_gps_mec_vagas from anon;
grant select, insert, update, delete on table gps_mec.efetivo_gps_mec_vagas to authenticated;

create policy "vagas: ler com login" on gps_mec.efetivo_gps_mec_vagas
    for select to authenticated using (true);
create policy "vagas: criar com login" on gps_mec.efetivo_gps_mec_vagas
    for insert to authenticated with check (true);
create policy "vagas: mudar com login" on gps_mec.efetivo_gps_mec_vagas
    for update to authenticated using (true) with check (true);
create policy "vagas: apagar com login" on gps_mec.efetivo_gps_mec_vagas
    for delete to authenticated using (true);

-- tempo real (as outras telas abertas atualizam sozinhas), como as demais tabelas do efetivo
alter publication supabase_realtime add table gps_mec.efetivo_gps_mec_vagas;
