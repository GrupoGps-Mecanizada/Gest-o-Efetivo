-- 2026-10-15 · Gestão de Efetivo · P-035 (Movimentar do Efetivo), etapa 2
-- 1) Lista de editores (começa só com o Warlison).
-- 2) Gravação nas tabelas do efetivo só para editores (a regra fica no banco, não só na tela).
-- 3) Histórico de movimentações que ninguém apaga (quem, quando, de onde, para onde, motivo).
-- 4) Campo "data de volta" no colaborador.
-- 5) Função "movimentar": grava uma ou mais mudanças de uma vez, com o motivo.
-- Não mexe na leitura sem login (isso é a etapa 3). Pode rodar mais de uma vez sem estragar.
-- Para desfazer: sql/voltar/2026-10-15_editores_e_historico_voltar.sql

-- ── 1) Editores ─────────────────────────────────────────────
create table if not exists gps_mec.efetivo_gps_mec_editores (
    usuario_id   uuid primary key references auth.users (id) on delete cascade,
    nome         text,
    email        text,
    incluido_por text,
    incluido_em  timestamptz not null default now()
);

comment on table gps_mec.efetivo_gps_mec_editores is
    'Quem pode mexer no efetivo (Movimentar). Os demais com login só consultam.';

-- "Sou editor?" (a tela usa para mostrar ou esconder o botão Movimentar)
create or replace function gps_mec.efetivo_gps_mec_e_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1 from gps_mec.efetivo_gps_mec_editores where usuario_id = (select auth.uid())
    );
$$;

revoke execute on function gps_mec.efetivo_gps_mec_e_editor() from public, anon;
grant execute on function gps_mec.efetivo_gps_mec_e_editor() to authenticated;

alter table gps_mec.efetivo_gps_mec_editores enable row level security;
revoke all on table gps_mec.efetivo_gps_mec_editores from anon, authenticated;
grant select, insert, delete on table gps_mec.efetivo_gps_mec_editores to authenticated;

drop policy if exists "editores: ler com login" on gps_mec.efetivo_gps_mec_editores;
create policy "editores: ler com login" on gps_mec.efetivo_gps_mec_editores
    for select to authenticated using (true);

drop policy if exists "editores: editor inclui" on gps_mec.efetivo_gps_mec_editores;
create policy "editores: editor inclui" on gps_mec.efetivo_gps_mec_editores
    for insert to authenticated with check ((select gps_mec.efetivo_gps_mec_e_editor()));

-- editor tira outro editor, mas não a si mesmo (a lista nunca fica vazia por engano)
drop policy if exists "editores: editor tira outro" on gps_mec.efetivo_gps_mec_editores;
create policy "editores: editor tira outro" on gps_mec.efetivo_gps_mec_editores
    for delete to authenticated
    using ((select gps_mec.efetivo_gps_mec_e_editor()) and usuario_id <> (select auth.uid()));

-- primeiro editor: Warlison
insert into gps_mec.efetivo_gps_mec_editores (usuario_id, nome, email, incluido_por)
select id, 'Warlison', email, 'SQL inicial 15/10/2026'
from auth.users
where lower(email) = 'warlison@sge.com'
on conflict (usuario_id) do nothing;

-- ── 2) Gravação só para editores ────────────────────────────
-- Regra "restritiva": soma-se às regras que já existem. Quem não é editor
-- (inclusive sem login) não grava, apaga nem altera, mesmo que outra regra permita.
-- Leitura não muda aqui. Tabela que estiver sem RLS é ligada sem perder a leitura de hoje.
do $$
declare
    t text;
    tabelas text[] := array[
        'efetivo_gps_mec_colaboradores',
        'efetivo_gps_mec_supervisores',
        'efetivo_gps_mec_equipamentos',
        'efetivo_gps_mec_setores',
        'efetivo_gps_mec_vagas',
        'efetivo_gps_mec_ferias',
        'efetivo_gps_mec_movimentacoes',
        'efetivo_gps_mec_advertencias',
        'efetivo_gps_mec_colaborador_treinamentos'
    ];
    editor text := '(select gps_mec.efetivo_gps_mec_e_editor())';
