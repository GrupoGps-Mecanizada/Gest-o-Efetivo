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
            <div id="history-view" style="display:flex; flex-direction:column; height:100%;">
                <div class="history-filters">
                    <input type="text" class="history-filter-input" id="advertencias-filter" placeholder="Filtrar por colaborador ou motivo..." value="${this._filterText}" style="width: 280px;" />
                    <select class="history-filter-input" id="advertencias-filter-tipo">
                        <option value="">Todos os tipos</option>
                        <option value="VERBAL" ${filterTipo === 'VERBAL' ? 'selected' : ''}>Verbal</option>
                        <option value="ESCRITA" ${filterTipo === 'ESCRITA' ? 'selected' : ''}>Escrita</option>
                        <option value="SUSPENSAO" ${filterTipo === 'SUSPENSAO' ? 'selected' : ''}>Suspensão</option>
                    </select>
                    
                    <button id="btn-registrar-advertencia" style="margin-left: auto; padding: 7px 14px; background: var(--accent); border: none; border-radius: 6px; color: #fff; font-family: var(--font-display); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 14px; height: 14px;"><path d="M8 1v14M1 8h14"/></svg>
                        Registrar Advertência
                    </button>
                </div>

                <div id="history-table-wrap">
                    <table id="history-table">
                        <thead>
                            <tr>
                                <th>Colaborador</th>
                                <th>ID Efetivo</th>
                                <th>Motivo</th>
                                <th>Data</th>
                                <th>Aplicador</th>
                                <th>Dias (Susp)</th>
                                <th>Tipo</th>
                                <th style="text-align: center;">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.length === 0 ? '<tr><td colspan="8" style="text-align: center; color: var(--text-3); padding: 20px;">Nenhum registro encontrado.</td></tr>' :
                filtered.map(a => {
                    const tipoBadge = this._getTipoBadge(a.tipo);
                    return `
                                <tr>
                                    <td style="font-weight: 500; color: var(--text-1);">${a.employee_name}</td>
                                    <td>${a.employee_matricula || 'N/A'}</td>
                                    <td>${a.motivo}</td>
                                    <td>${this._formatDateBR(a.data_aplicacao)}</td>
                                    <td>${a.aplicador || '—'}</td>
                                    <td>${a.tipo === 'SUSPENSAO' ? `<span style="color:var(--red)">${a.dias_suspensao || 0}</span>` : '—'}</td>
                                    <td><span class="advertencias-tipo-badge ${tipoBadge.class}" style="font-size: 10px; padding: 3px 8px; border-radius: 12px;">${tipoBadge.label}</span></td>
                                    <td style="text-align: center;">
                                        <div style="display: flex; gap: 8px; justify-content: center;">
                                            ${a.anexo_url ? `<a href="${a.anexo_url}" target="_blank" title="Ver Anexo" style="padding: 4px; background:var(--bg-2); border-radius:6px; cursor:pointer; color:var(--text-2); display: inline-flex;">
                                                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px;"><path d="M7 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V9"/><path d="M9 2h5v5M14 2L7 9"/></svg>
                                            </a>` : ''}
                                            <button data-action="delete" data-id="${a.id}" title="Excluir" style="padding: 4px; background:var(--bg-2); border-radius:6px; cursor:pointer; border:none; color:var(--red); display: inline-flex;">
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
