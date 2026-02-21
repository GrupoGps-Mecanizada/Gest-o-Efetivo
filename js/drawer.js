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
    document.getElementById('drawer-id').textContent = col.id + (h.isSemId(col) ? ' ⚠ Sem ID definitivo' : '');

    const body = document.getElementById('drawer-body');
    const movs = SGE.state.movimentacoes.filter(m => m.colaborador_id === col.id);

    const semIdAlert = h.isSemId(col) ? `<div class="alert-banner">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1L1 14h14z"/><path d="M8 6v4M8 11v1"/></svg>
      Colaborador sem ID definitivo — resolva em Configurações
    </div>` : '';

    body.innerHTML = `
      ${semIdAlert}
      <div class="section-title">Dados Cadastrais</div>
      <div class="drawer-fields-grid">
        <div class="drawer-field"><div class="drawer-field-label">Função</div><div class="drawer-field-value">${col.funcao}</div></div>
        <div class="drawer-field"><div class="drawer-field-label">Regime</div><div class="drawer-field-value">${col.regime}</div></div>
        <div class="drawer-field"><div class="drawer-field-label">Supervisor</div><div class="drawer-field-value">${col.supervisor}</div></div>
        <div class="drawer-field"><div class="drawer-field-label">Status</div><div class="drawer-field-value">${col.status}</div></div>
        <div class="drawer-field" style="grid-column:1/-1"><div class="drawer-field-label">Equipamento</div><div class="drawer-field-value">${col.equipamento || '—'}</div></div>
        <div class="drawer-field"><div class="drawer-field-label">Telefone</div><div class="drawer-field-value">${col.telefone || '—'}</div></div>
        <div class="drawer-field"><div class="drawer-field-label">Mat. Usiminas</div><div class="drawer-field-value">${col.matricula_usiminas || '—'}</div></div>
        <div class="drawer-field"><div class="drawer-field-label">Mat. GPS</div><div class="drawer-field-value">${col.matricula_gps || '—'}</div></div>
      </div>
      <div class="section-title">Histórico de Movimentações</div>
      <div class="drawer-history">
        ${movs.length === 0
        ? '<div style="color:var(--text-3);font-size:12px;text-align:center;padding:12px">Sem movimentações registradas</div>'
        : movs.map(m => `
            <div class="drawer-mov-item">
              <div class="drawer-mov-date">${h.formatDate(m.created_at)}</div>
              <div class="drawer-mov-text">${m.supervisor_origem} → ${m.supervisor_destino} · ${m.regime_origem} → ${m.regime_destino}</div>
              <span class="drawer-mov-motivo">${m.motivo}</span>
            </div>`).join('')}
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