begin
    foreach t in array tabelas loop
        if to_regclass('gps_mec.' || t) is null then
            raise notice 'Tabela % não existe, pulando.', t;
            continue;
        end if;

        -- sem RLS hoje? liga e mantém a leitura como está (a etapa 3 fecha a leitura sem login)
        if not (select relrowsecurity from pg_class where oid = ('gps_mec.' || t)::regclass) then
            execute format('alter table gps_mec.%I enable row level security', t);
            execute format('drop policy if exists "temporario: leitura (sai na etapa 3)" on gps_mec.%I', t);
            execute format('create policy "temporario: leitura (sai na etapa 3)" on gps_mec.%I for select to anon, authenticated using (true)', t);
        end if;

        -- leitura com login (garantida)
        execute format('drop policy if exists "efetivo: ler com login" on gps_mec.%I', t);
        execute format('create policy "efetivo: ler com login" on gps_mec.%I for select to authenticated using (true)', t);

        -- editores gravam
        execute format('drop policy if exists "efetivo: editor inclui" on gps_mec.%I', t);
        execute format('create policy "efetivo: editor inclui" on gps_mec.%I for insert to authenticated with check (%s)', t, editor);
        execute format('drop policy if exists "efetivo: editor altera" on gps_mec.%I', t);
        execute format('create policy "efetivo: editor altera" on gps_mec.%I for update to authenticated using (%s) with check (%s)', t, editor, editor);
        execute format('drop policy if exists "efetivo: editor apaga" on gps_mec.%I', t);
        execute format('create policy "efetivo: editor apaga" on gps_mec.%I for delete to authenticated using (%s)', t, editor);

        -- trava: só editor grava (vale por cima de qualquer outra regra)
        execute format('drop policy if exists "trava: so editor inclui" on gps_mec.%I', t);
        execute format('create policy "trava: so editor inclui" on gps_mec.%I as restrictive for insert to public with check (%s)', t, editor);
        execute format('drop policy if exists "trava: so editor altera" on gps_mec.%I', t);
        execute format('create policy "trava: so editor altera" on gps_mec.%I as restrictive for update to public using (%s) with check (%s)', t, editor, editor);
        execute format('drop policy if exists "trava: so editor apaga" on gps_mec.%I', t);
        execute format('create policy "trava: so editor apaga" on gps_mec.%I as restrictive for delete to public using (%s)', t, editor);
    end loop;
end $$;

-- ── 3) Data de volta ────────────────────────────────────────
alter table gps_mec.efetivo_gps_mec_colaboradores add column if not exists data_volta date;
comment on column gps_mec.efetivo_gps_mec_colaboradores.data_volta is
    'Quando volta de férias, atestado ou sobra (opcional). Alimenta a lista "Voltam esta semana".';

-- ── 4) Histórico que ninguém apaga ──────────────────────────
create table if not exists gps_mec.efetivo_gps_mec_historico_movimentos (
    id                 uuid primary key default gen_random_uuid(),
    grupo_id           uuid,               -- mudanças feitas juntas (ex.: troca entre duas pessoas); o Desfazer usa
    colaborador_id     text not null,      -- sem ligação forte: o histórico fica mesmo se a pessoa for apagada
    colaborador_nome   text,
    acao               text not null,      -- 'entrou', 'mudou', 'saiu do cadastro'
    situacao_antes     text,
    situacao_depois    text,
    supervisor_antes   text,
    supervisor_depois  text,
    equipamento_antes  text,
    equipamento_depois text,
    data_volta         date,
    motivo             text,
    observacao         text,
    feito_por_id       uuid,
    feito_por          text,
    feito_em           timestamptz not null default now()
);

comment on table gps_mec.efetivo_gps_mec_historico_movimentos is
    'Toda mudança de situação, supervisor, equipamento ou data de volta de um colaborador. Só o banco grava; ninguém altera nem apaga.';

create index if not exists efetivo_gps_mec_hist_mov_colab_idx
    on gps_mec.efetivo_gps_mec_historico_movimentos (colaborador_id, feito_em desc);
create index if not exists efetivo_gps_mec_hist_mov_data_idx
    on gps_mec.efetivo_gps_mec_historico_movimentos (feito_em desc);
create index if not exists efetivo_gps_mec_hist_mov_grupo_idx
    on gps_mec.efetivo_gps_mec_historico_movimentos (grupo_id) where grupo_id is not null;

