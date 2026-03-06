'use strict';

/**
 * SGE — Excel Table Pro (v3)
 * Filtros flutuantes por coluna (sort + multi-select), edição por ícone de lápis,
 * modal de treinamentos, seleção múltipla, edição em massa, export, fullscreen.
 */
window.SGE = window.SGE || {};

SGE.excelTable = {

    /* ─── Estado ─────────────────────────────────────────────────── */
    _state: {
        page: 1,
        pageSize: 500,
        sortCol: 'nome',
        sortAsc: true,
        colFilters: {},      // { colKey: string | string[] }
        selected: new Set(),
        editingCell: null,
        highlightText: '',
        hiddenCols: new Set(['matricula_usiminas', 'telefone', 'treinamentos', 'advertencias']),
        showColPicker: false,
        expanded: false,
        filterPanel: null,   // { col, x, y } quando aberto
    },

    // Referências para listeners de documento (cleanup)
    _docClickCB: null,
    _fpClickCB: null,

    /* ─── Colunas ─────────────────────────────────────────────────── */
    _columns: [
        { key: '__checkbox',        label: '',             type: 'checkbox', filterable: false, editable: false, sortable: false, alwaysVisible: true },
        { key: 'matricula_gps',     label: 'Matrícula',   type: 'text',     filterable: true,  editable: false, sortable: true  },
        { key: 'nome',              label: 'Nome',        type: 'text',     filterable: true,  editable: true,  sortable: true  },
        { key: 'categoria',         label: 'Categoria',   type: 'select',   filterable: true,  editable: true,  sortable: true,  optionsKey: 'categorias' },
        { key: 'funcao',            label: 'Função',      type: 'select',   filterable: true,  editable: true,  sortable: true,  optionsKey: 'funcoes' },
        { key: 'regime',            label: 'Regime',      type: 'select',   filterable: true,  editable: true,  sortable: true,  optionsKey: 'regimes' },
        { key: 'supervisor',        label: 'Supervisor',  type: 'select',   filterable: true,  editable: true,  sortable: true,  optionsKey: 'supervisores' },
        { key: 'status',            label: 'Status',      type: 'select',   filterable: true,  editable: true,  sortable: true,  optionsKey: 'statuses' },
        { key: 'alocacao',          label: 'Alocação',    type: 'text',     filterable: true,  editable: false, sortable: true  },
        { key: 'treinamentos',      label: 'Treinamentos',type: 'info',     filterable: false, editable: false, sortable: false },
        { key: 'advertencias',      label: 'Advertências',type: 'info',     filterable: false, editable: false, sortable: false },
        { key: 'matricula_usiminas',label: 'Mat. USI',    type: 'text',     filterable: true,  editable: false, sortable: true  },
        { key: 'telefone',          label: 'Telefone',    type: 'text',     filterable: true,  editable: false, sortable: false },
        { key: '__actions',         label: '',            type: 'actions',  filterable: false, editable: false, sortable: false, alwaysVisible: true },
    ],

    /* ─── Helpers básicos ─────────────────────────────────────────── */
    _getOptions(key) {
        const cfg = SGE.CONFIG;
        if (key === 'categorias')   return ['OPERACIONAL', 'GESTAO'];
        if (key === 'funcoes')      return cfg.funcoes || [];
        if (key === 'regimes')      return cfg.regimes || [];
        if (key === 'statuses')     return cfg.statuses || [];
        if (key === 'supervisores') return (SGE.state.supervisores || []).filter(s => s.ativo).map(s => s.nome);
        return [];
    },

    _visibleColumns() {
        return this._columns.filter(c => c.alwaysVisible || !this._state.hiddenCols.has(c.key));
    },

    _isFiltered(colKey) {
        const v = this._state.colFilters[colKey];
        if (!v) return false;
        if (Array.isArray(v)) return v.length > 0;
        return v !== '';
    },

    _activeFiltersCount() {
        return Object.keys(this._state.colFilters).filter(k => this._isFiltered(k)).length;
    },

    /* ─── Dados ───────────────────────────────────────────────────── */
    _getData() {
        const h = SGE.helpers;
        const s = this._state;

        let rows = h.filtrarColaboradores().map(c => ({
            ...c,
            alocacao: (c.setor_id && c.setor && c.setor !== 'SEM SETOR') ? c.setor : (c.equipamento || '—')
        }));

        // Filtros por coluna
        for (const [key, val] of Object.entries(s.colFilters)) {
            if (!val) continue;
            if (Array.isArray(val)) {
                if (val.length === 0) continue;
                rows = rows.filter(r => val.includes((r[key] || '').toString()));
            } else {
                if (val === '') continue;
                const lower = val.toLowerCase();
                rows = rows.filter(r => (r[key] || '').toString().toLowerCase().includes(lower));
            }
        }

        // Busca global
        if (s.highlightText && s.highlightText.trim()) {
            const ht = s.highlightText.toLowerCase();
            rows = rows.filter(r => Object.values(r).some(v => v && v.toString().toLowerCase().includes(ht)));
        }

        // Ordenação
        rows.sort((a, b) => {
            const aVal = (a[s.sortCol] || '').toString().toUpperCase();
            const bVal = (b[s.sortCol] || '').toString().toUpperCase();
            return s.sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });

        // Augmentar com contagens
        const advMap = {};
        (SGE.state.advertencias || []).forEach(a => { advMap[a.employee_id] = (advMap[a.employee_id] || 0) + 1; });
        const trMap = {};
        (SGE.state.colaboradorTreinamentos || []).forEach(t => { trMap[t.employee_id] = (trMap[t.employee_id] || 0) + 1; });

        return rows.map(r => ({ ...r, _tr_count: trMap[r.id] || 0, _adv_count: advMap[r.id] || 0 }));
    },

    _hl(text) {
        const s = this._state;
        if (!s.highlightText || !s.highlightText.trim() || !text) return text || '';
        const re = new RegExp(`(${s.highlightText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return String(text).replace(re, '<mark class="et-hl">$1</mark>');
    },

    /* ─── Focus save/restore (para search input) ─────────────────── */
    _saveSearchFocus() {
        const el = document.activeElement;
        if (el && el.id === 'et-highlight-input') return { pos: el.selectionStart || 0 };
        return null;
    },

    _restoreSearchFocus(saved) {
        if (!saved) return;
        requestAnimationFrame(() => {
            const el = document.getElementById('et-highlight-input');
            if (el) { el.focus(); try { el.setSelectionRange(saved.pos, saved.pos); } catch(e) {} }
        });
    },

    /* ─── Cleanup de listeners de documento ──────────────────────── */
    _cleanupDocListeners() {
        if (this._docClickCB) { document.removeEventListener('click', this._docClickCB); this._docClickCB = null; }
        if (this._fpClickCB)  { document.removeEventListener('click', this._fpClickCB);  this._fpClickCB = null; }
    },

    /* ─── Render principal ────────────────────────────────────────── */
    render() {
        const container = document.getElementById('tabela-content');
        if (!container) return;

        const focusSaved = this._saveSearchFocus();
        this._cleanupDocListeners();

        const s = this._state;
        const allData = this._getData();
        const total = allData.length;
        const totalPages = Math.max(1, Math.ceil(total / s.pageSize));
        if (s.page > totalPages) s.page = totalPages;

        const start    = (s.page - 1) * s.pageSize;
        const pageData = allData.slice(start, start + s.pageSize);
        const selCount = s.selected.size;
        const visCols  = this._visibleColumns();
        const actFilts = this._activeFiltersCount();

        const allSel  = pageData.length > 0 && pageData.every(r => s.selected.has(r.id));
        const someSel = pageData.some(r => s.selected.has(r.id));
        const ativosSel = [...s.selected].reduce((acc, id) => {
            const r = allData.find(x => x.id === id);
            return acc + (r && r.status === 'ATIVO' ? 1 : 0);
        }, 0);

        container.innerHTML = `
        <div class="excel-wrap${s.expanded ? ' et-expanded' : ''}" id="excel-wrap">

            <!-- TOOLBAR -->
            <div class="et-toolbar">
                <div class="excel-search-wrap et-toolbar-search">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" class="et-search-icon"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
                    <input type="text" id="et-highlight-input" class="et-search-input" placeholder="Buscar e destacar…" value="${s.highlightText}" autocomplete="off">
                    ${s.highlightText ? `<button id="et-clear-hl" class="et-search-clear">×</button>` : ''}
                </div>

                <span class="et-toolbar-sep"></span>

                <button class="excel-btn ${actFilts > 0 ? 'has-value' : ''}" id="et-clear-filters" title="Limpar todos os filtros de coluna">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                    <span>Filtros</span>
                    ${actFilts > 0 ? `<em class="et-badge">${actFilts}</em>` : ''}
                </button>

                <span class="et-toolbar-sep"></span>

                <!-- Colunas picker -->
                <div style="position:relative">
                    <button class="excel-btn ${s.showColPicker ? 'active' : ''}" id="et-col-picker" title="Escolher colunas visíveis">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>
                        <span>Colunas</span>
                    </button>
                    <div class="et-col-picker-panel ${s.showColPicker ? 'open' : ''}" id="et-col-picker-panel">
                        <div class="et-col-picker-title">Colunas Visíveis</div>
                        ${this._columns.filter(c => !c.alwaysVisible).map(c => `
                            <label class="et-col-picker-item">
                                <input type="checkbox" class="et-col-toggle" data-col="${c.key}" ${!s.hiddenCols.has(c.key) ? 'checked' : ''}>
                                <span>${c.label}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- Expand -->
                <button class="excel-btn ${s.expanded ? 'active' : ''}" id="et-expand" title="${s.expanded ? 'Recolher' : 'Expandir tela cheia'}">
                    ${s.expanded
                        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="21" y2="3"/><line x1="3" y1="21" x2="14" y2="10"/></svg>`
                        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`}
                    <span>${s.expanded ? 'Recolher' : 'Expandir'}</span>
                </button>

                <span style="flex:1"></span>

                ${selCount > 0 ? `
                <button class="excel-btn has-value" id="et-select-all-vis" title="Selecionar todos os resultados">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Todos (${total})</span>
                </button>
                <button class="excel-btn" id="et-deselect-all" title="Desmarcar tudo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <span class="et-toolbar-sep"></span>` : ''}

                <button class="excel-btn" id="et-export-xlsx" title="Exportar todos os filtrados">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span>Excel</span>
                </button>
                ${selCount > 0 ? `<button class="excel-btn" id="et-export-sel">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    <span>Sel. (${selCount})</span>
                </button>` : ''}

                <span class="et-toolbar-sep"></span>
                <select class="page-size-select" id="et-page-size" title="Linhas por página">
                    ${[50, 100, 200, 500, 1000].map(n => `<option value="${n}" ${s.pageSize === n ? 'selected' : ''}>${n}</option>`).join('')}
                </select>
            </div>

            <!-- STATUS BAR -->
            <div class="excel-status-bar">
                <span class="status-chip"><strong>${total}</strong> registro(s)</span>
                ${actFilts > 0 ? `<span class="status-chip" style="color:var(--orange)">· ${actFilts} filtro(s)</span>` : ''}
                ${s.highlightText ? `<span class="status-chip" style="color:var(--accent)">· Busca: <strong>"${s.highlightText}"</strong></span>` : ''}
                ${selCount > 0 ? `<span class="status-chip" style="color:var(--accent)">· <strong>${selCount}</strong> selecionado(s) · Ativos: <strong>${ativosSel}</strong></span>` : ''}
                <span style="flex:1"></span>
                <span class="status-chip" style="color:var(--text-3);font-size:10px">
                    ${start + 1}–${Math.min(start + pageData.length, total)} de ${total}
                    ${totalPages > 1 ? `· pág ${s.page}/${totalPages}` : ''}
                </span>
            </div>

            <!-- MASS EDIT BAR -->
            <div class="mass-edit-bar ${selCount > 0 ? 'visible' : ''}" id="mass-edit-bar">
                <span class="mass-count">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="20 6 9 17 4 12"/></svg>
                    ${selCount} selecionado(s)
                </span>
                <div class="mass-edit-btn-group">
                    <button class="mass-edit-btn" id="mass-btn-regime"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg><span>Regime</span></button>
                    <button class="mass-edit-btn" id="mass-btn-supervisor"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><span>Supervisor</span></button>
                    <button class="mass-edit-btn" id="mass-btn-status"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>Status</span></button>
                    <button class="mass-edit-btn" id="mass-btn-funcao"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg><span>Função</span></button>
                    <button class="mass-edit-btn" id="mass-btn-treinamento"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><span>Treinamento</span></button>
                    <button class="mass-edit-btn" id="mass-btn-all"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg><span>Editar Campos</span></button>
                </div>
                <button class="mass-edit-btn mass-cancel-btn" id="mass-btn-cancel" title="Cancelar seleção">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>

            <!-- TABLE -->
            <div class="excel-table-container" id="et-container">
                <table class="excel-table" id="et-table">
                    <thead>
                        <tr>${visCols.map((col, i) => this._renderTH(col, i, allSel, someSel)).join('')}</tr>
                    </thead>
                    <tbody>
                        ${pageData.length === 0
                            ? `<tr><td colspan="${visCols.length}" style="padding:0">
                                <div class="excel-empty">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                                    <h3>Nenhum resultado</h3>
                                    <p>Ajuste os filtros ou a busca.</p>
                                </div></td></tr>`
                            : pageData.map(row => this._renderRow(row)).join('')}
                    </tbody>
                </table>
            </div>

            <!-- PAGINATION -->
            <div class="excel-pagination">
                <span class="page-info">
                    ${total === 0 ? 'Nenhum registro' : `${start + 1}–${Math.min(start + pageData.length, total)} de <strong>${total}</strong>`}
                </span>
                <div class="page-controls">${this._renderPagination(s.page, totalPages)}</div>
            </div>

            <!-- FILTER PANEL (floating, posicionado por JS) -->
            ${s.filterPanel ? this._renderFilterPanel(allData) : ''}
        </div>`;

        this._bindEvents(pageData, allData);
        this._restoreSearchFocus(focusSaved);

        // Posicionar o filter panel se aberto
        if (s.filterPanel) this._positionFilterPanel();
    },

    /* ─── Render do cabeçalho ─────────────────────────────────────── */
    _renderTH(col, idx, allSel, someSel) {
        const s = this._state;

        if (col.key === '__checkbox') {
            const ind = !allSel && someSel;
            return `<th class="col-checkbox">
                <div style="display:flex;justify-content:center;align-items:center;height:100%;padding:8px 0">
                    <span class="excel-checkbox ${allSel ? 'checked' : ''} ${ind ? 'indeterminate' : ''}" id="et-select-all-cb"></span>
                </div>
            </th>`;
        }
        if (col.key === '__actions') {
            return `<th class="col-actions"><div class="th-inner"><div class="th-header" style="cursor:default;justify-content:center"><span class="th-label">Ações</span></div></div></th>`;
        }
        if (col.type === 'info') {
            return `<th><div class="th-inner"><div class="th-header" style="cursor:default"><span class="th-label">${col.label}</span></div></div></th>`;
        }

        const isFiltered = this._isFiltered(col.key);
        const isSorted   = s.sortCol === col.key;

        let sortIcon;
        if (isSorted && s.sortAsc)  sortIcon = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 3v10M3 8l5-5 5 5"/></svg>`;
        else if (isSorted)           sortIcon = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 3v10M3 8l5 5 5-5"/></svg>`;
        else                         sortIcon = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".4"><path d="M8 2v12M5 5l3-3 3 3M5 11l3 3 3-3"/></svg>`;

        return `
        <th class="${isSorted ? 'sorted' : ''} ${isFiltered ? 'filter-active' : ''}">
            <div class="th-inner">
                <div class="th-header" data-sort="${col.sortable ? col.key : ''}">
                    <span class="th-label">${col.label}</span>
                    ${col.sortable ? `<span class="th-sort">${sortIcon}</span>` : ''}
                    ${col.filterable ? `
                    <button class="th-filter-btn ${isFiltered ? 'active' : ''}" data-filter-open="${col.key}" title="Filtrar/Ordenar por ${col.label}">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="14 2 2 2 7 8.46 7 13 9 14 9 8.46 14 2"/></svg>
                    </button>` : ''}
                </div>
            </div>
        </th>`;
    },

    /* ─── Render de linha ─────────────────────────────────────────── */
    _renderRow(row) {
        const h = SGE.helpers;
        const s = this._state;
        const isSel  = s.selected.has(row.id);
        const isEdit = s.editingCell && s.editingCell.id === row.id;
        const hl     = t => this._hl(t);

        const cells = this._visibleColumns().map(col => {
            if (col.key === '__checkbox') {
                return `<td class="td-checkbox"><span class="excel-checkbox ${isSel ? 'checked' : ''}" data-sel="${row.id}"></span></td>`;
            }
            if (col.key === '__actions') {
                return `<td class="td-actions">
                    <button class="row-action-btn" data-action="open" data-id="${row.id}" title="Abrir detalhes">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 1l4 4L5 15H1v-4z"/></svg>
                    </button>
                </td>`;
            }
            if (col.key === 'treinamentos') {
                const cnt = row._tr_count || 0;
                return `<td class="td-count">
                    ${cnt > 0
                        ? `<button class="et-count-badge et-count-tr et-tr-open" data-colab-id="${row.id}" title="Ver treinamentos de ${row.nome}">${cnt} trein.</button>`
                        : `<button class="et-count-badge et-count-empty et-tr-open" data-colab-id="${row.id}" title="Adicionar treinamento">+ Add</button>`}
                </td>`;
            }
            if (col.key === 'advertencias') {
                const cnt = row._adv_count || 0;
                return `<td class="td-count">
                    ${cnt > 0
                        ? `<button class="et-count-badge et-count-adv et-adv-open" data-colab-id="${row.id}" title="Ver advertências">${cnt} advert.</button>`
                        : `<span class="td-empty-val">—</span>`}
                </td>`;
            }

            // Célula editável — mostra lápis ao passar mouse
            const isThisEdit = isEdit && s.editingCell.key === col.key;
            if (isThisEdit) return this._editCell(row, col);

            // Conteúdo normal com pencil icon
            if (col.key === 'matricula_gps') {
                const v = row.matricula_gps;
                return this._cellWrap(col, row, `${v ? hl(v) : '<span class="et-nomat">S/MAT</span>'}`, 'td-mono');
            }
            if (col.key === 'nome') {
                return `<td class="cell-name cell-with-edit" data-open="${row.id}" data-edit="${row.id}|${col.key}">
                    <div class="cell-content">
                        <span class="cell-val">${hl(row.nome)}</span>
                        ${col.editable ? `<button class="cell-edit-icon" data-edit-trigger="${row.id}|${col.key}" title="Editar nome"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11.5 2.5a2.121 2.121 0 1 1 3 3L5 15H2v-3z"/></svg></button>` : ''}
                    </div>
                </td>`;
            }
            if (col.key === 'matricula_usiminas') {
                return `<td class="td-mono">${hl(row.matricula_usiminas || '—')}</td>`;
            }
            if (col.key === 'telefone') {
                return `<td class="td-mono">${hl(row.telefone || '—')}</td>`;
            }
            if (col.key === 'categoria') {
                const isOp = row.categoria === 'OPERACIONAL';
                return this._cellWrap(col, row,
                    `<span class="et-badge-cat ${isOp ? 'et-cat-op' : 'et-cat-gestao'}">${isOp ? 'Operacional' : 'Gestão'}</span>`);
            }
            if (col.key === 'funcao') {
                const fKey = this._funcaoKey(row.funcao);
                return this._cellWrap(col, row,
                    `<span class="et-badge-func et-func-${fKey}">${hl(row.funcao || '—')}</span>`);
            }
            if (col.key === 'regime') {
                const rc = h.regimeBadgeClass(row.regime);
                return this._cellWrap(col, row,
                    `<span class="badge ${rc}">${hl(row.regime || '—')}</span>`);
            }
            if (col.key === 'status') {
                const sc = this._statusClass(row.status);
                return this._cellWrap(col, row,
                    `<span class="et-badge-status ${sc}">${hl(row.status || '—')}</span>`);
            }
            if (col.key === 'supervisor') {
                return this._cellWrap(col, row, hl(row.supervisor || '—'));
            }
            if (col.key === 'alocacao') {
                const isSetor = row.setor_id && row.setor && row.setor !== 'SEM SETOR';
                return `<td class="td-aloc">
                    ${isSetor
                        ? `<span class="et-badge-aloc et-aloc-s">${hl(row.setor)}</span>`
                        : `<span class="et-badge-aloc et-aloc-e">${hl(row.equipamento || '—')}</span>`}
                </td>`;
            }
            return `<td>${hl((row[col.key] || '—').toString())}</td>`;
        }).join('');

        return `<tr data-id="${row.id}" class="${isSel ? 'selected' : ''}">${cells}</tr>`;
    },

    /* Wrapper para células editáveis com ícone lápis */
    _cellWrap(col, row, content, extraClass = '') {
        if (!col.editable) return `<td class="${extraClass}">${content}</td>`;
        return `<td class="cell-with-edit ${extraClass}" data-edit="${row.id}|${col.key}">
            <div class="cell-content">
                <span class="cell-val">${content}</span>
                <button class="cell-edit-icon" data-edit-trigger="${row.id}|${col.key}" title="Editar ${col.label}">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11.5 2.5a2.121 2.121 0 1 1 3 3L5 15H2v-3z"/></svg>
                </button>
            </div>
        </td>`;
    },

    _editCell(row, col) {
        const options = col.optionsKey ? this._getOptions(col.optionsKey) : null;
        if (options) {
            return `<td class="td-editing">
                <select class="inline-edit-select" data-finish-edit="${row.id}|${col.key}" autofocus>
                    ${options.map(o => `<option value="${o}" ${(row[col.key] || '') === o ? 'selected' : ''}>${o}</option>`).join('')}
                </select>
            </td>`;
        }
        return `<td class="td-editing">
            <input class="inline-edit-input" type="text" value="${(row[col.key] || '')}" data-finish-edit="${row.id}|${col.key}" autofocus>
        </td>`;
    },

    /* ─── Filter panel flutuante ──────────────────────────────────── */
    _renderFilterPanel(allData) {
        const s   = this._state;
        const col = this._columns.find(c => c.key === s.filterPanel.col);
        if (!col) return '';

        const cur       = s.colFilters[col.key];
        const activeVals = Array.isArray(cur) ? cur : (cur ? [cur] : []);
        const isSorted  = s.sortCol === col.key;

        const sortHtml = `
            <div class="et-fp-sort">
                <button class="et-fp-sort-btn ${isSorted && s.sortAsc ? 'active' : ''}" data-fp-sort="asc">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 2v12M3 7l5-5 5 5"/></svg> A → Z
                </button>
                <button class="et-fp-sort-btn ${isSorted && !s.sortAsc ? 'active' : ''}" data-fp-sort="desc">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 2v12M3 9l5 5 5-5"/></svg> Z → A
                </button>
            </div>`;

        let filterHtml = '';
        if (col.type === 'select') {
            const opts = this._getOptions(col.optionsKey);
            filterHtml = `
                <div class="et-fp-options">
                    ${opts.map(o => `
                    <label class="et-fp-option">
                        <input type="checkbox" class="et-fp-check" value="${o}" ${activeVals.includes(o) ? 'checked' : ''}>
                        <span>${o}</span>
                    </label>`).join('')}
                </div>`;
        } else {
            const textVal = activeVals[0] || '';
            filterHtml = `
                <div class="et-fp-text-wrap">
                    <input type="text" id="et-fp-text" class="et-fp-text" placeholder="Filtrar por ${col.label}…" value="${textVal}" autocomplete="off">
                </div>`;
        }

        return `
        <div class="et-filter-panel" id="et-filter-panel">
            <div class="et-fp-header">
                <span class="et-fp-title">${col.label}</span>
                <button class="et-fp-close" id="et-fp-close">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="4" x2="4" y2="12"/><line x1="4" y1="4" x2="12" y2="12"/></svg>
                </button>
            </div>
            ${sortHtml}
            <div class="et-fp-divider"></div>
            ${filterHtml}
            <div class="et-fp-footer">
                <button class="et-fp-btn-clear" id="et-fp-clear">Limpar filtro</button>
                <button class="et-fp-btn-apply" id="et-fp-apply">Aplicar</button>
            </div>
        </div>`;
    },

    _positionFilterPanel() {
        const s   = this._state;
        if (!s.filterPanel) return;
        const panel = document.getElementById('et-filter-panel');
        if (!panel) return;

        const { x, y } = s.filterPanel;
        const pw = panel.offsetWidth  || 240;
        const ph = panel.offsetHeight || 300;

        let left = x;
        let top  = y;

        if (left + pw > window.innerWidth  - 8) left = window.innerWidth  - pw - 8;
        if (top  + ph > window.innerHeight - 8) top  = y - ph - 4;
        if (left < 8) left = 8;
        if (top  < 8) top  = 8;

        panel.style.left = left + 'px';
        panel.style.top  = top  + 'px';

        // Focar o input de texto se for coluna texto
        const col = this._columns.find(c => c.key === s.filterPanel.col);
        if (col && col.type !== 'select') {
            setTimeout(() => document.getElementById('et-fp-text')?.focus(), 0);
        }
    },

    /* ─── Paginação ───────────────────────────────────────────────── */
    _renderPagination(current, total) {
        if (total <= 1) return '';
        let html = `<button class="page-btn" id="et-first" ${current===1?'disabled':''} title="Primeira"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px"><path d="M11 12l-4-4 4-4M5 4v8"/></svg></button>
        <button class="page-btn" id="et-prev" ${current===1?'disabled':''} title="Anterior"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px"><path d="M10 12l-4-4 4-4"/></svg></button>`;

        const delta = 2;
        const range = [];
        for (let i = Math.max(2, current-delta); i <= Math.min(total-1, current+delta); i++) range.push(i);
        const items = [...new Set([1, ...range, total])].sort((a,b) => a-b);
        let prev = null;
        for (const p of items) {
            if (prev && p - prev > 1) html += `<span class="page-ellipsis">…</span>`;
            html += `<button class="page-btn ${p===current?'active':''}" data-page="${p}">${p}</button>`;
            prev = p;
        }
        html += `<button class="page-btn" id="et-next" ${current===total?'disabled':''} title="Próxima"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px"><path d="M6 4l4 4-4 4"/></svg></button>
        <button class="page-btn" id="et-last" ${current===total?'disabled':''} title="Última"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px"><path d="M5 4l4 4-4 4M11 4v8"/></svg></button>`;
        return html;
    },

    /* ─── Bind events ─────────────────────────────────────────────── */
    _bindEvents(pageData, allData) {
        const s = this._state;

        // Expand
        document.getElementById('et-expand')?.addEventListener('click', () => {
            s.expanded = !s.expanded;
            this.render();
        });

        // Limpar filtros
        document.getElementById('et-clear-filters')?.addEventListener('click', () => {
            s.colFilters = {};
            s.page = 1;
            this.render();
        });

        // Column picker toggle
        document.getElementById('et-col-picker')?.addEventListener('click', (e) => {
            e.stopPropagation();
            s.showColPicker = !s.showColPicker;
            this.render();
        });

        // Col picker — fechar ao clicar fora (com cleanup correto)
        if (s.showColPicker) {
            setTimeout(() => {
                this._docClickCB = (e) => {
                    if (!e.target.closest('#et-col-picker-panel') && !e.target.closest('#et-col-picker')) {
                        s.showColPicker = false;
                        if (this._docClickCB) {
                            document.removeEventListener('click', this._docClickCB);
                            this._docClickCB = null;
                        }
                        this.render();
                    }
                };
                document.addEventListener('click', this._docClickCB);
            }, 0);
        }

        // Col toggle checkboxes
        document.querySelectorAll('.et-col-toggle').forEach(cb => {
            cb.addEventListener('change', () => {
                const col = cb.dataset.col;
                if (cb.checked) s.hiddenCols.delete(col);
                else            s.hiddenCols.add(col);
                this.render();
            });
            cb.addEventListener('click', e => e.stopPropagation());
        });

        // Busca/highlight
        const hlInput = document.getElementById('et-highlight-input');
        if (hlInput) {
            let hlTimer;
            hlInput.addEventListener('input', () => {
                clearTimeout(hlTimer);
                hlTimer = setTimeout(() => {
                    s.highlightText = hlInput.value.trim();
                    s.page = 1;
                    this.render();
                }, 200);
            });
        }
        document.getElementById('et-clear-hl')?.addEventListener('click', () => { s.highlightText = ''; s.page = 1; this.render(); });

        // ── Filter panel buttons ─────────────────────────────────────
        document.querySelectorAll('.th-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const col = btn.dataset.filterOpen;
                const rect = btn.getBoundingClientRect();
                if (s.filterPanel && s.filterPanel.col === col) {
                    s.filterPanel = null;
                } else {
                    s.filterPanel = { col, x: rect.left, y: rect.bottom + 6 };
                }
                this.render();
            });
        });

        // Filter panel events
        if (s.filterPanel) {
            const applyFilter = () => {
                const colKey = s.filterPanel?.col;
                if (!colKey) return;
                const colDef = this._columns.find(c => c.key === colKey);
                if (colDef?.type === 'select') {
                    const checked = [...document.querySelectorAll('.et-fp-check:checked')].map(cb => cb.value);
                    if (checked.length === 0) delete s.colFilters[colKey];
                    else s.colFilters[colKey] = checked;
                } else {
                    const val = (document.getElementById('et-fp-text')?.value || '').trim();
                    if (!val) delete s.colFilters[colKey];
                    else s.colFilters[colKey] = val;
                }
                s.page = 1;
                s.filterPanel = null;
                this.render();
            };

            document.getElementById('et-fp-apply')?.addEventListener('click', applyFilter);
            document.getElementById('et-fp-clear')?.addEventListener('click', () => {
                const colKey = s.filterPanel?.col;
                if (colKey) delete s.colFilters[colKey];
                s.filterPanel = null;
                s.page = 1;
                this.render();
            });
            document.getElementById('et-fp-close')?.addEventListener('click', () => {
                s.filterPanel = null;
                this.render();
            });

            // Sort from filter panel
            document.querySelectorAll('[data-fp-sort]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const colKey = s.filterPanel?.col;
                    if (!colKey) return;
                    s.sortCol = colKey;
                    s.sortAsc = btn.dataset.fpSort === 'asc';
                    applyFilter();
                });
            });

            // Enter on text input
            document.getElementById('et-fp-text')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') applyFilter();
                if (e.key === 'Escape') { s.filterPanel = null; this.render(); }
            });

            // Fechar ao clicar fora do panel
            setTimeout(() => {
                this._fpClickCB = (e) => {
                    if (!e.target.closest('#et-filter-panel') && !e.target.closest('.th-filter-btn')) {
                        s.filterPanel = null;
                        if (this._fpClickCB) {
                            document.removeEventListener('click', this._fpClickCB);
                            this._fpClickCB = null;
                        }
                        this.render();
                    }
                };
                document.addEventListener('click', this._fpClickCB);
            }, 0);
        }

        // Ordenação pelo header (click no th-header)
        document.querySelectorAll('.th-header[data-sort]').forEach(th => {
            th.addEventListener('click', (e) => {
                if (e.target.closest('.th-filter-btn')) return; // não duplicar
                const col = th.dataset.sort;
                if (!col) return;
                if (s.sortCol === col) s.sortAsc = !s.sortAsc;
                else { s.sortCol = col; s.sortAsc = true; }
                this.render();
            });
        });

        // Checkbox header
        document.getElementById('et-select-all-cb')?.addEventListener('click', () => {
            const allSelected = pageData.every(r => s.selected.has(r.id));
            pageData.forEach(r => allSelected ? s.selected.delete(r.id) : s.selected.add(r.id));
            this.render();
        });

        // Checkbox por linha
        document.querySelectorAll('.excel-checkbox[data-sel]').forEach(cb => {
            cb.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = cb.dataset.sel;
                s.selected.has(id) ? s.selected.delete(id) : s.selected.add(id);
                this.render();
            });
        });

        document.getElementById('et-select-all-vis')?.addEventListener('click', () => { allData.forEach(r => s.selected.add(r.id)); this.render(); });
        document.getElementById('et-deselect-all')?.addEventListener('click', () => { s.selected.clear(); this.render(); });

        // Click no nome → drawer
        document.querySelectorAll('.cell-name[data-open]').forEach(td => {
            td.addEventListener('click', (e) => {
                if (e.target.closest('.cell-edit-icon')) return;
                const colab = SGE.state.colaboradores.find(c => c.id === td.dataset.open);
                if (colab) SGE.drawer.open(colab);
            });
        });

        // ── Pencil icon → inline edit ──────────────────────────────
        document.querySelectorAll('.cell-edit-icon[data-edit-trigger]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const [id, key] = btn.dataset.editTrigger.split('|');
                s.editingCell = { id, key };
                this.render();
                requestAnimationFrame(() => {
                    const el = document.querySelector('.inline-edit-input, .inline-edit-select');
                    if (el) { el.focus(); if (el.select) el.select(); }
                });
            });
        });

        // Finish inline edit
        const finishEdit = async (el, save) => {
            if (!s.editingCell) return;
            const { id, key } = s.editingCell;
            if (save && el) {
                const newVal = el.value;
                const colab = SGE.state.colaboradores.find(c => c.id === id);
                if (colab && colab[key] !== newVal) {
                    colab[key] = newVal;
                    try {
                        await SGE.api.syncEditColaborador(colab);
                        SGE.helpers.toast(`${colab.nome} — ${key} atualizado`, 'success');
                    } catch (e) { SGE.helpers.toast('Erro ao salvar: ' + e.message, 'error'); }
                }
            }
            s.editingCell = null;
            this.render();
        };

        document.querySelectorAll('[data-finish-edit]').forEach(el => {
            el.addEventListener('blur',    ()  => finishEdit(el, true));
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter')  { e.preventDefault(); finishEdit(el, true); }
                if (e.key === 'Escape') { e.preventDefault(); finishEdit(el, false); }
                if (e.key === 'Tab')    { e.preventDefault(); finishEdit(el, true); }
            });
        });

        // Row action button → drawer
        document.querySelectorAll('.row-action-btn[data-action="open"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const colab = SGE.state.colaboradores.find(c => c.id === btn.dataset.id);
                if (colab) SGE.drawer.open(colab);
            });
        });

        // Treinamentos → modal
        document.querySelectorAll('.et-tr-open[data-colab-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._openTrainingsModal(btn.dataset.colabId);
            });
        });

        // Advertências → modal
        document.querySelectorAll('.et-adv-open[data-colab-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._openWarningsModal(btn.dataset.colabId);
            });
        });

        // Export
        document.getElementById('et-export-xlsx')?.addEventListener('click', () => SGE.viz.exportData(allData, 'tsv'));
        document.getElementById('et-export-sel')?.addEventListener('click', () => {
            SGE.viz.exportData(allData.filter(r => s.selected.has(r.id)), 'tsv');
        });

        // Page size
        document.getElementById('et-page-size')?.addEventListener('change', (e) => {
            s.pageSize = parseInt(e.target.value); s.page = 1; this.render();
        });

        // Paginação
        document.getElementById('et-first')?.addEventListener('click', () => { s.page = 1; this.render(); });
        document.getElementById('et-prev')?.addEventListener('click',  () => { if (s.page > 1) { s.page--; this.render(); } });
        document.getElementById('et-next')?.addEventListener('click',  () => { const tp = Math.ceil(allData.length/s.pageSize); if (s.page < tp) { s.page++; this.render(); } });
        document.getElementById('et-last')?.addEventListener('click',  () => { s.page = Math.ceil(allData.length/s.pageSize); this.render(); });
        document.querySelectorAll('.page-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', () => { s.page = parseInt(btn.dataset.page); this.render(); });
        });

        // Mass edit
        document.getElementById('mass-btn-cancel')?.addEventListener('click',      () => { s.selected.clear(); this.render(); });
        document.getElementById('mass-btn-regime')?.addEventListener('click',      () => this._openMassEditSingle('regime',     'Alterar Regime',     'regimes'));
        document.getElementById('mass-btn-supervisor')?.addEventListener('click',  () => this._openMassEditSingle('supervisor', 'Alterar Supervisor', 'supervisores'));
        document.getElementById('mass-btn-status')?.addEventListener('click',      () => this._openMassEditSingle('status',     'Alterar Status',     'statuses'));
        document.getElementById('mass-btn-funcao')?.addEventListener('click',      () => this._openMassEditSingle('funcao',     'Alterar Função',     'funcoes'));
        document.getElementById('mass-btn-treinamento')?.addEventListener('click', () => this._openMassTrainingModal());
        document.getElementById('mass-btn-all')?.addEventListener('click',         () => this._openMassEditFull());
    },

    /* ─── Modal de treinamentos ───────────────────────────────────── */
    _openTrainingsModal(colabId) {
        const colab = SGE.state.colaboradores.find(c => c.id === colabId);
        if (!colab) return;
        const trainings = (SGE.state.colaboradorTreinamentos || []).filter(t => t.employee_id === colabId);
        const today     = new Date();

        const statusInfo = (t) => {
            if (!t.data_validade) return { cls: 'et-tr-na',      label: 'Sem validade' };
            const val = new Date(t.data_validade);
            const days = Math.floor((val - today) / 86400000);
            if (days < 0)   return { cls: 'et-tr-expired', label: 'Vencido'       };
            if (days < 30)  return { cls: 'et-tr-warning', label: `${days}d`      };
            return              { cls: 'et-tr-ok',      label: 'Válido'        };
        };

        const fmt = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

        const rows = trainings.map(t => {
            const si = statusInfo(t);
            return `<tr>
                <td style="padding:8px 10px;border-bottom:1px solid var(--border);color:var(--text-1);font-size:12px">${t.treinamento_nome || '—'}</td>
                <td style="padding:8px 10px;border-bottom:1px solid var(--border);color:var(--text-2);font-size:12px;font-family:var(--font-mono)">${fmt(t.data_realizacao)}</td>
                <td style="padding:8px 10px;border-bottom:1px solid var(--border);color:var(--text-2);font-size:12px;font-family:var(--font-mono)">${fmt(t.data_validade)}</td>
                <td style="padding:8px 10px;border-bottom:1px solid var(--border)"><span class="et-tr-badge ${si.cls}">${si.label}</span></td>
            </tr>`;
        }).join('');

        const body = document.createElement('div');
        body.innerHTML = `
            <p style="margin-bottom:12px;font-size:13px;color:var(--text-2)">Treinamentos de <strong style="color:var(--text-1)">${colab.nome}</strong></p>
            ${trainings.length === 0
                ? `<div style="padding:24px;text-align:center;color:var(--text-3);font-size:13px;background:var(--bg-2);border-radius:6px">Nenhum treinamento registrado para este colaborador.</div>`
                : `<div style="overflow:auto;max-height:280px;border:1px solid var(--border);border-radius:8px">
                    <table style="width:100%;border-collapse:collapse">
                        <thead><tr style="background:var(--bg-2)">
                            <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--text-3);border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--bg-2)">Treinamento</th>
                            <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--text-3);border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--bg-2)">Realizado</th>
                            <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--text-3);border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--bg-2)">Vence</th>
                            <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--text-3);border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--bg-2)">Status</th>
                        </tr></thead>
                        <tbody style="background:var(--bg-1)">${rows}</tbody>
                    </table>
                   </div>`}
            <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap">
                <div style="font-size:11px;color:var(--text-3);display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                    <span><span class="et-tr-badge et-tr-ok">Válido</span> dentro do prazo</span>
                    <span><span class="et-tr-badge et-tr-warning">Xd</span> vence em &lt;30 dias</span>
                    <span><span class="et-tr-badge et-tr-expired">Vencido</span> prazo expirado</span>
                </div>
            </div>`;

        SGE.modal.open(`Treinamentos — ${colab.nome}`, body, [
            { label: 'Fechar', action: () => SGE.modal.close() },
            { label: '+ Vincular Treinamento', class: 'btn-confirm', action: () => {
                SGE.modal.close();
                if (SGE.treinamentos && SGE.treinamentos._openVinculoModal) {
                    SGE.navigation.switchView('treinamentos');
                    setTimeout(() => SGE.treinamentos._openVinculoModal(), 350);
                }
            }}
        ]);
    },

    /* ─── Modal de advertências ───────────────────────────────────── */
    _openWarningsModal(colabId) {
        const colab = SGE.state.colaboradores.find(c => c.id === colabId);
        if (!colab) return;
        const warns = (SGE.state.advertencias || []).filter(a => a.employee_id === colabId);
        const fmt = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

        const tipoMap = { VERBAL: { cls: 'et-adv-verbal', label: 'Verbal' }, ESCRITA: { cls: 'et-adv-escrita', label: 'Escrita' }, SUSPENSAO: { cls: 'et-adv-suspensao', label: 'Suspensão' } };

        const rows = warns.map(w => {
            const t = tipoMap[w.tipo] || { cls: 'et-adv-verbal', label: w.tipo || '—' };
            return `<tr>
                <td style="padding:8px 10px;border-bottom:1px solid var(--border);color:var(--text-1);font-size:12px;font-family:var(--font-mono)">${fmt(w.data_aplicacao)}</td>
                <td style="padding:8px 10px;border-bottom:1px solid var(--border)"><span class="et-adv-badge ${t.cls}">${t.label}</span></td>
                <td style="padding:8px 10px;border-bottom:1px solid var(--border);color:var(--text-2);font-size:12px">${w.motivo || '—'}</td>
            </tr>`;
        }).join('');

        const body = document.createElement('div');
        body.innerHTML = `
            <p style="margin-bottom:12px;font-size:13px;color:var(--text-2)">Advertências de <strong style="color:var(--text-1)">${colab.nome}</strong></p>
            ${warns.length === 0
                ? `<div style="padding:24px;text-align:center;color:var(--text-3);font-size:13px;background:var(--bg-2);border-radius:6px">Nenhuma advertência registrada.</div>`
                : `<div style="overflow:auto;max-height:280px;border:1px solid var(--border);border-radius:8px">
                    <table style="width:100%;border-collapse:collapse">
                        <thead><tr style="background:var(--bg-2)">
                            <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--text-3);border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--bg-2)">Data</th>
                            <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--text-3);border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--bg-2)">Tipo</th>
                            <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--text-3);border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--bg-2)">Motivo</th>
                        </tr></thead>
                        <tbody style="background:var(--bg-1)">${rows}</tbody>
                    </table>
                   </div>`}`;

        SGE.modal.open(`Advertências — ${colab.nome}`, body, [
            { label: 'Fechar', action: () => SGE.modal.close() },
            { label: '+ Registrar Advertência', class: 'btn-confirm', action: () => {
                SGE.modal.close();
                if (SGE.advertencias && SGE.advertencias._openRegistarModal) {
                    SGE.navigation.switchView('advertencias');
                    setTimeout(() => SGE.advertencias._openRegistarModal(), 350);
                }
            }}
        ]);
    },

    /* ─── Modal de treinamentos em massa ──────────────────────────── */
    _openMassTrainingModal() {
        const s      = this._state;
        const count  = s.selected.size;
        const catlog = SGE.state.treinamentosCatalogo || [];

        if (catlog.length === 0) {
            return SGE.helpers.toast('Nenhum treinamento no catálogo. Crie primeiro em Segurança → Treinamentos.', 'info');
        }

        const body = document.createElement('div');
        body.innerHTML = `
            <p style="margin-bottom:14px;font-size:13px;color:var(--text-2)">
                Vincular treinamento a <strong>${count}</strong> colaborador(es) selecionado(s).
            </p>
            <div class="form-field" style="margin-bottom:12px">
                <label>Treinamento</label>
                <select id="mass-tr-id">
                    <option value="">-- Selecione --</option>
                    ${catlog.map(t => `<option value="${t.id}">${t.nome}</option>`).join('')}
                </select>
            </div>
            <div class="form-field" style="margin-bottom:12px">
                <label>Data de Realização</label>
                <input type="date" id="mass-tr-date" value="${new Date().toISOString().slice(0,10)}">
            </div>
            <div class="form-field">
                <label>Data de Validade (opcional)</label>
                <input type="date" id="mass-tr-expiry">
            </div>`;

        SGE.modal.open('Vincular Treinamento em Massa', body, [
            { label: 'Cancelar', action: () => SGE.modal.close() },
            { label: `Vincular em ${count}`, class: 'btn-confirm', action: async () => {
                const trId    = document.getElementById('mass-tr-id')?.value;
                const trDate  = document.getElementById('mass-tr-date')?.value;
                const trExpiry = document.getElementById('mass-tr-expiry')?.value;
                if (!trId)   return SGE.helpers.toast('Selecione um treinamento', 'error');
                if (!trDate) return SGE.helpers.toast('Informe a data de realização', 'error');
                try {
                    const ids = [...s.selected];
                    const data = { treinamento_id: trId, data_realizacao: trDate, data_validade: trExpiry || null };
                    for (const empId of ids) {
                        await SGE.api.syncTreinamento({ action: 'add', ...data, employee_id: empId });
                    }
                    SGE.helpers.toast(`Treinamento vinculado a ${ids.length} colaboradores!`, 'success');
                    SGE.modal.close();
                    s.selected.clear();
                    this.render();
                } catch(e) {
                    SGE.helpers.toast('Erro ao vincular: ' + e.message, 'error');
                }
            }}
        ]);
    },

    /* ─── Badge helpers ───────────────────────────────────────────── */
    _funcaoKey(funcao) {
        if (!funcao) return 'default';
        const f = funcao.toUpperCase();
        if (f.includes('OPERADOR'))       return 'op';
        if (f.includes('CAMINHAO') || f.includes('CAMINHÃO')) return 'cam';
        if (f.includes('MOTORISTA'))      return 'mot';
        if (f.includes('SUPERVISOR DE AREA') || f.includes('ÁREA')) return 'suparea';
        if (f.includes('SUPERVISOR'))     return 'supobra';
        if (f.includes('COORDENADOR'))    return 'coord';
        if (f.includes('PLANEJADOR') || f.includes('PROGRAMADOR')) return 'plan';
        if (f.includes('ALMOXARIFE'))     return 'almo';
        if (f.includes('SEGURANCA') || f.includes('SEGURANÇA')) return 'seg';
        return 'default';
    },

    _statusClass(status) {
        if (!status) return 'et-status-default';
        const s = status.toUpperCase();
        if (s === 'ATIVO')             return 'et-status-ativo';
        if (s === 'INATIVO')           return 'et-status-inativo';
        if (s === 'FÉRIAS'  || s === 'FERIAS')   return 'et-status-ferias';
        if (s === 'AFASTADO')          return 'et-status-afastado';
        if (s === 'DESLIGADO')         return 'et-status-desligado';
        if (s === 'EM AVISO')          return 'et-status-aviso';
        if (s === 'EM CONTRATAÇÃO' || s === 'EM CONTRATACAO') return 'et-status-contrat';
        return 'et-status-default';
    },

    /* ─── Mass edit ───────────────────────────────────────────────── */
    _openMassEditSingle(field, title, optionsKey) {
        const s = this._state;
        const count   = s.selected.size;
        const options = this._getOptions(optionsKey);
        const body = document.createElement('div');
        body.innerHTML = `
            <p style="margin-bottom:14px;font-size:13px;color:var(--text-2)">
                Alterar <strong style="color:var(--accent)">${field}</strong> de <strong>${count}</strong> colaborador(es).
            </p>
            <div class="form-field">
                <label>${field}</label>
                <select id="mass-single-val">
                    <option value="">-- Selecione --</option>
                    ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
                </select>
            </div>`;
        SGE.modal.open(title, body, [
            { label: 'Cancelar', action: () => SGE.modal.close() },
            { label: `Aplicar em ${count}`, class: 'btn-confirm', action: async () => {
                const val = document.getElementById('mass-single-val').value;
                if (!val) return SGE.helpers.toast('Selecione um valor', 'error');
                await this._applyMassEdit({ [field]: val });
                SGE.modal.close();
            }}
        ]);
    },

    _openMassEditFull() {
        const s = this._state;
        const count = s.selected.size;
        const body  = document.createElement('div');
        body.innerHTML = `
            <p style="margin-bottom:16px;font-size:13px;color:var(--text-2)">
                Editar campos de <strong>${count}</strong> colaborador(es).<br>
                <small style="color:var(--text-3)">Marque apenas os campos que deseja alterar.</small>
            </p>
            <div class="mass-edit-modal">
                ${this._massFieldHtml('regime',    'Regime',     this._getOptions('regimes'))}
                ${this._massFieldHtml('supervisor','Supervisor', this._getOptions('supervisores'))}
                ${this._massFieldHtml('status',    'Status',     this._getOptions('statuses'))}
                ${this._massFieldHtml('funcao',    'Função',     this._getOptions('funcoes'))}
                ${this._massFieldHtml('categoria', 'Categoria',  ['OPERACIONAL', 'GESTAO'])}
            </div>`;
        SGE.modal.open(`Edição em Massa — ${count} Colaboradores`, body, [
            { label: 'Cancelar', action: () => SGE.modal.close() },
            { label: 'Salvar Alterações', class: 'btn-confirm', action: async () => {
                const changes = {};
                body.querySelectorAll('.mass-field-toggle:checked').forEach(cb => {
                    const f = cb.dataset.field;
                    const inp = body.querySelector(`[data-mass-input="${f}"]`);
                    if (inp && inp.value) changes[f] = inp.value;
                });
                if (!Object.keys(changes).length) return SGE.helpers.toast('Marque ao menos um campo', 'warn');
                await this._applyMassEdit(changes);
                SGE.modal.close();
            }}
        ]);
        body.querySelectorAll('.mass-field-toggle').forEach(cb => {
            const inp = body.querySelector(`[data-mass-input="${cb.dataset.field}"]`);
            if (inp) { inp.disabled = !cb.checked; cb.addEventListener('change', () => { inp.disabled = !cb.checked; }); }
        });
    },

    _massFieldHtml(field, label, options) {
        return `
        <div class="mass-field-item">
            <div class="mass-field-checkbox-row">
                <input type="checkbox" class="mass-field-toggle" data-field="${field}" id="mft-${field}">
                <label for="mft-${field}">${label}</label>
            </div>
            <select data-mass-input="${field}" disabled>
                <option value="">-- Selecione --</option>
                ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
            </select>
        </div>`;
    },

    async _applyMassEdit(changes) {
        const s   = this._state;
        const ids = [...s.selected];
        const h   = SGE.helpers;
        if (!ids.length) return;
        try {
            let ok = 0;
            for (const id of ids) {
                const colab = SGE.state.colaboradores.find(c => c.id === id);
                if (!colab) continue;
                Object.assign(colab, changes);
                await SGE.api.syncEditColaborador(colab);
                ok++;
            }
            h.toast(`${ok} colaboradores atualizados!`, 'success');
            s.selected.clear();
            SGE.navigation._refreshViews();
        } catch(err) {
            console.error('[SGE MassEdit]', err);
            h.toast('Erro ao atualizar: ' + (err.message || 'Falha'), 'error');
        }
    }
};
