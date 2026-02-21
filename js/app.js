'use strict';

/**
 * SGE — App Initialization
 * Entry point, event wiring, and bootstrap
 */
window.SGE = window.SGE || {};

SGE.app = {
    async init() {
        const loadingScreen = document.getElementById('loading-screen');
        const statusEl = document.getElementById('loading-status');
        const topbar = document.getElementById('topbar');
        const main = document.getElementById('main');
        const filterbar = document.getElementById('filterbar');

        // Hide app content during loading
        if (topbar) topbar.style.opacity = '0';
        if (main) main.style.opacity = '0';
        if (filterbar) filterbar.style.opacity = '0';

        const setStatus = (msg) => {
            if (statusEl) statusEl.innerHTML = msg + '<span class="loading-dots"></span>';
        };

        // Load data from API with progress updates
        setStatus('Conectando ao banco de dados');

        if (SGE.CONFIG.gasUrl) {
            setStatus('Carregando colaboradores');
            const colabData = await SGE.api.callGAS('listar_colaboradores');
            if (colabData && Array.isArray(colabData)) {
                SGE.state.colaboradores = colabData;
            }

            setStatus('Carregando supervisores');
            const supData = await SGE.api.callGAS('listar_supervisores');
            if (supData && Array.isArray(supData)) {
                SGE.state.supervisores = supData;
            }

            setStatus('Carregando movimentações');
            const movData = await SGE.api.callGAS('listar_movimentacoes');
            if (movData && Array.isArray(movData)) {
                SGE.state.movimentacoes = movData;
            }

            setStatus('Carregando equipamentos');
            const equipData = await SGE.api.callGAS('listar_equipamentos');
            if (equipData && Array.isArray(equipData)) {
                SGE.state.equipamentos = equipData;
            }

            SGE.state.dataLoaded = true;
            setStatus('Montando interface');
        } else {
            setStatus('Sem URL configurada — modo offline');
            SGE.state.dataLoaded = true;
            await new Promise(r => setTimeout(r, 600));
        }

        // Build dynamic filter chips
        SGE.navigation.buildFilterChips();

        // Update stats after data load
        SGE.helpers.updateStats();

        // Render initial view
        SGE.kanban.render();

        // Setup event listeners
        SGE.app.setupNavigation();
        SGE.app.setupDrawer();
        SGE.app.setupModal();
        SGE.app.setupSearch();
        SGE.app.setupHistory();
        SGE.app.setupKanbanArrows();
        SGE.app.setupRefresh();

        // Fade out loading screen and show app
        await new Promise(r => setTimeout(r, 300));
        if (topbar) topbar.style.transition = 'opacity .4s ease';
        if (main) main.style.transition = 'opacity .4s ease';
        if (filterbar) filterbar.style.transition = 'opacity .4s ease';
        if (topbar) topbar.style.opacity = '1';
        if (main) main.style.opacity = '1';
        if (filterbar) filterbar.style.opacity = '1';

        if (loadingScreen) {
            loadingScreen.classList.add('hide');
            setTimeout(() => loadingScreen.remove(), 700);
        }
    },

    setupNavigation() {
        document.querySelectorAll('#nav .nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                SGE.navigation.switchView(btn.dataset.view);
            });
        });
    },

    setupDrawer() {
        document.getElementById('drawer-overlay').addEventListener('click', SGE.drawer.close);
        document.getElementById('drawer-close').addEventListener('click', SGE.drawer.close);

        // Drawer footer buttons — use event delegation
        document.getElementById('drawer-footer').addEventListener('click', e => {
            const btn = e.target.closest('.drawer-btn');
            if (!btn || !SGE.state.drawerColaborador) return;

            const action = btn.dataset.action;
            const col = SGE.state.drawerColaborador;

            if (action === 'move') {
                SGE.drawer.close();
                SGE.modal.openMoveSelector(col);
            } else if (action === 'edit') {
                SGE.drawer.close();
                SGE.modal.openEdit(col);
            }
        });
    },

    setupModal() {
        document.getElementById('modal-overlay').addEventListener('click', e => {
            if (e.target === document.getElementById('modal-overlay')) {
                SGE.modal.close();
            }
        });
    },

    setupSearch() {
        const input = document.getElementById('search-input');
        if (input) {
            input.addEventListener('input', () => SGE.search.render(input.value));
        }
    },

    setupHistory() {
        // Filter inputs
        document.querySelectorAll('.history-filter-input').forEach(inp => {
            inp.addEventListener('input', () => SGE.history.render());
        });

        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', SGE.history.exportCSV);
        }
    },

    setupKanbanArrows() {
        const kv = document.getElementById('kanban-view');
        const leftBtn = document.getElementById('kanban-arrow-left');
        const rightBtn = document.getElementById('kanban-arrow-right');

        if (leftBtn) {
            leftBtn.addEventListener('click', () => {
                kv.scrollBy({ left: -300, behavior: 'smooth' });
            });
        }
        if (rightBtn) {
            rightBtn.addEventListener('click', () => {
                kv.scrollBy({ left: 300, behavior: 'smooth' });
            });
        }
        if (kv) {
            kv.addEventListener('scroll', () => SGE.kanban.updateArrows());
            setTimeout(() => SGE.kanban.updateArrows(), 300);
        }
    },

    setupRefresh() {
        const btn = document.getElementById('refresh-btn');
        if (btn) {
            btn.addEventListener('click', async () => {
                SGE.helpers.toast('Recarregando dados...', 'info');
                await SGE.api.loadData();
                SGE.helpers.updateStats();
                SGE.navigation.switchView(SGE.state.activeView);
                SGE.helpers.toast('Dados atualizados', 'success');
            });
        }
    }
};

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => SGE.app.init());
