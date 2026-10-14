-- 2026-10-14 · Gestão de Efetivo v2.7.0
-- Escala de turnos: ciclo do 4x4 (A-D), ADM e 16 horas, feriados e histórico dos supervisores.
-- Regra oficial no cofre: 2 - Projetos/SGE/Departamentos/7 - Setores/Regimes, turnos e supervisores.md
-- Para desfazer: sql/voltar/2026-10-14_escala_e_turnos_voltar.sql

-- 1) Escala (mesma tabela de configurações que o sistema já lê; só com login)
--    4x4: 2 dias + 2 noites + 4 folgas. Em 13/10/2026 a letra A começou o turno do dia.
--    Ordem das letras no turno do dia: A -> D -> B -> C. De noite fica a letra do bloco anterior.
insert into gps_compartilhado.gps_configuracoes_sistema (sistema, setor, chave, valor, descricao)
values ('EFETIVO', 'MEC', 'escala_turnos', '{
  "ciclo_4x4": {
    "referencia": "2026-10-13",
    "ordem_dia": ["A", "D", "B", "C"],
    "dias_por_bloco": 2,
    "dia":   { "inicio": "06:40", "fim": "18:40" },
    "noite": { "inicio": "18:40", "fim": "06:40" }
  },
  "adm": { "dias_semana": [1, 2, 3, 4, 5], "inicio": "07:00", "fim": "16:48", "trabalha_feriado": false },
  "16h": {
    "dias_semana": [1, 2, 3, 4, 5],
    "turnos": [
      { "nome": "1º turno", "inicio": "06:40", "fim": "14:40" },
      { "nome": "2º turno", "inicio": "14:40", "fim": "22:40" }
    ],
    "trabalha_feriado": false
  }
}'::jsonb, 'Escala de turnos: ciclo do 4x4, ADM e 16 horas')
on conflict (sistema, setor, chave) do nothing;

-- 2) Feriados nacionais 2026 e 2027 (os de Ipatinga entram pela tela Turnos)
insert into gps_compartilhado.gps_configuracoes_sistema (sistema, setor, chave, valor, descricao)
values ('EFETIVO', 'MEC', 'feriados', '[
  {"data": "2026-01-01", "nome": "Confraternização Universal"},
  {"data": "2026-04-03", "nome": "Sexta-feira Santa"},
  {"data": "2026-04-21", "nome": "Tiradentes"},
  {"data": "2026-05-01", "nome": "Dia do Trabalho"},
  {"data": "2026-09-07", "nome": "Independência"},
  {"data": "2026-10-12", "nome": "Nossa Senhora Aparecida"},
  {"data": "2026-11-02", "nome": "Finados"},
  {"data": "2026-11-15", "nome": "Proclamação da República"},
  {"data": "2026-11-20", "nome": "Consciência Negra"},
  {"data": "2026-12-25", "nome": "Natal"},
  {"data": "2027-01-01", "nome": "Confraternização Universal"},
  {"data": "2027-03-26", "nome": "Sexta-feira Santa"},
  {"data": "2027-04-21", "nome": "Tiradentes"},
  {"data": "2027-05-01", "nome": "Dia do Trabalho"},
  {"data": "2027-09-07", "nome": "Independência"},
  {"data": "2027-10-12", "nome": "Nossa Senhora Aparecida"},
  {"data": "2027-11-02", "nome": "Finados"},
  {"data": "2027-11-15", "nome": "Proclamação da República"},
  {"data": "2027-11-20", "nome": "Consciência Negra"},
  {"data": "2027-12-25", "nome": "Natal"}
]'::jsonb, 'Feriados em que ADM e 16 horas não trabalham')
on conflict (sistema, setor, chave) do nothing;

-- 3) Histórico dos supervisores: toda criação ou mudança de nome, regime/letra ou ativo fica gravada
create table if not exists gps_mec.efetivo_gps_mec_supervisores_historico (
    id              uuid primary key default gen_random_uuid(),
    supervisor_id   uuid references gps_mec.efetivo_gps_mec_supervisores (id) on delete set null,
    supervisor_nome text,
    campo           text not null,
    valor_antes     text,
    valor_depois    text,
    alterado_por    text,
    alterado_em     timestamptz not null default now()
);