alter table gps_mec.efetivo_gps_mec_historico_movimentos enable row level security;
revoke all on table gps_mec.efetivo_gps_mec_historico_movimentos from anon, authenticated;
grant select on table gps_mec.efetivo_gps_mec_historico_movimentos to authenticated;

drop policy if exists "historico movimentos: ler com login" on gps_mec.efetivo_gps_mec_historico_movimentos;
create policy "historico movimentos: ler com login" on gps_mec.efetivo_gps_mec_historico_movimentos
    for select to authenticated using (true);

-- trava: ninguém altera nem apaga uma linha do histórico (nem o dono do banco pela tela)
create or replace function gps_mec.efetivo_gps_mec_historico_imutavel()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    raise exception 'O histórico de movimentações não pode ser alterado nem apagado.';
end;
$$;

revoke execute on function gps_mec.efetivo_gps_mec_historico_imutavel() from public, anon, authenticated;

drop trigger if exists efetivo_gps_mec_historico_imutavel_trg on gps_mec.efetivo_gps_mec_historico_movimentos;
create trigger efetivo_gps_mec_historico_imutavel_trg
    before update or delete on gps_mec.efetivo_gps_mec_historico_movimentos
    for each row execute function gps_mec.efetivo_gps_mec_historico_imutavel();

drop trigger if exists efetivo_gps_mec_historico_imutavel_trunc_trg on gps_mec.efetivo_gps_mec_historico_movimentos;
create trigger efetivo_gps_mec_historico_imutavel_trunc_trg
    before truncate on gps_mec.efetivo_gps_mec_historico_movimentos
    for each statement execute function gps_mec.efetivo_gps_mec_historico_imutavel();

-- gatilho no colaborador: toda mudança que importa vai para o histórico, venha de onde vier
create or replace function gps_mec.efetivo_gps_mec_historico_registrar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    quem    text := coalesce(auth.jwt() ->> 'email', current_user);
    motivo  text := nullif(current_setting('sge.motivo', true), '');
    obs     text := nullif(current_setting('sge.observacao', true), '');
    grupo   uuid := nullif(current_setting('sge.grupo', true), '')::uuid;
    situacao_antes  text;
    situacao_depois text;
    sup_antes  text;
    sup_depois text;
    eq_antes   text;
    eq_depois  text;
begin
    -- situação como o dono fala: trabalhando, férias, atestado, sobra, desligado...
    if tg_op <> 'INSERT' then
        situacao_antes := case
            when old.status = 'ATIVO' and old.supervisor_id is null then 'SOBRA'
            else old.status end;
        select s.name into sup_antes from gps_mec.efetivo_gps_mec_supervisores s where s.id = old.supervisor_id;
        select coalesce(to_jsonb(e) ->> 'placa', concat_ws('-', to_jsonb(e) ->> 'sigla', to_jsonb(e) ->> 'numero'))
            into eq_antes from gps_mec.efetivo_gps_mec_equipamentos e where e.id = old.equipment_id;
    end if;
    if tg_op <> 'DELETE' then
        situacao_depois := case
            when new.status = 'ATIVO' and new.supervisor_id is null then 'SOBRA'
            else new.status end;
        select s.name into sup_depois from gps_mec.efetivo_gps_mec_supervisores s where s.id = new.supervisor_id;
        select coalesce(to_jsonb(e) ->> 'placa', concat_ws('-', to_jsonb(e) ->> 'sigla', to_jsonb(e) ->> 'numero'))
            into eq_depois from gps_mec.efetivo_gps_mec_equipamentos e where e.id = new.equipment_id;
    end if;

    if tg_op = 'UPDATE'
       and new.status is not distinct from old.status
       and new.supervisor_id is not distinct from old.supervisor_id
       and new.equipment_id is not distinct from old.equipment_id
       and new.data_volta is not distinct from old.data_volta then
        return new; -- nada que importe mudou (ex.: telefone)
    end if;

    insert into gps_mec.efetivo_gps_mec_historico_movimentos (
        grupo_id, colaborador_id, colaborador_nome, acao,
        situacao_antes, situacao_depois, supervisor_antes, supervisor_depois,
        equipamento_antes, equipamento_depois, data_volta,
        motivo, observacao, feito_por_id, feito_por)
    values (
        grupo,
        case when tg_op = 'DELETE' then old.id::text else new.id::text end,
        case when tg_op = 'DELETE' then old.name else new.name end,
        case tg_op when 'INSERT' then 'entrou' when 'DELETE' then 'saiu do cadastro' else 'mudou' end,
        situacao_antes, situacao_depois, sup_antes, sup_depois,
        eq_antes, eq_depois,
        case when tg_op = 'DELETE' then null else new.data_volta end,
        coalesce(motivo, case when tg_op = 'UPDATE' then 'Alterado fora do Movimentar' end),
        obs, (select auth.uid()), quem);

    if tg_op = 'DELETE' then return old; end if;
    return new;
