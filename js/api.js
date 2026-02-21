'use strict';

/**
 * SGE — API Communication
 * Handles Google Apps Script API calls and data loading from Google Sheets
 */
window.SGE = window.SGE || {};

SGE.api = {
    /**
     * Generic GAS API call
     * @param {string} action - The action to perform
     * @param {Object} params - Parameters for the action
     * @returns {Promise<*>} Response data or null on failure
     */
    async callGAS(action, params = {}) {
        if (!SGE.CONFIG.gasUrl) return null;
        try {
            // GAS Web Apps redirect on POST which loses CORS headers.
            // Using GET with query params avoids this completely.
            const url = new URL(SGE.CONFIG.gasUrl);
            url.searchParams.set('action', action);
            url.searchParams.set('params', JSON.stringify(params));

            const resp = await fetch(url.toString(), {
                method: 'GET',
                redirect: 'follow'
            });
            const text = await resp.text();
            const data = JSON.parse(text);
            if (!data.success) throw new Error(data.error || 'Unknown error');
            return data.data;
        } catch (e) {
            console.warn('GAS call failed:', e.message);
            return null;
        }
    },

    /**
     * Load all data from Google Sheets via GAS
     * Populates state.colaboradores and state.supervisores
     */
    async loadData() {
        if (!SGE.CONFIG.gasUrl) {
            console.info('SGE: No GAS URL configured. Set SGE.CONFIG.gasUrl in js/config.js');
            SGE.state.dataLoaded = true;
            return false;
        }

        try {
            // Load collaborators
            const colabData = await SGE.api.callGAS('listar_colaboradores');
            if (colabData && Array.isArray(colabData)) {
                SGE.state.colaboradores = colabData;
            }

            // Load supervisors
            const supData = await SGE.api.callGAS('listar_supervisores');
            if (supData && Array.isArray(supData)) {
                SGE.state.supervisores = supData;
            }

            // Load movement history
            const movData = await SGE.api.callGAS('listar_movimentacoes');
            if (movData && Array.isArray(movData)) {
                SGE.state.movimentacoes = movData;
            }

            SGE.state.dataLoaded = true;
            return true;
        } catch (e) {
            console.error('SGE: Failed to load data:', e);
            SGE.state.dataLoaded = true;
            return false;
        }
    },

    /**
     * Sync a movement to GAS
     * @param {Object} movData - Movement parameters
     */
    async syncMove(movData) {
        return SGE.api.callGAS('mover_colaborador', movData);
    },

    /**
     * Sync a new collaborator to GAS
     * @param {Object} colData - Collaborator data
     */
    async syncNewColaborador(colData) {
        return SGE.api.callGAS('criar_colaborador', colData);
    },

    /**
     * Sync collaborator edit to GAS
     * @param {Object} colData - Updated collaborator data
     */
    async syncEditColaborador(colData) {
        return SGE.api.callGAS('editar_colaborador', colData);
    },

    /**
     * Sync ID update to GAS
     * @param {string} tempId - Temporary ID
     * @param {string} newId - New permanent ID
     */
    async syncIdUpdate(tempId, newId) {
        return SGE.api.callGAS('atualizar_id', { temp_id: tempId, novo_id: newId });
    },

    /**
     * Reset and rebuild supervisors from collaborator data
     */
    async limparSupervisores() {
        return SGE.api.callGAS('limpar_supervisores');
    }
};
