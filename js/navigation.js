'use strict';

/**
 * SGE — Navigation
 * View switching and filter management
 */
window.SGE = window.SGE || {};

SGE.navigation = {
    /**
     * Switch to a specific view
     */
    switchView(viewName) {
        SGE.state.activeView = viewName;

        // Update nav buttons
        document.querySelectorAll('#nav .nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });

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
            case 'viz':
                SGE.viz.render();
                break;
            case 'equip':
                SGE.equip.render();
                break;
            case 'settings':
                SGE.settings.render();
                break;
        }
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

                SGE.kanban.render();
            });
        });
    },

    /**
     * Build filter chips dynamically from data
     */
    buildFilterChips() {
        const filterbar = document.getElementById('filterbar');
        if (!filterbar) return;

        // Get unique statuses from data
        const allStatuses = [...new Set(SGE.state.colaboradores.map(c => c.status).filter(Boolean))];

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
    }
};
