-- Desfaz sql/2026-10-14_escala_e_turnos.sql (Gestão de Efetivo v2.7.0)
drop trigger if exists efetivo_gps_mec_supervisores_historico_trg on gps_mec.efetivo_gps_mec_supervisores;
drop function if exists gps_mec.efetivo_gps_mec_supervisores_registrar();
drop table if exists gps_mec.efetivo_gps_mec_supervisores_historico;

delete from gps_compartilhado.gps_configuracoes_sistema
where sistema = 'EFETIVO' and setor = 'MEC' and chave in ('escala_turnos', 'feriados');

update gps_mec.efetivo_gps_mec_supervisores
set default_regime = '16HS-6X3'
where name = '16 HORAS' and default_regime = '16HS-5X2';
