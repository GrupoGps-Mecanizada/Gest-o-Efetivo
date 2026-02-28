'use strict';

/**
 * SGE — Drawer Component
 * Side panel for viewing collaborator details
 */
window.SGE = window.SGE || {};

SGE.drawer = {
  /**
   * Open drawer with collaborator details
   */
  open(col) {
    SGE.state.drawerColaborador = col;
    const h = SGE.helpers;

    document.getElementById('drawer-title').textContent = col.nome;
    document.getElementById('drawer-id').textContent = (col.matricula_gps || 'SEM_MATRICULA') + (h.isSemId(col) ? ' [!]' : '');

    const body = document.getElementById('drawer-body');
    const movs = SGE.state.movimentacoes.filter(m => m.colaborador_id === col.id);

    const semIdAlert = h.isSemId(col) ? `<div class="alert-banner">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1L1 14h14z"/><path d="M8 6v4M8 11v1"/></svg>
      Colaborador sem ID definitivo — resolva em Configuracoes
    </div>` : '';

    const categoriaLabel = col.categoria === 'OPERACIONAL' ? 'Operacional' : 'Gestao';
    const categoriaBadgeColor = col.categoria === 'OPERACIONAL'
      ? 'background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd'
      : 'background:#fef3c7;color:#92400e;border:1px solid #fde68a';
    const alocacaoLabel = col.categoria === 'GESTAO' ? 'Setor' : 'Equipamento';
    const alocacaoValue = col.categoria === 'GESTAO' ? (col.supervisor || '—') : (col.equipamento || '—');

    body.innerHTML = `
      ${semIdAlert}
      <div class="section-title">Dados Cadastrais</div>
      <div class="drawer-fields-grid">
        <div class="drawer-field"><div class="drawer-field-label">Categoria</div><div class="drawer-field-value"><span class="badge" style="${categoriaBadgeColor}">${categoriaLabel}</span></div></div>
        <div class="drawer-field"><div class="drawer-field-label">Funcao</div><div class="drawer-field-value"><span class="badge" style="${SGE.CONFIG.getFuncaoBadgeStyle(col.funcao)}">${col.funcao}</span></div></div>
        <div class="drawer-field"><div class="drawer-field-label">CR</div><div class="drawer-field-value">${col.cr || '—'}</div></div>
        <div class="drawer-field"><div class="drawer-field-label">Regime</div><div class="drawer-field-value">${col.regime}</div></div>
        <div class="drawer-field"><div class="drawer-field-label">Supervisor</div><div class="drawer-field-value">${col.supervisor}</div></div>
        <div class="drawer-field"><div class="drawer-field-label">Status</div><div class="drawer-field-value">${col.status}</div></div>
        <div class="drawer-field" style="grid-column:1/-1"><div class="drawer-field-label">${alocacaoLabel}</div><div class="drawer-field-value">${alocacaoValue}</div></div>
        <div class="drawer-field"><div class="drawer-field-label">Telefone</div><div class="drawer-field-value">${col.telefone || '—'}</div></div>
        <div class="drawer-field"><div class="drawer-field-label">Mat. Usiminas</div><div class="drawer-field-value">${col.matricula_usiminas || '—'}</div></div>
        <div class="drawer-field"><div class="drawer-field-label">Mat. GPS</div><div class="drawer-field-value">${col.matricula_gps || '—'}</div></div>
      </div>
      <div class="section-title">Historico de Movimentacoes</div>
      <div class="drawer-history">
        ${movs.length === 0
        ? '<div style="color:var(--text-3);font-size:12px;text-align:center;padding:12px">Sem movimentacoes registradas</div>'
        : movs.map(m => `
            <div class="drawer-mov-item">
              <div class="drawer-mov-date">${h.formatDate(m.created_at)}</div>
              <div class="drawer-mov-text">${m.supervisor_origem} → ${m.supervisor_destino} · ${m.regime_origem} → ${m.regime_destino}</div>
              <span class="drawer-mov-motivo">${m.motivo}</span>
            </div>`).join('')}
      </div>
      <div style="margin-top:24px; padding-top:12px; border-top:1px dashed var(--border); font-size:11px; color:var(--text-3); text-align:center;">
        Ultima Atualizacao: ${col.ultima_edicao ? h.formatDate(col.ultima_edicao) : 'Desconhecida'} por <strong>${col.editado_por || 'Sistema'}</strong>
      </div>
    `;

    document.getElementById('drawer-overlay').classList.add('open');
    document.getElementById('drawer').classList.add('open');
  },

  /**
   * Close the drawer
   */
  close() {
    document.getElementById('drawer-overlay').classList.remove('open');
    document.getElementById('drawer').classList.remove('open');
    SGE.state.drawerColaborador = null;
  }
};
