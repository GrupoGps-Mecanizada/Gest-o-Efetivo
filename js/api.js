'use strict';

/**
 * SGE — API Communication (Supabase Edition)
 * Handles data synchronization and real-time updates using Supabase
 */
window.SGE = window.SGE || {};

SGE.api = {
    activeRequests: 0,
    subscriptions: [],

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

                setTimeout(() => {
                    if (this.activeRequests === 0) {
                        bar.classList.remove('success');
                    }
                }, 500);
            }
        }
    },

    /**
     * Standardized error handler for Supabase responses
     */
    _handleError(error, context) {
        console.error(`SGE Supabase [${context}]:`, error.message);
        SGE.helpers.toast(`Erro em ${context}: ${error.message}`, 'error');
        return null;
    },

    /**
     * Initialize Real-time subscriptions
     */
    setupRealtime() {
        if (!window.supabase) return;

        // Debounce: avoid flooding loadData on batch updates
        let realtimeTimer = null;
        const debouncedReload = () => {
            if (realtimeTimer) clearTimeout(realtimeTimer);
            realtimeTimer = setTimeout(() => this.loadData(true), 800);
        };

        const channels = [
            { table: 'employees', event: '*' },
            { table: 'supervisors', event: '*' },
            { table: 'equipment', event: '*' },
            { table: 'movements', event: 'INSERT' }
        ];

        channels.forEach(ch => {
            const subscription = supabase
                .channel(`public:${ch.table}`)
                .on('postgres_changes', { event: ch.event, schema: 'public', table: ch.table }, (payload) => {
                    console.info(`SGE Real-time: Change in ${ch.table}`, payload);
                    debouncedReload();
                })
                .subscribe();

            this.subscriptions.push(subscription);
        });

        console.info('SGE: Real-time subscriptions active.');
    },

    /**
     * Load all data from Supabase
     * @param {boolean} silent - If true, won't show the sync bar
     */
    async loadData(silent = false) {
        if (!window.supabase) {
            console.warn('SGE: Supabase client not initialized. Waiting for config...');
            return false;
        }

        try {
            if (!silent) this.updateSyncBar(true);

            // Fetch everything in parallel
            const [
                { data: employees, error: errEmp },
                { data: supervisors, error: errSup },
                { data: movements, error: errMov },
                { data: equipment, error: errEq },
                { data: configs, error: errCfg }
            ] = await Promise.all([
                supabase.from('employees').select('*, supervisors(name), equipment(sigla, numero)'),
                supabase.from('supervisors').select('*').order('name'),
                supabase.from('movements').select('*, employees(name)').order('created_at', { ascending: false }).limit(100),
                supabase.from('equipment').select('*'),
                supabase.from('app_config').select('*')
            ]);

            if (!silent) this.updateSyncBar(false);

            if (errEmp) return this._handleError(errEmp, 'Carregar Colaboradores');
            if (errSup) return this._handleError(errSup, 'Carregar Supervisores');
            if (errMov) return this._handleError(errMov, 'Carregar Histórico');
            if (errEq) return this._handleError(errEq, 'Carregar Equipamentos');

            // Map Supabase JSON structure back to SGE state format
            // SGE internally uses strings for supervisor and equipment in collaborators
            SGE.state.colaboradores = employees.map(e => ({
                id: e.id,
                nome: e.name,
                funcao: e.function,
                cr: e.cr,
                regime: e.regime,
                status: e.status,
                telefone: e.telefone,
                matricula_usiminas: e.matricula_usiminas,
                matricula_gps: e.matricula_gps,
                supervisor: e.supervisors ? e.supervisors.name : 'SEM SUPERVISOR',
                equipamento: e.equipment ? `${e.equipment.sigla}-${e.equipment.numero || ''}`.replace(/-$/, '') : 'SEM EQUIPAMENTO'
            }));

            SGE.state.supervisores = supervisors.map(s => ({
                id: s.id,
                nome: s.name,
                regime_padrao: s.default_regime || 'Misto',
                ativo: s.is_active !== false // Defaults to true if missing
            }));

            // Map movements
            SGE.state.movimentacoes = movements.map(m => ({
                ...m,
                colaborador_nome: m.employees ? m.employees.name : 'Desconhecido',
                colaborador_matricula: m.employees ? (m.employees.matricula_gps || 'S/ MAT') : 'S/ MAT'
            }));

            // Sort movements by effective_date then created_at
            SGE.state.movimentacoes.sort((a, b) => {
                const dateA = a.effective_date || a.created_at;
                const dateB = b.effective_date || b.created_at;
                return new Date(dateB) - new Date(dateA);
            });

            SGE.state.equipamentos = equipment;

            // Load configurations
            if (configs) {
                configs.forEach(cfg => {
                    if (SGE.CONFIG[cfg.key]) SGE.CONFIG[cfg.key] = cfg.value;
                });
            }

            SGE.state.dataLoaded = true;
            this.cacheData();

            // Trigger UI refresh if data changed
            this.refreshUI();

            return true;
        } catch (e) {
            if (!silent) this.updateSyncBar(false);
            console.error('SGE Data loading failed:', e);
            return false;
        }
    },

    /**
     * Intelligently refresh the visible parts of the UI
     */
    refreshUI() {
        const v = SGE.state.activeView;
        SGE.helpers.updateStats();

        if (v === 'kanban' && !(SGE.state.drag && SGE.state.drag.cardData)) SGE.kanban.render();
        if (v === 'viz' && SGE.dashboard) SGE.dashboard.render();
        if (v === 'equip' && SGE.equip) SGE.equip.render();
        if (v === 'search' && SGE.search) SGE.search.render();
        if (v === 'history' && SGE.history) SGE.history.render();
        if (v === 'tabela' && SGE.viz) SGE.viz.renderTable();
        if (v === 'grupo' && SGE.viz) SGE.viz.renderGroups();
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
                equipamentos: SGE.state.equipamentos
            };
            localStorage.setItem('SGE_CACHE', JSON.stringify(cachePayload));
        } catch (e) {
            console.warn('SGE: Could not save cache:', e);
        }
    },

    clearCache() {
        localStorage.removeItem('SGE_CACHE');
    },

    /**
     * syncBackground is now obsolete thanks to Real-time
     * Kept for signature compatibility but does nothing
     */
    syncBackground(immediate = false) {
        if (immediate) this.loadData(true);
    },

    /**
     * Mutate data in Supabase
     */
    async syncMove(movData) {
        if (!window.supabase) return null;
        this.updateSyncBar(true);

        try {
            // Find IDs for supervisors and equipment based on names (since legacy system passes names initially)
            // Note: The UI now sends `movData.supervisor_destino` (name). We need the ID.
            const targetSup = SGE.state.supervisores.find(s => s.nome === movData.supervisor_destino);
            const sourceSup = SGE.state.supervisores.find(s => s.nome === movData.supervisor_origem);

            // 1. Update Employee
            const { error: errEmp } = await supabase
                .from('employees')
                .update({
                    supervisor_id: targetSup ? targetSup.id : null,
                    regime: movData.regime_destino,
                    updated_at: new Date()
                })
                .eq('id', movData.colaborador_id);

            if (errEmp) throw errEmp;

            // 2. Log Movement
            const { error: errMov } = await supabase
                .from('movements')
                .insert({
                    employee_id: movData.colaborador_id,
                    from_supervisor_id: sourceSup ? sourceSup.id : null,
                    to_supervisor_id: targetSup ? targetSup.id : null,
                    reason: movData.motivo || 'N/A',
                    effective_date: movData.effective_date || new Date().toISOString().split('T')[0]
                });

            if (errMov) throw errMov;

            this.updateSyncBar(false);
            return true;
        } catch (e) {
            this.updateSyncBar(false);
            return this._handleError(e, 'Sincronizar Movimentação');
        }
    },

    async syncNewColaborador(colData) {
        if (!window.supabase) return null;
        this.updateSyncBar(true);

        try {
            const { data, error } = await supabase
                .from('employees')
                .insert({
                    name: colData.nome,
                    function: colData.funcao,
                    regime: colData.regime,
                    status: colData.status,
                    supervisor_id: colData.supervisor_id,
                    equipment_id: colData.equipment_id
                })
                .select();

            if (error) throw error;
            this.updateSyncBar(false);
            return data[0];
        } catch (e) {
            this.updateSyncBar(false);
            return this._handleError(e, 'Criar Colaborador');
        }
    },

    async syncEditColaborador(colData) {
        if (!window.supabase) return null;
        this.updateSyncBar(true);

        try {
            const { error } = await supabase
                .from('employees')
                .update({
                    name: colData.nome,
                    function: colData.funcao,
                    cr: colData.cr,
                    regime: colData.regime,
                    status: colData.status,
                    telefone: colData.telefone,
                    matricula_usiminas: colData.matricula_usiminas,
                    matricula_gps: colData.matricula_gps,
                    supervisor_id: colData.supervisor_id,
                    equipment_id: colData.equipment_id,
                    updated_at: new Date()
                })
                .eq('id', colData.id);

            if (error) throw error;
            this.updateSyncBar(false);
            return true;
        } catch (e) {
            this.updateSyncBar(false);
            return this._handleError(e, 'Editar Colaborador');
        }
    },

    /**
     * Batch update multiple employees in Supabase
     * @param {Array} updates - Array of {id, ...fieldsToUpdate}
     */
    async syncBatchColaboradores(updates) {
        if (!window.supabase || !updates || updates.length === 0) return null;
        this.updateSyncBar(true);

        try {
            const fieldMap = {
                funcao: 'function',
                regime: 'regime',
                status: 'status',
                equipamento: null, // handled specially
                telefone: 'telefone',
                matricula_usiminas: 'matricula_usiminas',
                matricula_gps: 'matricula_gps'
            };

            const promises = updates.map(async (u) => {
                const patch = { updated_at: new Date() };

                for (const [frontKey, dbKey] of Object.entries(fieldMap)) {
                    if (u[frontKey] !== undefined && dbKey) {
                        patch[dbKey] = u[frontKey];
                    }
                }

                // Handle supervisor name → ID lookup
                if (u.supervisor !== undefined) {
                    const sup = SGE.state.supervisores.find(s => s.nome === u.supervisor);
                    patch.supervisor_id = sup ? sup.id : null;
                }

                return supabase.from('employees').update(patch).eq('id', u.id);
            });

            const results = await Promise.all(promises);
            const errors = results.filter(r => r.error);
            if (errors.length > 0) {
                console.warn(`SGE Batch: ${errors.length}/${updates.length} failed`, errors);
            }

            this.updateSyncBar(false);
            return true;
        } catch (e) {
            this.updateSyncBar(false);
            return this._handleError(e, 'Atualização em lote');
        }
    },

    /**
     * Upsert a config value into app_config table
     * @param {string} configKey - The config key (e.g. 'regimes', 'funcoes')
     * @param {*} value - The value to store (will be stored as JSONB)
     */
    async syncConfigArray(configKey, value) {
        if (!window.supabase) return null;

        try {
            const { error } = await supabase
                .from('app_config')
                .upsert({ key: configKey, value }, { onConflict: 'key' });

            if (error) throw error;
            return true;
        } catch (e) {
            return this._handleError(e, `Salvar config: ${configKey}`);
        }
    },

    /**
     * CRUD operations on the supervisors table
     * @param {'create'|'update'|'delete'} action
     * @param {Object} data - Supervisor data
     */
    async syncSupervisor(action, data) {
        if (!window.supabase) return null;
        this.updateSyncBar(true);

        try {
            let result;

            if (action === 'create') {
                const { data: inserted, error } = await supabase
                    .from('supervisors')
                    .insert({
                        name: data.nome,
                        default_regime: data.regime_padrao || 'Misto',
                        is_active: data.ativo !== false
                    })
                    .select();
                if (error) throw error;
                result = inserted?.[0];
            } else if (action === 'update') {
                const patch = {};
                if (data.nome !== undefined) patch.name = data.nome;
                if (data.regime_padrao !== undefined) patch.default_regime = data.regime_padrao;
                if (data.ativo !== undefined) patch.is_active = data.ativo;

                if (Object.keys(patch).length > 0) {
                    const { error } = await supabase
                        .from('supervisors')
                        .update(patch)
                        .eq('id', data.id);
                    if (error) throw error;
                }
                result = true;
            } else if (action === 'delete') {
                const { error } = await supabase
                    .from('supervisors')
                    .delete()
                    .eq('id', data.id);
                if (error) throw error;
                result = true;
            }

            this.updateSyncBar(false);
            return result;
        } catch (e) {
            this.updateSyncBar(false);
            return this._handleError(e, `Supervisor (${action})`);
        }
    },

    /**
     * Normalize equipment: parse all employee equipment strings,
     * upsert into equipment table, then reload data
     */
    async syncNormalizeEquipments() {
        if (!window.supabase) return null;
        this.updateSyncBar(true);

        try {
            const tipos = SGE.CONFIG.equipTipos;
            const equipSet = new Map();

            SGE.state.colaboradores.forEach(c => {
                if (!c.equipamento || c.equipamento === 'SEM EQUIPAMENTO') return;
                const parsed = SGE.equip ? SGE.equip.parseEquip(c.equipamento) : null;
                if (!parsed || !tipos[parsed.sigla]) return;

                const key = `${parsed.sigla}-${parsed.numero}`;
                if (!equipSet.has(key)) {
                    equipSet.set(key, {
                        sigla: parsed.sigla,
                        numero: parsed.numero,
                        escala: '24HS',
                        status: 'ATIVO'
                    });
                }
            });

            const rows = Array.from(equipSet.values());
            let updated = 0;

            if (rows.length > 0) {
                const { error } = await supabase
                    .from('equipment')
                    .upsert(rows, { onConflict: 'sigla,numero' });
                if (error) throw error;
                updated = rows.length;
            }

            // Reload all data to reflect changes
            await this.loadData(true);
            this.updateSyncBar(false);
            return { updated };
        } catch (e) {
            this.updateSyncBar(false);
            return this._handleError(e, 'Normalizar Equipamentos');
        }
    }
};