end;
$$;

revoke execute on function gps_mec.efetivo_gps_mec_historico_registrar() from public, anon, authenticated;

drop trigger if exists efetivo_gps_mec_historico_movimentos_trg on gps_mec.efetivo_gps_mec_colaboradores;
create trigger efetivo_gps_mec_historico_movimentos_trg
    after insert or update or delete on gps_mec.efetivo_gps_mec_colaboradores
    for each row execute function gps_mec.efetivo_gps_mec_historico_registrar();

-- ── 5) Movimentar (o botão da tela chama esta função) ───────
-- Recebe uma lista de mudanças e grava tudo junto (ou nada, se algo falhar), com o mesmo motivo.
-- Ex.: [{"colaborador_id": "...", "status": "FÉRIAS", "supervisor_id": null, "equipment_id": null, "data_volta": "2026-11-03"}]
-- Roda com o login de quem chamou: a trava de editor do item 2 vale aqui também.
-- Devolve o número do grupo (o Desfazer usa para voltar exatamente essas mudanças).
create or replace function gps_mec.efetivo_gps_mec_movimentar(
    p_mudancas   jsonb,
    p_motivo     text,
    p_observacao text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
    grupo uuid := gen_random_uuid();
    m     jsonb;
    n     int;
begin
    if not gps_mec.efetivo_gps_mec_e_editor() then
        raise exception 'Só editores podem movimentar o efetivo.' using errcode = '42501';
    end if;
    if p_motivo is null or btrim(p_motivo) = '' then
        raise exception 'Informe o motivo.';
    end if;
    if jsonb_typeof(p_mudancas) <> 'array' or jsonb_array_length(p_mudancas) = 0 then
        raise exception 'Nenhuma mudança informada.';
    end if;

    perform set_config('sge.motivo', btrim(p_motivo), true);
    perform set_config('sge.observacao', coalesce(btrim(p_observacao), ''), true);
    perform set_config('sge.grupo', grupo::text, true);

    for m in select * from jsonb_array_elements(p_mudancas) loop
        update gps_mec.efetivo_gps_mec_colaboradores c set
            status        = coalesce(m ->> 'status', c.status),
            supervisor_id = case when m ? 'supervisor_id' then (m ->> 'supervisor_id')::uuid else c.supervisor_id end,
            equipment_id  = case when m ? 'equipment_id'  then (m ->> 'equipment_id')::uuid  else c.equipment_id end,
            data_volta    = case when m ? 'data_volta'    then (m ->> 'data_volta')::date    else c.data_volta end,
            updated_at    = now()
        where c.id::text = (m ->> 'colaborador_id');
        get diagnostics n = row_count;
        if n = 0 then
            raise exception 'Colaborador % não encontrado.', m ->> 'colaborador_id';
        end if;
    end loop;

    -- limpa para não "vazar" o motivo para outra gravação na mesma conexão
    perform set_config('sge.motivo', '', true);
    perform set_config('sge.observacao', '', true);
    perform set_config('sge.grupo', '', true);
    return grupo;
end;
$$;

revoke execute on function gps_mec.efetivo_gps_mec_movimentar(jsonb, text, text) from public, anon;
grant execute on function gps_mec.efetivo_gps_mec_movimentar(jsonb, text, text) to authenticated;

notify pgrst, 'reload schema';

-- ── Conferência (só leitura; rode depois e veja o resultado) ─
-- select * from gps_mec.efetivo_gps_mec_editores;   -- deve mostrar 1 linha: Warlison
-- select tablename, policyname, permissive, cmd from pg_policies
--   where schemaname = 'gps_mec' and policyname like 'trava:%' order by 1, 2;   -- 3 travas por tabela
