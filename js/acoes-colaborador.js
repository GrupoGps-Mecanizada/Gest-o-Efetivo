'use strict';

/**
 * SGE — Ações sobre colaboradores (usadas pela Matriz)
 * Edição em massa dos colaboradores selecionados.
 * Vieram da antiga Tabela (excel-table.js), agora com todo texto do banco escapado.
 */
window.SGE = window.SGE || {};

SGE.acoesColaborador = {
    _esc(v) {
        return SGE.helpers.escapeHtml(v);
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
};
