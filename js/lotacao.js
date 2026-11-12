'use strict';

/**
 * SGE — Aba "Lotação" do painel lateral da pessoa (v2.18.0, opção 3 do portfólio de 12/11: Mover | Situação)
 * Fica no painel oficial à direita (pedido do dono, 12/11), aberta pela Matriz, pelo Organograma e pelo botão Lotação.
 *  - Mover: supervisor (caixa de seleção) + lista dos equipamentos dele com quem está e se tem vaga;
 *    "Sem equipamento" é uma linha da lista. Regime, motivo e data já vêm preenchidos ("alterar" abre os campos).
 *    Grava pelo mesmo caminho de sempre: SGE.modal.confirmMove (validação, Desfazer, movimentação e vaga).
 *  - Situação: Ativo, Férias, Afastado... Grava só o status (SGE.api.syncStatusColaborador) com Desfazer.
 *    Férias/afastado: a pessoa vai para o cartão da situação no Organograma e o equipamento fica guardado.
 */
window.SGE = window.SGE || {};

SGE.lotacao = {
    SEM_SUP: 'SEM SUPERVISOR',
    SEM_EQ: 'SEM EQUIPAMENTO',
    FORA: ['DESLIGADO', 'INATIVO'],
    AUSENTES: ['FÉRIAS', 'AFASTADO', 'BLOQUEADO NA PORTARIA', 'EM AVISO'],
    _st: null, // { col, aba, sup, eq, alterar, status }

    _esc(v) { return SGE.helpers.escapeHtml(v == null ? '' : String(v)); },
    _mot(c) { return /MOTORISTA/i.test((c && c.funcao) || ''); },
    _cap(s) { return s.charAt(0) + s.slice(1).toLowerCase(); },
    _curto(nome) {
        const p = String(nome || '').trim().split(/\s+/);
        const seg = p.slice(1).find(w => !/^(DA|DE|DO|DAS|DOS|E)$/i.test(w));
        return seg ? `${this._cap(p[0])} ${this._cap(seg)}` : this._cap(p[0] || '—');
    },
    _rotulo(cod) { return SGE.organograma && SGE.organograma._rotulo ? SGE.organograma._rotulo(cod) : String(cod).replace('-', ' '); },
    _nomeSup(n) { return n === this.SEM_SUP ? 'Sem supervisor (sobra)' : (/^16\s*HORAS$/i.test(n) ? 'Equipe 16 horas' : String(n).split(/\s+/).map(w => this._cap(w)).join(' ')); },

    /** supervisor atual da pessoa (inativo ou vazio = sobra) */
    _supDe(col) {
        return (SGE.state.supervisores || []).some(s => s.ativo && s.nome === col.supervisor) ? col.supervisor : this.SEM_SUP;
    },

    /** abre o painel lateral da pessoa já na aba Lotação. aba: 'mover' (padrão) ou 'situacao' */
    abrir(col, aba) {
        if (!col) return;
        if (!this.pode()) return SGE.helpers.toast('Seu perfil não pode mudar a lotação.', 'error');
        this._iniciar(col, aba);
        SGE.drawer._aba = 'lotacao';
        SGE.drawer.open(col);
    },

    pode() { return !!(SGE.auth && SGE.auth.hasRole('GESTAO')); },

    _iniciar(col, aba) {
        this._st = { col, aba: aba === 'situacao' ? 'situacao' : 'mover', sup: this._supDe(col), eq: null, alterar: false, status: col.status || 'ATIVO' };
    },

    /** conteúdo da aba "Lotação" do painel lateral (chamado pelo SGE.drawer) */
    html(col) {
        if (!this._st || this._st.col !== col) this._iniciar(col);
        const st = this._st, esc = this._esc.bind(this);
        const abas = `<div class="lot-seg" role="tablist"><button type="button" role="tab" data-lot="aba-mover" class="${st.aba === 'mover' ? 'on' : ''}">Mover</button><button type="button" role="tab" data-lot="aba-situacao" class="${st.aba === 'situacao' ? 'on' : ''}">Situação</button></div>`;
        const corpo = st.aba === 'mover' ? this._corpoMover() : this._corpoSituacao(); // antes do botão: escolhe a vaga sugerida
        const pronto = st.aba === 'mover' ? !!st.eq : st.status !== col.status;
        return `<div class="lot-painel">${abas}${corpo}
            <div class="lot-acoes"><button type="button" class="btn-cancel" data-lot="limpar">Limpar</button><button type="button" class="btn-confirm" data-lot="confirmar"${pronto ? '' : ' disabled'}>${esc(this._textoBotao())}</button></div></div>`;
    },

    /* ───────── dados da aba Mover ───────── */

    /** equipamentos do supervisor: vagas dele + onde a equipe dele está, com quem está em cada um */
    _equipamentos(sup) {
        const st = this._st;
        const mapa = new Map();
        if (sup !== this.SEM_SUP && SGE.vagas) SGE.vagas.doSupervisor(sup).forEach(({ eq }) => mapa.set(SGE.vagas.codigo(eq), []));
        (SGE.state.colaboradores || []).forEach(c => {
            if (this.FORA.includes(c.status) || this._supDe(c) !== sup) return;
            const cod = c.equipamento && c.equipamento !== this.SEM_EQ ? c.equipamento : null;
            if (!cod) return;
            if (!mapa.has(cod)) mapa.set(cod, []);
            mapa.get(cod).push(c);
        });
        // o equipamento atual da pessoa aparece mesmo se for de outro supervisor (para ver de onde sai)
        return [...mapa.entries()]
            .map(([cod, pessoas]) => ({ cod, rotulo: this._rotulo(cod), pessoas: pessoas.sort((a, b) => (this._mot(b) - this._mot(a)) || a.nome.localeCompare(b.nome, 'pt')) }))
            .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR', { numeric: true }))
            .map(e => ({ ...e, ...this._vaga(e, st.col, sup) }));
    },

    /** etiqueta de vaga pela função da pessoa: MOT = 1 por equipamento; OP = até 2 */
    _vaga(e, col, sup) {
        if (sup === this._supDe(col) && e.cod === col.equipamento) return { tag: 'atual', cls: 'atual' };
        const presentes = e.pessoas.filter(c => c.id !== col.id && !this.AUSENTES.includes(c.status));
        if (!presentes.length) return { tag: 'vazio', cls: 'livre' };
        if (this._mot(col)) return presentes.some(c => this._mot(c)) ? { tag: 'já tem MOT', cls: 'ocup' } : { tag: 'vaga de MOT', cls: 'livre' };
        const ops = presentes.filter(c => !this._mot(c)).length;
        return ops >= 2 ? { tag: `já tem ${ops} OP`, cls: 'ocup' } : { tag: 'vaga de OP', cls: 'livre' };
    },

    /** regime sugerido: o da pessoa se ficar no mesmo supervisor; senão o padrão do supervisor (se existir na lista) */
    _regime(sup) {
        const col = this._st.col, lista = SGE.CONFIG.regimes || [];
        const norm = r => String(r || '').toUpperCase().replace(/\s+/g, '').replace('-', '');
        const achar = r => lista.find(x => norm(x) === norm(r));
        if (sup === this._supDe(col) && achar(col.regime)) return achar(col.regime);
        const s = (SGE.state.supervisores || []).find(x => x.nome === sup);
        return (s && achar(s.regime_padrao)) || achar(col.regime) || lista[0] || '';
    },
    _motivo(sup) {
        const lista = SGE.CONFIG.motivos || [];
        const quer = sup === this._supDe(this._st.col) ? 'Remanejamento Operacional' : 'Transferência';
        return lista.includes(quer) ? quer : (lista[0] || '');
    },

    /* ───────── desenho ───────── */

    /** redesenha a aba (o painel lateral desenha tudo de novo e chama _ligar) */
    _desenhar() {
        if (SGE.drawer && SGE.drawer._desenhar) SGE.drawer._desenhar();
    },

    _corpoMover() {
        const st = this._st, esc = this._esc.bind(this);
        const sups = (SGE.state.supervisores || []).filter(s => s.ativo).sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
        const atual = this._supDe(st.col);
        const opcoesSup = sups.map(s => `<option value="${esc(s.nome)}"${s.nome === st.sup ? ' selected' : ''}>${esc(this._nomeSup(s.nome))}${s.nome === atual ? ' (atual)' : ''}${s.regime_padrao ? ' · ' + esc(s.regime_padrao) : ''}</option>`).join('')
            + `<option value="${this.SEM_SUP}"${st.sup === this.SEM_SUP ? ' selected' : ''}>Sem supervisor (sobra)${atual === this.SEM_SUP ? ' (atual)' : ''}</option>`;
        const eqs = this._equipamentos(st.sup);
        if (st.eq == null) {
            // sugere: primeira vaga livre; senão "sem equipamento"
            const livre = eqs.find(e => e.cls === 'livre');
            st.eq = livre ? livre.cod : this.SEM_EQ;
            if (st.sup === atual && (st.col.equipamento || this.SEM_EQ) === st.eq) st.eq = null;
        }
        const linha = (cod, rot, pessoas, tag, cls) => {
            const atualDele = cls === 'atual';
            return `<div class="lot-it${st.eq === cod ? ' on' : ''}${atualDele ? ' dis' : ''}" data-lot-eq="${esc(cod)}" role="radio" aria-checked="${st.eq === cod}" tabindex="${atualDele ? -1 : 0}">
                <span class="rd"></span><b>${esc(rot)}</b><span class="ps">${pessoas}</span><span class="tg ${cls}">${esc(tag)}</span></div>`;
        };
        const pessoas = e => e.pessoas.length ? e.pessoas.map(c => `${this._mot(c) ? 'MOT' : 'OP'} ${esc(this._curto(c.nome))}${this.AUSENTES.includes(c.status) ? ` <i>(${esc(c.status === 'FÉRIAS' ? 'FÉR' : c.status === 'AFASTADO' ? 'AFAST' : c.status)})</i>` : ''}`).join(' · ') : '<i>ninguém</i>';
        const semAtual = st.sup === atual && (!st.col.equipamento || st.col.equipamento === this.SEM_EQ);
        const lista = eqs.map(e => linha(e.cod, e.rotulo, pessoas(e), e.tag, e.cls)).join('')
            + linha(this.SEM_EQ, 'SEM EQUIP', 'fica só com o supervisor', semAtual ? 'atual' : '', semAtual ? 'atual' : 'ocup');
        const reg = this._regime(st.sup), mot = this._motivo(st.sup), hoje = new Date().toISOString().slice(0, 10);
        const campos = st.alterar ? `
            <div class="lot-2">
                <div class="form-field"><label for="modal-data">Data</label><input type="date" id="modal-data" value="${hoje}"></div>
                <div class="form-field"><label for="modal-regime-dest">Regime</label><select id="modal-regime-dest">${(SGE.CONFIG.regimes || []).map(r => `<option${r === reg ? ' selected' : ''}>${esc(r)}</option>`).join('')}</select></div>
                <div class="form-field"><label for="modal-motivo">Motivo</label><select id="modal-motivo">${(SGE.CONFIG.motivos || []).map(m => `<option${m === mot ? ' selected' : ''}>${esc(m)}</option>`).join('')}</select></div>
                <div class="form-field"><label for="modal-obs">Observação</label><input type="text" id="modal-obs" maxlength="500" placeholder="opcional"></div>
            </div>`
            : `<div class="lot-auto"><span>Regime <b>${esc(reg)}</b></span><span>Motivo <b>${esc(mot)}</b></span><span>Data <b>hoje</b></span><a href="#" data-lot="alterar">alterar</a>
                <input type="hidden" id="modal-data" value="${hoje}"><input type="hidden" id="modal-regime-dest" value="${esc(reg)}"><input type="hidden" id="modal-motivo" value="${esc(mot)}"><input type="hidden" id="modal-obs" value=""></div>`;
        const aviso = this._avisoMover(eqs);
        return `<div class="form-field"><label for="lot-sup">Supervisor</label><select id="lot-sup">${opcoesSup}</select></div>
            <div class="form-field"><label>Equipamento</label><div class="lot-lista" role="radiogroup">${lista}</div></div>
            ${aviso ? `<div class="lot-aviso">${aviso}</div>` : ''}
            ${campos}
            <input type="hidden" id="modal-equip-dest" value="${esc(st.eq || '')}">`;
    },

    /** aviso de conflito antes de gravar */
    _avisoMover(eqs) {
        const st = this._st, esc = this._esc.bind(this);
        if (!st.eq || st.eq === this.SEM_EQ) return '';
        const e = eqs.find(x => x.cod === st.eq);
        if (e && e.cls === 'ocup') return `O <b>${esc(e.rotulo)}</b> ${esc(e.tag)}. Pode mover mesmo assim.`;
        if (this.AUSENTES.includes(st.col.status)) return `${esc(this._curto(st.col.nome))} está de <b>${esc(st.col.status)}</b>. Para voltar ao trabalho, mude a situação para Ativo na aba Situação.`;
        return '';
    },

    _corpoSituacao() {
        const st = this._st, col = st.col, esc = this._esc.bind(this);
        const lista = (SGE.CONFIG.statuses || []).filter(s => !this.FORA.includes(s));
        const chips = lista.map(s => `<button type="button" data-lot-st="${esc(s)}" class="${st.status === s ? 'on' : ''}">${esc(this._cap(s.toLowerCase()).replace(/^./, c => c.toUpperCase()))}</button>`).join('');
        const sup = this._nomeSup(this._supDe(col));
        const eq = col.equipamento && col.equipamento !== this.SEM_EQ ? this._rotulo(col.equipamento) : null;
        let res = '', aviso = '';
        if (st.status === col.status) res = `Situação atual: <b>${esc(col.status || 'ATIVO')}</b>. Escolha outra para mudar.`;
        else if (this.AUSENTES.includes(st.status)) {
            res = `Vai para o cartão <b>${esc(st.status)}</b> de ${esc(sup)}.${eq ? ` O <b>${esc(eq)}</b> fica guardado para a volta.` : ''}`;
            if (eq) {
                const resto = (SGE.state.colaboradores || []).filter(c => c.id !== col.id && c.equipamento === col.equipamento && this._supDe(c) === this._supDe(col) && !this.FORA.includes(c.status) && !this.AUSENTES.includes(c.status));
                if (this._mot(col) && !resto.some(c => this._mot(c))) aviso = `O <b>${esc(eq)}</b> fica sem motorista enquanto ${esc(this._curto(col.nome))} estiver fora.`;
                else if (!resto.length) aviso = `O <b>${esc(eq)}</b> fica sem ninguém enquanto ${esc(this._curto(col.nome))} estiver fora.`;
            }
        } else if (this.AUSENTES.includes(col.status)) res = `Volta ao trabalho${eq ? ` no <b>${esc(eq)}</b>` : ''} com ${esc(sup)}.`;
        else res = `Muda a situação para <b>${esc(st.status)}</b>.`;
        return `<div class="lot-sit" role="radiogroup" aria-label="Situação">${chips}</div>
            <div class="lot-res">${res}</div>${aviso ? `<div class="lot-aviso">${aviso}</div>` : ''}`;
    },

    _textoBotao() {
        const st = this._st;
        if (st.aba === 'situacao') return st.status === st.col.status ? 'Nada a mudar' : (st.status === 'ATIVO' ? 'Voltar a ativo' : `Confirmar ${st.status.toLowerCase()}`);
        if (!st.eq) return 'Escolha o equipamento';
        return st.eq === this.SEM_EQ ? 'Tirar do equipamento' : `Mover para ${this._rotulo(st.eq)}`;
    },

    /* ───────── eventos ───────── */

    /** liga os cliques da aba (o corpo do painel é o mesmo elemento a cada desenho: liga uma vez só) */
    _ligar(root) {
        if (!root || root._lotLigado) return;
        root._lotLigado = true;
        root.addEventListener('click', (ev) => {
            const st = this._st;
            if (!st || !ev.target.closest('.lot-painel')) return;
            const a = ev.target.closest('[data-lot]');
            const it = ev.target.closest('[data-lot-eq]');
            const sti = ev.target.closest('[data-lot-st]');
            if (it && !it.classList.contains('dis')) { st.eq = it.dataset.lotEq; return this._desenhar(); }
            if (sti) { st.status = sti.dataset.lotSt; return this._desenhar(); }
            if (!a) return;
            ev.preventDefault();
            const k = a.dataset.lot;
            if (k === 'aba-mover' || k === 'aba-situacao') { st.aba = k === 'aba-mover' ? 'mover' : 'situacao'; return this._desenhar(); }
            if (k === 'alterar') { st.alterar = true; return this._desenhar(); }
            if (k === 'limpar') { this._iniciar(st.col, st.aba); return this._desenhar(); }
            if (k === 'confirmar') return st.aba === 'mover' ? this._confirmarMover() : this._confirmarSituacao();
        });
        root.addEventListener('keydown', (ev) => {
            const it = ev.target.closest && ev.target.closest('[data-lot-eq]');
            if (it && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); it.click(); }
        });
        root.addEventListener('change', (ev) => {
            if (ev.target.id !== 'lot-sup' || !this._st) return;
            this._st.sup = ev.target.value; this._st.eq = null; this._desenhar();
        });
    },

    /** depois de gravar: zera a aba e mostra o painel com os dados novos */
    _depois(col) {
        this._st = null;
        if (SGE.drawer && SGE.state.drawerColaborador === col) SGE.drawer.open(col);
    },

    /** mover: entrega ao caminho oficial (SGE.modal.confirmMove) com os mesmos campos da janela antiga */
    _confirmarMover() {
        const st = this._st;
        if (!st.eq) return SGE.helpers.toast('Escolha o equipamento (ou "SEM EQUIP").', 'info');
        const atual = this._supDe(st.col);
        if (st.sup === atual && (st.col.equipamento || this.SEM_EQ) === st.eq) return SGE.helpers.toast('Nada mudou.', 'info');
        const col = st.col;
        SGE.state.pendingMove = { colaborador: col, supervisorDestino: st.sup, source: 'lotacao' };
        SGE.modal.confirmMove(); // valida, atualiza a tela, Desfazer por 10 s, grava movimentação e garante a vaga
        if (SGE.state.pendingMove === null) this._depois(col); // gravou (o caminho oficial fecha e zera)
        else SGE.state.pendingMove = null; // não passou na validação: o aviso já apareceu
    },

    /** situação: grava só o status, com Desfazer por 10 s (igual ao mover) */
    _confirmarSituacao() {
        const st = this._st, col = st.col, novo = st.status, antigo = col.status;
        if (novo === antigo) return;
        if (!(SGE.CONFIG.statuses || []).includes(novo)) return SGE.helpers.toast('Situação inválida.', 'error');
        col.status = novo;
        this._depois(col);
        const atualizar = () => { if (SGE.helpers.updateStats) SGE.helpers.updateStats(); if (SGE.navigation && SGE.navigation._refreshViews) SGE.navigation._refreshViews(); if (SGE.state.drawerColaborador === col) SGE.drawer.open(col); };
        atualizar();
        let desfeito = false;
        const timer = setTimeout(async () => {
            if (desfeito) return;
            const ok = await SGE.api.syncStatusColaborador(col, novo, antigo);
            if (!ok) { col.status = antigo; atualizar(); SGE.helpers.toast('Não foi possível salvar a situação. Nada mudou.', 'error'); }
        }, 10000);
        SGE.helpers.toastUndo(`${col.nome}: ${novo}`, () => {
            desfeito = true;
            clearTimeout(timer);
            col.status = antigo;
            atualizar();
            SGE.helpers.toast('Mudança desfeita.', 'info');
        });
    },
};
