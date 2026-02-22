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

            // Auto-inject current user for backend audit logs
            if (SGE.auth && SGE.auth.currentUser) {
                params._user = SGE.auth.currentUser.usuario;
            }

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
            // Prepare all API calls simultaneously
            const promises = [
                SGE.api.callGAS('listar_colaboradores'),
                SGE.api.callGAS('listar_supervisores'),
                SGE.api.callGAS('listar_movimentacoes'),
                SGE.api.callGAS('listar_equipamentos')
            ];

            // If ADM, we add user list call to the pipeline
            let hasAdmCall = false;
            if (SGE.auth.hasRole('ADM')) {
                promises.push(SGE.api.callGAS('listar_usuarios'));
                hasAdmCall = true;
            }

            // Launch explicitly in parallel
            const results = await Promise.all(promises);

            const [colabData, supData, movData, equipData] = results;
            const usrData = hasAdmCall ? results[4] : null;

            if (colabData && Array.isArray(colabData)) SGE.state.colaboradores = colabData;
            if (supData && Array.isArray(supData)) SGE.state.supervisores = supData;
            if (movData && Array.isArray(movData)) SGE.state.movimentacoes = movData;
            if (equipData && Array.isArray(equipData)) SGE.state.equipamentos = equipData;

            if (hasAdmCall && usrData && Array.isArray(usrData)) {
                SGE.state.usuarios = usrData;
            }

            SGE.state.dataLoaded = true;
            SGE.api.cacheData(); // Save loaded data to local storage
            return true;
        } catch (e) {
            console.error('Error loading data:', e);
            return false;
        }
    },

    /**
     * Save current state to LocalStorage for instant boot
     */
    cacheData() {
        try {
            const cachePayload = {
                timestamp: Date.now(),
                colaboradores: SGE.state.colaboradores,
                supervisores: SGE.state.supervisores,
                movimentacoes: SGE.state.movimentacoes,
                equipamentos: SGE.state.equipamentos,
                usuarios: SGE.state.usuarios
            };
            localStorage.setItem('SGE_CACHE', JSON.stringify(cachePayload));
        } catch (e) {
            console.warn('Could not save cache to localStorage:', e);
        }
    },

    /**
     * Delete cache (useful on logout)
     */
    clearCache() {
        localStorage.removeItem('SGE_CACHE');
    },

    /**
     * Background sync - fetches fresh data silently and updates UI if changed
     */
    async syncBackground() {
        if (!SGE.CONFIG.gasUrl) return;
        try {
            console.log('SGE: Starting background sync...');

            // Quickly check status/hash first to see if anything changed (optional optimization)
            const status = await SGE.api.callGAS('status');

            // Fetch everything in parallel
            const promises = [
                SGE.api.callGAS('listar_colaboradores'),
                SGE.api.callGAS('listar_supervisores'),
                SGE.api.callGAS('listar_movimentacoes'),
                SGE.api.callGAS('listar_equipamentos')
            ];

            let hasAdmCall = false;
            if (SGE.auth.hasRole('ADM')) {
                promises.push(SGE.api.callGAS('listar_usuarios'));
                hasAdmCall = true;
            }

            const results = await Promise.all(promises);

            const [colabData, supData, movData, equipData] = results;
            const usrData = hasAdmCall ? results[4] : null;

            let hasChanges = false;

            // Simple cheap comparison: check lengths or stringified versions
            if (JSON.stringify(colabData) !== JSON.stringify(SGE.state.colaboradores)) hasChanges = true;
            if (JSON.stringify(supData) !== JSON.stringify(SGE.state.supervisores)) hasChanges = true;
            if (JSON.stringify(movData) !== JSON.stringify(SGE.state.movimentacoes)) hasChanges = true;
            if (JSON.stringify(equipData) !== JSON.stringify(SGE.state.equipamentos)) hasChanges = true;
            if (hasAdmCall && usrData && JSON.stringify(usrData) !== JSON.stringify(SGE.state.usuarios)) hasChanges = true;

            if (hasChanges) {
                console.log('SGE: Background sync found new data. Updating state globally.');
                if (colabData) SGE.state.colaboradores = colabData;
                if (supData) SGE.state.supervisores = supData;
                if (movData) SGE.state.movimentacoes = movData;
                if (equipData) SGE.state.equipamentos = equipData;
                if (usrData) SGE.state.usuarios = usrData;

                SGE.api.cacheData();

                // Re-render currently visible views
                SGE.kanban.render();
                SGE.helpers.updateStats();
                if (document.getElementById('equip-view').classList.contains('active')) SGE.equip.render();

                SGE.helpers.toast('Base de dados sincronizada automaticamente.', 'success');
            } else {
                console.log('SGE: Background sync complete. No changes detected.');
            }
        } catch (e) {
            console.warn('SGE: Background sync failed:', e);
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
