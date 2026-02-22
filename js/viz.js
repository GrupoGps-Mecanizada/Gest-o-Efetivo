'use strict';

/**
 * SGE — Visualization View
 * Table and grouped views for collaborator data
 */
window.SGE = window.SGE || {};

SGE.viz = {
  render() {
    SGE.viz.renderToolbar();
    if (SGE.state.viz.mode === 'table') {
      SGE.viz.renderTable();
    } else {
      SGE.viz.renderGroups();
    }
  },

  renderGroupToolbar() {
    const toolbar = document.getElementById('grupo-toolbar');
    if (!toolbar) return;
    const v = SGE.state.viz;

    toolbar.innerHTML = `
      <span class="filter-label" style="margin-right:8px; font-weight:600">Agrupar por:</span>
      <button class="viz-btn ${v.groupBy === 'regime' ? 'active' : ''}" data-group="regime">Regime</button>
      <button class="viz-btn ${v.groupBy === 'funcao' ? 'active' : ''}" data-group="funcao">Função</button>
      <button class="viz-btn ${v.groupBy === 'status' ? 'active' : ''}" data-group="status">Status</button>
      <button class="viz-btn ${v.groupBy === 'supervisor' ? 'active' : ''}" data-group="supervisor">Supervisor</button>
      <div style="flex:1"></div>
      <button class="viz-expand-all" id="viz-expand-all">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:11px;height:11px"><path d="M5 3l6 5-6 5"/></svg>
        Expandir Todos
      </button>
    `;

    // Group toggle
    toolbar.querySelectorAll('.viz-btn[data-group]').forEach(btn => {
      btn.addEventListener('click', () => {
        SGE.state.viz.groupBy = btn.dataset.group;
        SGE.viz.renderGroups();
      });
    });

    // Expand all
    const expandAllBtn = document.getElementById('viz-expand-all');
    if (expandAllBtn) {
      expandAllBtn.addEventListener('click', () => {
        const content = document.getElementById('grupo-content');
        const headers = content.querySelectorAll('.viz-group-header');
        const allExpanded = [...headers].every(h => h.classList.contains('expanded'));

        headers.forEach(h => {
          const body = h.nextElementSibling;
          if (allExpanded) {
            h.classList.remove('expanded');
            body.classList.remove('open');
          } else {
            h.classList.add('expanded');
            body.classList.add('open');
          }
        });

        expandAllBtn.innerHTML = allExpanded
          ? '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:11px;height:11px"><path d="M5 3l6 5-6 5"/></svg> Expandir Todos'
          : '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:11px;height:11px"><path d="M11 3l-6 5 6 5"/></svg> Recolher Todos';
      });
    }
  },

  renderTable() {
    const content = document.getElementById('tabela-content');
    if (!content) return;
    const v = SGE.state.viz;
    const h = SGE.helpers;

    let cols = h.filtrarColaboradores();

    // Sort
    cols.sort((a, b) => {
      const aVal = (a[v.sortCol] || '').toString().toUpperCase();
      const bVal = (b[v.sortCol] || '').toString().toUpperCase();
      return v.sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'nome', label: 'Nome' },
      { key: 'funcao', label: 'Função' },
      { key: 'regime', label: 'Regime' },
      { key: 'supervisor', label: 'Supervisor' },
      { key: 'status', label: 'Status' },
      { key: 'equipamento', label: 'Equipamento' },
    ];

    content.innerHTML = `
      <div class="viz-table-wrap">
        <table class="viz-table">
          <thead>
            <tr>
              ${columns.map(c => `
                <th class="${v.sortCol === c.key ? 'sorted' : ''}" data-col="${c.key}">
                  ${c.label}
                  <span class="sort-arrow">${v.sortCol === c.key ? (v.sortAsc ? '↑' : '↓') : '↕'}</span>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${cols.map(c => `
              <tr data-id="${c.id}" style="cursor:pointer">
                <td class="id-cell">${c.id}</td>
                <td class="name-cell">${c.nome}</td>
                <td><span class="badge ${c.funcao === 'MOT' ? 'badge-MOT' : 'badge-OP'}">${c.funcao}</span></td>
                <td><span class="badge ${h.regimeBadgeClass(c.regime)}">${c.regime}</span></td>
                <td>${c.supervisor || '—'}</td>
                <td>${c.status}</td>
                <td style="font-size:11px">${c.equipamento || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Sort click
    content.querySelectorAll('.viz-table th').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.col;
        if (v.sortCol === col) v.sortAsc = !v.sortAsc;
        else { v.sortCol = col; v.sortAsc = true; }
        SGE.viz.render();
      });
    });

    // Row click
    content.querySelectorAll('.viz-table tbody tr').forEach(tr => {
      tr.addEventListener('click', () => {
        const col = SGE.state.colaboradores.find(c => c.id === tr.dataset.id);
        if (col) SGE.drawer.open(col);
      });
    });
  },

  renderGroups() {
    SGE.viz.renderGroupToolbar();
    const content = document.getElementById('grupo-content');
    if (!content) return;
    const h = SGE.helpers;
    const v = SGE.state.viz;

    const cols = h.filtrarColaboradores();
    const groups = {};
    cols.forEach(c => {
      const key = c[v.groupBy] || 'Sem Informação';
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });

    const container = document.createElement('div');
    container.className = 'viz-groups';

    Object.keys(groups).sort().forEach(groupName => {
      const members = groups[groupName];
      const section = document.createElement('div');
      section.className = 'viz-group';

      const preview = members.slice(0, 3).map(c => c.nome).join(', ') + (members.length > 3 ? '...' : '');

      const header = document.createElement('div');
      header.className = 'viz-group-header';
      header.innerHTML = `
        <svg class="chevron-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l6 5-6 5"/></svg>
        <span class="group-label">${groupName}</span>
        <span class="group-preview">${preview}</span>
        <span class="group-count">${members.length}</span>
      `;

      const body = document.createElement('div');
      body.className = 'viz-group-body';
      body.innerHTML = members.map(c => `
        <div class="card" style="cursor:pointer" data-id="${c.id}">
          <div class="card-top">
            <div class="card-id">${c.id}</div>
            <div class="card-name">${c.nome}</div>
          </div>
          <div class="card-badges">
            <span class="badge ${c.funcao === 'MOT' ? 'badge-MOT' : 'badge-OP'}">${c.funcao}</span>
            <span class="badge ${h.regimeBadgeClass(c.regime)}">${c.regime}</span>
          </div>
        </div>
      `).join('');

      header.addEventListener('click', () => {
        header.classList.toggle('expanded');
        body.classList.toggle('open');
      });

      body.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
          const col = SGE.state.colaboradores.find(c => c.id === card.dataset.id);
          if (col) SGE.drawer.open(col);
        });
      });

      section.appendChild(header);
      section.appendChild(body);
      container.appendChild(section);
    });

    content.innerHTML = '';
    content.appendChild(container);
  }
};
