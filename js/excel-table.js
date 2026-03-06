'use strict';

/**
 * SGE — Excel Table Professional
 * Tabela estilo planilha com: filtros avançados por coluna, seleção múltipla,
 * edição inline, edição em massa, paginação, ordenação e export.
 */
window.SGE = window.SGE || {};

SGE.excelTable = {
    // Estado interno
    _state: {
        page: 1,
        pageSize: 50,
        sortCol: 'nome',
        sortAsc: true,
        colFilters: {},     // { key: valor }
        selected: new Set(), // IDs selecionados
        editingId: null,
        showFilters: true,
    },

    // Colunas definidas
    _columns: [
        { key: '__checkbox', label: '', type: 'checkbox', width: 38, filterable: false, editable: false, sortable: false },
        { key: 'matricula_gps', label: 'Matrícula', type: 'text', filterable: true, editable: false, sortable: true },
        { key: 'nome', label: 'Nome', type: 'text', filterable: true, editable: true, sortable: true },
        { key: 'categoria', label: 'Categoria', type: 'select', filterable: true, editable: true, sortable: true, optionsKey: 'categorias' },
        { key: 'funcao', label: 'Função', type: 'select', filterable: true, editable: true, sortable: true, optionsKey: 'funcoes' },
        { key: 'regime', label: 'Regime', type: 'select', filterable: true, editable: true, sortable: true, optionsKey: 'regimes' },
        { key: 'supervisor', label: 'Supervisor', type: 'select', filterable: true, editable: true, sortable: true, optionsKey: 'supervisores' },
        { key: 'status', label: 'Status', type: 'select', filterable: true, editable: true, sortable: true, optionsKey: 'statuses' },
        { key: 'alocacao', label: 'Alocação', type: 'text', filterable: true, editable: false, sortable: true },
        { key: '__actions', label: '', type: 'actions', width: 60, filterable: false, editable: false, sortable: false },
    ],

    _getOptions(key) {
        const cfg = SGE.CONFIG;
        if (key === 'categorias') return ['OPERACIONAL', 'GESTAO'];
        if (key === 'funcoes') return cfg.funcoes || [];
        if (key === 'regimes') return cfg.regimes || [];
        if (key === 'statuses') return cfg.statuses || [];
        if (key === 'supervisores') return (SGE.state.supervisores || []).filter(s => s.ativo).map(s => s.nome);
        return [];
    },

    _getData() {
        const h = SGE.helpers;
        const s = this._state;

        let rows = h.filtrarColaboradores().map(c => ({
            ...c,
            alocacao: (c.setor_id && c.setor && c.setor !== 'SEM SETOR')
                ? c.setor
                : (c.equipamento || '—')
        }));

        // Filtros por coluna
        for (const [key, val] of Object.entries(s.colFilters)) {
            if (!val || val === '') continue;
            const lower = val.toLowerCase();
            rows = rows.filter(r => {
                const cell = (r[key] || '').toString().toLowerCase();
                return cell.includes(lower);
            });
        }

        // Ordenação
        rows.sort((a, b) => {
            const aVal = (a[s.sortCol] || '').toString().toUpperCase();
            const bVal = (b[s.sortCol] || '').toString().toUpperCase();
            return s.sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });

        return rows;
    },

    render() {
        const container = document.getElementById('tabela-content');
        if (!container) return;

        const s = this._state;
        const allData = this._getData();
        const total = allData.length;
        const totalPages = Math.max(1, Math.ceil(total / s.pageSize));
        if (s.page > totalPages) s.page = totalPages;

        const start = (s.page - 1) * s.pageSize;
        const pageData = allData.slice(start, start + s.pageSize);

        const selectedCount = s.selected.size;
        const allPageSelected = pageData.length > 0 && pageData.every(r => s.selected.has(r.id));
        const somePageSelected = pageData.some(r => s.selected.has(r.id));

        const activeFilters = Object.values(s.colFilters).filter(v => v && v !== '').length;

        container.innerHTML = `
            <div class="excel-wrap" id="excel-wrap">

                <!-- TOOLBAR -->
                <div class="excel-toolbar">
                    <div class="excel-toolbar-section">
                        <button class="excel-btn ${s.showFilters ? 'active' : ''}" id="et-toggle-filters" title="Mostrar/Ocultar Filtros de Coluna">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                            <span>Filtros</span>
                            ${activeFilters > 0 ? `<span style="background:var(--accent);color:#fff;border-radius:8px;padding:0 6px;font-size:10px;font-weight:700">${activeFilters}</span>` : ''}
                        </button>
                        <button class="excel-btn ${activeFilters > 0 ? 'has-value' : ''}" id="et-clear-filters" title="Limpar todos os filtros de coluna">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            <span>Limpar</span>
                        </button>
                    </div>
                    <div class="excel-toolbar-divider"></div>
                    <div class="excel-toolbar-section">
                        <button class="excel-btn" id="et-select-all-vis" title="Selecionar todos visíveis">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                            <span>Sel. Todos</span>
                        </button>
                        <button class="excel-btn" id="et-deselect-all" title="Desmarcar todos">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                            <span>Desmarcar</span>
                        </button>
                    </div>
                    <div class="excel-toolbar-divider"></div>
                    <div class="excel-toolbar-section">
                        <button class="excel-btn" id="et-export-xlsx" title="Exportar Excel">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                            <span>Excel</span>
                        </button>
                        <button class="excel-btn" id="et-export-csv" title="Exportar CSV">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            <span>CSV</span>
                        </button>
                    </div>
                    <div style="flex:1"></div>
                    <div class="excel-toolbar-section" style="gap:6px; font-size:12px; color:var(--text-3)">
                        <span>Linhas por pág:</span>
                        <select class="page-size-select" id="et-page-size">
                            ${[25, 50, 100, 250, 500].map(n => `<option value="${n}" ${s.pageSize === n ? 'selected' : ''}>${n}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <!-- STATUS BAR -->
                <div class="excel-status-bar">
                    <span class="status-chip">Total: <strong>${total}</strong></span>
                    <span class="status-chip">Página: <strong>${s.page}/${totalPages}</strong></span>
                    ${selectedCount > 0 ? `<span class="status-chip" style="color:var(--accent)">Selecionados: <strong>${selectedCount}</strong></span>` : ''}
                    ${activeFilters > 0 ? `<span class="status-chip" style="color:var(--orange)">Filtros ativos: <strong>${activeFilters}</strong></span>` : ''}
                </div>

                <!-- MASS EDIT BAR -->
                <div class="mass-edit-bar ${selectedCount > 0 ? 'visible' : ''}" id="mass-edit-bar">
                    <span class="mass-count">${selectedCount} selecionado(s)</span>
                    <button class="mass-edit-btn" id="mass-btn-letra" title="Alterar Regime/Letra">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                        <span>Alterar Regime</span>
                    </button>
                    <button class="mass-edit-btn" id="mass-btn-supervisor" title="Alterar Supervisor">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                        <span>Supervisor</span>
                    </button>
                    <button class="mass-edit-btn" id="mass-btn-status" title="Alterar Status">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <span>Status</span>
                    </button>
                    <button class="mass-edit-btn" id="mass-btn-funcao" title="Alterar Função">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                        <span>Função</span>
                    </button>
                    <button class="mass-edit-btn" id="mass-btn-all" title="Edição completa em massa">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        <span>Editar Campos</span>
                    </button>
                    <button class="mass-edit-btn mass-cancel-btn" id="mass-btn-cancel">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        <span>Cancelar</span>
                    </button>
                </div>

                <!-- TABLE CONTAINER -->
                <div class="excel-table-container" id="et-container">
                    <table class="excel-table" id="et-table">
                        <thead>
                            <tr>
                                ${this._columns.map(col => this._renderTH(col, allPageSelected, somePageSelected)).join('')}
                            </tr>
                        </thead>
                        <tbody id="et-tbody">
                            ${pageData.length === 0
                                ? `<tr><td colspan="${this._columns.length}" style="padding:0">
                                    <div class="excel-empty">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                                        <h3>Nenhum resultado</h3>
                                        <p>Ajuste os filtros para encontrar colaboradores.</p>
                                    </div>
                                   </td></tr>`
                                : pageData.map(row => this._renderRow(row)).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- PAGINATION -->
                <div class="excel-pagination">
                    <span class="page-info">Exibindo ${Math.min(start + 1, total)}–${Math.min(start + pageData.length, total)} de ${total} registros</span>
                    <div class="page-controls">
                        ${this._renderPagination(s.page, totalPages)}
                    </div>
                </div>
            </div>
        `;

        this._bindEvents();
    },

    _renderTH(col, allSelected, someSelected) {
        const s = this._state;
        if (col.key === '__checkbox') {
            const indeterminate = !allSelected && someSelected;
            return `<th class="col-checkbox">
                <div style="display:flex;justify-content:center;align-items:center;height:100%;padding:8px 0">
                    <span class="excel-checkbox ${allSelected ? 'checked' : ''} ${indeterminate ? 'indeterminate' : ''}" id="et-select-all-cb" style="cursor:pointer"></span>
                </div>
            </th>`;
        }
        if (col.key === '__actions') {
            return `<th class="col-actions"><div class="th-inner"><div class="th-header" style="cursor:default;justify-content:center"><span class="th-label">Ações</span></div></div></th>`;
        }

        const isFiltered = s.colFilters[col.key] && s.colFilters[col.key] !== '';
        const isSorted = s.sortCol === col.key;

        return `
        <th class="${isSorted ? 'sorted' : ''} ${isFiltered ? 'filter-active' : ''}">
            <div class="th-inner">
                <div class="th-header" data-sort="${col.sortable ? col.key : ''}">
                    <span class="th-label">${col.label}</span>
                    ${col.sortable ? `
                    <span class="th-sort">
                        ${isSorted && s.sortAsc
                            ? `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v10M3 8l5-5 5 5"/></svg>`
                            : isSorted && !s.sortAsc
                            ? `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v10M3 8l5 5 5-5"/></svg>`
                            : `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v12M5 5l3-3 3 3M5 11l3 3 3-3"/></svg>`
                        }
                    </span>` : ''}
                </div>
                ${col.filterable && s.showFilters ? `
                <div class="th-filter">
                    ${col.type === 'select'
                        ? `<select class="excel-filter-select" data-filter-col="${col.key}">
                            <option value="">Todos</option>
                            ${this._getOptions(col.optionsKey).map(o => `<option value="${o}" ${s.colFilters[col.key] === o ? 'selected' : ''}>${o}</option>`).join('')}
                           </select>`
                        : `<input class="excel-filter-input" type="text" placeholder="Filtrar..." data-filter-col="${col.key}" value="${s.colFilters[col.key] || ''}">`
                    }
                </div>` : ''}
            </div>
        </th>`;
    },

    _renderRow(row) {
        const h = SGE.helpers;
        const s = this._state;
        const isSelected = s.selected.has(row.id);
        const isEditing = s.editingId === row.id;

        const cells = this._columns.map(col => {
            if (col.key === '__checkbox') {
                return `<td class="td-checkbox">
                    <div style="display:flex;justify-content:center;align-items:center;padding:6px 0">
                        <span class="excel-checkbox ${isSelected ? 'checked' : ''}" data-sel="${row.id}" style="cursor:pointer"></span>
                    </div>
                </td>`;
            }
            if (col.key === '__actions') {
                return `<td class="td-actions">
                    <button class="row-action-btn" data-action="edit" data-id="${row.id}" title="Editar">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 1l4 4L5 15H1v-4z"/></svg>
                    </button>
                </td>`;
            }
            if (col.key === 'matricula_gps') {
                return `<td class="cell-id">${row.matricula_gps || '<span style="color:var(--red);font-size:10px">S/MAT</span>'}</td>`;
            }
            if (col.key === 'nome') {
                return `<td class="cell-name" data-open="${row.id}">${row.nome}</td>`;
            }
            if (col.key === 'categoria') {
                const isOp = row.categoria === 'OPERACIONAL';
                return `<td><span class="badge" style="background:${isOp ? '#e0f2fe' : '#fef3c7'};color:${isOp ? '#0369a1' : '#92400e'};border:1px solid ${isOp ? '#bae6fd' : '#fde68a'}">${isOp ? 'Operacional' : 'Gestão'}</span></td>`;
            }
            if (col.key === 'funcao') {
                return `<td><span class="badge" style="${SGE.CONFIG.getFuncaoBadgeStyle(row.funcao)}">${row.funcao || '—'}</span></td>`;
            }
            if (col.key === 'regime') {
                return `<td><span class="badge ${h.regimeBadgeClass(row.regime)}">${row.regime || '—'}</span></td>`;
            }
            if (col.key === 'status') {
                return `<td>${row.status || '—'}</td>`;
            }
            if (col.key === 'supervisor') {
                return `<td>${row.supervisor || '<span style="color:var(--text-3)">—</span>'}</td>`;
            }
            if (col.key === 'alocacao') {
                return `<td style="font-size:11px">${row.alocacao || '—'}</td>`;
            }
            return `<td>${row[col.key] || '—'}</td>`;
        }).join('');

        return `<tr data-id="${row.id}" class="${isSelected ? 'selected' : ''}">${cells}</tr>`;
    },

    _renderPagination(current, total) {
        if (total <= 1) return '';
        const pages = [];
        const delta = 2;
        const range = [];

        for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
            range.push(i);
        }

        const items = [1, ...range, total];
        const unique = [...new Set(items)].sort((a, b) => a - b);

        let html = `<button class="page-btn" id="et-prev" ${current === 1 ? 'disabled' : ''}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path d="M10 12l-4-4 4-4"/></svg>
        </button>`;

        let prev = null;
        for (const p of unique) {
            if (prev && p - prev > 1) {
                html += `<span style="padding:0 4px;color:var(--text-3);line-height:30px">…</span>`;
            }
            html += `<button class="page-btn ${p === current ? 'active' : ''}" data-page="${p}">${p}</button>`;
            prev = p;
        }

        html += `<button class="page-btn" id="et-next" ${current === total ? 'disabled' : ''}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path d="M6 4l4 4-4 4"/></svg>
        </button>`;

        return html;
    },

    _bindEvents() {
        const s = this._state;

        // Toggle filtros
        document.getElementById('et-toggle-filters')?.addEventListener('click', () => {
            s.showFilters = !s.showFilters;
            this.render();
        });

        // Clear filtros
        document.getElementById('et-clear-filters')?.addEventListener('click', () => {
            s.colFilters = {};
            s.page = 1;
            this.render();
        });

        // Filtros de coluna (texto - debounce)
        document.querySelectorAll('.excel-filter-input').forEach(input => {
            let timer;
            input.addEventListener('input', () => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    const col = input.dataset.filterCol;
                    if (input.value.trim() === '') {
                        delete s.colFilters[col];
                    } else {
                        s.colFilters[col] = input.value.trim();
                    }
                    s.page = 1;
                    this.render();
                }, 280);
            });
            // Prevenir sort ao clicar no filtro
            input.addEventListener('click', e => e.stopPropagation());
        });

        // Filtros de coluna (select)
        document.querySelectorAll('.excel-filter-select').forEach(sel => {
            sel.addEventListener('change', () => {
                const col = sel.dataset.filterCol;
                if (sel.value === '') {
                    delete s.colFilters[col];
                } else {
                    s.colFilters[col] = sel.value;
                }
                s.page = 1;
                this.render();
            });
            sel.addEventListener('click', e => e.stopPropagation());
        });

        // Sort
        document.querySelectorAll('.th-header[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const col = th.dataset.sort;
                if (!col) return;
                if (s.sortCol === col) s.sortAsc = !s.sortAsc;
                else { s.sortCol = col; s.sortAsc = true; }
                this.render();
            });
        });

        // Select all (cabeçalho)
        document.getElementById('et-select-all-cb')?.addEventListener('click', () => {
            const allData = this._getData();
            const pageData = allData.slice((s.page - 1) * s.pageSize, s.page * s.pageSize);
            const allSelected = pageData.every(r => s.selected.has(r.id));
            if (allSelected) {
                pageData.forEach(r => s.selected.delete(r.id));
            } else {
                pageData.forEach(r => s.selected.add(r.id));
            }
            this.render();
        });

        // Select individual
        document.querySelectorAll('.excel-checkbox[data-sel]').forEach(cb => {
            cb.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = cb.dataset.sel;
                if (s.selected.has(id)) s.selected.delete(id);
                else s.selected.add(id);
                this.render();
            });
        });

        // Select all visible
        document.getElementById('et-select-all-vis')?.addEventListener('click', () => {
            this._getData().forEach(r => s.selected.add(r.id));
            this.render();
        });

        // Deselect all
        document.getElementById('et-deselect-all')?.addEventListener('click', () => {
            s.selected.clear();
            this.render();
        });

        // Row click → open drawer
        document.querySelectorAll('.cell-name[data-open]').forEach(td => {
            td.addEventListener('click', () => {
                const col = SGE.state.colaboradores.find(c => c.id === td.dataset.open);
                if (col) SGE.drawer.open(col);
            });
        });

        // Row edit button
        document.querySelectorAll('.row-action-btn[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const col = SGE.state.colaboradores.find(c => c.id === btn.dataset.id);
                if (col) SGE.drawer.open(col);
            });
        });

        // Export XLSX
        document.getElementById('et-export-xlsx')?.addEventListener('click', () => {
            SGE.viz.exportData(this._getData(), 'tsv');
        });

        // Export CSV
        document.getElementById('et-export-csv')?.addEventListener('click', () => {
            SGE.viz.exportData(this._getData(), 'csv');
        });

        // Page size
        document.getElementById('et-page-size')?.addEventListener('change', (e) => {
            s.pageSize = parseInt(e.target.value);
            s.page = 1;
            this.render();
        });

        // Pagination buttons
        document.getElementById('et-prev')?.addEventListener('click', () => {
            if (s.page > 1) { s.page--; this.render(); }
        });
        document.getElementById('et-next')?.addEventListener('click', () => {
            const total = Math.ceil(this._getData().length / s.pageSize);
            if (s.page < total) { s.page++; this.render(); }
        });
        document.querySelectorAll('.page-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                s.page = parseInt(btn.dataset.page);
                this.render();
            });
        });

        // Mass edit - cancel
        document.getElementById('mass-btn-cancel')?.addEventListener('click', () => {
            s.selected.clear();
            this.render();
        });

        // Mass edit - Regime
        document.getElementById('mass-btn-letra')?.addEventListener('click', () => {
            this._openMassEditSingle('regime', 'Alterar Regime dos Selecionados', 'regimes');
        });

        // Mass edit - Supervisor
        document.getElementById('mass-btn-supervisor')?.addEventListener('click', () => {
            this._openMassEditSingle('supervisor', 'Alterar Supervisor dos Selecionados', 'supervisores');
        });

        // Mass edit - Status
        document.getElementById('mass-btn-status')?.addEventListener('click', () => {
            this._openMassEditSingle('status', 'Alterar Status dos Selecionados', 'statuses');
        });

        // Mass edit - Função
        document.getElementById('mass-btn-funcao')?.addEventListener('click', () => {
            this._openMassEditSingle('funcao', 'Alterar Função dos Selecionados', 'funcoes');
        });

        // Mass edit - All fields
        document.getElementById('mass-btn-all')?.addEventListener('click', () => {
            this._openMassEditFull();
        });
    },

    _openMassEditSingle(field, title, optionsKey) {
        const s = this._state;
        const count = s.selected.size;
        const options = this._getOptions(optionsKey);

        const body = document.createElement('div');
        body.innerHTML = `
            <p style="margin-bottom:12px;font-size:13px;color:var(--text-2)">
                Alterar <strong>${field}</strong> para <strong>${count}</strong> colaboradores selecionados.
            </p>
            <div class="form-field">
                <label>${field}</label>
                <select id="mass-single-val">
                    <option value="">-- Selecione --</option>
                    ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
                </select>
            </div>
        `;

        SGE.modal.open(title, body, [
            { label: 'Cancelar', action: () => SGE.modal.close() },
            {
                label: `Aplicar a ${count}`,
                class: 'btn-confirm',
                action: async () => {
                    const val = document.getElementById('mass-single-val').value;
                    if (!val) return SGE.helpers.toast('Selecione um valor', 'error');
                    await this._applyMassEdit({ [field]: val });
                    SGE.modal.close();
                }
            }
        ]);
    },

    _openMassEditFull() {
        const s = this._state;
        const count = s.selected.size;
        const regimes = this._getOptions('regimes');
        const supervisores = this._getOptions('supervisores');
        const statuses = this._getOptions('statuses');
        const funcoes = this._getOptions('funcoes');

        const body = document.createElement('div');
        body.innerHTML = `
            <p style="margin-bottom:16px;font-size:13px;color:var(--text-2)">
                Editar campos de <strong>${count}</strong> colaboradores selecionados.<br>
                <small style="color:var(--text-3)">Marque apenas os campos que deseja alterar.</small>
            </p>
            <div class="mass-edit-modal">
                ${this._massFieldHtml('regime', 'Regime', 'select', regimes)}
                ${this._massFieldHtml('supervisor', 'Supervisor', 'select', supervisores)}
                ${this._massFieldHtml('status', 'Status', 'select', statuses)}
                ${this._massFieldHtml('funcao', 'Função', 'select', funcoes)}
                ${this._massFieldHtml('categoria', 'Categoria', 'select', ['OPERACIONAL', 'GESTAO'])}
            </div>
        `;

        SGE.modal.open(`Edição em Massa — ${count} Colaboradores`, body, [
            { label: 'Cancelar', action: () => SGE.modal.close() },
            {
                label: `Salvar Alterações`,
                class: 'btn-confirm',
                action: async () => {
                    const changes = {};
                    body.querySelectorAll('.mass-field-toggle:checked').forEach(cb => {
                        const field = cb.dataset.field;
                        const input = body.querySelector(`[data-mass-input="${field}"]`);
                        if (input && input.value) changes[field] = input.value;
                    });
                    if (Object.keys(changes).length === 0) {
                        return SGE.helpers.toast('Marque ao menos um campo para alterar', 'warn');
                    }
                    await this._applyMassEdit(changes);
                    SGE.modal.close();
                }
            }
        ]);

        // Toggle de campos
        body.querySelectorAll('.mass-field-toggle').forEach(cb => {
            const field = cb.dataset.field;
            const input = body.querySelector(`[data-mass-input="${field}"]`);
            if (input) {
                input.disabled = !cb.checked;
                cb.addEventListener('change', () => { input.disabled = !cb.checked; });
            }
        });
    },

    _massFieldHtml(field, label, type, options) {
        const selectHtml = `<select data-mass-input="${field}" disabled>
            <option value="">-- Selecione --</option>
            ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
        </select>`;

        return `
        <div class="mass-field-item">
            <div class="mass-field-checkbox-row">
                <input type="checkbox" class="mass-field-toggle" data-field="${field}" id="mft-${field}">
                <label for="mft-${field}">${label}</label>
            </div>
            ${selectHtml}
        </div>`;
    },

    async _applyMassEdit(changes) {
        const s = this._state;
        const ids = [...s.selected];
        const h = SGE.helpers;

        if (ids.length === 0) return;

        try {
            let successCount = 0;
            for (const id of ids) {
                const colab = SGE.state.colaboradores.find(c => c.id === id);
                if (!colab) continue;

                Object.assign(colab, changes);
                await SGE.api.syncEditColaborador(colab);
                successCount++;
            }

            h.toast(`${successCount} colaboradores atualizados!`, 'success');
            s.selected.clear();

            // Log em histórico se disponível
            if (SGE.history && SGE.history.logMassEdit) {
                SGE.history.logMassEdit(ids, changes);
            }

            // Refresh views
            SGE.navigation._refreshViews();

        } catch (err) {
            console.error('[SGE MassEdit] Erro:', err);
            h.toast('Erro ao atualizar: ' + (err.message || 'Falha'), 'error');
        }
    }
};
