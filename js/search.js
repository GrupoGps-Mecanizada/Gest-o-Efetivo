'use strict';

/**
 * SGE — Search View
 * Full-text search across collaborators
 */
window.SGE = window.SGE || {};

SGE.search = {
  render(q = '') {
    const viewContainer = document.getElementById('search-view');
    const savedScroll = viewContainer ? viewContainer.scrollTop : 0;
    const res = document.getElementById('search-results');
    const h = SGE.helpers;
    const query = q.toUpperCase().trim();

    // Show all collaborators when no query, or filtered results when there is one
    const matches = !query
      ? SGE.state.colaboradores
      : SGE.state.colaboradores.filter(c =>
        (c.nome && c.nome.toUpperCase().includes(query)) ||
        (c.id && c.id.toUpperCase().includes(query)) ||
        (c.cr && c.cr.toUpperCase().includes(query)) ||
        (c.equipamento && c.equipamento.toUpperCase().includes(query)) ||
        (c.supervisor && c.supervisor.toUpperCase().includes(query))
      );

    if (matches.length === 0) {
      res.innerHTML = `
        <div class="search-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <p style="color:var(--text-3);font-size:13px">Nenhum resultado para "${q}"</p>
        </div>`;
      return;
    }

    res.innerHTML = matches.map(c => {
      const badgeClass = h.regimeBadgeClass(c.regime);
      return `
        <div class="search-card" data-id="${c.id}">
          <div class="search-card-header">
            <div class="search-card-name" style="font-weight: 600; font-size: 13px; color: var(--text-1);">${c.nome}</div>
          </div>
          <div class="card-badges" style="margin-top: 4px; margin-bottom: 6px;">
            <span class="badge" style="${SGE.CONFIG.getFuncaoBadgeStyle(c.funcao)}">${c.funcao}</span>
            <span class="badge ${badgeClass}">${c.regime}</span>
          </div>
          <div class="search-card-sup" style="margin-bottom: 6px;">${c.supervisor || '—'}</div>
          <div class="search-card-id" style="font-size: 11px; color: var(--text-3); border-top: 1px solid var(--border-color); padding-top: 6px; margin-top: auto;">
            MAT: <strong style="color: var(--text-2);">${c.matricula_gps || 'S/ MAT'}</strong>
            ${c.cr ? `<span style="margin-left:8px;">CR: <strong style="color: var(--text-2);">${c.cr}</strong></span>` : ''}
          </div>
        </div>`;
    }).join('');

    res.querySelectorAll('.search-card').forEach(card => {
      card.addEventListener('click', () => {
        const col = SGE.state.colaboradores.find(c => c.id === card.dataset.id);
        if (col) SGE.drawer.open(col);
      });
    });

    if (viewContainer) viewContainer.scrollTop = savedScroll;
  }
};
