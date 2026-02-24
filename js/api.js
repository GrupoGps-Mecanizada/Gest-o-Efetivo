'use strict';

/**
 * SGE — API Communication
 * Handles Google Apps Script API calls and data loading from Google Sheets
 */
window.SGE = window.SGE || {};

SGE.api = {
    activeRequests: 0,

    /**
     * Show/Hide sync bar based on active requests
     */
    updateSyncBar(isLoading) {
        const bar = document.getElementById('global-sync-bar');
        if (!bar) return;

        if (isLoading) {
            this.activeRequests++;
            if (this.activeRequests === 1) {
                bar.classList.remove('success');
                bar.classList.add('loading');
            }
        } else {
            this.activeRequests = Math.max(0, this.activeRequests - 1);
            if (this.activeRequests === 0) {
                bar.classList.remove('loading');
                bar.classList.add('success');

                // Remove success class after animation finishes to reset
                setTimeout(() => {
                    if (this.activeRequests === 0) {
                        bar.classList.remove('success');
                    }
                }, 500);
            }
        }
    },

    /**
     * Generic GAS API call
     * @param {string} action - The action to perform
     * @param {Object} params - Parameters for the action
     * @returns {Promise<*>} Response data or null on failure
     */
    async callGAS(action, params = {}, silent = false) {
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

            if (!silent) this.updateSyncBar(true);

            const resp = await fetch(url.toString(), {
                method: 'GET',
                redirect: 'follow'
            });
            const text = await resp.text();

            if (!silent) this.updateSyncBar(false);

            const data = JSON.parse(text);
            if (!data.success) throw new Error(data.error || 'Unknown error');
            return data.data;
        } catch (e) {
            if (!silent) this.updateSyncBar(false);
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
                SGE.api.callGAS('listar_equipamentos'),
                SGE.api.callGAS('listar_configuracoes')
            ];

            // If ADM, we add user list call to the pipeline
            let hasAdmCall = false;
            if (SGE.auth.hasRole('ADM')) {
                promises.push(SGE.api.callGAS('listar_usuarios'));
                hasAdmCall = true;
            }

            // Launch explicitly in parallel
            const results = await Promise.all(promises);

            const [colabData, supData, movData, equipData, configData] = results;
            const usrData = hasAdmCall ? results[5] : null;

            if (colabData && Array.isArray(colabData)) SGE.state.colaboradores = colabData;
            if (supData && Array.isArray(supData)) SGE.state.supervisores = supData;
            if (movData && Array.isArray(movData)) SGE.state.movimentacoes = movData;
            if (equipData && Array.isArray(equipData)) SGE.state.equipamentos = equipData;

            if (configData) {
                if (configData.regimes) SGE.CONFIG.regimes = configData.regimes;
                if (configData.funcoes) SGE.CONFIG.funcoes = configData.funcoes;
                if (configData.equipTipos) SGE.CONFIG.equipTipos = configData.equipTipos;
                if (configData.turnoMap) SGE.CONFIG.turnoMap = configData.turnoMap;
                if (configData.ordemKanban) SGE.CONFIG.ordemKanban = configData.ordemKanban;
                localStorage.setItem('SGE_CUSTOM_CONFIG', JSON.stringify(configData));
            }

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
     * Quick lightweight hash of data arrays for fast change detection.
     * Uses length + first+last item id to avoid full JSON comparison on no-change cases.
     */
    _quickHash(colabs, sups, movs, equips) {
        const snap = (arr) => {
            if (!arr || arr.length === 0) return '0';
            const first = arr[0];
            const last = arr[arr.length - 1];
            return `${arr.length}:${first.id || first.nome || ''}:${last.id || last.nome || ''}`;
        };
        return `${snap(colabs)}|${snap(sups)}|${snap(movs)}|${snap(equips)}`;
    },

    /**
     * Debounced syncBackground — coalesces rapid successive calls into one.
     * Safe to call at will after any mutation. Only one sync runs at a time.
     */
    syncBackground: (() => {
        let debounceTimer = null;
        let running = false;

        const _doSync = async () => {
            if (running || !SGE.CONFIG.gasUrl) return;
            running = true;

            try {
                // Fetch everything in parallel (silent — no sync bar)
                const promises = [
                    SGE.api.callGAS('listar_colaboradores', {}, true),
                    SGE.api.callGAS('listar_supervisores', {}, true),
                    SGE.api.callGAS('listar_movimentacoes', {}, true),
                    SGE.api.callGAS('listar_equipamentos', {}, true)
                ];

                let hasAdmCall = false;
                if (SGE.auth.hasRole('ADM')) {
                    promises.push(SGE.api.callGAS('listar_usuarios', {}, true));
                    hasAdmCall = true;
                }

                const results = await Promise.all(promises);
                const [colabData, supData, movData, equipData] = results;
                const usrData = hasAdmCall ? results[4] : null;

                if (!colabData) {
                    running = false;
                    return; // Network issue, skip
                }

                // Fast pre-check: compare lightweight hashes before doing expensive JSON.stringify
                const newHash = SGE.api._quickHash(colabData, supData, movData, equipData);
                if (newHash === SGE.state.lastSyncHash) {
                    // console.log('SGE Sync: No changes detected (hash match).');
                    running = false;
                    return;
                }

                // Deep comparison only when hashes differ
                const colabChanged = JSON.stringify(colabData) !== JSON.stringify(SGE.state.colaboradores);
                const supChanged = JSON.stringify(supData) !== JSON.stringify(SGE.state.supervisores);
                const movChanged = JSON.stringify(movData) !== JSON.stringify(SGE.state.movimentacoes);
                const equipChanged = JSON.stringify(equipData) !== JSON.stringify(SGE.state.equipamentos);
                const usrChanged = hasAdmCall && usrData
                    && JSON.stringify(usrData) !== JSON.stringify(SGE.state.usuarios);

                const hasChanges = colabChanged || supChanged || movChanged || equipChanged || usrChanged;

                if (hasChanges) {
                    console.log('SGE Sync: New data detected — updating state.');

                    if (colabData) SGE.state.colaboradores = colabData;
                    if (supData) SGE.state.supervisores = supData;
                    if (movData) SGE.state.movimentacoes = movData;
                    if (equipData) SGE.state.equipamentos = equipData;
                    if (usrData) SGE.state.usuarios = usrData;

                    SGE.state.lastSyncHash = SGE.api._quickHash(
                        SGE.state.colaboradores,
                        SGE.state.supervisores,
                        SGE.state.movimentacoes,
                        SGE.state.equipamentos
                    );

                    SGE.api.cacheData();
                    SGE.helpers.updateStats();

                    // Re-render ONLY the currently visible view, intelligently
                    const v = SGE.state.activeView;

                    // Kanban uses smart DOM morphing (won't interrupt scroll/drag)
                    if (v === 'kanban' && !(SGE.state.drag && SGE.state.drag.cardData)) {
                        SGE.kanban.render();
                    }
                    if (v === 'viz' && SGE.dashboard) SGE.dashboard.render();
                    if (v === 'equip' && SGE.equip) SGE.equip.render();
                    if (v === 'search' && SGE.search) {
                        const si = document.getElementById('search-input');
                        SGE.search.render(si ? si.value : '');
                    }
                    if (v === 'history' && SGE.history) SGE.history.render();
                    if (v === 'tabela' && SGE.viz) SGE.viz.renderTable();
                    if (v === 'grupo' && SGE.viz) SGE.viz.renderGroups();

                } else {
                    SGE.state.lastSyncHash = newHash;
                }
            } catch (e) {
                console.warn('SGE Sync error:', e);
            } finally {
                running = false;
            }
        };

        // Public interface: debounced by 300ms, only one run at a time
        return function syncBackground(immediate = false) {
            if (immediate) {
                clearTimeout(debounceTimer);
                _doSync();
                return;
            }
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(_doSync, 300);
        };
    })(),

    /**
     * Sync a movement to GAS
     */
    async syncMove(movData) {
        const res = await SGE.api.callGAS('mover_colaborador', movData);
        SGE.api.syncBackground(true); // immediate sync after mutation
        return res;
    },

    /**
     * Sync a new collaborator to GAS
     */
    async syncNewColaborador(colData) {
        const res = await SGE.api.callGAS('criar_colaborador', colData);
        SGE.api.syncBackground(true);
        return res;
    },

    /**
     * Sync collaborator edit to GAS
     */
    async syncEditColaborador(colData) {
        const res = await SGE.api.callGAS('editar_colaborador', colData);
        SGE.api.syncBackground(true);
        return res;
    },

    /**
     * Sync a batch of collaborators to GAS
     */
    async syncBatchColaboradores(updatesArray) {
        if (!updatesArray || updatesArray.length === 0) return true;
        const res = await SGE.api.callGAS('atualizar_lote_colaboradores', { atualizacoes: updatesArray });
        SGE.api.syncBackground(true);
        return res;
    },

    /**
     * Sync ID update to GAS
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
