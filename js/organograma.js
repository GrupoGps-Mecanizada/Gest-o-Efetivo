'use strict';

/**
 * SGE — Tela Organograma (formato A do portfólio de 11/11/2026: árvore clássica)
 * Coordenação no topo; abaixo Supervisores, Planejamento, Segurança e Almoxarifado.
 * Cada supervisor desce para os equipamentos dele (vagas), e cada equipamento mostra quem trabalha nele
 * ("AP 01 · Motorista · Operador"). Tudo num quadro livre: arrastar move, rodinha/pinça/botões dão zoom.
 * Só leitura: usa os dados já carregados (SGE.state). Clicar numa pessoa abre o painel dela.
 */
window.SGE = window.SGE || {};

SGE.organograma = {
    _fechados: new Set(),        // supervisores com os equipamentos recolhidos
    _modo: (() => { try { return localStorage.getItem('sge_organograma_modo') === 'pessoas' ? 'pessoas' : 'equip'; } catch (e) { return 'equip'; } })(),
    _vista: null,                // { x, y, z } posição e zoom do quadro (null = ajustar na tela)
    _arrastou: false,

    FORA: ['DESLIGADO', 'INATIVO'],
    ZOOM_MIN: 0.2,
    ZOOM_MAX: 2.5,

    // Grupos pela função cadastrada (a ordem importa: o 1º que bater vale)
    GRUPOS: [
        { id: 'coord', nome: 'Coordenação', cargo: 'Coordenador', teste: /COORDENADOR|GERENTE/ },
        { id: 'plan', nome: 'Planejamento', cargo: 'Planejador', teste: /PLANEJADOR|PROGRAMADOR/ },
        { id: 'seg', nome: 'Segurança', cargo: 'Téc. de Segurança', teste: /SEGURAN/ },
        { id: 'alm', nome: 'Almoxarifado', cargo: 'Almoxarife', teste: /ALMOX/ },
        { id: 'sup', nome: 'Supervisores', cargo: 'Supervisor', teste: /SUPERVISOR|ENCARREGADO/ },
    ],

    _grupo(c) {
        const f = String(c.funcao || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        const g = this.GRUPOS.find(x => x.teste.test(f));
        return g ? g.id : 'oper';
    },

    _ehMotorista(c) { return /MOTORISTA/i.test(c.funcao || ''); },

    _cap(s) { return s.charAt(0) + s.slice(1).toLowerCase(); },

    /** primeiro e segundo nome, pulando "da/de/do/dos/das/e" ("JOSE ALVES DA SILVA" → "Jose Alves") */
    _nomeCurto(nome) {
        const p = String(nome || '').trim().split(/\s+/).filter(Boolean);
        if (!p.length) return '—';
        const seg = p.slice(1).find(w => !/^(DA|DE|DO|DAS|DOS|E)$/i.test(w));
        return seg ? `${this._cap(p[0])} ${this._cap(seg)}` : this._cap(p[0]);
    },

    // Siglas curtas (regra do cofre: AP = Alta Pressão, AV = Auto Vácuo, HV = Hiper Vácuo, ASP = Aspirador)
    _papel(c) { return this._ehMotorista(c) ? 'MOT' : 'OP'; },

    STATUS_CURTO: { 'FÉRIAS': 'FÉR', 'AFASTADO': 'AFAST', 'BLOQUEADO NA PORTARIA': 'BLOQ', 'EM AVISO': 'AVISO', 'EM CONTRATAÇÃO': 'CONTRAT', 'SOBRA': 'SOBRA' },
    _status(c) { return this.STATUS_CURTO[c.status] || c.status; },

    _nomeSup(nome) {
        if (/^16\s*HORAS$/i.test(nome)) return 'Equipe 16 horas';
        return String(nome).split(/\s+/).map(s => this._cap(s)).join(' ');
    },

    /** sigla curta: "AP-01" → "AP1", "AV-02 - EQUIP 1" → "AV2 E1", "ASP-TELHADO" → "ASP TELHADO", "MT" → "MT" */
    _rotulo(codigo) {
        return String(codigo).toLocaleUpperCase('pt-BR')
            .replace(/^([A-Z]+)[- ]+0*(\d+)/, '$1$2')
            .replace(/\s*-\s*EQUIP\s*(\d+)/, ' E$1')
            .replace(/^([A-Z]+)[- ]+/, '$1 ')
            .trim();
    },

    _dados() {
        const ativos = (SGE.state.colaboradores || []).filter(c => !this.FORA.includes(c.status));
        const por = { coord: [], plan: [], seg: [], alm: [], sup: [], oper: [] };
        ativos.forEach(c => por[this._grupo(c)].push(c));
        Object.values(por).forEach(l => l.sort((a, b) => a.nome.localeCompare(b.nome, 'pt')));

        const supervisores = (SGE.state.supervisores || [])
            .filter(s => s.ativo)
            .map(s => this._montarEquipe(s.nome, s.regime_padrao, por.oper.filter(c => c.supervisor === s.nome)))
            .filter(s => s.equipe.length || s.equipamentos.length)
            .sort((a, b) => b.equipe.length - a.equipe.length);

        const semSup = por.oper.filter(c => !supervisores.some(s => s.nome === c.supervisor));
        // quem está sem supervisor (sobra) vira uma equipe própria, para dar para ver e mover
        if (semSup.length) supervisores.push({ ...this._montarEquipe(this.SEM_SUP, '', semSup), semSup: true });
        return { por, supervisores, semSup, total: ativos.length };
    },

    SEM_SUP: 'SEM SUPERVISOR',
    // fora do equipamento no momento: vão para o cartão da situação, embaixo do supervisor (pedido do dono, 12/11)
    AUSENTES: ['FÉRIAS', 'AFASTADO', 'BLOQUEADO NA PORTARIA', 'EM AVISO'],
    TITULO_SIT: { 'FÉRIAS': 'FÉRIAS', 'AFASTADO': 'AFASTADOS', 'BLOQUEADO NA PORTARIA': 'BLOQUEADOS', 'EM AVISO': 'EM AVISO' },

    /** uma equipe: equipamentos (vagas, mesmo vazias), "Sem equipamento" e os cartões de situação */
    _montarEquipe(nome, regime, equipe) {
        const mapa = new Map();
        if (nome !== this.SEM_SUP && SGE.vagas && SGE.vagas.doSupervisor) {
            SGE.vagas.doSupervisor(nome).forEach(({ eq }) => mapa.set(SGE.vagas.codigo(eq), []));
        }
        const semEq = [], sit = new Map();
        equipe.forEach(c => {
            if (this.AUSENTES.includes(c.status)) {
                if (!sit.has(c.status)) sit.set(c.status, []);
                return sit.get(c.status).push(c);
            }
            const cod = c.equipamento && c.equipamento !== 'SEM EQUIPAMENTO' ? c.equipamento : null;
            if (!cod) return semEq.push(c);
            if (!mapa.has(cod)) mapa.set(cod, []);
            mapa.get(cod).push(c);
        });
        const ordem = c => (this._ehMotorista(c) ? 0 : 1);
        const ord = l => l.sort((a, b) => ordem(a) - ordem(b) || a.nome.localeCompare(b.nome, 'pt'));
        const equipamentos = [...mapa.entries()]
            .map(([cod, pessoas]) => ({ codigo: cod, rotulo: this._rotulo(cod), pessoas: ord(pessoas) }))
            .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR', { numeric: true }));
        if (semEq.length) equipamentos.push({ codigo: 'SEM EQUIPAMENTO', rotulo: 'Sem equipamento', pessoas: ord(semEq), sem: true });
        this.AUSENTES.forEach(st => {
            const l = sit.get(st) || [];
            if (l.length) equipamentos.push({ status: st, rotulo: this.TITULO_SIT[st], pessoas: ord(l) });
        });
        return {
            nome, regime, equipe, equipamentos,
            mot: equipe.filter(c => this._ehMotorista(c)).length,
        };
    },

    _caixa({ nome, cargo, cor, qtd, extra, attrs = '', seta = '' }) {
        const esc = SGE.helpers.escapeHtml;
        return `<button type="button" class="org-cx org-${cor}" ${attrs}>
            <b>${esc(nome)}${seta}</b>${cargo ? `<small>${esc(cargo)}</small>` : ''}
            ${extra ? `<small class="org-extra">${esc(extra)}</small>` : ''}
            ${qtd != null ? `<span class="org-n">${qtd} ${qtd === 1 ? 'pessoa' : 'pessoas'}</span>` : ''}
        </button>`;
    },

    _ramoPessoas(lista, cor, cargo) {
        const esc = SGE.helpers.escapeHtml;
        if (!lista.length) return `<ul><li>${this._caixa({ nome: 'Ninguém cadastrado', cargo: 'confira a função no cadastro', cor: 'vazio' })}</li></ul>`;
        return `<ul>${lista.map(c => `<li>${this._caixa({
            nome: this._nomeCurto(c.nome), cargo, cor,
            extra: c.status !== 'ATIVO' ? this._status(c) : '',
            attrs: `data-colab="${esc(String(c.id))}" title="${esc(c.nome)}"`,
        })}</li>`).join('')}</ul>`;
    },

    /** linha de uma pessoa na tabela do cartão: função | nome | situação (clique abre o painel) */
    _linhaPessoa(c) {
        const esc = SGE.helpers.escapeHtml;
        return `<td class="org-fn${this._ehMotorista(c) ? ' org-mot' : ''}">${this._papel(c)}</td>
            <td class="org-pn">${esc(this._nomeCurto(c.nome))}</td>
            <td class="org-sit">${c.status !== 'ATIVO' ? `<span class="org-st" title="${esc(c.status)}">${esc(this._status(c))}</span>` : ''}</td>`;
    },

    /** formato E do portfólio de 12/11: código do equipamento na lateral, unindo as linhas (célula mesclada).
     *  Cartão de situação (FÉRIAS, AFASTADOS...): a lateral mostra a situação e a última coluna o equipamento da pessoa. */
    _cartaoEquip(e, sup) {
        const esc = SGE.helpers.escapeHtml;
        const cod = `<td class="org-cod" rowspan="${Math.max(1, e.pessoas.length)}">${esc(e.sem ? 'SEM EQUIP' : e.rotulo)}</td>`;
        const linha = (c) => e.status
            ? `<td class="org-fn${this._ehMotorista(c) ? ' org-mot' : ''}">${this._papel(c)}</td><td class="org-pn">${esc(this._nomeCurto(c.nome))}</td><td class="org-sit org-sit-eq">${c.equipamento && c.equipamento !== 'SEM EQUIPAMENTO' ? esc(this._rotulo(c.equipamento)) : ''}</td>`
            : this._linhaPessoa(c);
        const vazio = e.sem ? 'ninguém' : 'vaga sem ninguém';
        const linhas = e.pessoas.length
            ? e.pessoas.map((c, i) => `<tr data-colab="${esc(String(c.id))}" title="${esc(c.nome)}">${i === 0 ? cod : ''}${linha(c)}</tr>`).join('')
            : `<tr>${cod}<td colspan="3" class="org-vaga">${vazio}</td></tr>`;
        const cls = ['org-tab', e.sem ? 'org-tab-sem' : '', e.status ? `org-tab-st org-tab-st-${e.status === 'FÉRIAS' ? 'fer' : e.status === 'AFASTADO' ? 'afa' : 'out'}` : ''].filter(Boolean).join(' ');
        return `<table class="${cls}"><colgroup><col class="org-c-cod"><col class="org-c-fn"><col><col class="org-c-sit"></colgroup><tbody>${linhas}</tbody></table>`;
    },

    /** visão "Só pessoas": uma tabela por supervisor, sem os equipamentos (motoristas primeiro) */
    _tabelaPessoas(s) {
        const esc = SGE.helpers.escapeHtml;
        const ord = c => (this._ehMotorista(c) ? 0 : 1);
        const l = [...s.equipe].sort((a, b) => ord(a) - ord(b) || a.nome.localeCompare(b.nome, 'pt'));
        return `<table class="org-tab org-tab-pes"><colgroup><col class="org-c-fn"><col><col class="org-c-sit"></colgroup><tbody>${l.map(c => `<tr data-colab="${esc(String(c.id))}" title="${esc(c.nome)}">${this._linhaPessoa(c)}</tr>`).join('')}</tbody></table>`;
    },

    // Cor de cada supervisor (opção 1 do portfólio de 12/11: faixa no topo + código no tom claro). Tons fechados, sem neon.
    CORES_SUP: { 'DONIZETE': '#3b6ea8', 'GENESIO ADAO': '#2f8a6b', 'JUNIOR PEREIRA': '#7a5ba8', 'OZIAS': '#c0702a', 'MATUSALEM': '#a24a5e', 'FABIO': '#2b7f8f', 'ISRAEL': '#7a7d2b', '16 HORAS': '#4f5d75', 'SEM SUPERVISOR': '#8a95a5' },
    PALETA_EXTRA: ['#5b7f3a', '#8a5a2b', '#3a6b8a', '#8a3a6b', '#4a7a6a', '#6a5a8a'],
    _corSup(nome) {
        const n = String(nome || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
        if (this.CORES_SUP[n]) return this.CORES_SUP[n];
        let h = 0; for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) >>> 0; // supervisor novo: cor fixa pelo nome
        return this.PALETA_EXTRA[h % this.PALETA_EXTRA.length];
    },

    /** cartão do supervisor no formato "Mínimo" (escolha do dono, 12/11): só o nome e o total de pessoas */
    _cartaoSup(s, fechado) {
        const esc = SGE.helpers.escapeHtml;
        const seta = `<span class="org-seta">${fechado ? '▸' : '▾'}</span>`;
        const t = s.equipe.length;
        return `<button type="button" class="org-cx org-sc org-sc-minimo" data-sup="${esc(s.nome)}" title="${fechado ? 'Mostrar' : 'Recolher'} os equipamentos">`
            + `<b>${esc(this._nomeSup(s.nome))}${seta}</b><small>${t} ${t === 1 ? 'pessoa' : 'pessoas'}</small></button>`;
    },

    _ramoSupervisor(s) {
        const fechado = this._fechados.has(s.nome);
        const caixa = this._cartaoSup(s, fechado);
        const corpo = this._modo === 'pessoas'
            ? (s.equipe.length ? this._tabelaPessoas(s) : '')
            : s.equipamentos.map(e => this._cartaoEquip(e, s.nome)).join('');
        return `<li class="org-ramo" style="--sc:${this._corSup(s.nome)}">${caixa}${fechado || !corpo ? '' : `<div class="org-col${this._modo === 'pessoas' ? ' org-col-pes' : ''}">${corpo}</div>`}</li>`;
    },

    /** a árvore inteira em HTML; soChefes = só a hierarquia, sem equipamentos (resumo da impressão) */
    _htmlArvore(d, soChefes) {
        const esc = SGE.helpers.escapeHtml;
        const G = id => this.GRUPOS.find(g => g.id === id);
        const raiz = d.por.coord.length
            ? this._caixa({
                nome: d.por.coord.map(c => this._nomeCurto(c.nome)).join(' · '),
                cargo: d.por.coord.length > 1 ? 'Coordenação' : this._cap(d.por.coord[0].funcao || 'Coordenador'),
                cor: 'coord', extra: `${d.total} pessoas no efetivo`,
                attrs: d.por.coord.length === 1 ? `data-colab="${esc(String(d.por.coord[0].id))}"` : '',
            })
            : this._caixa({ nome: 'Coordenação', cargo: 'sem coordenador cadastrado', cor: 'coord', extra: `${d.total} pessoas no efetivo` });

        const sups = d.supervisores.filter(x => !x.semSup);
        const totalSup = sups.reduce((s, x) => s + x.equipe.length, 0);
        const grupo = (id) => {
            const g = G(id), lista = d.por[id];
            return `<li>${this._caixa({ nome: g.nome, cor: id, qtd: lista.length })}${this._ramoPessoas(lista, id, g.cargo)}</li>`;
        };
        const fechados = this._fechados;
        if (soChefes) this._fechados = new Set(d.supervisores.map(s => s.nome));
        const html = `<div class="org-arvore">
                        <ul><li>${raiz}<ul>
                            <li>${this._caixa({ nome: 'Supervisores', cor: 'sup', qtd: totalSup, extra: `${sups.length} equipes` })}<ul>${d.supervisores.map(s => this._ramoSupervisor(s)).join('')}</ul></li>
                            ${grupo('plan')}
                            ${grupo('seg')}
                            ${grupo('alm')}
                        </ul></li></ul>
                    </div>`;
        this._fechados = fechados;
        return html;
    },

    render() {
        const view = document.getElementById('organograma-view');
        if (!view) return;
        const d = this._dados();
        this._ultimo = d;

        view.innerHTML = `
        <div class="org-tela">
            <div class="org-topo">
                <div>
                    <h2 class="org-titulo">Organograma</h2>
                    <p class="org-sub">Arraste para mover · rodinha do mouse ou dois dedos para aproximar · clique no supervisor para recolher · clique na pessoa para ${this._podeLotar() ? 'mudar a lotação (mover ou situação)' : 'abrir o painel'}.</p>
                </div>
                <div class="org-ferr">
                    <div class="org-modo" role="group" aria-label="O que mostrar embaixo dos supervisores">
                        <button type="button" data-acao="modo-equip" class="${this._modo === 'pessoas' ? '' : 'on'}" title="Equipamentos com motorista e operador">Com equipamentos</button>
                        <button type="button" data-acao="modo-pessoas" class="${this._modo === 'pessoas' ? 'on' : ''}" title="Só a lista de pessoas de cada supervisor">Só pessoas</button>
                    </div>
                    <button type="button" class="org-btn" data-acao="menos" title="Afastar">−</button>
                    <span class="org-zoom" id="org-zoom">100%</span>
                    <button type="button" class="org-btn" data-acao="mais" title="Aproximar">+</button>
                    <button type="button" class="org-btn" data-acao="ajustar" title="Caber tudo na tela">Ajustar</button>
                    <button type="button" class="org-btn" data-acao="${this._fechados.size ? 'abrir' : 'fechar'}">${this._fechados.size ? 'Abrir todos' : 'Recolher todos'}</button>
                    <button type="button" class="org-btn" data-acao="tela-cheia" title="Ver tudo na tela inteira (Esc para sair)">${document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia'}</button>
                    <div class="org-imp">
                        <button type="button" class="org-btn" data-acao="imprimir" aria-haspopup="menu">Imprimir ▾</button>
                        <div class="org-imp-menu" role="menu" hidden>
                            <button type="button" role="menuitem" data-imp="a4"><b>Tudo em 1 folha · A4 deitada</b><small>a árvore inteira reduzida para caber</small></button>
                            <button type="button" role="menuitem" data-imp="a3"><b>Tudo em 1 folha · A3 deitada</b><small>maior e mais legível (impressora A3 ou PDF)</small></button>
                            <button type="button" role="menuitem" data-imp="equipes"><b>Resumo + 1 folha por supervisor · A4</b><small>a hierarquia na 1ª folha; depois cada equipe com letra de leitura</small></button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="org-canvas" id="org-canvas">
                <div class="org-palco" id="org-palco">
                    ${this._htmlArvore(d, false)}
                </div>
            </div>
            ${d.semSup.length ? `<p class="org-aviso">${d.semSup.length} ${d.semSup.length === 1 ? 'pessoa está' : 'pessoas estão'} sem supervisor ativo e não aparecem na árvore.</p>` : ''}
        </div>`;

        view.onclick = (ev) => this._clique(ev, d);
        this._ligarQuadro();
    },

    _clique(ev, d) {
        if (this._arrastou) { this._arrastou = false; return; }
        const b = ev.target.closest('[data-sup],[data-colab],[data-acao],[data-imp]');
        if (!b) return;
        const a = b.dataset.acao;
        if (a === 'imprimir') {
            const m = b.parentElement.querySelector('.org-imp-menu');
            m.hidden = !m.hidden;
            if (!m.hidden) setTimeout(() => document.addEventListener('click', () => { m.hidden = true; }, { once: true }), 0);
            return;
        }
        if (a === 'tela-cheia') return this._telaCheia();
        if (b.dataset && b.dataset.imp) return this._imprimir(b.dataset.imp, d);
        if (a === 'mais' || a === 'menos') return this._zoomCentro(a === 'mais' ? 1.25 : 0.8);
        if (a === 'ajustar') return this._ajustar();
        if (a === 'modo-equip' || a === 'modo-pessoas') {
            this._modo = a === 'modo-pessoas' ? 'pessoas' : 'equip';
            try { localStorage.setItem('sge_organograma_modo', this._modo); } catch (e) { /* sem armazenamento: só nesta tela */ }
            this._fechados.clear();
            this._vista = null; // a árvore muda de tamanho: ajusta na tela de novo
            return this.render();
        }
        if (a === 'abrir') { this._fechados.clear(); return this.render(); }
        if (a === 'fechar') { d.supervisores.forEach(s => this._fechados.add(s.nome)); return this.render(); }
        if (b.dataset.sup) {
            const n = b.dataset.sup;
            this._fechados.has(n) ? this._fechados.delete(n) : this._fechados.add(n);
            return this.render();
        }
        const col = (SGE.state.colaboradores || []).find(c => String(c.id) === b.dataset.colab);
        if (!col) return;
        // perfil de Gestão: clicar na pessoa abre a janela de lotação (Mover | Situação); os outros veem o painel
        if (this._podeLotar()) return SGE.lotacao.abrir(col);
        if (SGE.drawer) SGE.drawer.open(col);
    },

    _podeLotar() {
        return !!(SGE.lotacao && SGE.auth && typeof SGE.auth.hasRole === 'function' && SGE.auth.hasRole('GESTAO'));
    },

    /* ───────── ver tudo: tela cheia ───────── */

    _telaCheia() {
        const el = document.getElementById('organograma-view');
        if (!el) return;
        if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
        if (!el.requestFullscreen) { SGE.helpers && SGE.helpers.toast && SGE.helpers.toast('Este navegador não deixa abrir em tela cheia. Use F11.', 'info'); return; }
        if (!this._ouvindoTela) {
            this._ouvindoTela = true;
            // entrou/saiu da tela cheia: ajusta a árvore no novo tamanho (sem redesenhar, para não sair da tela cheia)
            document.addEventListener('fullscreenchange', () => {
                const b = document.querySelector('#organograma-view [data-acao="tela-cheia"]');
                if (b) b.textContent = document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia';
                this._vista = null;
                setTimeout(() => this._ajustar(), 60);
            });
        }
        el.requestFullscreen().catch(() => {});
    },

    /* ───────── imprimir (ou salvar em PDF pela janela de impressão) ───────── */

    PAPEL: { a4: { w: 297, h: 210, nome: 'A4' }, a3: { w: 420, h: 297, nome: 'A3' } },

    _imprimir(tipo, d) {
        const esc = SGE.helpers.escapeHtml;
        const papel = this.PAPEL[tipo === 'a3' ? 'a3' : 'a4'];
        const MM = 96 / 25.4, MARGEM = 8;
        const larg = (papel.w - 2 * MARGEM) * MM, alt = (papel.h - 2 * MARGEM) * MM;
        const agora = new Date();
        const quando = `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        const coord = d.por.coord.map(c => this._nomeCurto(c.nome)).join(' · ') || 'Coordenação';
        const cab = (titulo, sub) => `<div class="org-pr-cab"><b>${esc(titulo)}</b><span>${esc(sub)}</span></div>`;

        const antigo = document.getElementById('org-print');
        if (antigo) antigo.remove();
        const box = document.createElement('div');
        box.id = 'org-print';
        box.className = `org-print org-print-${tipo}`;

        const folhaArvore = (soChefes, titulo) => `<section class="org-pr-pag">${cab(titulo, `Gestão de Efetivo · Mecanizada · ${d.total} pessoas · ${quando}`)}<div class="org-pr-fit">${this._htmlArvore(d, soChefes)}</div></section>`;
        if (tipo === 'equipes') {
            const equipes = d.supervisores.map((s) => {
                const e = s.equipamentos.filter(x => !x.sem).length, o = s.equipe.length - s.mot;
                const corpo = this._modo === 'pessoas' ? this._tabelaPessoas(s) : s.equipamentos.map(x => this._cartaoEquip(x)).join('');
                return `<section class="org-pr-pag org-pr-equipe" style="--sc:${this._corSup(s.nome)}">`
                    + cab(`${this._nomeSup(s.nome)}${s.regime ? ` · ${s.regime}` : ''}`, `${s.equipe.length} pessoas · ${e} EQUIP · ${s.mot} MOT · ${o} OP · Coordenação: ${coord} · ${quando}`)
                    + `<div class="org-pr-grade">${corpo}</div></section>`;
            }).join('');
            box.innerHTML = folhaArvore(true, 'Organograma do Efetivo · resumo') + equipes;
        } else {
            box.innerHTML = folhaArvore(false, 'Organograma do Efetivo');
        }
        document.body.appendChild(box);

        // cada árvore reduzida (zoom) para caber inteira na folha
        box.querySelectorAll('.org-pr-fit').forEach((f) => {
            const a = f.querySelector('.org-arvore');
            const z = Math.min(1, larg / a.scrollWidth, (alt - 40) / a.scrollHeight);
            f.style.zoom = String(Math.floor(z * 1000) / 1000);
        });

        const pagina = document.createElement('style');
        pagina.id = 'org-print-pagina';
        pagina.textContent = `@page { size: ${papel.nome} landscape; margin: ${MARGEM}mm; }`;
        document.head.appendChild(pagina);
        document.documentElement.classList.add('org-imprimindo');

        let limpo = false;
        const limpar = () => {
            if (limpo) return;
            limpo = true;
            document.documentElement.classList.remove('org-imprimindo');
            pagina.remove();
            box.remove();
        };
        window.addEventListener('afterprint', limpar, { once: true });
        // a folha só aparece na impressão (na tela fica escondida); some depois que a janela de impressão fecha
        setTimeout(() => window.print(), 50);
    },

    /* ───────── quadro livre: arrastar, zoom com rodinha, pinça e botões ───────── */

    _aplicar() {
        const p = document.getElementById('org-palco');
        if (!p || !this._vista) return;
        const { x, y, z } = this._vista;
        // posição em pixel inteiro e sem will-change: o navegador redesenha o texto nítido em qualquer zoom
        p.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) scale(${z})`;
        const r = document.getElementById('org-zoom');
        if (r) r.textContent = Math.round(z * 100) + '%';
    },

    _zoomEm(fator, cx, cy) {
        const v = this._vista;
        const z = Math.min(this.ZOOM_MAX, Math.max(this.ZOOM_MIN, v.z * fator));
        const k = z / v.z;
        v.x = cx - (cx - v.x) * k;
        v.y = cy - (cy - v.y) * k;
        v.z = z;
        this._aplicar();
    },

    _zoomCentro(fator) {
        const c = document.getElementById('org-canvas');
        if (!c || !this._vista) return;
        this._zoomEm(fator, c.clientWidth / 2, c.clientHeight / 2);
    },

    _ajustar() {
        const c = document.getElementById('org-canvas'), p = document.getElementById('org-palco');
        if (!c || !p) return;
        if (!c.clientWidth) return requestAnimationFrame(() => this._ajustar()); // tela ainda escondida
        const w = p.offsetWidth, h = p.offsetHeight;
        const z = Math.min(1, (c.clientWidth - 32) / w, (c.clientHeight - 32) / h);
        const zf = Math.max(this.ZOOM_MIN, z);
        this._vista = { z: zf, x: (c.clientWidth - w * zf) / 2, y: Math.max(16, (c.clientHeight - h * zf) / 2) };
        this._aplicar();
    },

    _ligarQuadro() {
        const c = document.getElementById('org-canvas');
        if (!c) return;
        if (this._vista) this._aplicar(); else this._ajustar();

        const toques = new Map();
        let ini = null, pinca = null;

        c.addEventListener('pointerdown', (ev) => {
            if (ev.button !== undefined && ev.button !== 0 && ev.pointerType === 'mouse') return;
            toques.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
            this._arrastou = false;
            if (toques.size === 1) {
                ini = { x: ev.clientX, y: ev.clientY, vx: this._vista.x, vy: this._vista.y };
            } else if (toques.size === 2) {
                const [a, b] = [...toques.values()];
                pinca = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this._vista.z };
                ini = null;
            }
        });

        c.addEventListener('pointermove', (ev) => {
            if (!toques.has(ev.pointerId)) return;
            toques.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
            if (pinca && toques.size === 2) {
                const [a, b] = [...toques.values()];
                const r = c.getBoundingClientRect();
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                this._arrastou = true;
                this._zoomEm((pinca.z * d / pinca.d) / this._vista.z, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
                return;
            }
            if (!ini) return;
            const dx = ev.clientX - ini.x, dy = ev.clientY - ini.y;
            if (!this._arrastou && Math.hypot(dx, dy) < 5) return;
            if (!this._arrastou) { this._arrastou = true; c.setPointerCapture(ev.pointerId); c.classList.add('org-movendo'); }
            this._vista.x = ini.vx + dx;
            this._vista.y = ini.vy + dy;
            this._aplicar();
        });

        const soltar = (ev) => {
            toques.delete(ev.pointerId);
            if (toques.size < 2) pinca = null;
            if (!toques.size) { ini = null; c.classList.remove('org-movendo'); }
        };
        c.addEventListener('pointerup', soltar);
        c.addEventListener('pointercancel', soltar);

        c.addEventListener('wheel', (ev) => {
            ev.preventDefault();
            const r = c.getBoundingClientRect();
            this._zoomEm(ev.deltaY < 0 ? 1.12 : 1 / 1.12, ev.clientX - r.left, ev.clientY - r.top);
        }, { passive: false });
    },
};
