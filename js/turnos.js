'use strict';

/**
 * SGE — Tela Turnos
 * Quem está de turno (agora ou num momento escolhido), calendário das letras,
 * feriados e histórico dos supervisores. O cálculo fica em escala.js.
 */
window.SGE = window.SGE || {};

SGE.turnos = {
    _momento: null,        // null = agora (atualiza sozinho)
    _mesVisto: null,       // { ano, mes }
    _historico: null,      // linhas do histórico dos supervisores (carrega ao abrir)
    _relogio: null,

    PERIODO: { dia: 'Dia', noite: 'Noite' },
    SEMANA: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    MESES: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],

    render() {
        const view = document.getElementById('turnos-view');
        if (!view) return;
        if (!this._mesVisto) {
            const h = new Date();
            this._mesVisto = { ano: h.getFullYear(), mes: h.getMonth() + 1 };
        }

        const esc = SGE.helpers.escapeHtml;
        const momento = this._momento || new Date();
        const t = SGE.escala.turnoEm(momento);

        view.innerHTML = `
            <div class="turnos-tela">
                <div class="turnos-topo">
                    <div>
                        <h2 class="turnos-titulo">Turnos e supervisores</h2>
                        <p class="turnos-sub">${this._momento ? 'Consultando' : 'Agora'}: <b>${esc(this._formatarMomento(momento))}</b>${t.feriado ? ` · <span class="turnos-feriado-tag">Feriado: ${esc(t.feriado.nome)}</span>` : ''}</p>
                    </div>
                    <div class="turnos-consulta">
                        <label for="turnos-momento">Quem estava de turno em</label>
                        <input type="datetime-local" id="turnos-momento" class="history-filter-input" value="${this._valorInput(momento)}">
                        <button type="button" class="turnos-btn" id="turnos-agora" ${this._momento ? '' : 'disabled'}>Agora</button>
                    </div>
                </div>

                <div class="turnos-cards">
                    ${this._card4x4(t.quatroPorQuatro)}
                    ${this._cardAdm(t.adm, t.feriado)}
                    ${this._card16(t.dezesseis, t.feriado)}
                </div>

                <section class="turnos-bloco">
                    <h3>Escala dos supervisores em ${this._dataCurta(SGE.escala.dataISO(momento))}</h3>
                    ${this._tabelaSupervisores(momento)}
                </section>

                <section class="turnos-bloco">
                    <div class="turnos-bloco-topo">
                        <h3>Calendário das letras</h3>
                        <div class="turnos-mes-nav">
                            <button type="button" class="turnos-btn" data-mes="-1" aria-label="Mês anterior">‹</button>
                            <b>${this.MESES[this._mesVisto.mes - 1]} ${this._mesVisto.ano}</b>
                            <button type="button" class="turnos-btn" data-mes="1" aria-label="Próximo mês">›</button>
                        </div>
                    </div>
                    <p class="turnos-legenda">Em cima a letra do <b>dia</b> (06:40–18:40), embaixo a da <b>noite</b> (18:40–06:40).</p>
                    ${this._calendario()}
                </section>

                <div class="turnos-duas">
                    <section class="turnos-bloco">
                        <h3>Feriados</h3>
                        <p class="turnos-legenda">ADM e 16 horas não trabalham em feriado. O 4x4 segue a escala.</p>
                        ${this._feriados()}
                    </section>
                    <section class="turnos-bloco">
                        <h3>Histórico dos supervisores</h3>
                        <p class="turnos-legenda">Toda troca de letra, regime, nome ou ativo, com quem mudou e quando.</p>
                        <div id="turnos-historico">${this._historicoHtml()}</div>
                    </section>
                </div>
            </div>`;

        this._ligarEventos(view);
        this._ligarRelogio();
        if (this._historico === null) this._carregarHistorico();
    },

    /** Dados mudaram no banco: recarrega o histórico e redesenha (sem atrapalhar quem está digitando). */
    atualizar() {
        this._historico = null;
        if (!this._digitando()) this.render();
    },

    _digitando() {
        const el = document.activeElement;
        return !!(el && el.closest && el.closest('#turnos-view form, #turnos-momento'));
    },

    // ---------- cartões ----------

    _card4x4(q) {
        const esc = SGE.helpers.escapeHtml;
        const nomes = this._supervisoresDaLetra(q.letra);
        return `
            <article class="turnos-card">
                <p class="turnos-card-rotulo">4x4 · ${this.PERIODO[q.periodo]} (${esc(q.inicio)}–${esc(q.fim)})</p>
                <div class="turnos-card-linha">
                    <span class="turnos-letra turnos-letra-${esc(q.letra)}">${esc(q.letra)}</span>
                    <div>
                        <b class="turnos-card-nome">${nomes.length ? esc(nomes.join(', ')) : 'Sem supervisor cadastrado'}</b>
                        <small>${q.periodo === 'dia' ? `${q.vezDaLetra}º dia seguido` : `${q.vezDaLetra}ª noite seguida · começou em ${esc(this._dataCurta(q.diaDoTurno))}`}</small>
                    </div>
                </div>
            </article>`;
    },

    _cardAdm(adm, feriado) {
        const esc = SGE.helpers.escapeHtml;
        const nomes = this._supervisoresDoTipo('ADM');
        const motivo = adm.trabalhando ? 'Trabalhando' : (feriado ? 'Folga (feriado)' : 'Fora do horário');
        return `
            <article class="turnos-card ${adm.trabalhando ? '' : 'turnos-card-off'}">
                <p class="turnos-card-rotulo">ADM · seg a sex (${esc(adm.inicio)}–${esc(adm.fim)})</p>
                <div class="turnos-card-linha">
                    <span class="turnos-letra turnos-letra-ADM">ADM</span>
                    <div>
                        <b class="turnos-card-nome">${esc(motivo)}</b>
                        <small>${nomes.length ? esc(nomes.join(', ')) : 'Sem supervisor ADM'}</small>
                    </div>
                </div>
            </article>`;
    },

    _card16(dez, feriado) {
        const esc = SGE.helpers.escapeHtml;
        const turnos = SGE.escala.config()['16h'].turnos.map(x => `${x.inicio}–${x.fim}`).join(' e ');
        const texto = dez.turno ? `${dez.turno.nome} (${dez.turno.inicio}–${dez.turno.fim})` : (feriado ? 'Folga (feriado)' : 'Fora do horário');
        return `
            <article class="turnos-card ${dez.turno ? '' : 'turnos-card-off'}">
                <p class="turnos-card-rotulo">16 horas · seg a sex (${esc(turnos)})</p>
                <div class="turnos-card-linha">
                    <span class="turnos-letra turnos-letra-16H">16H</span>
                    <div>
                        <b class="turnos-card-nome">${esc(texto)}</b>
                        <small>Sem supervisor (AP 07 e AV 07)</small>
                    </div>
                </div>
            </article>`;
    },

    // ---------- tabela dos supervisores ----------

    _tabelaSupervisores(momento) {
        const esc = SGE.helpers.escapeHtml;
        const hoje = SGE.escala.dataISO(momento);
        const sups = (SGE.state.supervisores || [])
            .filter(s => s.ativo && !['SEM SUPERVISOR', '16 HORAS'].includes(s.nome))
            .map(s => ({ ...s, grupo: SGE.escala.grupoDoRegime(s.regime_padrao) }))
            .sort((a, b) => (a.grupo.letra || 'Z' + a.grupo.tipo).localeCompare(b.grupo.letra || 'Z' + b.grupo.tipo) || a.nome.localeCompare(b.nome));

        if (!sups.length) return '<p class="turnos-vazio">Nenhum supervisor ativo.</p>';

        const linhas = sups.map(s => {
            let hojeTxt = '—', classe = '';
            if (s.grupo.tipo === '4x4') {
                const sit = SGE.escala.situacaoDaLetra(s.grupo.letra, hoje);
                hojeTxt = sit === 'dia' ? 'Dia (06:40–18:40)' : sit === 'noite' ? 'Noite (18:40–06:40)' : 'Folga';
                classe = sit === 'folga' ? 'turnos-off' : 'turnos-on';
            } else if (s.grupo.tipo === 'ADM') {
                const semana = momento.getDay();
                const util = semana >= 1 && semana <= 5 && !SGE.escala.feriadoDe(hoje);
                hojeTxt = util ? 'Expediente ADM' : 'Folga';
                classe = util ? 'turnos-on' : 'turnos-off';
            } else {
                hojeTxt = 'Regime sem escala definida';
                classe = 'turnos-alerta';
            }
            const letra = s.grupo.letra || s.grupo.tipo || '?';
            return `
                <tr>
                    <td><b>${esc(s.nome)}</b></td>
                    <td><span class="turnos-letra turnos-letra-mini turnos-letra-${esc(letra)}">${esc(letra)}</span> ${esc(s.regime_padrao)}</td>
                    <td class="${classe}">${esc(hojeTxt)}</td>
                </tr>`;
        }).join('');

        return `
            <div class="turnos-tabela-wrap">
                <table class="turnos-tabela">
                    <thead><tr><th>Supervisor</th><th>Regime / letra</th><th>Neste dia</th></tr></thead>
                    <tbody>${linhas}</tbody>
                </table>
            </div>`;
    },

    // ---------- calendário ----------

    _calendario() {
        const esc = SGE.helpers.escapeHtml;
        const { ano, mes } = this._mesVisto;
        const dias = SGE.escala.mes(ano, mes);
        const hoje = SGE.escala.dataISO(new Date());
        const vazios = Array.from({ length: dias[0].semana }, () => '<div class="turnos-dia turnos-dia-vazio"></div>').join('');

        const celulas = dias.map(d => `
            <div class="turnos-dia ${d.iso === hoje ? 'turnos-dia-hoje' : ''} ${d.feriado ? 'turnos-dia-feriado' : ''} ${d.semana === 0 || d.semana === 6 ? 'turnos-dia-fds' : ''}"
                 title="${esc(d.feriado ? d.feriado.nome + ' · ' : '')}Dia: ${esc(d.dia)} · Noite: ${esc(d.noite)} · Folga: ${esc(d.folga.join(', '))}">
                <span class="turnos-dia-num">${d.numero}</span>
                <span class="turnos-letra turnos-letra-mini turnos-letra-${esc(d.dia)}">${esc(d.dia)}</span>
                <span class="turnos-letra turnos-letra-mini turnos-letra-noite turnos-letra-${esc(d.noite)}">${esc(d.noite)}</span>
                ${d.feriado ? `<span class="turnos-dia-fer">${esc(d.feriado.nome)}</span>` : ''}
            </div>`).join('');

        return `
            <div class="turnos-cal">
                ${this.SEMANA.map(s => `<div class="turnos-cal-cab">${s}</div>`).join('')}
                ${vazios}${celulas}
            </div>`;
    },

    // ---------- feriados ----------

    _feriados() {
        const esc = SGE.helpers.escapeHtml;
        const ano = this._mesVisto.ano;
        const lista = SGE.escala.feriados()
            .filter(f => f.data.startsWith(String(ano)))
            .sort((a, b) => a.data.localeCompare(b.data));
        const podeEditar = SGE.auth && SGE.auth.hasRole && SGE.auth.hasRole('GESTAO');

        const linhas = lista.length
            ? lista.map(f => `
                <li>
                    <span>${esc(this._dataCurta(f.data))}</span>
                    <b>${esc(f.nome)}</b>
                    ${podeEditar ? `<button type="button" class="turnos-btn-x" data-remover-feriado="${esc(f.data)}" aria-label="Remover ${esc(f.nome)}">×</button>` : ''}
                </li>`).join('')
            : `<li class="turnos-vazio">Nenhum feriado cadastrado em ${ano}.</li>`;

        const form = podeEditar ? `
            <form class="turnos-feriado-form" id="turnos-feriado-form">
                <input type="date" id="turnos-feriado-data" class="history-filter-input" required>
                <input type="text" id="turnos-feriado-nome" class="history-filter-input" placeholder="Nome (ex.: Aniversário de Ipatinga)" maxlength="60" required>
                <button type="submit" class="turnos-btn turnos-btn-cheio">Adicionar</button>
            </form>` : '';

        return `<ul class="turnos-feriados">${linhas}</ul>${form}`;
    },

    async _adicionarFeriado(data, nome) {
        const lista = SGE.escala.feriados().filter(f => f.data !== data);
        lista.push({ data, nome: nome.trim() });
        await this._salvarFeriados(lista, 'Feriado adicionado.');
    },

    async _removerFeriado(data) {
        await this._salvarFeriados(SGE.escala.feriados().filter(f => f.data !== data), 'Feriado removido.');
    },

    async _salvarFeriados(lista, msg) {
        lista.sort((a, b) => a.data.localeCompare(b.data));
        const ok = await SGE.api.syncConfigArray('feriados', lista);
        if (!ok) return; // o api já mostrou o erro
        SGE.CONFIG.feriados = lista;
        SGE.helpers.toast(msg);
        this.render();
    },

    // ---------- histórico ----------

    async _carregarHistorico() {
        this._historico = 'carregando';
        const linhas = await SGE.api.carregarHistoricoSupervisores();
        this._historico = linhas; // array ou { erro }
        const alvo = document.getElementById('turnos-historico');
        if (alvo) alvo.innerHTML = this._historicoHtml();
    },

    _historicoHtml() {
        const esc = SGE.helpers.escapeHtml;
        const h = this._historico;
        if (h === null || h === 'carregando') return '<p class="turnos-vazio">Carregando…</p>';
        if (!Array.isArray(h)) return '<p class="turnos-vazio">Histórico ainda não disponível. Falta rodar o SQL de 14/10/2026 no banco.</p>';
        if (!h.length) return '<p class="turnos-vazio">Nenhuma mudança registrada ainda.</p>';

        const campo = { criado: 'Criado', nome: 'Nome', regime: 'Regime / letra', ativo: 'Ativo' };
        return `
            <div class="turnos-tabela-wrap">
                <table class="turnos-tabela">
                    <thead><tr><th>Quando</th><th>Supervisor</th><th>O que mudou</th><th>Quem</th></tr></thead>
                    <tbody>${h.map(r => `
                        <tr>
                            <td>${esc(new Date(r.alterado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }))}</td>
                            <td>${esc(r.supervisor_nome || '—')}</td>
                            <td>${esc(campo[r.campo] || r.campo)}: ${r.valor_antes ? `${esc(r.valor_antes)} → ` : ''}<b>${esc(r.valor_depois || '—')}</b></td>
                            <td>${esc(r.alterado_por || '—')}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
    },

    // ---------- ajudantes ----------

    _supervisoresDaLetra(letra) {
        return (SGE.state.supervisores || [])
            .filter(s => s.ativo && SGE.escala.grupoDoRegime(s.regime_padrao).letra === letra)
            .map(s => s.nome);
    },

    _supervisoresDoTipo(tipo) {
        return (SGE.state.supervisores || [])
            .filter(s => s.ativo && SGE.escala.grupoDoRegime(s.regime_padrao).tipo === tipo)
            .map(s => s.nome);
    },

    _formatarMomento(d) {
        return d.toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    },

    _dataCurta(iso) {
        const [a, m, d] = iso.split('-');
        return `${d}/${m}/${a}`;
    },

    _valorInput(d) {
        const p = n => String(n).padStart(2, '0');
        return `${SGE.escala.dataISO(d)}T${p(d.getHours())}:${p(d.getMinutes())}`;
    },

    _ligarEventos(view) {
        const inp = view.querySelector('#turnos-momento');
        inp.addEventListener('change', () => {
            if (!inp.value) return;
            const [data, hora] = inp.value.split('T');
            const [a, m, d] = data.split('-').map(Number);
            const [hh, mm] = hora.split(':').map(Number);
            this._momento = new Date(a, m - 1, d, hh, mm);
            this._mesVisto = { ano: a, mes: m };
            this.render();
        });
        view.querySelector('#turnos-agora').addEventListener('click', () => {
            this._momento = null;
            this._mesVisto = null;
            this.render();
        });
        view.querySelectorAll('[data-mes]').forEach(b => b.addEventListener('click', () => {
            const passo = Number(b.dataset.mes);
            const d = new Date(this._mesVisto.ano, this._mesVisto.mes - 1 + passo, 1);
            this._mesVisto = { ano: d.getFullYear(), mes: d.getMonth() + 1 };
            this.render();
        }));
        view.querySelectorAll('[data-remover-feriado]').forEach(b => b.addEventListener('click', () => {
            if (confirm('Remover este feriado?')) this._removerFeriado(b.dataset.removerFeriado);
        }));
        const form = view.querySelector('#turnos-feriado-form');
        if (form) form.addEventListener('submit', e => {
            e.preventDefault();
            this._adicionarFeriado(view.querySelector('#turnos-feriado-data').value, view.querySelector('#turnos-feriado-nome').value);
        });
    },

    // atualiza o "agora" a cada minuto enquanto a tela está aberta
    _ligarRelogio() {
        clearInterval(this._relogio);
        this._relogio = setInterval(() => {
            const aberta = SGE.state.activeView === 'turnos';
            if (!aberta) { clearInterval(this._relogio); return; }
            if (!this._momento && !this._digitando()) this.render();
        }, 60000);
    }
};
