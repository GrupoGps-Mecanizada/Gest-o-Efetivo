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
        document.querySelectorAll('#nav [data-view], #nav .nav-module').forEach(el => {
            el.classList.remove('active');
        });

        // Update active nav button and its parent module (Nested Tabs Support)
        const activeBtn = document.querySelector(`#nav [data-view="${viewName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            const parentModule = activeBtn.closest('.nav-module');
            if (parentModule) parentModule.classList.add('active');
        }

        // Show/hide views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const target = document.getElementById(`${viewName}-view`);
        if (target) target.classList.add('active');

        // Show/hide filter bar and kanban-wrap (only on kanban)
        const filterbar = document.getElementById('filterbar');
        const kanbanWrap = document.getElementById('kanban-wrap');
        if (filterbar) {
            filterbar.style.display = viewName === 'kanban' ? 'flex' : 'none';
        }
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
     * Setup filter chips event listeners
     */
    setupFilters() {
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const type = chip.dataset.type;
                const value = chip.dataset.value;

                if (SGE.state.filtros[type] === value) {
                    SGE.state.filtros[type] = '';
                    chip.classList.remove('active');
                } else {
                    // Deactivate siblings
                    document.querySelectorAll(`.filter-chip[data-type="${type}"]`).forEach(c => c.classList.remove('active'));
                    SGE.state.filtros[type] = value;
                    chip.classList.add('active');
                }

                // Persist active filters to sessionStorage
                try {
                    sessionStorage.setItem('SGE_FILTROS', JSON.stringify(SGE.state.filtros));
                } catch (e) { /* ignore */ }

                SGE.kanban.render();
            });
        });
    },

    /**
     * Restore previously active filter chips from sessionStorage
     */
    restoreFilters() {
        try {
            const saved = sessionStorage.getItem('SGE_FILTROS');
            if (saved) {
                const filtros = JSON.parse(saved);
                Object.assign(SGE.state.filtros, filtros);

                // Visually activate the chips
                document.querySelectorAll('.filter-chip').forEach(chip => {
                    const type = chip.dataset.type;
                    const value = chip.dataset.value;
                    if (SGE.state.filtros[type] === value) {
                        chip.classList.add('active');
                    }
                });
            }
        } catch (e) { /* ignore */ }
    },

    /**
     * Build filter chips dynamically from data
     */
    buildFilterChips() {
        const filterbar = document.getElementById('filterbar');
        if (!filterbar) return;

        filterbar.innerHTML = `
      <span class="filter-label">Regime</span>
      ${SGE.CONFIG.regimes.filter(r => r !== 'SEM REGISTRO').map(r =>
            `<button class="filter-chip" data-type="regime" data-value="${r}">${r}</button>`
        ).join('')}
      <div class="filter-sep"></div>
      <span class="filter-label">Função</span>
      ${SGE.CONFIG.funcoes.map(f =>
            `<button class="filter-chip" data-type="funcao" data-value="${f}">${f}</button>`
        ).join('')}
      <div class="filter-sep"></div>
      <span class="filter-label">Status</span>
      <button class="filter-chip" data-type="status" data-value="FÉRIAS">FÉRIAS</button>
      <button class="filter-chip" data-type="status" data-value="SEM EQUIP">SEM EQUIP</button>
      <button class="filter-chip" data-type="status" data-value="SEM_ID">SEM ID</button>
    `;

        SGE.navigation.setupFilters();
        SGE.navigation.restoreFilters();
    }
};
