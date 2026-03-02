'use strict';

/**
 * SGE — Férias Feature
 * Vacation management with auto-calculated return dates
 */
window.SGE = window.SGE || {};

SGE.ferias = {
    _loaded: false,
    _filterText: '',

    render() {
        const view = document.getElementById('ferias-view');
        if (!view) return;

        view.style.overflowY = 'auto';
        view.style.overflowX = 'hidden';

        const hoje = new Date();
        const historico = SGE.state.ferias || [];
        const filteredHistorico = this._filterText ?
            historico.filter(f =>
                (f.employee_name || '').toUpperCase().includes(this._filterText.toUpperCase()) ||
                (f.employee_matricula || '').toUpperCase().includes(this._filterText.toUpperCase())
            ) : historico;

        const ativas = historico.filter(f => f.status !== 'CONCLUIDA' && f.status !== 'CANCELADA');

        view.innerHTML = `
            <div class="ferias-header">
                <h2 class="ferias-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px">
                        <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                        <path d="M12 4v1M17.66 6.34l-.7.7M20 12h-1M17.66 17.66l-.7-.7M12 20v-1M6.34 17.66l.7-.7M4 12h1M6.34 6.34l.7.7"/>
                    </svg>
                    Gestão de Férias
                </h2>
                <button class="ferias-btn ferias-btn-primary" id="btn-registrar-ferias">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1v14M1 8h14"/></svg>
                    Registrar Férias
                </button>
            </div>

            <!-- Active Vacations Panel -->
            <div class="ferias-section">
                <div class="ferias-section-title">Férias Ativas & Agendadas (${ativas.length})</div>
                <div class="ferias-active-grid">
                    ${ativas.length === 0 ? '<div class="ferias-empty">Nenhuma férias ativa ou agendada no momento</div>' :
                ativas.map(f => {
                    const inicio = new Date(f.data_inicio + 'T00:00:00');
                    const retorno = new Date(f.data_retorno + 'T00:00:00');
                    const diffMs = retorno - hoje;
                    const diasRestantes = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                    const totalDias = f.quantidade_dias;
                    const diasUsados = Math.max(0, totalDias - diasRestantes);
                    const progresso = totalDias > 0 ? Math.min(100, Math.round((diasUsados / totalDias) * 100)) : 0;

                    const isActive = f.status === 'EM_ANDAMENTO' || (inicio <= hoje && retorno >= hoje);
                    const statusLabel = isActive ? 'Em Andamento' : 'Agendada';
                    const statusClass = isActive ? 'ferias-card-status-active' : 'ferias-card-status-scheduled';

                    return `
                            <div class="ferias-card ${isActive ? 'ferias-card-active' : 'ferias-card-scheduled'}">
                                <div class="ferias-card-top">
                                    <div class="ferias-card-name">${f.employee_name}</div>
                                    <span class="ferias-card-status ${statusClass}">${statusLabel}</span>
                                </div>
                                <div class="ferias-card-dates">
                                    <div class="ferias-card-date-item">
                                        <span class="ferias-card-date-label">Início</span>
                                        <span class="ferias-card-date-value">${this._formatDateBR(f.data_inicio)}</span>
                                    </div>
                                    <div class="ferias-card-date-arrow">→</div>
                                    <div class="ferias-card-date-item">
                                        <span class="ferias-card-date-label">Retorno</span>
                                        <span class="ferias-card-date-value">${this._formatDateBR(f.data_retorno)}</span>
                                    </div>
                                </div>
                                <div class="ferias-card-progress-bar">
                                    <div class="ferias-card-progress-fill" style="width:${progresso}%"></div>
                                </div>
                                <div class="ferias-card-bottom">
                                    <span class="ferias-card-days">${totalDias} dias</span>
                                    <span class="ferias-card-countdown">${diasRestantes > 0 ? `${diasRestantes} dias restantes` : 'Retorno hoje!'}</span>
                                </div>
                                <div class="ferias-card-actions">
                                    ${isActive && f.status !== 'EM_ANDAMENTO' ? `<button class="ferias-mini-btn" data-action="start" data-id="${f.id}" title="Marcar como em andamento">▶ Iniciar</button>` : ''}
                                    <button class="ferias-mini-btn" data-action="complete" data-id="${f.id}" title="Concluir férias">✓ Concluir</button>
                                    <button class="ferias-mini-btn ferias-mini-btn-danger" data-action="delete" data-id="${f.id}" title="Excluir">✕</button>
                                </div>
                            </div>`;
                }).join('')}
                </div>
            </div>

            <!-- History Table -->
            <div class="ferias-section">
                <div class="ferias-section-title">Histórico de Férias (${historico.length})</div>
                <div class="ferias-filter-bar">
                    <input type="text" class="ferias-filter-input" id="ferias-filter" placeholder="Filtrar por colaborador..." value="${this._filterText}" />
                </div>
                <div class="ferias-table-wrap">
                    <table class="ferias-table">
                        <thead>
                            <tr>
                                <th>Colaborador</th>
                                <th>Matrícula</th>
                                <th>Início</th>
                                <th>Qtd Dias</th>
                                <th>Retorno</th>
                                <th>Status</th>
                                <th>Obs</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredHistorico.length === 0 ?
                '<tr><td colspan="7" style="text-align:center;color:var(--text-3);padding:24px">Nenhum registro encontrado</td></tr>' :
                filteredHistorico.map(f => {
                    const stClass = f.status === 'CONCLUIDA' ? 'ferias-badge-done' : 'ferias-badge-cancelled';
                    return `
                                    <tr>
                                        <td>${f.employee_name}</td>
                                        <td>${f.employee_matricula}</td>
                                        <td>${this._formatDateBR(f.data_inicio)}</td>
                                        <td>${f.quantidade_dias}</td>
                                        <td>${this._formatDateBR(f.data_retorno)}</td>
                                        <td><span class="ferias-status-badge ${stClass}">${f.status || 'CONCLUIDA'}</span></td>
                                        <td>${f.observacao || '—'}</td>
                                    </tr>`;
                }).join('')
            }
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this._wireEvents(view);
    },

    _wireEvents(view) {
        // Filter
        view.querySelector('#ferias-filter')?.addEventListener('input', (e) => {
            this._filterText = e.target.value;
            this.render();
        });

        // Register button
        view.querySelector('#btn-registrar-ferias')?.addEventListener('click', () => this._openRegistarModal());

        // Card actions
        view.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;

            if (action === 'start') this._updateStatus(id, 'EM_ANDAMENTO');
            if (action === 'complete') this._updateStatus(id, 'CONCLUIDA');
            if (action === 'delete') this._delete(id);
        });
    },

    _openRegistarModal() {
        const colabs = SGE.state.colaboradores.sort((a, b) => a.nome.localeCompare(b.nome));

        SGE.modal.openDynamic({
            title: 'Registrar Férias',
            subtitle: 'Selecione o colaborador e as datas',
            fields: [
                {
                    id: 'employee_id', label: 'Colaborador', type: 'select',
                    options: colabs.map(c => ({ value: c.id, label: `${c.nome} (${c.matricula_gps || 'S/MAT'})` }))
                },
                { id: 'data_inicio', label: 'Data de Início', type: 'date', value: new Date().toISOString().split('T')[0] },
                { id: 'quantidade_dias', label: 'Quantidade de Dias', type: 'number', value: '30', placeholder: '30' },
                { id: 'observacao', label: 'Observação (opcional)', type: 'text', value: '', placeholder: 'Ex: Férias fracionadas' },
                {
                    id: 'status', label: 'Status', type: 'select',
                    options: [
                        { value: 'AGENDADA', label: 'Agendada' },
                        { value: 'EM_ANDAMENTO', label: 'Em Andamento' }
                    ],
                    value: 'AGENDADA'
                }
            ],
            okText: 'Registrar',
            onConfirm: async (vals) => {
                if (!vals.employee_id || !vals.data_inicio || !vals.quantidade_dias) {
                    SGE.helpers.toast('Preencha todos os campos obrigatórios', 'error');
                    return false;
                }
                const result = await SGE.api.syncFerias('create', vals);
                if (result) {
                    SGE.helpers.toast('Férias registradas com sucesso');
                    await SGE.api.loadFerias();
                    this.render();
                }
            }
        });
    },

    async _updateStatus(id, newStatus) {
        const result = await SGE.api.syncFerias('update', { id, status: newStatus });
        if (result) {
            SGE.helpers.toast(`Status atualizado para ${newStatus}`);
            await SGE.api.loadFerias();
            this.render();
        }
    },

    async _delete(id) {
        SGE.modal.confirm({
            title: 'Excluir Férias',
            message: 'Deseja excluir este registro de férias?',
            confirmText: 'Excluir',
            confirmColor: 'danger',
            onConfirm: async () => {
                await SGE.api.syncFerias('delete', { id });
                SGE.helpers.toast('Registro excluído');
                await SGE.api.loadFerias();
                this.render();
            }
        });
    },

    _formatDateBR(dateStr) {
        if (!dateStr) return '—';
        try {
            const [y, m, d] = dateStr.split('-');
            return `${d}/${m}/${y}`;
        } catch { return dateStr; }
    }
};
