-- Desfaz 2026-10-28_status_bloqueado_portaria.sql (Supabase do Efetivo, projeto mgcjidryrjqiceielmzp)
update gps_mec.efetivo_gps_mec_colaboradores
   set status = 'AFASTADO'
 where status = 'BLOQUEADO NA PORTARIA';

update gps_compartilhado.gps_configuracoes_sistema
   set valor = valor - 'BLOQUEADO NA PORTARIA'
 where sistema = 'EFETIVO' and setor = 'MEC' and chave = 'status_colaborador';
