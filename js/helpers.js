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
     * Check if collaborator has a temporary ID or missing Matricula GPS
     */
    isSemId(col) {
        return col.status === 'SEM_ID' || !col.matricula_gps || String(col.matricula_gps).trim() === '';
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
            // Regime filter (multi-select)
            if (f.regime && f.regime.length > 0 && !f.regime.includes(c.regime)) return false;
            // Funcao filter (multi-select)
            if (f.funcao && f.funcao.length > 0 && !f.funcao.includes(c.funcao)) return false;
            // Status filter (multi-select, with special cases)
            if (f.status && f.status.length > 0) {
                const matchesStatus = f.status.some(s => {
                    if (s === 'FÉRIAS') return SGE.helpers.isFerias(c);
                    if (s === 'SEM EQUIP') return SGE.helpers.isSemEquipamento(c);
                    if (s === 'SEM_ID') return SGE.helpers.isSemId(c);
                    return c.status === s;
                });
                if (!matchesStatus) return false;
            }
            // Supervisor filter
            if (f.supervisor && f.supervisor.length > 0 && !f.supervisor.includes(c.supervisor)) return false;
            // Categoria filter (OPERACIONAL / GESTAO)
            if (f.categoria && f.categoria.length > 0 && !f.categoria.includes(c.categoria)) return false;
            // EquipTipo filter
            if (f.equipTipo && f.equipTipo.length > 0) {
                const parsed = SGE.equip ? SGE.equip.parseEquip(c.equipamento) : null;
                if (!parsed || !f.equipTipo.includes(parsed.sigla)) return false;
            }
            // EquipTurno filter
            if (f.equipTurno && f.equipTurno.length > 0) {
                const turno = SGE.equip ? SGE.equip.getTurno(c.regime) : null;
                if (!turno || !f.equipTurno.includes(turno)) return false;
            }
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

        // Menu stats (primary)
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
        setVal('stat-total-menu', total);
        setVal('stat-ativos-menu', ativos);
        setVal('stat-semid-menu', semId);
    },

    /**
     * Get the equipamento icon SVG
     */
    equipamentoIconSvg() {
        return '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="4" width="10" height="7" rx="1"/><path d="M4 4V3a2 2 0 014 0v1"/></svg>';
    }
};
