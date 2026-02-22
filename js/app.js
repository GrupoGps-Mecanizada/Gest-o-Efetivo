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
        if (SGE.auth.init()) {
            // Already logged in
            if (loginScreen) loginScreen.classList.add('hidden');
            SGE.app.boot();
        } else {
            // Needs login
            if (loadingScreen) loadingScreen.classList.add('hide');
            if (loginScreen) loginScreen.classList.remove('hidden');
            SGE.app.setupLoginForm();
        }
    },

    setupLoginForm() {
        const form = document.getElementById('login-form');
        const errEl = document.getElementById('login-error');
        const submitBtn = document.getElementById('login-submit');

        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errEl.textContent = '';
            submitBtn.disabled = true;
            submitBtn.textContent = 'Autenticando...';

            const user = document.getElementById('login-user').value;
            const pass = document.getElementById('login-pass').value;

            const res = await SGE.auth.login(user, pass);

            if (res.success) {
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('loading-screen').classList.remove('hide');
                SGE.app.boot();
            } else {
                errEl.textContent = res.error;
                submitBtn.disabled = false;
                submitBtn.textContent = 'Entrar';
            }
        });
    },

    async boot() {
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

                SGE.state.dataLoaded = true;
                usedCache = true;
                setStatus('Carregando offline (instanciado do cache)...');

                // Trigger background sync
                setTimeout(() => { SGE.api.syncBackground(); }, 1000);
            }
        } catch (e) {
            console.warn('Cache load failed:', e);
        }

        // 2. If no cache, do the slow network load blocking the screen
        if (!usedCache) {
            setStatus('Conectando ao banco de dados...');
            if (SGE.CONFIG.gasUrl) {
                setStatus('Baixando dados pela primeira vez... Isso pode levar alguns segundos.');
                await SGE.api.loadData();
                setStatus('Montando interface');
            } else {
                setStatus('Sem URL configurada — modo offline');
                SGE.state.dataLoaded = true;
                await new Promise(r => setTimeout(r, 600));
            }
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
        SGE.app.setupRefresh();

        // Render initial view (Dashboard/Viz)
        SGE.navigation.switchView('viz');

        // Fade out loading screen and show app
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
    },

    setupNavigation() {
        // Desktop / Normal view switching
        document.querySelectorAll('#nav [data-view], #nav .nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                SGE.navigation.switchView(btn.dataset.view);

                // Auto-close mobile menu when a navigation item is clicked
                const nav = document.getElementById('nav');
                if (nav && nav.classList.contains('mobile-open')) {
                    nav.classList.remove('mobile-open');
                }
            });
        });

        // Hamburger Menu Toggle (Mobile)
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                const nav = document.getElementById('nav');
                if (nav) nav.classList.toggle('mobile-open');
            });
        }

        // Accordion for Mobile Submenus
        document.querySelectorAll('.nav-module.has-submenu .module-title').forEach(title => {
            title.addEventListener('click', (e) => {
                // Ignore if clicked on a direct link
                if (e.target.closest('[data-view]')) return;

                // Only act as accordion on mobile screens
                if (window.innerWidth <= 768) {
                    const module = title.closest('.nav-module');
                    if (module) module.classList.toggle('expanded');
                }
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
