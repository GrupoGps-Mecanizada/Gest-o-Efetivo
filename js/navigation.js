'use strict';

/**
 * SGE — Navigation
 * View switching, filter management, and scroll/position persistence
 */
window.SGE = window.SGE || {};

SGE.navigation = {

    // Valid view names for hash restoration
    _validViews: ['viz', 'kanban', 'search', 'history', 'tabela', 'grupo', 'equip', 'settings', 'ferias', 'treinamentos'],

    /**
     * Save scroll position for current active view before leaving
     */
    _saveScrollPosition(viewName) {
        if (!viewName) return;
        try {
            // General view scroll
            const viewEl = document.getElementById(`${viewName}-view`);
            if (viewEl) {
                SGE.state.scrollPositions[viewName] = viewEl.scrollTop;
            }

            // Kanban: also save main horizontal scroll + each column scroll
            if (viewName === 'kanban') {
                const kv = document.getElementById('kanban-view');
                if (kv) {
                    const kanbanState = { scrollLeft: kv.scrollLeft, cols: {} };
                    kv.querySelectorAll('.col-body').forEach(cb => {
                        if (cb.dataset.supervisor) {
                            kanbanState.cols[cb.dataset.supervisor] = cb.scrollTop;
                        }
                    });
                    SGE.state.scrollPositions['_kanban'] = kanbanState;
                }
            }

            // Persist to sessionStorage so it survives a hash-triggered reload
            sessionStorage.setItem('SGE_SCROLL', JSON.stringify(SGE.state.scrollPositions));
        } catch (e) { /* ignore */ }
    },

    /**
     * Restore scroll position for a view after rendering
     */
    _restoreScrollPosition(viewName) {
        if (!viewName) return;
        requestAnimationFrame(() => {
            try {
                const viewEl = document.getElementById(`${viewName}-view`);
                const pos = SGE.state.scrollPositions[viewName];
                if (viewEl && pos) {
                    viewEl.scrollTop = pos;
                }

                // Kanban: restore horizontal + per-column scroll
                if (viewName === 'kanban') {
                    const kanbanState = SGE.state.scrollPositions['_kanban'];
                    const kv = document.getElementById('kanban-view');
                    if (kv && kanbanState) {
                        kv.scrollLeft = kanbanState.scrollLeft || 0;
                        if (kanbanState.cols) {
                            kv.querySelectorAll('.col-body').forEach(cb => {
                                const sup = cb.dataset.supervisor;
                                if (sup && kanbanState.cols[sup]) {
                                    cb.scrollTop = kanbanState.cols[sup];
                                }
                            });
                        }
                    }
                }
            } catch (e) { /* ignore */ }
        });
    },

    /**
     * Switch to a specific view
     * @param {string} viewName - Target view identifier
     * @param {boolean} [skipHash] - If true, don't update location.hash (used when restoring from hash)
     */
    switchView(viewName, skipHash = false) {
        // Save scroll of departing view
        if (SGE.state.activeView && SGE.state.activeView !== viewName) {
            SGE.navigation._saveScrollPosition(SGE.state.activeView);
        }

        SGE.state.activeView = viewName;

        // Update URL hash for page-reload persistence (browser history supported)
        if (!skipHash) {
            history.pushState({ view: viewName }, '', `#${viewName}`);
        }

        // Clear active states globally
        document.querySelectorAll('.nav-menu-item[data-view]').forEach(el => {
            el.classList.remove('active');
        });

        // Update active nav menu item
        const activeBtn = document.querySelector(`.nav-menu-item[data-view="${viewName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Show/hide views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const target = document.getElementById(`${viewName}-view`);
        if (target) target.classList.add('active');

        // Show/hide kanban-wrap (only on kanban)
        const kanbanWrap = document.getElementById('kanban-wrap');
        if (kanbanWrap) {
            kanbanWrap.style.display = viewName === 'kanban' ? 'flex' : 'none';
        }

        // Render the active view
        switch (viewName) {
            case 'viz':
                if (SGE.dashboard) SGE.dashboard.render();
                break;
            case 'kanban':
                SGE.kanban.render();
                setTimeout(() => SGE.kanban.updateArrows(), 100);
                break;
            case 'search':
                SGE.search.render();
                const si = document.getElementById('search-input');
                if (si) si.focus();
                break;
            case 'history':
                SGE.history.render();
                break;
            case 'tabela':
                SGE.viz.renderTable();
                break;
            case 'grupo':
                SGE.viz.renderGroups();
                break;
            case 'equip':
                SGE.equip.render();
                break;
            case 'settings':
                SGE.settings.render();
                break;
        }

        // Restore scroll after render
        SGE.navigation._restoreScrollPosition(viewName);
    },

    /**
     * Determine the initial view from URL hash or default
     */
    getInitialView() {
        const hash = location.hash.replace('#', '').trim().toLowerCase();
        if (hash && SGE.navigation._validViews.includes(hash)) {
            return hash;
        }
        return 'viz'; // default
    },

    /**
     * Load persisted scroll positions from sessionStorage
     */
    loadScrollPositions() {
        try {
            const saved = sessionStorage.getItem('SGE_SCROLL');
            if (saved) {
                SGE.state.scrollPositions = JSON.parse(saved);
            }
        } catch (e) { /* ignore */ }
    },

    /**
     * Setup filter dropdown event listeners
     */
    setupFilterDropdown() {
        const panel = document.getElementById('filter-dropdown-panel');
        const body = document.getElementById('filter-dropdown-body');
        if (!panel || !body) return;

        // Accordion toggle handler (event delegation)
        body.addEventListener('click', (e) => {
            const header = e.target.closest('.filter-accordion-header');
            if (header) {
                const accordion = header.closest('.filter-accordion');
                if (accordion) accordion.classList.toggle('open');
                return;
            }

            const item = e.target.closest('.filter-checkbox-item');
            if (!item) return;

            const type = item.dataset.type;
            const value = item.dataset.value;
            const checkbox = item.querySelector('.filter-checkbox');

            if (!SGE.state.filtros[type]) SGE.state.filtros[type] = [];

            const idx = SGE.state.filtros[type].indexOf(value);
            if (idx >= 0) {
                SGE.state.filtros[type].splice(idx, 1);
                checkbox.classList.remove('checked');
            } else {
                SGE.state.filtros[type].push(value);
                checkbox.classList.add('checked');
            }

            SGE.navigation._persistFilters();
            SGE.navigation._updateFilterBadge();
            SGE.navigation._refreshViews();
        });

        // Clear all button
        const clearBtn = document.getElementById('filter-clear-all');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                SGE.state.filtros = { regime: [], funcao: [], status: [], equipTipo: [], equipTurno: [], supervisor: [], categoria: [] };
                body.querySelectorAll('.filter-checkbox').forEach(cb => cb.classList.remove('checked'));
                SGE.navigation._persistFilters();
                SGE.navigation._updateFilterBadge();
                SGE.navigation._refreshViews();
            });
        }
    },

    /**
     * Restore previously active filters from sessionStorage
     */
    restoreFilters() {
        try {
            const saved = sessionStorage.getItem('SGE_FILTROS');
            if (saved) {
                const filtros = JSON.parse(saved);
                // Migrate old string format to array format
                Object.keys(filtros).forEach(key => {
                    if (typeof filtros[key] === 'string') {
                        filtros[key] = filtros[key] ? [filtros[key]] : [];
                    }
                });
                Object.assign(SGE.state.filtros, filtros);

                // Visually check the checkboxes
                const body = document.getElementById('filter-dropdown-body');
                if (body) {
                    Object.keys(SGE.state.filtros).forEach(type => {
                        SGE.state.filtros[type].forEach(val => {
                            const item = body.querySelector(`.filter-checkbox-item[data-type="${type}"][data-value="${val}"]`);
                            if (item) {
                                item.querySelector('.filter-checkbox').classList.add('checked');
                                // Auto-open the accordion for this active filter
                                const accordion = item.closest('.filter-accordion');
                                if (accordion && !accordion.classList.contains('open')) {
                                    accordion.classList.add('open');
                                }
                            }
                        });
                    });
                }

                SGE.navigation._updateFilterBadge();
            }
        } catch (e) { /* ignore */ }
    },

    /**
     * Build filter dropdown content dynamically from data
     */
    buildFilterChips() {
        // Build the dropdown instead
        SGE.navigation.buildFilterDropdown();
    },

    buildFilterDropdown() {
        const body = document.getElementById('filter-dropdown-body');
        if (!body) return;

        const colabs = SGE.state.colaboradores || [];
        const tipos = SGE.CONFIG.equipTipos;
        const turnos = ['A', 'B', 'C', 'D', 'ADM', '16H'];

        // Count occurrences for each option
        const countBy = (field) => {
            const map = {};
            colabs.forEach(c => {
                const val = c[field] || '';
                if (val) map[val] = (map[val] || 0) + 1;
            });
            return map;
        };

        const regimeCounts = countBy('regime');
        const funcaoCounts = countBy('funcao');
        const statusCounts = countBy('status');
        const supervisorCounts = countBy('supervisor');

        // Count equipment types
        const equipTipoCounts = {};
        colabs.forEach(c => {
            if (c.equipamento) {
                const parsed = SGE.equip.parseEquip(c.equipamento);
                if (parsed && tipos[parsed.sigla]) {
                    equipTipoCounts[parsed.sigla] = (equipTipoCounts[parsed.sigla] || 0) + 1;
                }
            }
        });

        // Count turnos
        const turnoCounts = {};
        colabs.forEach(c => {
            const t = SGE.equip.getTurno(c.regime);
            if (t) turnoCounts[t] = (turnoCounts[t] || 0) + 1;
        });

        const chevronSvg = '<svg class="filter-accordion-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg>';

        const makeAccordion = (title, type, options, defaultOpen) => {
            const activeCount = (SGE.state.filtros[type] || []).length;
            const badgeHtml = activeCount > 0 ? `<span class="filter-accordion-badge">${activeCount}</span>` : '';
            return `
                <div class="filter-accordion${defaultOpen ? ' open' : ''}">
                    <div class="filter-accordion-header">
                        ${chevronSvg}
                        <span class="filter-accordion-title">${title}</span>
                        ${badgeHtml}
                    </div>
                    <div class="filter-accordion-body">
                        ${options.map(opt => {
                const count = opt.count || 0;
                return `
                                <div class="filter-checkbox-item" data-type="${type}" data-value="${opt.value}">
                                    <div class="filter-checkbox"></div>
                                    <span class="filter-checkbox-label">${opt.label}</span>
                                    <span class="filter-checkbox-count">${count}</span>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        };

        // Build options for each category
        const equipTipoOptions = Object.entries(tipos).map(([sigla, info]) => ({
            value: sigla, label: `${sigla} — ${info.nome}`, count: equipTipoCounts[sigla] || 0
        }));

        const turnoOptions = turnos.map(t => ({
            value: t, label: t, count: turnoCounts[t] || 0
        }));

        const supervisorOptions = SGE.state.supervisores
            .filter(s => s.ativo)
            .map(s => ({ value: s.nome, label: s.nome, count: supervisorCounts[s.nome] || 0 }));

        const regimeOptions = SGE.CONFIG.regimes.map(r => ({ value: r, label: r, count: regimeCounts[r] || 0 }));
        const funcaoOptions = SGE.CONFIG.funcoes.map(f => ({ value: f, label: f, count: funcaoCounts[f] || 0 }));
        const statusOptions = SGE.CONFIG.statuses.map(s => ({ value: s, label: s, count: statusCounts[s] || 0 }));

        // Add special status options
        statusOptions.push(
            { value: 'FÉRIAS', label: 'Ferias', count: colabs.filter(c => SGE.helpers.isFerias(c)).length },
            { value: 'SEM EQUIP', label: 'Sem Equipamento', count: colabs.filter(c => SGE.helpers.isSemEquipamento(c)).length },
            { value: 'SEM_ID', label: 'Sem ID', count: colabs.filter(c => SGE.helpers.isSemId(c)).length }
        );

        // Categoria options
        const categoriaCounts = countBy('categoria');
        const categoriaOptions = ['OPERACIONAL', 'GESTAO'].map(cat => ({
            value: cat, label: cat === 'OPERACIONAL' ? 'Operacional' : 'Gestao', count: categoriaCounts[cat] || 0
        }));

        body.innerHTML = [
            makeAccordion('Categoria', 'categoria', categoriaOptions, false),
            makeAccordion('Equipamentos', 'equipTipo', equipTipoOptions, false),
            makeAccordion('Turno', 'equipTurno', turnoOptions, false),
            makeAccordion('Supervisores', 'supervisor', supervisorOptions, false),
            makeAccordion('Regime', 'regime', regimeOptions, false),
            makeAccordion('Funcao', 'funcao', funcaoOptions, false),
            makeAccordion('Status', 'status', statusOptions, false)
        ].join('');

        SGE.navigation.setupFilterDropdown();
        SGE.navigation.restoreFilters();
    },

    /* ---- Internal helpers ---- */

    _persistFilters() {
        try {
            sessionStorage.setItem('SGE_FILTROS', JSON.stringify(SGE.state.filtros));
        } catch (e) { /* ignore */ }
    },

    _updateFilterBadge() {
        const f = SGE.state.filtros;
        const total = (f.regime?.length || 0) +
            (f.funcao?.length || 0) +
            (f.status?.length || 0) +
            (f.equipTipo?.length || 0) +
            (f.equipTurno?.length || 0) +
            (f.supervisor?.length || 0) +
            (f.categoria?.length || 0);
        const badge = document.getElementById('filter-count-badge');
        const btn = document.getElementById('filter-toggle-btn');
        if (badge) {
            badge.textContent = total;
            badge.classList.toggle('hidden', total === 0);
        }
        if (btn) {
            btn.classList.toggle('has-filters', total > 0);
        }
    },

    _refreshViews() {
        // Refresh the currently active view with new filter state
        const activeView = SGE.state.activeView;
        switch (activeView) {
            case 'kanban': SGE.kanban.render(); break;
            case 'viz': if (SGE.dashboard) SGE.dashboard.render(); break;
            case 'tabela': SGE.viz.renderTable(); break;
            case 'grupo': SGE.viz.renderGroups(); break;
            case 'search': SGE.search.render(); break;
            case 'equip': SGE.equip.render(); break;
            case 'history': SGE.history.render(); break;
            case 'settings': SGE.settings.render(); break;
        }
    }
};
