-- 2026-10-28 · Gestão de Efetivo · novo status "BLOQUEADO NA PORTARIA" (P-205)
-- Barrado na portaria: o dia é abonado, não é falta. O aviso do ponto não cobra falta dessas pessoas.
-- Rodar no Supabase do Efetivo (projeto mgcjidryrjqiceielmzp).
-- Voltar: sql/voltar/2026-10-28_status_bloqueado_portaria_voltar.sql

-- 1) Status entra na lista da tela (Configurações > Status)
update gps_compartilhado.gps_configuracoes_sistema
   set valor = valor || '["BLOQUEADO NA PORTARIA"]'::jsonb
 where sistema = 'EFETIVO' and setor = 'MEC' and chave = 'status_colaborador'
   and not (valor ? 'BLOQUEADO NA PORTARIA');

-- 2) Renato Torres passa para BLOQUEADO NA PORTARIA (estava AFASTADO)
update gps_mec.efetivo_gps_mec_colaboradores
   set status = 'BLOQUEADO NA PORTARIA'
 where name = 'RENATO TORRES DE MENEZES';

-- Conferência: a lista deve ter BLOQUEADO NA PORTARIA e o Renato deve aparecer com o novo status.
select valor from gps_compartilhado.gps_configuracoes_sistema
 where sistema = 'EFETIVO' and setor = 'MEC' and chave = 'status_colaborador';
select name, status from gps_mec.efetivo_gps_mec_colaboradores where name = 'RENATO TORRES DE MENEZES';
