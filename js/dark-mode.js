'use strict';

/**
 * SGE — Dark Mode Manager
 * Persiste preferência no localStorage e sincroniza ícones
 */
window.SGE = window.SGE || {};

SGE.darkMode = {
    // Um tema só para o Portal SGE e os sistemas (mesma chave da Barra Universal). Sem escolha: sempre claro.
    STORAGE_KEY: 'sge_tema',

    init() {
        let isDark = false;
        try { isDark = localStorage.getItem(this.STORAGE_KEY) === 'escuro'; } catch (_) { /* sem armazenamento: claro */ }
        this._apply(isDark);

        const btn = document.getElementById('dark-mode-btn');
        if (btn) {
            btn.addEventListener('click', () => this.toggle());
        }
    },

    toggle() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        this._apply(!isDark);
        try { localStorage.setItem(this.STORAGE_KEY, !isDark ? 'escuro' : 'claro'); } catch (_) { /* vale só nesta visita */ }
    },

    _apply(dark) {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        // mesmo tema para o sge-core (ele lê data-tema)
        document.documentElement.setAttribute('data-tema', dark ? 'escuro' : 'claro');
        if (SGE.matriz) SGE.matriz.tema(dark);
        const moon = document.getElementById('dark-mode-icon-moon');
        const sun = document.getElementById('dark-mode-icon-sun');
        if (moon) moon.style.display = dark ? 'none' : '';
        if (sun) sun.style.display = dark ? '' : 'none';

        // Atualizar gráficos Chart.js se existirem
        if (dark && window.Chart) {
            Chart.defaults.color = '#5e7a96';
            Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(22,27,34,0.95)';
            Chart.defaults.plugins.tooltip.titleColor = '#e6edf3';
            Chart.defaults.plugins.tooltip.bodyColor = '#9fb3c8';
        } else if (window.Chart) {
            Chart.defaults.color = '#8a95a5';
            Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(30,30,40,0.92)';
            Chart.defaults.plugins.tooltip.titleColor = '#2d3748';
            Chart.defaults.plugins.tooltip.bodyColor = '#5a6676';
        }

        // Re-renderizar dashboard se ativo
        if (SGE.state && SGE.state.activeView === 'viz' && SGE.dashboard) {
            SGE.dashboard.render();
        }
    },

    isDark() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }
};

// Auto-init assim que o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SGE.darkMode.init());
} else {
    SGE.darkMode.init();
}
