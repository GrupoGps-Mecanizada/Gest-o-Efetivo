'use strict';

/**
 * SGE — Treinamentos Feature
 * Training catalog management and employee training associations
 */
window.SGE = window.SGE || {};

SGE.treinamentos = {
    _loaded: false,
    _filterText: '',

    render() {
        const view = document.getElementById('treinamentos-view');
        if (!view) return;

        view.style.overflowY = 'auto';
        view.style.overflowX = 'hidden';

        const catalogo = SGE.state.treinamentosCatalogo || [];
        const vinculos = SGE.state.colaboradorTreinamentos || [];
        const filter = this._filterText ? this._filterText.toLowerCase() : '';

        // Filter vinculos
        const filtered = filter ? vinculos.filter(v => {
            return (v.employee_name || '').toLowerCase().includes(filter) ||
                (v.treinamento_nome || '').toLowerCase().includes(filter);
        }) : vinculos;

        view.innerHTML = `
            <div class="treinamentos-header">
                <h2 class="treinamentos-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                    </svg>
                    Treinamentos & Especificações
                </h2>
                <div class="treinamentos-actions">
                    <button class="treinamentos-btn treinamentos-btn-secondary" id="btn-gerenciar-catalogo">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1v14M1 8h14"/></svg>
                        Gerenciar Catálogo
                    </button>
                    <button class="treinamentos-btn treinamentos-btn-primary" id="btn-vincular-treinamento">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1v14M1 8h14"/></svg>
                        Vincular Treinamento
                    </button>
                </div>
            </div>

            <!-- Catálogo Section -->
            <div class="treinamentos-section">
                <div class="treinamentos-section-title">Catálogo de Treinamentos (${catalogo.length})</div>
                <div class="treinamentos-catalogo-grid">
                    ${catalogo.length === 0 ? '<div class="treinamentos-empty">Nenhum treinamento cadastrado. Clique em "Gerenciar Catálogo" para adicionar.</div>' :
                catalogo.map(t => `
                        <div class="treinamentos-catalogo-card" data-id="${t.id}">
                            <div class="treinamentos-catalogo-card-header">
                                <span class="treinamentos-catalogo-card-name">${t.nome}</span>
                                <div class="treinamentos-catalogo-card-actions">
                                    <button class="treinamentos-icon-btn" data-action="edit-catalogo" data-id="${t.id}" title="Editar">
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 1l4 4L5 15H1v-4z"/></svg>
                                    </button>
                                    <button class="treinamentos-icon-btn treinamentos-icon-btn-danger" data-action="delete-catalogo" data-id="${t.id}" title="Excluir">
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5"/></svg>
                                    </button>
                                </div>
                            </div>
                            <div class="treinamentos-catalogo-card-desc">${t.descricao || 'Sem descrição'}</div>
                            <div class="treinamentos-catalogo-card-count">${vinculos.filter(v => v.treinamento_id === t.id).length} colaborador(es) vinculado(s)</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Vínculos Section -->
            <div class="treinamentos-section">
                <div class="treinamentos-section-title">Vínculos de Treinamento (${vinculos.length})</div>
                <div class="treinamentos-filter-bar">
                    <input type="text" class="treinamentos-filter-input" id="treinamentos-filter" placeholder="Filtrar por colaborador ou treinamento..." value="${this._filterText}" />
                </div>
                <div class="treinamentos-list">
                    ${filtered.length === 0 ? '<div class="no-data-message"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-18a8 8 0 100 16 8 8 0 000-16z"/><path d="M9 9l6 6m0-6l-6 6"/></svg><h3>Nenhum registro</h3><p>Não há vínculos para o filtro atual.</p></div>' :
                filtered.map(v => {
                    const hoje = new Date();
                    const validade = v.validade ? new Date(v.validade + 'T00:00:00') : null;
                    let statusClass = 'treinamentos-status-ok';
                    let statusLabel = 'Válido';
                    if (!validade) {
                        statusClass = 'treinamentos-status-na';
                        statusLabel = 'S/ Validade';
                    } else if (validade < hoje) {
                        statusClass = 'treinamentos-status-expired';
                        statusLabel = 'Vencido';
                    } else {
                        const diffDays = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
                        if (diffDays <= 30) {
                            statusClass = 'treinamentos-status-warning';
                            statusLabel = `Vence em ${diffDays}d`;
                        }
                    }
                    return `
                                <div class="treinamentos-row">
                                    <div class="treinamentos-row-main">
                                        <div class="treinamentos-row-title">
                                            ${v.employee_name} 
                                            <span class="treinamentos-status-badge ${statusClass}">${statusLabel}</span>
                                        </div>
                                        <div class="treinamentos-row-desc">ID: ${v.employee_matricula} • ${v.treinamento_nome}</div>
                                    </div>
                                    <div class="treinamentos-row-meta">
                                        <div class="treinamentos-meta-item">
                                            <span class="treinamentos-meta-label">Conclusão</span>
                                            <span class="treinamentos-meta-val">${v.data_conclusao ? SGE.helpers.formatDate(v.data_conclusao).split(',')[0] : '—'}</span>
                                        </div>
                                        <div class="treinamentos-meta-item">
                                            <span class="treinamentos-meta-label">Validade</span>
                                            <span class="treinamentos-meta-val">${v.validade ? SGE.helpers.formatDate(v.validade).split(',')[0] : '—'}</span>
                                        </div>
                                        <div class="treinamentos-row-actions">
                                            <button class="treinamentos-icon-btn treinamentos-icon-btn-danger" data-action="delete-vinculo" data-id="${v.id}" title="Remover">
                                                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                }).join('')
            }
                </div>
            </div>
        `;

        // Wire events
        this._wireEvents(view);
    },

    _wireEvents(view) {
        // Filter
        const filterInput = view.querySelector('#treinamentos-filter');
        if (filterInput) {
            filterInput.addEventListener('input', (e) => {
                this._filterText = e.target.value;
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                this.render();
                const newInput = view.querySelector('#treinamentos-filter');
                if (newInput) {
                    newInput.focus();
                    newInput.setSelectionRange(start, end);
                }
            });
        }

        // Gerenciar Catálogo button
        view.querySelector('#btn-gerenciar-catalogo')?.addEventListener('click', () => this._openCatalogoModal());

        // Vincular button
        view.querySelector('#btn-vincular-treinamento')?.addEventListener('click', () => this._openVinculoModal());

        // Card actions (event delegation)
        view.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;

            if (action === 'edit-catalogo') this._editCatalogo(id);
            if (action === 'delete-catalogo') this._deleteCatalogo(id);
            if (action === 'delete-vinculo') this._deleteVinculo(id);
        });
    },

    _openCatalogoModal() {
        SGE.modal.openDynamic({
            title: 'Novo Treinamento',
            subtitle: 'Adicionar ao catálogo',
            fields: [
                { id: 'nome', label: 'Nome do Treinamento', type: 'text', value: '', placeholder: 'Ex: NR-35 Trabalho em Altura', uppercase: true },
                { id: 'validade_meses', label: 'Validade (em meses) - Opcional', type: 'number', value: '', placeholder: 'Ex: 24 (para 2 anos)' },
                { id: 'descricao', label: 'Descrição (opcional)', type: 'text', value: '', placeholder: 'Breve descrição do treinamento' }
            ],
            okText: 'Criar Treinamento',
            onConfirm: async (vals) => {
                if (!vals.nome.trim()) {
                    SGE.helpers.toast('Nome do treinamento é obrigatório', 'error');
                    return false;
                }
                const result = await SGE.api.syncTreinamentoCatalogo('create', {
                    nome: vals.nome.trim(),
                    descricao: vals.descricao.trim(),
                    validade_meses: vals.validade_meses
                });
                if (result) {
                    SGE.helpers.toast('Treinamento criado com sucesso');
                    await SGE.api.loadTreinamentos();
                    this.render();
                }
            }
        });
    },

    _editCatalogo(id) {
        const item = SGE.state.treinamentosCatalogo.find(t => t.id === id);
        if (!item) return;

        SGE.modal.openDynamic({
            title: 'Editar Treinamento',
            fields: [
                { id: 'nome', label: 'Nome', type: 'text', value: item.nome, uppercase: true },
                { id: 'validade_meses', label: 'Validade (em meses) - Opcional', type: 'number', value: item.validade_meses || '' },
                { id: 'descricao', label: 'Descrição', type: 'text', value: item.descricao || '' }
            ],
            okText: 'Salvar',
            onConfirm: async (vals) => {
                if (!vals.nome.trim()) {
                    SGE.helpers.toast('Nome é obrigatório', 'error');
                    return false;
                }
                await SGE.api.syncTreinamentoCatalogo('update', {
                    id,
                    nome: vals.nome.trim(),
                    descricao: vals.descricao.trim(),
                    validade_meses: vals.validade_meses
                });
                SGE.helpers.toast('Treinamento atualizado');
                await SGE.api.loadTreinamentos();
                this.render();
            },
            onDelete: async () => {
                await this._deleteCatalogo(id);
            }
        });
    },

    _deleteCatalogo(id) {
        return new Promise((resolve) => {
            SGE.modal.confirm({
                title: 'Excluir Treinamento',
                message: 'Isso removerá o treinamento e todos os vínculos associados. Continuar?',
                confirmText: 'Excluir',
                confirmColor: 'danger',
                onConfirm: async () => {
                    await SGE.api.syncTreinamentoCatalogo('delete', { id });
                    SGE.helpers.toast('Treinamento excluído');
                    await SGE.api.loadTreinamentos();
                    this.render();
                    resolve(true); // Tell the caller (edit modal) that delete succeeded
                },
                onCancel: () => {
                    resolve(false); // Action was cancelled, handle properly
                }
            });
        });
    },

    _openVinculoModal() {
        const catalogo = SGE.state.treinamentosCatalogo;
        if (catalogo.length === 0) {
            SGE.helpers.toast('Crie um treinamento no catálogo primeiro', 'info');
            return;
        }

        const colabs = SGE.state.colaboradores.sort((a, b) => a.nome.localeCompare(b.nome));

        SGE.modal.openDynamic({
            title: 'Vincular Treinamento',
            subtitle: 'Associar treinamento a 1 ou mais colaboradores',
            fields: [
                {
                    id: 'employee_ids', label: 'Colaboradores', type: 'multiselect',
                    options: colabs.map(c => ({ value: c.id, label: `${c.nome} (${c.matricula_gps || 'S/MAT'})` }))
                },
                {
                    id: 'treinamento_id', label: 'Treinamento', type: 'select',
                    options: catalogo.map(t => ({ value: t.id, label: t.nome }))
                },
                { id: 'data_conclusao', label: 'Data de Conclusão', type: 'date', value: new Date().toISOString().split('T')[0] },
                { id: 'validade', label: 'Validade (opcional)', type: 'date', value: '' },
                { id: 'anexo_url', label: 'URL do Anexo (opcional)', type: 'text', value: '', placeholder: 'https://...' }
            ],
            okText: 'Vincular a todos',
            onConfirm: async (vals) => {
                if (!vals.employee_ids || vals.employee_ids.length === 0) {
                    SGE.helpers.toast('Selecione ao menos um colaborador', 'error');
                    return false;
                }
                const result = await SGE.api.syncColaboradorTreinamentoLote(vals);
                if (result) {
                    SGE.helpers.toast(`Treinamento vinculado a ${vals.employee_ids.length} colaborador(es)`);
                    await SGE.api.loadTreinamentos();
                    this.render();
                }
            }
        });

        // Set up reactive auto-calculation in the DOM
        setTimeout(() => {
            const trSelect = document.getElementById('dyn-field-1'); // treinamento_id
            const dtConcInput = document.getElementById('dyn-field-2'); // data_conclusao
            const valInput = document.getElementById('dyn-field-3'); // validade

            const autoCalc = () => {
                if (!trSelect || !dtConcInput || !valInput) return;
                const tId = trSelect.value;
                const dC = dtConcInput.value;
                if (tId && dC) {
                    const treinamento = catalogo.find(t => t.id === tId);
                    if (treinamento && treinamento.validade_meses) {
                        const dateObj = new Date(dC + 'T00:00:00');
                        dateObj.setMonth(dateObj.getMonth() + treinamento.validade_meses);
                        valInput.value = dateObj.toISOString().split('T')[0];
                    } else {
                        valInput.value = '';
                    }
                }
            };

            if (trSelect) trSelect.addEventListener('change', autoCalc);
            if (dtConcInput) dtConcInput.addEventListener('change', autoCalc);

            // Trigger initially
            autoCalc();
        }, 100); // give the modal DOM a moment to be rendered
    },

    async _deleteVinculo(id) {
        SGE.modal.confirm({
            title: 'Remover Vínculo',
            message: 'Remover este vínculo de treinamento?',
            confirmText: 'Remover',
            confirmColor: 'danger',
            onConfirm: async () => {
                await SGE.api.syncColaboradorTreinamento('delete', { id });
                SGE.helpers.toast('Vínculo removido');
                await SGE.api.loadTreinamentos();
                this.render();
            }
        });
    }
};
