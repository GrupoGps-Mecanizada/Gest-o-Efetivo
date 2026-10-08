'use strict';

/**
 * SGE — Ações sobre colaboradores (usadas pela Matriz)
 * Janelas de treinamentos e advertências de uma pessoa, edição em massa e treinamento em massa.
 * Vieram da antiga Tabela (excel-table.js), agora com todo texto do banco escapado.
 */
window.SGE = window.SGE || {};

SGE.acoesColaborador = {
    _esc(v) {
        return SGE.helpers.escapeHtml(v);
    },

    _fmt(d) {
        return d ? new Date(d).toLocaleDateString('pt-BR') : '—';
    },

    opcoes(chave) {
        const cfg = SGE.CONFIG;
        if (chave === 'categorias') return ['OPERACIONAL', 'GESTAO'];
        if (chave === 'funcoes') return cfg.funcoes || [];
        if (chave === 'regimes') return cfg.regimes || [];
        if (chave === 'statuses') return cfg.statuses || [];
        if (chave === 'supervisores') return (SGE.state.supervisores || []).filter((s) => s.ativo).map((s) => s.nome);
        return [];
    },

    _tabela(cabecalhos, linhas) {
        const th = cabecalhos.map((c) => `<th>${c}</th>`).join('');
        return `<div class="ac-tabela-caixa"><table class="ac-tabela"><thead><tr>${th}</tr></thead><tbody>${linhas}</tbody></table></div>`;
    },

    /* ─── Treinamentos de uma pessoa ─── */
    abrirTreinamentos(colabId) {
        const colab = SGE.state.colaboradores.find((c) => c.id === colabId);
        if (!colab) return;
        const esc = this._esc;
        const lista = (SGE.state.colaboradorTreinamentos || []).filter((t) => t.employee_id === colabId);
        const hoje = new Date();
        const situacao = (t) => {
            if (!t.data_validade) return { cls: 'ac-neutro', rotulo: 'Sem validade' };
            const dias = Math.floor((new Date(t.data_validade) - hoje) / 86400000);
            if (dias < 0) return { cls: 'ac-ruim', rotulo: 'Vencido' };
            if (dias < 30) return { cls: 'ac-atencao', rotulo: `${dias}d` };
            return { cls: 'ac-ok', rotulo: 'Válido' };
        };
        const linhas = lista
            .map((t) => {
                const s = situacao(t);
                return `<tr><td>${esc(t.treinamento_nome || '—')}</td><td>${this._fmt(t.data_realizacao)}</td><td>${this._fmt(t.data_validade)}</td><td><span class="ac-selo ${s.cls}">${s.rotulo}</span></td></tr>`;
            })
            .join('');
        const corpo = document.createElement('div');
        corpo.innerHTML = lista.length
            ? this._tabela(['Treinamento', 'Realizado', 'Vence', 'Situação'], linhas)
            : '<p class="ac-vazio">Nenhum treinamento registrado para este colaborador.</p>';
        SGE.modal.open(`Treinamentos — ${colab.nome}`, corpo, [
            { label: 'Fechar', action: () => SGE.modal.close() },
            {
                label: '+ Vincular treinamento',
                class: 'btn-confirm',
                action: () => {
                    SGE.modal.close();
                    if (SGE.treinamentos && SGE.treinamentos._openVinculoModal) {
                        SGE.navigation.switchView('treinamentos');
                        setTimeout(() => SGE.treinamentos._openVinculoModal(), 350);
                    }
                },
            },
        ]);
    },

    /* ─── Advertências de uma pessoa ─── */
    abrirAdvertencias(colabId) {
        const colab = SGE.state.colaboradores.find((c) => c.id === colabId);
        if (!colab) return;
        const esc = this._esc;
        const lista = (SGE.state.advertencias || []).filter((a) => a.employee_id === colabId);
        const tipos = { VERBAL: ['ac-neutro', 'Verbal'], ESCRITA: ['ac-atencao', 'Escrita'], SUSPENSAO: ['ac-ruim', 'Suspensão'] };
        const linhas = lista
            .map((w) => {
                const [cls, rotulo] = tipos[w.tipo] || ['ac-neutro', w.tipo || '—'];
                return `<tr><td>${this._fmt(w.data_aplicacao)}</td><td><span class="ac-selo ${cls}">${esc(rotulo)}</span></td><td>${esc(w.motivo || '—')}</td></tr>`;
            })
            .join('');
        const corpo = document.createElement('div');
        corpo.innerHTML = lista.length ? this._tabela(['Data', 'Tipo', 'Motivo'], linhas) : '<p class="ac-vazio">Nenhuma advertência registrada.</p>';
        SGE.modal.open(`Advertências — ${colab.nome}`, corpo, [
            { label: 'Fechar', action: () => SGE.modal.close() },
            {
                label: '+ Registrar advertência',
                class: 'btn-confirm',
                action: () => {
                    SGE.modal.close();
                    if (SGE.advertencias && SGE.advertencias._openRegistarModal) {
                        SGE.navigation.switchView('advertencias');
                        setTimeout(() => SGE.advertencias._openRegistarModal(), 350);
                    }
                },
            },
        ]);
    },

    /* ─── Edição em massa ─── */
    _campoMassa(campo, rotulo, opcoes) {
        const esc = this._esc;
        return `
        <div class="mass-field-item">
            <div class="mass-field-checkbox-row">
                <input type="checkbox" class="mass-field-toggle" data-field="${campo}" id="mft-${campo}">
                <label for="mft-${campo}">${rotulo}</label>
            </div>
            <select data-mass-input="${campo}" disabled>
                <option value="">-- Selecione --</option>
                ${opcoes.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}
            </select>
        </div>`;
    },

    editarEmMassa(ids, aoTerminar) {
        if (!SGE.auth.hasRole('GESTAO')) return SGE.helpers.toast('Seu perfil não pode editar colaboradores.', 'error');
        const corpo = document.createElement('div');
        corpo.innerHTML = `
            <p class="ac-texto">Editar campos de <strong>${ids.length}</strong> colaborador(es).<br>
            <small>Marque só os campos que deseja alterar.</small></p>
            <div class="mass-edit-modal">
                ${this._campoMassa('regime', 'Regime', this.opcoes('regimes'))}
                ${this._campoMassa('supervisor', 'Supervisor', this.opcoes('supervisores'))}
                ${this._campoMassa('status', 'Status', this.opcoes('statuses'))}
                ${this._campoMassa('funcao', 'Função', this.opcoes('funcoes'))}
                ${this._campoMassa('categoria', 'Categoria', this.opcoes('categorias'))}
            </div>`;
        SGE.modal.open(`Edição em massa — ${ids.length} colaboradores`, corpo, [
            { label: 'Cancelar', action: () => SGE.modal.close() },
            {
                label: 'Salvar alterações',
                class: 'btn-confirm',
                action: async () => {
                    const mudancas = {};
                    corpo.querySelectorAll('.mass-field-toggle:checked').forEach((cb) => {
                        const inp = corpo.querySelector(`[data-mass-input="${cb.dataset.field}"]`);
                        if (inp && inp.value) mudancas[cb.dataset.field] = inp.value;
                    });
                    if (!Object.keys(mudancas).length) return SGE.helpers.toast('Marque ao menos um campo', 'error');
                    await this._aplicarMassa(ids, mudancas);
                    SGE.modal.close();
                    if (aoTerminar) aoTerminar();
                },
            },
        ]);
        corpo.querySelectorAll('.mass-field-toggle').forEach((cb) => {
            const inp = corpo.querySelector(`[data-mass-input="${cb.dataset.field}"]`);
            if (!inp) return;
            inp.disabled = !cb.checked;
            cb.addEventListener('change', () => (inp.disabled = !cb.checked));
        });
    },

    async _aplicarMassa(ids, mudancas) {
        try {
            let ok = 0;
            for (const id of ids) {
                const colab = SGE.state.colaboradores.find((c) => c.id === id);
                if (!colab) continue;
                Object.assign(colab, mudancas);
                await SGE.api.syncEditColaborador(colab);
                ok++;
            }
            SGE.helpers.toast(`${ok} colaboradores atualizados!`, 'success');
            SGE.helpers.updateStats();
            SGE.navigation._refreshViews();
        } catch (err) {
            console.error('[SGE Massa]', err);
            SGE.helpers.toast('Erro ao atualizar: ' + (err.message || 'falha'), 'error');
        }
    },

    /* ─── Treinamento em massa ─── */
    vincularTreinamentoEmMassa(ids, aoTerminar) {
        if (!SGE.auth.hasRole('GESTAO')) return SGE.helpers.toast('Seu perfil não pode vincular treinamentos.', 'error');
        const catalogo = SGE.state.treinamentosCatalogo || [];
        if (!catalogo.length) return SGE.helpers.toast('Nenhum treinamento no catálogo. Crie primeiro em Segurança → Treinamentos.', 'info');
        const esc = this._esc;
        const corpo = document.createElement('div');
        corpo.innerHTML = `
            <p class="ac-texto">Vincular treinamento a <strong>${ids.length}</strong> colaborador(es) selecionado(s).</p>
            <div class="form-field"><label>Treinamento</label>
                <select id="mass-tr-id"><option value="">-- Selecione --</option>
                ${catalogo.map((t) => `<option value="${esc(t.id)}">${esc(t.nome)}</option>`).join('')}</select></div>
            <div class="form-field"><label>Data de realização</label><input type="date" id="mass-tr-date" value="${new Date().toISOString().slice(0, 10)}"></div>
            <div class="form-field"><label>Data de validade (opcional)</label><input type="date" id="mass-tr-expiry"></div>`;
        SGE.modal.open('Vincular treinamento em massa', corpo, [
            { label: 'Cancelar', action: () => SGE.modal.close() },
            {
                label: `Vincular em ${ids.length}`,
                class: 'btn-confirm',
                action: async () => {
                    const trId = corpo.querySelector('#mass-tr-id').value;
                    const data = corpo.querySelector('#mass-tr-date').value;
                    const validade = corpo.querySelector('#mass-tr-expiry').value;
                    if (!trId) return SGE.helpers.toast('Selecione um treinamento', 'error');
                    if (!data) return SGE.helpers.toast('Informe a data de realização', 'error');
                    try {
                        for (const empId of ids) {
                            await SGE.api.syncTreinamento({ action: 'add', treinamento_id: trId, data_realizacao: data, data_validade: validade || null, employee_id: empId });
                        }
                        SGE.helpers.toast(`Treinamento vinculado a ${ids.length} colaboradores!`, 'success');
                        SGE.modal.close();
                        if (aoTerminar) aoTerminar();
                    } catch (e) {
                        SGE.helpers.toast('Erro ao vincular: ' + e.message, 'error');
                    }
                },
            },
        ]);
    },
};
