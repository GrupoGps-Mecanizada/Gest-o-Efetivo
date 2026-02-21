'use strict';

/**
 * SGE — Helper Functions
 * Utility functions used across the application
 */
window.SGE = window.SGE || {};

SGE.helpers = {
    /**
     * Get CSS class for regime badge
     */
    regimeBadgeClass(regime) {
        if (!regime) return 'badge-SEM';
        if (regime.startsWith('24HS-A')) return 'badge-24A';
        if (regime.startsWith('24HS-B')) return 'badge-24B';
        if (regime.startsWith('24HS-C')) return 'badge-24C';
        if (regime.startsWith('24HS-D')) return 'badge-24D';
        if (regime.startsWith('ADM')) return 'badge-ADM';
        if (regime.startsWith('16HS')) return 'badge-16HS';
        return 'badge-SEM';
    },

    /**
     * Check if collaborator has a temporary ID
     */
    isSemId(col) {
        return col.id && col.id.startsWith('COL_TEMP_');
    },

    /**
     * Check if collaborator has no assigned position
     */
    isSemEquipamento(col) {
        return !col.equipamento || col.equipamento === 'SEM EQUIPAMENTO' || col.equipamento === 'NÃO INFORMADA';
    },

    /**
     * Check if collaborator is on vacation
     */
    isFerias(col) {
        return col.status && col.status.startsWith('FÉRIAS');
    },

    /**
     * Filter collaborators based on active filters
     */
    filtrarColaboradores() {
        const f = SGE.state.filtros;
        return SGE.state.colaboradores.filter(c => {
            if (f.regime && c.regime !== f.regime) return false;
            if (f.funcao && c.funcao !== f.funcao) return false;
            if (f.status === 'FÉRIAS' && !SGE.helpers.isFerias(c)) return false;
            if (f.status === 'SEM EQUIP' && !SGE.helpers.isSemEquipamento(c)) return false;
            if (f.status === 'SEM_ID' && !SGE.helpers.isSemId(c)) return false;
            return true;
        });
    },

    /**
     * Show toast notification
     */
    toast(msg, type = 'success') {
        const icons = {
            success: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="2 8 6 12 14 4"/></svg>',
            error: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 2l12 12M14 2L2 14"/></svg>',
            info: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="7"/><path d="M8 5v4M8 11v1"/></svg>',
        };
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = (icons[type] || '') + msg;
        document.getElementById('toast-container').appendChild(el);
        setTimeout(() => el.remove(), SGE.CONFIG.toastDuration);
    },

    /**
     * Format ISO date to pt-BR locale string
     */
    formatDate(iso) {
        if (!iso) return '—';
        try { return new Date(iso).toLocaleString('pt-BR'); } catch { return iso; }
    },

    /**
     * Update statistics in the topbar
     */
    updateStats() {
        const total = SGE.state.colaboradores.length;
        const ativos = SGE.state.colaboradores.filter(c => c.status === 'ATIVO').length;
        const semId = SGE.state.colaboradores.filter(c => SGE.helpers.isSemId(c)).length;

        document.getElementById('stat-total').textContent = total || '—';
        document.getElementById('stat-ativos').textContent = ativos || '—';
        document.getElementById('stat-semid').textContent = semId || '—';
    },

    /**
     * Get the equipamento icon SVG
     */
    equipamentoIconSvg() {
        return '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="4" width="10" height="7" rx="1"/><path d="M4 4V3a2 2 0 014 0v1"/></svg>';
    }
};
