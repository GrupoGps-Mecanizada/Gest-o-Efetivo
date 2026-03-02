'use strict';

/**
 * SGE — Advertências Feature
 * Warning management with types: Verbal, Written, Suspension
 */
window.SGE = window.SGE || {};

SGE.advertencias = {
    _loaded: false,
    _filterText: '',
    _filterTipo: '',

    render() {
        const view = document.getElementById('advertencias-view');
        if (!view) return;

        view.style.overflowY = 'auto';
        view.style.overflowX = 'hidden';

        const todas = SGE.state.advertencias || [];
        const filter = this._filterText ? this._filterText.toLowerCase() : '';
        const filterTipo = this._filterTipo;

        const filtered = todas.filter(a => {
            if (filter && !(a.employee_name || '').toLowerCase().includes(filter) && !(a.motivo || '').toLowerCase().includes(filter)) return false;
            if (filterTipo && a.tipo !== filterTipo) return false;
            return true;
        });

        // Stats
        const totalVerbal = todas.filter(a => a.tipo === 'VERBAL').length;
        const totalEscrita = todas.filter(a => a.tipo === 'ESCRITA').length;
        const totalSuspensao = todas.filter(a => a.tipo === 'SUSPENSAO').length;

        view.innerHTML = `
            <div class="advertencias-header">
                <h2 class="advertencias-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Histórico de Advertências
                </h2>
                <button class="advertencias-btn advertencias-btn-primary" id="btn-registrar-advertencia">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1v14M1 8h14"/></svg>
                    Registrar Advertência
                </button>
            </div>

            <!-- Stats Cards -->
            <div class="advertencias-stats">
                <div class="advertencias-stat-card advertencias-stat-verbal">
                    <div class="advertencias-stat-number">${totalVerbal}</div>
                    <div class="advertencias-stat-label">Verbal</div>
                </div>
                <div class="advertencias-stat-card advertencias-stat-escrita">
                    <div class="advertencias-stat-number">${totalEscrita}</div>
                    <div class="advertencias-stat-label">Escrita</div>
                </div>
                <div class="advertencias-stat-card advertencias-stat-suspensao">
                    <div class="advertencias-stat-number">${totalSuspensao}</div>
                    <div class="advertencias-stat-label">Suspensão</div>
                </div>
                <div class="advertencias-stat-card advertencias-stat-total">
                    <div class="advertencias-stat-number">${todas.length}</div>
                    <div class="advertencias-stat-label">Total</div>
                </div>
            </div>

            <!-- Filters -->
            <div class="advertencias-section">
                <div class="advertencias-section-title">Registros (${filtered.length})</div>
                <div class="advertencias-filter-bar">
                    <input type="text" class="advertencias-filter-input" id="advertencias-filter" placeholder="Filtrar por colaborador ou motivo..." value="${this._filterText}" />
                    <select class="advertencias-filter-select" id="advertencias-filter-tipo">
                        <option value="">Todos os tipos</option>
                        <option value="VERBAL" ${filterTipo === 'VERBAL' ? 'selected' : ''}>Verbal</option>
                        <option value="ESCRITA" ${filterTipo === 'ESCRITA' ? 'selected' : ''}>Escrita</option>
                        <option value="SUSPENSAO" ${filterTipo === 'SUSPENSAO' ? 'selected' : ''}>Suspensão</option>
                    </select>
                </div>
                <div class="advertencias-table-wrap">
                    <table class="advertencias-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Colaborador</th>
                                <th>Matrícula</th>
                                <th>Tipo</th>
                                <th>Motivo</th>
                                <th>Dias Susp.</th>
                                <th>Aplicador</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.length === 0 ?
                '<tr><td colspan="8" style="text-align:center;color:var(--text-3);padding:24px">Nenhuma advertência encontrada</td></tr>' :
                filtered.map(a => {
                    const tipoBadge = this._getTipoBadge(a.tipo);
                    return `
                                    <tr>
                                        <td>${this._formatDateBR(a.data_aplicacao)}</td>
                                        <td><strong>${a.employee_name}</strong></td>
                                        <td>${a.employee_matricula}</td>
                                        <td><span class="advertencias-tipo-badge ${tipoBadge.class}">${tipoBadge.label}</span></td>
                                        <td class="advertencias-motivo-cell">${a.motivo}</td>
                                        <td>${a.tipo === 'SUSPENSAO' ? (a.dias_suspensao || 0) + ' dias' : '—'}</td>
                                        <td>${a.aplicador || '—'}</td>
                                        <td>
                                            <div class="advertencias-row-actions">
                                                ${a.anexo_url ? `<a href="${a.anexo_url}" target="_blank" class="advertencias-icon-btn" title="Ver Anexo">
                                                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V9"/><path d="M9 2h5v5M14 2L7 9"/></svg>
                                                </a>` : ''}
                                                <button class="advertencias-icon-btn advertencias-icon-btn-danger" data-action="delete" data-id="${a.id}" title="Excluir">
                                                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5"/></svg>
                                                </button>
                                            </div>
                                        </td>
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
        // Text filter
        view.querySelector('#advertencias-filter')?.addEventListener('input', (e) => {
            this._filterText = e.target.value;
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            this.render();
            const newInput = view.querySelector('#advertencias-filter');
            if (newInput) {
                newInput.focus();
                newInput.setSelectionRange(start, end);
            }
        });

        // Type filter
        view.querySelector('#advertencias-filter-tipo')?.addEventListener('change', (e) => {
            this._filterTipo = e.target.value;
            this.render();
            view.querySelector('#advertencias-filter-tipo')?.focus();
        });

        // Register button
        view.querySelector('#btn-registrar-advertencia')?.addEventListener('click', () => this._openRegistarModal());

        // Row actions
        view.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            if (btn.dataset.action === 'delete') this._delete(btn.dataset.id);
        });
    },

    _openRegistarModal() {
        const colabs = SGE.state.colaboradores.sort((a, b) => a.nome.localeCompare(b.nome));

        SGE.modal.openDynamic({
            title: 'Registrar Advertência',
            subtitle: 'Selecione o colaborador e os detalhes',
            fields: [
                {
                    id: 'employee_id', label: 'Colaborador', type: 'select',
                    options: colabs.map(c => ({ value: c.id, label: `${c.nome} (${c.matricula_gps || 'S/MAT'})` }))
                },
                {
                    id: 'tipo', label: 'Tipo', type: 'select',
                    options: [
                        { value: 'VERBAL', label: 'Verbal' },
                        { value: 'ESCRITA', label: 'Escrita' },
                        { value: 'SUSPENSAO', label: 'Suspensão' }
                    ],
                    value: 'VERBAL'
                },
                { id: 'data_aplicacao', label: 'Data de Aplicação', type: 'date', value: new Date().toISOString().split('T')[0] },
                { id: 'motivo', label: 'Motivo', type: 'text', value: '', placeholder: 'Descreva o motivo da advertência' },
                { id: 'dias_suspensao', label: 'Dias de Suspensão (se aplicável)', type: 'number', value: '0', placeholder: '0' },
                { id: 'anexo_url', label: 'URL do Anexo (opcional)', type: 'text', value: '', placeholder: 'https://...' },
                { id: 'aplicador', label: 'Aplicador', type: 'text', value: SGE.auth.currentUser ? (SGE.auth.currentUser.nome || SGE.auth.currentUser.usuario) : '', placeholder: 'Nome de quem aplicou' }
            ],
            okText: 'Registrar',
            onConfirm: async (vals) => {
                if (!vals.employee_id || !vals.motivo.trim()) {
                    SGE.helpers.toast('Preencha o colaborador e o motivo', 'error');
                    return false;
                }
                const result = await SGE.api.syncAdvertencia('create', vals);
                if (result) {
                    SGE.helpers.toast('Advertência registrada com sucesso');
                    await SGE.api.loadAdvertencias();
                    this.render();
                }
            }
        });
    },

    async _delete(id) {
        SGE.modal.confirm({
            title: 'Excluir Advertência',
            message: 'Deseja excluir este registro de advertência? Esta ação não pode ser desfeita.',
            confirmText: 'Excluir',
            confirmColor: 'danger',
            onConfirm: async () => {
                await SGE.api.syncAdvertencia('delete', { id });
                SGE.helpers.toast('Advertência excluída');
                await SGE.api.loadAdvertencias();
                this.render();
            }
        });
    },

    _getTipoBadge(tipo) {
        switch (tipo) {
            case 'VERBAL': return { class: 'advertencias-tipo-verbal', label: 'Verbal' };
            case 'ESCRITA': return { class: 'advertencias-tipo-escrita', label: 'Escrita' };
            case 'SUSPENSAO': return { class: 'advertencias-tipo-suspensao', label: 'Suspensão' };
            default: return { class: '', label: tipo };
        }
    },

    _formatDateBR(dateStr) {
        if (!dateStr) return '—';
        try {
            const [y, m, d] = dateStr.split('-');
            return `${d}/${m}/${y}`;
        } catch { return dateStr; }
    }
};
