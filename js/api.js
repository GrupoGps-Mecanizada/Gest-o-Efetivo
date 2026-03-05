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
        // Skip reload during active modal edits to prevent race conditions
        let realtimeTimer = null;
        const debouncedReload = () => {
            // Don't reload while user is editing — prevents the "wrong name" bug
            if (SGE.state.modalContext === 'edit' || SGE.state._editingColabId) {
                console.info('SGE Real-time: Skipping reload — modal edit active');
                return;
            }
            if (realtimeTimer) clearTimeout(realtimeTimer);
            realtimeTimer = setTimeout(() => this.loadData(true), 800);
        };

        const channels = [
            { schema: 'gps_mec', table: 'efetivo_gps_mec_colaboradores', event: '*' },
            { schema: 'gps_mec', table: 'efetivo_gps_mec_supervisores', event: '*' },
            { schema: 'gps_mec', table: 'efetivo_gps_mec_setores', event: '*' },
            { schema: 'gps_mec', table: 'efetivo_gps_mec_equipamentos', event: '*' },
            { schema: 'gps_mec', table: 'efetivo_gps_mec_movimentacoes', event: 'INSERT' },
            { schema: 'gps_mec', table: 'efetivo_gps_mec_ferias', event: '*' },
            { schema: 'gps_mec', table: 'efetivo_gps_mec_advertencias', event: '*' },
            { schema: 'gps_mec', table: 'efetivo_gps_mec_catalogo_treinamentos', event: '*' },
            { schema: 'gps_mec', table: 'efetivo_gps_mec_colaborador_treinamentos', event: '*' },
            { schema: 'gps_compartilhado', table: 'gps_configuracoes_sistema', event: '*' }
        ];

        channels.forEach(ch => {
            const subscription = supabase
                .channel(`realtime:${ch.schema}:${ch.table}`)
                .on('postgres_changes', { event: ch.event, schema: ch.schema, table: ch.table }, (payload) => {
                    console.info(`SGE Real-time: Change in ${ch.schema}.${ch.table}`, payload);
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
                { data: setores, error: errSetores },
                { data: movements, error: errMov },
                { data: equipment, error: errEq },
                { data: configs, error: errCfg }
            ] = await Promise.all([
                supabase.schema('gps_mec').from('efetivo_gps_mec_colaboradores').select('id, name, function, cr, regime, status, telefone, matricula_usiminas, matricula_gps, category, supervisor_id, equipment_id, setor_id, supervisors:efetivo_gps_mec_supervisores(name), equipment:efetivo_gps_mec_equipamentos(sigla, numero), setores:efetivo_gps_mec_setores(nome)'),
                supabase.schema('gps_mec').from('efetivo_gps_mec_supervisores').select('*').order('name'),
                supabase.schema('gps_mec').from('efetivo_gps_mec_setores').select('*').order('nome'),
                supabase.schema('gps_mec').from('efetivo_gps_mec_movimentacoes').select('*, employees:efetivo_gps_mec_colaboradores(name, matricula_gps), from_sup:efetivo_gps_mec_supervisores!movements_from_supervisor_id_fkey(name), to_sup:efetivo_gps_mec_supervisores!movements_to_supervisor_id_fkey(name)').order('created_at', { ascending: false }).limit(100),
                supabase.schema('gps_mec').from('efetivo_gps_mec_equipamentos').select('*'),
                supabase.schema('gps_compartilhado').from('gps_configuracoes_sistema').select('*').eq('sistema', 'EFETIVO').eq('setor', 'MEC')
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
                categoria: e.category || 'OPERACIONAL',
                supervisor: e.supervisors ? e.supervisors.name : 'SEM SUPERVISOR',
                equipamento: e.equipment ? `${e.equipment.sigla}-${e.equipment.numero || ''}`.replace(/-$/, '') : 'SEM EQUIPAMENTO',
                setor: e.setores ? e.setores.nome : 'SEM SETOR',
                setor_id: e.setor_id
            }));

            // DEBUG: log category distribution to verify DB mapping
            const catDebug = {};
            SGE.state.colaboradores.forEach(c => {
                catDebug[c.categoria] = (catDebug[c.categoria] || 0) + 1;
            });
            console.log('[SGE DEBUG] Category distribution:', catDebug);
            console.log('[SGE DEBUG] First employee raw:', employees[0]);
            SGE.state.supervisores = supervisors.map(s => ({
                id: s.id,
                nome: s.name,
                regime_padrao: s.default_regime || 'Misto',
                ativo: s.is_active !== false // Defaults to true if missing
            }));

            SGE.state.setores = setores || [];

            // Map movements
            SGE.state.movimentacoes = movements.map(m => ({
                ...m,
                colaborador_nome: m.employees ? m.employees.name : 'Desconhecido',
                colaborador_matricula: m.employees ? (m.employees.matricula_gps || 'S/ MAT') : 'S/ MAT',
                supervisor_origem: m.from_sup ? m.from_sup.name : 'SEM SUPERVISOR',
                supervisor_destino: m.to_sup ? m.to_sup.name : 'SEM SUPERVISOR',
                regime_origem: m.from_regime || '—',
                regime_destino: m.to_regime || '—',
                motivo: m.reason || 'N/A',
                observacao: m.observation || '—',
                usuario: m.created_by_name || 'Sistema'
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
                    // Mapeia de volta para as chaves antigas para não quebrar o frontend
                    const legacyKeys = {
                        'tipos_equipamento': 'equipTipos',
                        'funcoes': 'funcoes',
                        'motivos_movimentacao': 'motivos',
                        'regimes': 'regimes',
                        'status_colaborador': 'statuses',
                        'mapa_turnos': 'turnoMap',
                        'ordem_kanban': 'ordemKanban'
                    };
                    const mappedKey = legacyKeys[cfg.chave] || cfg.chave;
                    if (SGE.CONFIG[mappedKey] !== undefined) SGE.CONFIG[mappedKey] = cfg.valor;
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
        if (v === 'ferias' && SGE.ferias) SGE.ferias.render();
        if (v === 'treinamentos' && SGE.treinamentos) SGE.treinamentos.render();
        if (v === 'advertencias' && SGE.advertencias) SGE.advertencias.render();
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
                setores: SGE.state.setores,
                movimentacoes: SGE.state.movimentacoes,
                equipamentos: SGE.state.equipamentos,
                treinamentosCatalogo: SGE.state.treinamentosCatalogo,
                colaboradorTreinamentos: SGE.state.colaboradorTreinamentos,
                ferias: SGE.state.ferias,
                advertencias: SGE.state.advertencias
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
     * syncBackground triggers a silent fetch of all data and refreshes UI if loaded
     */
    async syncBackground(immediate = false) {
        if (immediate) {
            await Promise.all([
                this.loadData(true),
                this.loadFerias(),
                this.loadTreinamentos(),
                this.loadAdvertencias()
            ]);
        }
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

            const { error: errEmp } = await supabase
                .schema('gps_mec')
                .from('efetivo_gps_mec_colaboradores')
                .update({
                    supervisor_id: targetSup ? targetSup.id : null,
                    regime: movData.regime_destino,
                    updated_at: new Date()
                })
                .eq('id', movData.colaborador_id);

            if (errEmp) throw errEmp;

            // 2. Log Movement
            const userName = movData.usuario
                || (SGE.auth.currentUser ? (SGE.auth.currentUser.nome || SGE.auth.currentUser.usuario) : null)
                || 'Sistema';

            const { error: errMov } = await supabase
                .schema('gps_mec')
                .from('efetivo_gps_mec_movimentacoes')
                .insert({
                    employee_id: movData.colaborador_id,
                    from_supervisor_id: sourceSup ? sourceSup.id : null,
                    to_supervisor_id: targetSup ? targetSup.id : null,
                    from_regime: movData.regime_origem || null,
                    to_regime: movData.regime_destino || null,
                    reason: movData.motivo || 'N/A',
                    observation: movData.observacao || null,
                    created_by_name: userName,
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
                .schema('gps_mec')
                .from('efetivo_gps_mec_colaboradores')
                .insert({
                    name: colData.nome,
                    function: colData.funcao,
                    regime: colData.regime,
                    status: colData.status,
                    category: colData.categoria || 'OPERACIONAL',
                    supervisor_id: colData.supervisor_id,
                    equipment_id: colData.equipment_id,
                    setor_id: colData.setor_id || null,
                    matricula_gps: colData.matricula_gps || null,
                    matricula_usiminas: colData.matricula_usiminas || null,
                    telefone: colData.telefone || null
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
            // Handle supervisor name → ID lookup
            const sup = SGE.state.supervisores.find(s => s.nome === colData.supervisor);
            const supId = sup ? sup.id : (colData.supervisor_id || null);

            // Handle equipment string → ID lookup
            let equipId = null;
            if (colData.equipamento && colData.equipamento !== 'SEM EQUIPAMENTO') {
                const parsed = SGE.equip ? SGE.equip.parseEquip(colData.equipamento) : null;
                if (parsed) {
                    const eqObj = SGE.state.equipamentos.find(eq => eq.sigla === parsed.sigla && eq.numero === parsed.numero);
                    if (eqObj) equipId = eqObj.id;
                }
            }

            // Handle setor_id — may come directly or need lookup by name
            let setorId = colData.setor_id || null;
            if (!setorId && colData.setor && colData.setor !== 'SEM SETOR') {
                const sObj = (SGE.state.setores || []).find(s => s.nome === colData.setor);
                if (sObj) setorId = sObj.id;
            }

            // If category is GESTAO, clear equipment; if OPERACIONAL, clear setor
            const categoria = colData.categoria || 'OPERACIONAL';
            if (categoria === 'GESTAO') {
                equipId = null;
            } else {
                setorId = null;
            }

            const { error } = await supabase
                .schema('gps_mec')
                .from('efetivo_gps_mec_colaboradores')
                .update({
                    name: colData.nome,
                    function: colData.funcao,
                    cr: colData.cr,
                    regime: colData.regime,
                    status: colData.status,
                    category: categoria,
                    telefone: colData.telefone,
                    matricula_usiminas: colData.matricula_usiminas,
                    matricula_gps: colData.matricula_gps,
                    supervisor_id: supId,
                    equipment_id: equipId,
                    setor_id: setorId,
                    updated_at: new Date()
                })
                .eq('id', colData.id);

            if (error) throw error;
            this.updateSyncBar(false);

            // After successful save, trigger a fresh reload to get consistent state
            setTimeout(() => this.loadData(true), 500);

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

                // Handle equipment string → ID lookup
                if (u.equipamento !== undefined) {
                    if (u.equipamento === 'SEM EQUIPAMENTO' || !u.equipamento) {
                        patch.equipment_id = null;
                    } else {
                        const parsed = SGE.equip ? SGE.equip.parseEquip(u.equipamento) : null;
                        if (parsed) {
                            const eqObj = SGE.state.equipamentos.find(eq => eq.sigla === parsed.sigla && eq.numero === parsed.numero);
                            if (eqObj) patch.equipment_id = eqObj.id;
                        }
                    }
                }

                if (u.setor !== undefined) {
                    if (u.setor === 'SEM SETOR' || !u.setor) {
                        patch.setor_id = null;
                    } else {
                        const sObj = SGE.state.setores.find(s => s.nome === u.setor);
                        if (sObj) patch.setor_id = sObj.id;
                    }
                }

                if (u.categoria !== undefined) {
                    patch.category = u.categoria;
                }

                return supabase.schema('gps_mec').from('efetivo_gps_mec_colaboradores').update(patch).eq('id', u.id);
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
            // Mapear chave antiga para a nova para persistência
            const newKeys = {
                'equipTipos': 'tipos_equipamento',
                'funcoes': 'funcoes',
                'motivos': 'motivos_movimentacao',
                'regimes': 'regimes',
                'statuses': 'status_colaborador',
                'turnoMap': 'mapa_turnos',
                'ordemKanban': 'ordem_kanban'
            };
            const mappedKey = newKeys[configKey] || configKey;

            const { error } = await supabase
                .schema('gps_compartilhado')
                .from('gps_configuracoes_sistema')
                .upsert({ sistema: 'EFETIVO', setor: 'MEC', chave: mappedKey, valor: value });

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
                    .schema('gps_mec')
                    .from('efetivo_gps_mec_supervisores')
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
                        .schema('gps_mec')
                        .from('efetivo_gps_mec_supervisores')
                        .update(patch)
                        .eq('id', data.id);
                    if (error) throw error;
                }
                result = true;
            } else if (action === 'delete') {
                const { error } = await supabase
                    .schema('gps_mec')
                    .from('efetivo_gps_mec_supervisores')
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
     * CRUD operations on the setores table
     * @param {'create'|'update'|'delete'} action
     * @param {Object} data - Setor data (nome, descricao, status)
     */
    async syncSetor(action, data) {
        if (!window.supabase) return null;
        this.updateSyncBar(true);

        try {
            let result;

            if (action === 'create') {
                const { data: inserted, error } = await supabase
                    .schema('gps_mec')
                    .from('efetivo_gps_mec_setores')
                    .insert({
                        nome: data.nome,
                        descricao: data.descricao || '',
                        status: data.status || 'ATIVO'
                    })
                    .select();
                if (error) throw error;
                result = inserted?.[0];
            } else if (action === 'update') {
                const patch = {};
                if (data.nome !== undefined) patch.nome = data.nome;
                if (data.descricao !== undefined) patch.descricao = data.descricao;
                if (data.status !== undefined) patch.status = data.status;

                if (Object.keys(patch).length > 0) {
                    const { error } = await supabase
                        .schema('gps_mec')
                        .from('efetivo_gps_mec_setores')
                        .update(patch)
                        .eq('id', data.id);
                    if (error) throw error;
                }
                result = true;
            } else if (action === 'delete') {
                const { error } = await supabase
                    .schema('gps_mec')
                    .from('efetivo_gps_mec_setores')
                    .delete()
                    .eq('id', data.id);
                if (error) throw error;
                result = true;
            }

            this.updateSyncBar(false);
            return result;
        } catch (e) {
            this.updateSyncBar(false);
            return this._handleError(e, `Setor (${action})`);
        }
    },

    /**
     * CRUD operations on the equipment table (Vagas)
     * @param {'create'|'update'|'delete'} action
     * @param {Object} data - Equipment data
     */
    async syncEquipamento(action, data) {
        if (!window.supabase) return null;
        this.updateSyncBar(true);

        try {
            let result;

            if (action === 'create') {
                const { data: inserted, error } = await supabase
                    .schema('gps_mec')
                    .from('efetivo_gps_mec_equipamentos')
                    .insert({
                        sigla: data.sigla,
                        numero: data.numero || null,
                        escala: data.escala || null,
                        status: data.status || 'ATIVO'
                    })
                    .select();
                if (error) throw error;
                result = inserted?.[0];
            } else if (action === 'update') {
                const patch = {};
                if (data.sigla !== undefined) patch.sigla = data.sigla;
                if (data.numero !== undefined) patch.numero = data.numero || null;
                if (data.escala !== undefined) patch.escala = data.escala || null;
                if (data.status !== undefined) patch.status = data.status;

                if (Object.keys(patch).length > 0) {
                    const { error } = await supabase
                        .schema('gps_mec')
                        .from('efetivo_gps_mec_equipamentos')
                        .update(patch)
                        .eq('id', data.id);
                    if (error) throw error;
                }
                result = true;
            } else if (action === 'delete') {
                const { error } = await supabase
                    .schema('gps_mec')
                    .from('efetivo_gps_mec_equipamentos')
                    .delete()
                    .eq('id', data.id);
                if (error) throw error;
                result = true;
            }

            this.updateSyncBar(false);
            return result;
        } catch (e) {
            this.updateSyncBar(false);
            return this._handleError(e, `Equipamento (${action})`);
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
                    .schema('gps_mec')
                    .from('efetivo_gps_mec_equipamentos')
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
    },

    /* ──────── TREINAMENTOS API ──────── */

    async loadTreinamentos() {
        if (!window.supabase) return;
        try {
            const [
                { data: catalogo, error: e1 },
                { data: vinculos, error: e2 }
            ] = await Promise.all([
                supabase.schema('gps_mec').from('efetivo_gps_mec_catalogo_treinamentos').select('*').order('nome'),
                supabase.schema('gps_mec').from('efetivo_gps_mec_colaborador_treinamentos').select('*, employees:efetivo_gps_mec_colaboradores(name, matricula_gps), treinamentos_catalogo:efetivo_gps_mec_catalogo_treinamentos(nome)').order('created_at', { ascending: false })
            ]);
            if (e1) return this._handleError(e1, 'Carregar Catálogo Treinamentos');
            if (e2) return this._handleError(e2, 'Carregar Vínculos Treinamentos');
            SGE.state.treinamentosCatalogo = catalogo || [];
            SGE.state.colaboradorTreinamentos = (vinculos || []).map(v => ({
                ...v,
                employee_name: v.employees ? v.employees.name : 'Desconhecido',
                employee_matricula: v.employees ? (v.employees.matricula_gps || 'S/ MAT') : 'S/ MAT',
                treinamento_nome: v.treinamentos_catalogo ? v.treinamentos_catalogo.nome : 'Desconhecido'
            }));
        } catch (e) {
            console.error('SGE loadTreinamentos failed:', e);
        }
    },

    async syncTreinamentoCatalogo(action, data) {
        if (!window.supabase) return null;
        this.updateSyncBar(true);
        try {
            let result;
            if (action === 'create') {
                const { data: ins, error } = await supabase.schema('gps_mec').from('efetivo_gps_mec_catalogo_treinamentos').insert({
                    nome: data.nome,
                    descricao: data.descricao || null,
                    validade_meses: data.validade_meses ? parseInt(data.validade_meses) : null
                }).select();
                if (error) throw error;
                result = ins?.[0];
            } else if (action === 'update') {
                const patch = {};
                if (data.nome !== undefined) patch.nome = data.nome;
                if (data.descricao !== undefined) patch.descricao = data.descricao;
                if (data.validade_meses !== undefined) patch.validade_meses = data.validade_meses ? parseInt(data.validade_meses) : null;
                patch.updated_at = new Date();
                const { error } = await supabase.schema('gps_mec').from('efetivo_gps_mec_catalogo_treinamentos').update(patch).eq('id', data.id);
                if (error) throw error;
                result = true;
            } else if (action === 'delete') {
                // Delete related associations first
                await supabase.schema('gps_mec').from('efetivo_gps_mec_colaborador_treinamentos').delete().eq('treinamento_id', data.id);
                const { error } = await supabase.schema('gps_mec').from('efetivo_gps_mec_catalogo_treinamentos').delete().eq('id', data.id);
                if (error) throw error;
                // Synchronously update local state for instant feedback
                if (SGE.state.treinamentosCatalogo) {
                    SGE.state.treinamentosCatalogo = SGE.state.treinamentosCatalogo.filter(t => t.id !== data.id);
                }
                if (SGE.state.colaboradorTreinamentos) {
                    SGE.state.colaboradorTreinamentos = SGE.state.colaboradorTreinamentos.filter(v => v.treinamento_id !== data.id);
                }
                result = true;
            }
            this.updateSyncBar(false);
            return result;
        } catch (e) {
            this.updateSyncBar(false);
            return this._handleError(e, `Treinamento Catálogo (${action})`);
        }
    },

    async syncColaboradorTreinamento(action, data) {
        if (!window.supabase) return null;
        this.updateSyncBar(true);
        try {
            let result;
            if (action === 'create') {
                const { data: ins, error } = await supabase.schema('gps_mec').from('efetivo_gps_mec_colaborador_treinamentos').insert({
                    employee_id: data.employee_id,
                    treinamento_id: data.treinamento_id,
                    data_conclusao: data.data_conclusao || null,
                    validade: data.validade || null,
                    anexo_url: data.anexo_url || null
                }).select();
                if (error) throw error;
                result = ins?.[0];
            } else if (action === 'update' || action === 'renovar') {
                const patch = {
                    updated_at: new Date()
                };
                if (data.data_conclusao !== undefined) patch.data_conclusao = data.data_conclusao;
                if (data.validade !== undefined) patch.validade = data.validade;
                if (data.revogado !== undefined) patch.revogado = data.revogado;
                if (data.data_revogacao !== undefined) patch.data_revogacao = data.data_revogacao;
                if (data.motivo_revogacao !== undefined) patch.motivo_revogacao = data.motivo_revogacao;

                const { error } = await supabase.schema('gps_mec').from('efetivo_gps_mec_colaborador_treinamentos').update(patch).eq('id', data.id);
                if (error) throw error;
                result = true;
            } else if (action === 'delete') {
                const { error } = await supabase.schema('gps_mec').from('efetivo_gps_mec_colaborador_treinamentos').delete().eq('id', data.id);
                if (error) throw error;
                // Synchronously update local state for instant feedback
                if (SGE.state.colaboradorTreinamentos) {
                    SGE.state.colaboradorTreinamentos = SGE.state.colaboradorTreinamentos.filter(v => v.id !== data.id);
                }
                result = true;
            }
            this.updateSyncBar(false);
            return result;
        } catch (e) {
            this.updateSyncBar(false);
            return this._handleError(e, `Vínculo Treinamento (${action})`);
        }
    },

    async syncColaboradorTreinamentoLote(data) {
        if (!window.supabase) return null;
        this.updateSyncBar(true);
        try {
            const inserts = data.employee_ids.map(id => ({
                employee_id: id,
                treinamento_id: data.treinamento_id,
                data_conclusao: data.data_conclusao || null,
                validade: data.validade || null,
                anexo_url: data.anexo_url || null
            }));

            const { data: ins, error } = await supabase.schema('gps_mec').from('efetivo_gps_mec_colaborador_treinamentos').insert(inserts).select();
            if (error) throw error;

            this.updateSyncBar(false);
            return ins;
        } catch (e) {
            this.updateSyncBar(false);
            return this._handleError(e, `Vínculo Treinamento em Lote`);
        }
    },

    /* ──────── FÉRIAS API ──────── */

    async loadFerias() {
        if (!window.supabase) return;
        try {
            const { data, error } = await supabase.schema('gps_mec').from('efetivo_gps_mec_ferias').select('*, employees:efetivo_gps_mec_colaboradores(name, matricula_gps)').order('data_inicio', { ascending: false });
            if (error) return this._handleError(error, 'Carregar Férias');
            SGE.state.ferias = (data || []).map(f => ({
                ...f,
                employee_name: f.employees ? f.employees.name : 'Desconhecido',
                employee_matricula: f.employees ? (f.employees.matricula_gps || 'S/ MAT') : 'S/ MAT'
            }));
        } catch (e) {
            console.error('SGE loadFerias failed:', e);
        }
    },

    async syncFerias(action, data) {
        if (!window.supabase) return null;
        this.updateSyncBar(true);
        try {
            let result;
            if (action === 'create') {
                // Auto-calc return date
                const inicio = new Date(data.data_inicio + 'T00:00:00');
                inicio.setDate(inicio.getDate() + parseInt(data.quantidade_dias));
                const retorno = inicio.toISOString().split('T')[0];

                const { data: ins, error } = await supabase.schema('gps_mec').from('efetivo_gps_mec_ferias').insert({
                    employee_id: data.employee_id,
                    data_inicio: data.data_inicio,
                    quantidade_dias: parseInt(data.quantidade_dias),
                    data_retorno: retorno,
                    observacao: data.observacao || null,
                    status: data.status || 'AGENDADA'
                }).select();
                if (error) throw error;
                result = ins?.[0];
            } else if (action === 'update') {
                const patch = { updated_at: new Date() };
                if (data.status !== undefined) patch.status = data.status;
                if (data.observacao !== undefined) patch.observacao = data.observacao;
                if (data.data_inicio && data.quantidade_dias) {
                    patch.data_inicio = data.data_inicio;
                    patch.quantidade_dias = parseInt(data.quantidade_dias);
                    const d = new Date(data.data_inicio + 'T00:00:00');
                    d.setDate(d.getDate() + parseInt(data.quantidade_dias));
                    patch.data_retorno = d.toISOString().split('T')[0];
                }
                const { error } = await supabase.schema('gps_mec').from('efetivo_gps_mec_ferias').update(patch).eq('id', data.id);
                if (error) throw error;
                result = true;
            } else if (action === 'delete') {
                const { error } = await supabase.schema('gps_mec').from('efetivo_gps_mec_ferias').delete().eq('id', data.id);
                if (error) throw error;
                result = true;
            }
            this.updateSyncBar(false);
            return result;
        } catch (e) {
            this.updateSyncBar(false);
            return this._handleError(e, `Férias (${action})`);
        }
    },

    /* ──────── ADVERTÊNCIAS API ──────── */

    async loadAdvertencias() {
        if (!window.supabase) return;
        try {
            const { data, error } = await supabase.schema('gps_mec').from('efetivo_gps_mec_advertencias').select('*, employees:efetivo_gps_mec_colaboradores(name, matricula_gps)').order('data_aplicacao', { ascending: false });
            if (error) return this._handleError(error, 'Carregar Advertências');
            SGE.state.advertencias = (data || []).map(a => ({
                ...a,
                employee_name: a.employees ? a.employees.name : 'Desconhecido',
                employee_matricula: a.employees ? (a.employees.matricula_gps || 'S/ MAT') : 'S/ MAT'
            }));
        } catch (e) {
            console.error('SGE loadAdvertencias failed:', e);
        }
    },

    async syncAdvertencia(action, data) {
        if (!window.supabase) return null;
        this.updateSyncBar(true);
        try {
            let result;
            if (action === 'create') {
                const { data: ins, error } = await supabase.schema('gps_mec').from('efetivo_gps_mec_advertencias').insert({
                    employee_id: data.employee_id,
                    tipo: data.tipo,
                    data_aplicacao: data.data_aplicacao || new Date().toISOString().split('T')[0],
                    motivo: data.motivo,
                    dias_suspensao: data.tipo === 'SUSPENSAO' ? (parseInt(data.dias_suspensao) || 0) : 0,
                    anexo_url: data.anexo_url || null,
                    aplicador: data.aplicador || (SGE.auth.currentUser ? (SGE.auth.currentUser.nome || SGE.auth.currentUser.usuario) : 'Sistema')
                }).select();
                if (error) throw error;
                result = ins?.[0];
            } else if (action === 'delete') {
                const { error } = await supabase.schema('gps_mec').from('efetivo_gps_mec_advertencias').delete().eq('id', data.id);
                if (error) throw error;
                result = true;
            }
            this.updateSyncBar(false);
            return result;
        } catch (e) {
            this.updateSyncBar(false);
            return this._handleError(e, `Advertência (${action})`);
        }
    }
};
