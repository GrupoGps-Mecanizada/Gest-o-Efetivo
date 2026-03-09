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
    const esc = h.escapeHtml.bind(h);

    document.getElementById('drawer-title').textContent = col.nome || '—';
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
    const hasSetor = col.setor_id && col.setor !== 'SEM SETOR';
    const alocacaoLabel = hasSetor ? 'Setor' : 'Equipamento';
    const alocacaoValue = esc(hasSetor ? col.setor : (col.equipamento || '—'));

    body.innerHTML = `
      ${semIdAlert}
      <div class="section-title">Dados Cadastrais</div>
      <div class="drawer-fields-grid">
        <div class="drawer-field"><div class="drawer-field-label">Categoria</div><div class="drawer-field-value"><span class="badge" style="${esc(categoriaBadgeColor)}">${esc(categoriaLabel)}</span></div></div>
        <div class="drawer-field"><div class="drawer-field-label">Funcao</div><div class="drawer-field-value"><span class="badge" style="${SGE.CONFIG.getFuncaoBadgeStyle(col.funcao)}">${esc(col.funcao)}</span></div></div>
        <div class="drawer-field"><div class="drawer-field-label">CR</div><div class="drawer-field-value">${esc(col.cr || '—')}</div></div>
        <div class="drawer-field"><div class="drawer-field-label">Regime</div><div class="drawer-field-value">${esc(col.regime)}</div></div>
        <div class="drawer-field"><div class="drawer-field-label">Supervisor</div><div class="drawer-field-value">${esc(col.supervisor)}</div></div>
        <div class="drawer-field"><div class="drawer-field-label">Status</div><div class="drawer-field-value">${esc(col.status)}</div></div>
        <div class="drawer-field" style="grid-column:1/-1"><div class="drawer-field-label">${esc(alocacaoLabel)}</div><div class="drawer-field-value">${alocacaoValue}</div></div>
        <div class="drawer-field"><div class="drawer-field-label">Telefone</div><div class="drawer-field-value">${esc(col.telefone || '—')}</div></div>
        <div class="drawer-field"><div class="drawer-field-label">Mat. Usiminas</div><div class="drawer-field-value">${esc(col.matricula_usiminas || '—')}</div></div>
        <div class="drawer-field"><div class="drawer-field-label">Mat. GPS</div><div class="drawer-field-value">${esc(col.matricula_gps || '—')}</div></div>
      </div>
      <div class="section-title">Historico de Movimentacoes</div>
      <div class="drawer-history">
        ${movs.length === 0
        ? '<div style="color:var(--text-3);font-size:12px;text-align:center;padding:12px">Sem movimentacoes registradas</div>'
        : movs.map(m => `
            <div class="drawer-mov-item">
              <div class="drawer-mov-date">${esc(h.formatDate(m.created_at))}</div>
              <div class="drawer-mov-text">${esc(m.supervisor_origem)} → ${esc(m.supervisor_destino)} · ${esc(m.regime_origem)} → ${esc(m.regime_destino)}</div>
              <span class="drawer-mov-motivo">${esc(m.motivo)}</span>
            </div>`).join('')}
      </div>
      <div style="margin-top:24px; padding-top:12px; border-top:1px dashed var(--border); font-size:11px; color:var(--text-3); text-align:center;">
        Ultima Atualizacao: ${col.ultima_edicao ? esc(h.formatDate(col.ultima_edicao)) : 'Desconhecida'} por <strong>${esc(col.editado_por || 'Sistema')}</strong>
      </div>
      <div id="drawer-field-history-section"></div>
    `;

    document.getElementById('drawer-overlay').classList.add('open');
    document.getElementById('drawer').classList.add('open');

    // Load field-level history asynchronously (non-blocking)
    SGE.drawer._loadFieldHistory(col.id);
  },

  /**
   * Load and render field-level change history for a collaborator
   */
  async _loadFieldHistory(colId) {
    const section = document.getElementById('drawer-field-history-section');
    if (!section || !window.supabase) return;

    try {
      const { data, error } = await window.supabase
        .schema('gps_compartilhado')
        .from('gps_field_history')
        .select('changed_by, changed_at, changes')
        .eq('entity_type', 'colaborador')
        .eq('entity_id', String(colId))
        .order('changed_at', { ascending: false })
        .limit(10);

      if (error || !data || data.length === 0) return;

      const h = SGE.helpers;
      const esc = h.escapeHtml.bind(h);

      const rows = data.map(entry => {
        const changes = Array.isArray(entry.changes) ? entry.changes : [];
        const changesHtml = changes.map(c =>
          `<div style="display:flex;gap:6px;align-items:baseline;font-size:11px;">
             <span style="color:var(--text-3);min-width:80px">${esc(c.campo)}:</span>
             <span style="text-decoration:line-through;color:var(--text-3)">${esc(c.de || '—')}</span>
             <span style="color:var(--text-3)">→</span>
             <span style="color:var(--text-1);font-weight:600">${esc(c.para || '—')}</span>
           </div>`
        ).join('');

        return `<div style="padding:8px 0;border-bottom:1px solid var(--border)">
          <div style="font-size:11px;color:var(--text-3);margin-bottom:4px">
            ${esc(h.formatDate(entry.changed_at))} — <strong>${esc(entry.changed_by)}</strong>
          </div>
          ${changesHtml}
        </div>`;
      }).join('');

      section.innerHTML = `
        <div class="section-title" style="margin-top:16px">Histórico de Campos</div>
        <div style="font-size:12px;">${rows}</div>
      `;
    } catch {
      // Table may not exist yet — fail silently
    }
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
