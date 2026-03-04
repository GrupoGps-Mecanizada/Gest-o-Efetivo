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

        // Filter vinculos, ignoring revoked ones in active count if desired, but here we just show all.
        const filtered = filter ? vinculos.filter(v => {
            return (v.employee_name || '').toLowerCase().includes(filter) ||
                (v.treinamento_nome || '').toLowerCase().includes(filter);
        }) : vinculos;

        view.innerHTML = `
            <div id="history-view" style="display:flex; flex-direction:column; height:100%;">
                <div class="history-filters">
                    <input type="text" class="history-filter-input" id="treinamentos-filter" placeholder="Filtrar por colaborador ou treinamento..." value="${this._filterText}" style="width: 320px;" />
                    
                    <div style="margin-left: auto; display: flex; gap: 12px;">
                        <button id="btn-gerenciar-catalogo" style="padding: 7px 14px; background: var(--bg-2); border: 1px solid var(--border); border-radius: 6px; color: var(--text-2); font-family: var(--font-display); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px;"><path d="M1 4h14M1 8h14M1 12h14"/></svg>
                            Catálogo
                        </button>
                        <button id="btn-vincular-treinamento" style="padding: 7px 14px; background: var(--accent); border: none; border-radius: 6px; color: #fff; font-family: var(--font-display); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px;"><path d="M8 1v14M1 8h14"/></svg>
                            Vincular
                        </button>
                    </div>
                </div>

                <div id="history-table-wrap">
                    <table id="history-table">
                        <thead>
                            <tr>
                                <th>Colaborador</th>
                                <th>ID Efetivo</th>
                                <th>Treinamento</th>
                                <th>Conclusão</th>
                                <th>Validade</th>
                                <th>Status</th>
                                <th style="text-align: center;">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.length === 0 ? '<tr><td colspan="7" style="text-align: center; color: var(--text-3); padding: 20px;">Nenhum registro encontrado.</td></tr>' :
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
                                <tr>
                                    <td style="font-weight: 500; color: var(--text-1);">${v.employee_name}</td>
                                    <td>${v.employee_matricula || 'N/A'}</td>
                                    <td>${v.treinamento_nome}</td>
                                    <td>${v.data_conclusao ? SGE.helpers.formatDate(v.data_conclusao).split(',')[0] : '—'}</td>
                                    <td>${v.validade ? SGE.helpers.formatDate(v.validade).split(',')[0] : '—'}</td>
                                    <td><span class="treinamentos-status-badge ${statusClass}" style="font-size: 10px; padding: 3px 8px; border-radius: 12px; font-weight: 700; text-transform: uppercase;">${statusLabel}</span></td>
                                    <td style="text-align: center;">
                                        <div style="display: flex; gap: 8px; justify-content: center;">
                                            <button data-action="renovar-vinculo" data-id="${v.id}" title="Renovar Treinamento" style="padding: 4px; background:var(--bg-2); border-radius:6px; cursor:pointer; border:none; color:var(--accent); display: inline-flex;">
                                                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px;"><path d="M13.5 8a5.5 5.5 0 1 1-1.61-3.89L13.5 6"/><path d="M9 6h4.5V1.5"/></svg>
                                            </button>
                                            <button data-action="delete-vinculo" data-id="${v.id}" title="Remover Vínculo" style="padding: 4px; background:var(--bg-2); border-radius:6px; cursor:pointer; border:none; color:var(--red); display: inline-flex;">
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
            if (action === 'renovar-vinculo') this._renovarVinculo(id);
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

    async _renovarVinculo(id) {
        const vinculoAtual = SGE.state.colaboradorTreinamentos.find(v => v.id === id);
        if (!vinculoAtual) return;

        const catItem = SGE.state.treinamentosCatalogo.find(c => c.id === vinculoAtual.treinamento_id);

        SGE.modal.openDynamic({
            title: 'Renovar Treinamento',
            subtitle: `Nova validade para ${vinculoAtual.employee_name} — ${vinculoAtual.treinamento_nome}`,
            fields: [
                { id: 'data_conclusao', label: 'Nova Data de Conclusão', type: 'date', value: new Date().toISOString().split('T')[0] }
            ],
            okText: 'Renovar',
            onConfirm: async (vals) => {
                if (!vals.data_conclusao) {
                    SGE.helpers.toast('Informe a data de conclusão', 'error');
                    return false;
                }

                let validade = null;
                if (catItem && catItem.validade_meses) {
                    const conc = new Date(vals.data_conclusao + 'T00:00:00');
                    conc.setMonth(conc.getMonth() + catItem.validade_meses);
                    validade = conc.toISOString().split('T')[0];
                }

                const res = await SGE.api.syncColaboradorTreinamento('update', {
                    id: vinculoAtual.id,
                    data_conclusao: vals.data_conclusao,
                    validade: validade,
                    revogado: false // Resets revocation if it was revoked previously
                });

                if (res) {
                    SGE.helpers.toast('Treinamento renovado com sucesso');
                    await SGE.api.loadTreinamentos();
                    this.render();
                }
            }
        });
    },

    async _deleteVinculo(id) {
        SGE.modal.confirm({
            title: 'Remover Vínculo',
            message: 'Remover este vínculo de treinamento permanentemente?',
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
