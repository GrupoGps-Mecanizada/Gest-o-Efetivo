'use strict';

/**
 * SGE — State Management
 * Centralized application state
 */
window.SGE = window.SGE || {};

SGE.state = {
    colaboradores: [],
    supervisores: [],
    movimentacoes: [],
    equipamentos: [],
    usuarios: [],
    filtros: { regime: [], funcao: [], status: [] },
    activeView: 'kanban',
    drawerColaborador: null,
    pendingMove: null,
    modalContext: null, // 'move' | 'edit' | 'moveSelector'
    dataLoaded: false,

    // Equipment view state
    equip: {
        filtroTipo: 'TODOS',
        filtroTurno: 'TODOS'
    },

    // Visualization state
    viz: {
        mode: 'table',
        sortCol: 'nome',
        sortAsc: true,
        groupBy: 'regime'
    },

    // Drag state
    drag: {
        cardData: null,
        colSrcIdx: null
    },

    // Scroll positions per view — persisted to sessionStorage
    scrollPositions: {},

    // Background sync state
    syncLock: false,          // Prevents concurrent background syncs
    syncDebounceTimer: null,  // Timer for debounced sync calls
    lastSyncHash: null        // Quick hash comparison to skip re-renders
};
