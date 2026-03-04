'use strict';

/**
 * SGE — App Initialization
 * Entry point, event wiring, and bootstrap
 */
window.SGE = window.SGE || {};

SGE.app = {
    async init() {
        const loadingScreen = document.getElementById('loading-screen');
        const loginScreen = document.getElementById('login-screen');

        // Check auth status
        if (await SGE.auth.init()) {
            // Already logged in
            if (loginScreen) loginScreen.classList.add('hidden');

            // If we have cached data, skip loading screen entirely for instant boot
            const hasCache = localStorage.getItem('SGE_CACHE');
            if (hasCache && loadingScreen) {
                loadingScreen.classList.add('hide');
            }

            SGE.app.boot();
        } else {
            // Needs login
            if (loadingScreen) loadingScreen.classList.add('hide');
            if (loginScreen) loginScreen.classList.remove('hidden');
            SGE.app.setupLoginForm();
        }
    },

    setupLoginForm() {
        // Redundante: Agora é handled pelo SSO redirect. 
        // Mantemos a função vazia temporariamente para não quebrar referências.
        return;
    },


    async boot() {
        const loadingScreen = document.getElementById('loading-screen');
        const statusEl = document.getElementById('loading-status');
        const topbar = document.getElementById('topbar');
        const main = document.getElementById('main');
        const filterbar = document.getElementById('filterbar');

        // Detect if loading screen was already hidden (cached instant boot)
        const isInstantBoot = loadingScreen && loadingScreen.classList.contains('hide');

        // Hide app content during loading (only if not instant boot)
        if (!isInstantBoot) {
            if (topbar) topbar.style.opacity = '0';
            if (main) main.style.opacity = '0';
            if (filterbar) filterbar.style.opacity = '0';
        }

        const setStatus = (msg) => {
            if (statusEl) statusEl.innerHTML = msg + '<span class="loading-dots"></span>';
        };

        // Restore persisted scroll positions from sessionStorage
        SGE.navigation.loadScrollPositions();

        // 1. Try to load from Cache first for instant boot
        let usedCache = false;
        try {
            const cachedParams = localStorage.getItem('SGE_CACHE');
            if (cachedParams) {
                const parsed = JSON.parse(cachedParams);
                if (parsed.colaboradores) SGE.state.colaboradores = parsed.colaboradores;
                if (parsed.supervisores) SGE.state.supervisores = parsed.supervisores;
                if (parsed.movimentacoes) SGE.state.movimentacoes = parsed.movimentacoes;
                if (parsed.equipamentos) SGE.state.equipamentos = parsed.equipamentos;
                if (parsed.treinamentosCatalogo) SGE.state.treinamentosCatalogo = parsed.treinamentosCatalogo;
                if (parsed.colaboradorTreinamentos) SGE.state.colaboradorTreinamentos = parsed.colaboradorTreinamentos;
                if (parsed.ferias) SGE.state.ferias = parsed.ferias;
                if (parsed.advertencias) SGE.state.advertencias = parsed.advertencias;

                SGE.state.dataLoaded = true;
                usedCache = true;
                setStatus('Carregando offline (instanciado do cache)...');

                // Trigger background sync after UI is ready
                setTimeout(() => { SGE.api.syncBackground(true); }, 1500);
            }
        } catch (e) {
            console.warn('Cache load failed:', e);
        }

        // Initialize Real-time immediately if connected
        if (window.supabase) SGE.api.setupRealtime();

        // 2. If no cache, do the network load blocking the screen
        if (!usedCache) {
            setStatus('Conectando ao banco de dados Supabase...');
            await Promise.all([
                SGE.api.loadData(),
                SGE.api.loadFerias(),
                SGE.api.loadTreinamentos(),
                SGE.api.loadAdvertencias()
            ]);
            setStatus('Montando interface');
        }

        // Build dynamic filter chips
        SGE.navigation.buildFilterChips();

        // Update stats after data load
        SGE.helpers.updateStats();

        // Setup event listeners before switching view so everything is ready
        SGE.app.setupNavigation();
        SGE.app.setupDrawer();
        SGE.app.setupModal();
        SGE.app.setupSearch();
        SGE.app.setupHistory();
        SGE.app.setupKanbanArrows();

        // Restore the view the user was on before the page reload (from URL hash)
        const initialView = SGE.navigation.getInitialView();
        SGE.navigation.switchView(initialView, true); // skipHash=true: don't push state again

        // Listen for browser back/forward navigation + Double-Back Exit
        window.addEventListener('popstate', (e) => {
            // Check if this is a quick double-back press
            SGE.app._backPressCount++;

            if (SGE.app._backPressTimer) clearTimeout(SGE.app._backPressTimer);

            if (SGE.app._backPressCount >= 2) {
                // Double-back detected — show exit confirmation
                SGE.app._backPressCount = 0;

                // Push state back to prevent leaving
                history.pushState({ sge: true, view: SGE.state.activeView }, '');

                // Show confirmation modal
                SGE.modal.confirm({
                    title: 'Deseja sair do sistema?',
                    message: 'Se confirmar, você será redirecionado para a página anterior.',
                    confirmText: 'Sair',
                    confirmColor: 'danger',
                    onConfirm: () => {
                        // User confirmed exit — go back beyond our history
                        window.location.href = document.referrer || 'about:blank';
                    }
                });
                return;
            }

            // First back press — re-push state and reset after 1.5 seconds
            SGE.app._backPressTimer = setTimeout(() => {
                SGE.app._backPressCount = 0;
            }, 1500);

            // Handle normal internal view navigation
            const view = (e.state && e.state.view) || SGE.navigation.getInitialView();
            SGE.navigation.switchView(view, true);

            // Re-push so back can be caught again
            history.pushState({ sge: true, view: SGE.state.activeView }, '');
        });

        // Silent polling (runs every 30s; after mutations, syncBackground(true) runs immediately)
        setInterval(() => {
            SGE.api.syncBackground();
        }, 30000);

        // Fade out loading screen and show app
        if (isInstantBoot) {
            // Instant boot: show everything immediately without animation
            if (topbar) topbar.style.opacity = '1';
            if (main) main.style.opacity = '1';
            if (filterbar) filterbar.style.opacity = '1';
            if (loadingScreen && loadingScreen.parentNode) loadingScreen.remove();
        } else {
            await new Promise(r => setTimeout(r, 300));
            if (topbar) topbar.style.transition = 'opacity .4s ease';
            if (main) main.style.transition = 'opacity .4s ease';
            if (filterbar) filterbar.style.transition = 'opacity .4s ease';
            if (topbar) topbar.style.opacity = '1';
            if (main) main.style.opacity = '1';
            if (filterbar) filterbar.style.opacity = '1';

            if (loadingScreen && loadingScreen.parentNode) {
                loadingScreen.classList.add('hide');
                setTimeout(() => loadingScreen.remove(), 700);
            }
        }
    },

    setupNavigation() {
        // Logo click → go to dashboard
        const logo = document.getElementById('logo-home');
        if (logo) {
            logo.addEventListener('click', () => {
                SGE.navigation.switchView('viz');
            });
        }

        // ── Nav Menu Toggle ──
        const menuBtn = document.getElementById('nav-menu-btn');
        const menuOverlay = document.getElementById('nav-menu-overlay');
        const openMenu = () => menuOverlay && menuOverlay.classList.remove('hidden');
        const closeMenu = () => menuOverlay && menuOverlay.classList.add('hidden');

        if (menuBtn) menuBtn.addEventListener('click', openMenu);
        if (menuOverlay) {
            menuOverlay.addEventListener('click', (e) => {
                if (e.target === menuOverlay) closeMenu();
            });
        }

        // View toggle logic for sidebar and dashboard internal tabs
        const viewButtons = document.querySelectorAll('.nav-menu-item[data-view], .dash-tab-btn[data-view]');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                SGE.navigation.switchView(btn.dataset.view);
                if (btn.classList.contains('nav-menu-item')) {
                    closeMenu();
                }
            });
        });

        // ── Global Export Button ──
        const exportBtn = document.getElementById('topbar-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (SGE.export) SGE.export.openModal();
            });
        }

        // ── Filter Dropdown Toggle ──
        const filterBtn = document.getElementById('filter-toggle-btn');
        const filterPanel = document.getElementById('filter-dropdown-panel');

        if (filterBtn && filterPanel) {
            filterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                filterPanel.classList.toggle('hidden');
            });

            // Close filter panel when clicking outside
            document.addEventListener('click', (e) => {
                if (!filterPanel.contains(e.target) && e.target !== filterBtn && !filterBtn.contains(e.target)) {
                    filterPanel.classList.add('hidden');
                }
            });
        }

        // ── Double-Back Exit Confirmation ──
        SGE.app._backPressCount = 0;
        SGE.app._backPressTimer = null;
        SGE.app._historyPushCount = 0;

        // Push a dummy state so the first back doesn't leave the page
        history.pushState({ sge: true, view: SGE.state.activeView }, '');
        SGE.app._historyPushCount++;
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
                if (!SGE.auth.hasRole('GESTAO')) return;
                SGE.drawer.close();
                SGE.modal.openMoveSelector(col);
            } else if (action === 'edit') {
                if (!SGE.auth.hasRole('GESTAO')) return;
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

        const globalSearch = document.getElementById('global-search');
        if (globalSearch) {
            globalSearch.addEventListener('input', (e) => {
                const val = e.target.value;
                if (SGE.state.activeView !== 'search' && val.trim().length > 0) {
                    SGE.navigation.switchView('search');
                    // Focus back to global after switch because view transition might steal it
                    setTimeout(() => globalSearch.focus(), 10);
                }

                // Sync the main search input
                if (input) {
                    input.value = val;
                }

                // If it was cleared, maybe we should leave the user in search view or return them? 
                // Usually it's fine to leave them on search view so they see the whole list
                SGE.search.render(val);
            });

            // clear global search if leaving the search view
            document.addEventListener('click', (e) => {
                // Not ideal, let's just clear on navigation to another page handled somewhere else, or just keep it simple
            });
        }
    },

    setupHistory() {
        // Filter inputs
        document.querySelectorAll('.history-filter-input').forEach(inp => {
            inp.addEventListener('input', () => SGE.history.render());
        });
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
    }
};

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => SGE.app.init());
