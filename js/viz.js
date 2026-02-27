'use strict';

/**
 * SGE — Visualization View
 * Table and grouped views for collaborator data
 */
window.SGE = window.SGE || {};

SGE.viz = {
  render() {
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

    // Initialize filters state if not present
    v.filters = v.filters || {};

    let cols = h.filtrarColaboradores();

    // Apply Smart Table Filters
    if (Object.keys(v.filters).length > 0) {
      cols = cols.filter(c => {
        for (const key in v.filters) {
          if (v.filters[key] && c[key] !== v.filters[key]) return false;
        }
        return true;
      });
    }

    // Sort
    cols.sort((a, b) => {
      const aVal = (a[v.sortCol] || '').toString().toUpperCase();
      const bVal = (b[v.sortCol] || '').toString().toUpperCase();
      return v.sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    const columns = [
      { key: 'id', label: 'ID', filterable: false },
      { key: 'nome', label: 'Nome', filterable: false },
      { key: 'funcao', label: 'Função', filterable: true, options: SGE.CONFIG.funcoes },
      { key: 'regime', label: 'Regime', filterable: true, options: SGE.CONFIG.regimes },
      { key: 'supervisor', label: 'Supervisor', filterable: true, options: SGE.state.supervisores.map(s => s.nome) },
      { key: 'status', label: 'Status', filterable: true, options: SGE.CONFIG.statuses },
      { key: 'equipamento', label: 'Equipamento', filterable: true, options: Object.keys(SGE.CONFIG.equipTipos) },
    ];

    // Salvar estado de scroll para não pular a tela no refresh
    const viewContainer = document.getElementById('tabela-view');
    const savedScroll = viewContainer ? viewContainer.scrollTop : 0;

    content.innerHTML = `
      <div class="viz-table-toolbar" style="display:flex; justify-content:flex-end; padding:8px 0; gap:8px; position:relative;">
        <div class="export-dropdown-container" style="position:relative;">
          <button id="export-main-btn" style="padding:7px 14px; background:var(--accent); border:none; border-radius:6px; cursor:pointer; color:#fff; font-size:12px; font-weight:600; display:flex; align-items:center; gap:6px; box-shadow:0 2px 4px rgba(0,0,0,0.1); transition:all .2s;">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 1v10M4 7l4 4 4-4"/><path d="M1 12v2h14v-2"/></svg>
            Exportar Dados
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="margin-left:4px;"><path d="M4 6l4 4 4-4"/></svg>
          </button>
          
          <div id="export-menu" style="display:none; position:absolute; top:calc(100% + 4px); right:0; background:var(--bg-1); border:1px solid var(--border); border-radius:8px; box-shadow:0 4px 16px rgba(0,0,0,0.15); min-width:160px; z-index:100; overflow:hidden;">
            <div class="export-tabela-btn" data-format="csv" style="padding:10px 14px; cursor:pointer; font-size:12px; color:var(--text-1); display:flex; align-items:center; gap:8px; transition:background .15s; border-bottom:1px solid var(--border);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Documento CSV
            </div>
            <div class="export-tabela-btn" data-format="tsv" style="padding:10px 14px; cursor:pointer; font-size:12px; color:var(--text-1); display:flex; align-items:center; gap:8px; transition:background .15s;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#217346" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M8 13h2v4H8z"></path><path d="M14 13h2v4h-2z"></path></svg>
              Planilha Excel (XLSX)
            </div>
          </div>
        </div>
      </div>
      <div class="viz-table-wrap">
        <table class="viz-table">
          <thead>
            <tr>
              ${columns.map(c => `
                <th class="${v.sortCol === c.key ? 'sorted' : ''}">
                  <div style="display:flex; flex-direction:column; gap:4px">
                    <div class="th-sort-clicker" data-col="${c.key}" style="cursor:pointer; display:flex; align-items:center; justify-content:space-between">
                      <span>${c.label}</span>
                      <span class="sort-arrow">${v.sortCol === c.key ? (v.sortAsc ? '↑' : '↓') : '↕'}</span>
                    </div>
                    ${c.filterable ? `
                      <select class="table-filter-sel" data-col="${c.key}" style="width:100%; max-width:120px; font-size:10px; padding:2px; background:var(--bg-1); border:1px solid var(--border); border-radius:3px; color:var(--text-1); cursor:pointer">
                        <option value="">Tudo</option>
                        ${c.options.map(opt => `<option value="${opt}" ${v.filters[c.key] === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                      </select>
                    ` : ''}
                  </div>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${cols.map(c => `
              <tr data-id="${c.id}" style="cursor:pointer">
                <td class="id-cell">${c.matricula_gps || 'S/ MAT'}</td>
                <td class="name-cell">
                  <div>${c.nome}</div>
                </td>
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
    content.querySelectorAll('.th-sort-clicker').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.col;
        if (v.sortCol === col) v.sortAsc = !v.sortAsc;
        else { v.sortCol = col; v.sortAsc = true; }
        SGE.viz.render();
      });
    });

    // Filter change
    content.querySelectorAll('.table-filter-sel').forEach(sel => {
      sel.addEventListener('change', () => {
        const col = sel.dataset.col;
        const val = sel.value;
        if (val === "") {
          delete v.filters[col];
        } else {
          v.filters[col] = val;
        }
        SGE.viz.render();
      });
      // Prevent sorting when clicking on the select box
      sel.addEventListener('click', e => e.stopPropagation());
    });

    // Row click
    content.querySelectorAll('.viz-table tbody tr').forEach(tr => {
      tr.addEventListener('click', () => {
        const col = SGE.state.colaboradores.find(c => c.id === tr.dataset.id);
        if (col) SGE.drawer.open(col);
      });
    });

    // Dropdown toggle
    const exportBtn = content.querySelector('#export-main-btn');
    const exportMenu = content.querySelector('#export-menu');
    if (exportBtn && exportMenu) {
      exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exportMenu.style.display = exportMenu.style.display === 'none' ? 'block' : 'none';
      });

      // Close menu on click outside
      document.addEventListener('click', () => {
        if (exportMenu.style.display === 'block') exportMenu.style.display = 'none';
      });

      exportMenu.addEventListener('click', (e) => e.stopPropagation());
    }

    // Exports actions
    content.querySelectorAll('.export-tabela-btn').forEach(btn => {
      // Hover effects dynamically
      btn.addEventListener('mouseenter', () => btn.style.background = 'var(--bg-3)');
      btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');

      btn.addEventListener('click', () => {
        if (exportMenu) exportMenu.style.display = 'none';
        SGE.viz.exportData(cols, btn.dataset.format);
      });
    });

    if (viewContainer) viewContainer.scrollTop = savedScroll;
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

    // Salvar estado de scroll e expansões
    const viewContainer = document.getElementById('grupo-view');
    const savedScroll = viewContainer ? viewContainer.scrollTop : 0;
    const expandedGroups = new Set();
    content.querySelectorAll('.viz-group-header.expanded .group-label').forEach(el => {
      expandedGroups.add(el.textContent.trim());
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
            <div class="card-id">${c.matricula_gps || 'S/ MAT'}</div>
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

      if (expandedGroups.has(groupName)) {
        header.classList.add('expanded');
        body.classList.add('open');
      }

      section.appendChild(header);
      section.appendChild(body);
      container.appendChild(section);
    });

    content.innerHTML = '';
    content.appendChild(container);

    if (viewContainer) viewContainer.scrollTop = savedScroll;
  },

  exportData(data, format) {
    if (!data || data.length === 0) return SGE.helpers.toast('Nenhum dado para exportar', 'error');

    // Create export payload matching the table columns
    const exportData = data.map(c => ({
      ID: c.matricula_gps || 'S/ MAT',
      CR: c.cr || '',
      Nome: c.nome,
      Função: c.funcao,
      Regime: c.regime,
      Supervisor: c.supervisor || '',
      Status: c.status,
      Equipamento: c.equipamento || ''
    }));

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `SGE_DB_Completo_${dateStr}.${format === 'tsv' ? 'xlsx' : format}`;

    if (format === 'tsv') {
      try {
        const ws = window.XLSX.utils.json_to_sheet(exportData);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Gestão Efetivo");
        window.XLSX.writeFile(wb, filename);
        return SGE.helpers.toast(`Download XLSX concluído`, 'success');
      } catch (err) {
        console.error('Erro ao exportar XLSX:', err);
        return SGE.helpers.toast('Erro ao gerar arquivo Excel. Tente CSV.', 'error');
      }
    }

    // Fallback for CSV
    let contentStr = '';
    let mimeType = 'text/csv;charset=utf-8;';
    const separator = ',';
    const headers = Object.keys(exportData[0]).join(separator);
    const rows = exportData.map(obj =>
      Object.values(obj).map(v => {
        let val = String(v).replace(/"/g, '""'); // escape quotes
        if (val.includes(separator) || val.includes('\n') || val.includes('"')) val = `"${val}"`;
        return val;
      }).join(separator)
    ).join('\n');

    // Prefix BOM for excel UTF-8 compatibility on CSV
    contentStr = '\ufeff' + headers + '\n' + rows;

    const blob = new Blob([contentStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    SGE.helpers.toast(`Download CSV concluído`, 'success');
  }
};