comment on table gps_mec.efetivo_gps_mec_supervisores_historico is
    'Rastreabilidade dos supervisores: quem mudou nome, regime/letra ou ativo, quando e de qual valor para qual.';

create index if not exists efetivo_gps_mec_sup_hist_supervisor_idx
    on gps_mec.efetivo_gps_mec_supervisores_historico (supervisor_id, alterado_em desc);

alter table gps_mec.efetivo_gps_mec_supervisores_historico enable row level security;

revoke all on table gps_mec.efetivo_gps_mec_supervisores_historico from anon, authenticated;
grant select on table gps_mec.efetivo_gps_mec_supervisores_historico to authenticated;

drop policy if exists "historico supervisores: ler com login" on gps_mec.efetivo_gps_mec_supervisores_historico;
create policy "historico supervisores: ler com login" on gps_mec.efetivo_gps_mec_supervisores_historico
    for select to authenticated using (true);

-- o gatilho grava sozinho (ninguém escreve direto no histórico, nem apaga)
create or replace function gps_mec.efetivo_gps_mec_supervisores_registrar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    quem text := coalesce(auth.jwt() ->> 'email', current_user);
begin
    if tg_op = 'INSERT' then
        insert into gps_mec.efetivo_gps_mec_supervisores_historico
            (supervisor_id, supervisor_nome, campo, valor_antes, valor_depois, alterado_por)
        values (new.id, new.name, 'criado', null, new.default_regime, quem);
        return new;
    end if;

    if new.name is distinct from old.name then
        insert into gps_mec.efetivo_gps_mec_supervisores_historico
            (supervisor_id, supervisor_nome, campo, valor_antes, valor_depois, alterado_por)
        values (new.id, new.name, 'nome', old.name, new.name, quem);
    end if;
    if new.default_regime is distinct from old.default_regime then
        insert into gps_mec.efetivo_gps_mec_supervisores_historico
            (supervisor_id, supervisor_nome, campo, valor_antes, valor_depois, alterado_por)
        values (new.id, new.name, 'regime', old.default_regime, new.default_regime, quem);
    end if;
    if new.is_active is distinct from old.is_active then
        insert into gps_mec.efetivo_gps_mec_supervisores_historico
            (supervisor_id, supervisor_nome, campo, valor_antes, valor_depois, alterado_por)
        values (new.id, new.name, 'ativo',
                case when old.is_active then 'sim' else 'não' end,
                case when new.is_active then 'sim' else 'não' end, quem);
    end if;
    return new;
end;
$$;

revoke execute on function gps_mec.efetivo_gps_mec_supervisores_registrar() from public, anon, authenticated;

drop trigger if exists efetivo_gps_mec_supervisores_historico_trg on gps_mec.efetivo_gps_mec_supervisores;
create trigger efetivo_gps_mec_supervisores_historico_trg
    after insert or update on gps_mec.efetivo_gps_mec_supervisores
    for each row execute function gps_mec.efetivo_gps_mec_supervisores_registrar();

-- 4) Ponto de partida do histórico: a letra/regime de cada supervisor hoje
insert into gps_mec.efetivo_gps_mec_supervisores_historico
    (supervisor_id, supervisor_nome, campo, valor_antes, valor_depois, alterado_por)
select id, name, 'regime', null, default_regime, 'retrato inicial 14/10/2026'
from gps_mec.efetivo_gps_mec_supervisores
where not exists (select 1 from gps_mec.efetivo_gps_mec_supervisores_historico);

-- 5) A turma de 16 horas é 5x2 (seg a sex), não 6x3 (o gatilho já registra a troca)
update gps_mec.efetivo_gps_mec_supervisores
set default_regime = '16HS-5X2'
where name = '16 HORAS' and default_regime = '16HS-6X3';
