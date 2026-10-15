-- Desfaz sql/2026-10-15_editores_e_historico.sql (Gestão de Efetivo, P-035 etapa 2).
-- Tira a trava de editor e o Movimentar. GUARDA o histórico, a lista de editores e a data de volta
-- (não se apaga histórico). Para apagar de vez, veja o fim do arquivo.

drop function if exists gps_mec.efetivo_gps_mec_movimentar(jsonb, text, text);

drop trigger if exists efetivo_gps_mec_historico_movimentos_trg on gps_mec.efetivo_gps_mec_colaboradores;
drop function if exists gps_mec.efetivo_gps_mec_historico_registrar();

do $$
declare
    t text;
    p text;
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
begin
    foreach t in array tabelas loop
        if to_regclass('gps_mec.' || t) is null then continue; end if;
        foreach p in array array[
            'trava: so editor inclui', 'trava: so editor altera', 'trava: so editor apaga',
            'efetivo: editor inclui', 'efetivo: editor altera', 'efetivo: editor apaga',
            'efetivo: ler com login'
        ] loop
            execute format('drop policy if exists %I on gps_mec.%I', p, t);
        end loop;
        -- a "temporario: leitura" só existe nas tabelas que estavam sem RLS: fica, para não perder a leitura
    end loop;
end $$;

notify pgrst, 'reload schema';

-- Para apagar de vez (só se tiver certeza; o histórico se perde):
-- drop trigger if exists efetivo_gps_mec_historico_imutavel_trg on gps_mec.efetivo_gps_mec_historico_movimentos;
-- drop table if exists gps_mec.efetivo_gps_mec_historico_movimentos;
-- drop function if exists gps_mec.efetivo_gps_mec_historico_imutavel();
-- drop table if exists gps_mec.efetivo_gps_mec_editores;
-- drop function if exists gps_mec.efetivo_gps_mec_e_editor();
-- alter table gps_mec.efetivo_gps_mec_colaboradores drop column if exists data_volta;
