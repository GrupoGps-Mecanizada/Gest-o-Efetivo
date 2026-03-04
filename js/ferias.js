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
        const filtered = this._filterText ?
            historico.filter(f =>
                (f.employee_name || '').toUpperCase().includes(this._filterText.toUpperCase()) ||
                (f.employee_matricula || '').toUpperCase().includes(this._filterText.toUpperCase())
            ) : historico;

        view.innerHTML = `
            <div id="history-view" style="display:flex; flex-direction:column; height:100%;">
                <div class="history-filters">
                    <input type="text" class="history-filter-input" id="ferias-filter" placeholder="Filtrar por colaborador..." value="${this._filterText}" style="width: 280px;" />
                    
                    <button id="btn-registrar-ferias" style="margin-left: auto; padding: 7px 14px; background: var(--accent); border: none; border-radius: 6px; color: #fff; font-family: var(--font-display); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 14px; height: 14px;"><path d="M8 1v14M1 8h14"/></svg>
                        Registrar Férias
                    </button>
                </div>

                <div id="history-table-wrap">
                    <table id="history-table">
                        <thead>
                            <tr>
                                <th>Colaborador</th>
                                <th>ID Efetivo</th>
                                <th>Início</th>
                                <th>Retorno</th>
                                <th>Dias</th>
                                <th>Status</th>
                                <th style="text-align: center;">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.length === 0 ? '<tr><td colspan="7" style="text-align: center; color: var(--text-3); padding: 20px;">Nenhum registro encontrado.</td></tr>' :
                filtered.map(f => {
                    const stClass = f.status === 'CONCLUIDA' ? 'ferias-badge-done' : (f.status === 'CANCELADA' ? 'ferias-badge-cancelled' : (f.status === 'EM_ANDAMENTO' ? 'ferias-badge-active' : 'ferias-badge-scheduled'));
                    const isAtiva = f.status === 'EM_ANDAMENTO' || f.status === 'AGENDADA';

                    return `
                                <tr>
                                    <td style="font-weight: 500; color: var(--text-1);">${f.employee_name}</td>
                                    <td>${f.employee_matricula || 'N/A'}</td>
                                    <td>${this._formatDateBR(f.data_inicio)}</td>
                                    <td>${this._formatDateBR(f.data_retorno)}</td>
                                    <td>${f.quantidade_dias}</td>
                                    <td><span class="ferias-status-badge ${stClass}" style="font-size: 10px; padding: 3px 8px; border-radius: 12px;">${f.status.replace('_', ' ')}</span></td>
                                    <td style="text-align: center;">
                                        <div style="display: flex; gap: 8px; justify-content: center;">
                                            ${(f.status === 'AGENDADA') ?
                            `<button class="ferias-icon-btn" data-action="start" data-id="${f.id}" title="Iniciar" style="padding: 4px; background:var(--bg-2); border-radius:6px; cursor:pointer; border:none; color:var(--text-2);">
                                                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px;"><path d="M4 2v12l10-6z"/></svg>
                                                </button>` : ''}
                                            ${isAtiva ?
                            `<button class="ferias-icon-btn" data-action="complete" data-id="${f.id}" title="Concluir" style="padding: 4px; background:var(--bg-2); border-radius:6px; cursor:pointer; border:none; color:var(--text-2);">
                                                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px;"><path d="M13 4L6 11 3 8"/></svg>
                                            </button>` : ''}
                                            
                                            <button class="ferias-icon-btn ferias-icon-btn-danger" data-action="delete" data-id="${f.id}" title="Excluir" style="padding: 4px; background:var(--bg-2); border-radius:6px; cursor:pointer; border:none; color:var(--red);">
                                                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px;"><path d="M4 12V3h8v9a2 2 0 01-2 2H6a2 2 0 01-2-2z"/><path d="M2 3h12M6 1v2M10 1v2M6 7v6M10 7v6"/></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                }).join('')}
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
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            this.render();
            const newInput = view.querySelector('#ferias-filter');
            if (newInput) {
                newInput.focus();
                newInput.setSelectionRange(start, end);
            }
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
