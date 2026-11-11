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
            .map(s => {
                const equipe = por.oper.filter(c => c.supervisor === s.nome);
                // equipamentos: vagas do supervisor (mesmo vazias) + onde a equipe dele está alocada
                const mapa = new Map();
                if (SGE.vagas && SGE.vagas.doSupervisor) {
                    SGE.vagas.doSupervisor(s.nome).forEach(({ eq }) => mapa.set(SGE.vagas.codigo(eq), []));
                }
                const semEq = [];
                equipe.forEach(c => {
                    const cod = c.equipamento && c.equipamento !== 'SEM EQUIPAMENTO' ? c.equipamento : null;
                    if (!cod) return semEq.push(c);
                    if (!mapa.has(cod)) mapa.set(cod, []);
                    mapa.get(cod).push(c);
                });
                const ordem = c => (this._ehMotorista(c) ? 0 : 1);
                const equipamentos = [...mapa.entries()]
                    .map(([cod, pessoas]) => ({ rotulo: this._rotulo(cod), pessoas: pessoas.sort((a, b) => ordem(a) - ordem(b) || a.nome.localeCompare(b.nome, 'pt')) }))
                    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR', { numeric: true }));
                if (semEq.length) equipamentos.push({ rotulo: 'Sem equipamento', pessoas: semEq, sem: true });
                return {
                    nome: s.nome, regime: s.regime_padrao, equipe, equipamentos,
                    mot: equipe.filter(c => this._ehMotorista(c)).length,
                };
            })
            .filter(s => s.equipe.length || s.equipamentos.length)
            .sort((a, b) => b.equipe.length - a.equipe.length);

        const semSup = por.oper.filter(c => !supervisores.some(s => s.nome === c.supervisor));
        return { por, supervisores, semSup, total: ativos.length };
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

    _cartaoEquip(e) {
        const esc = SGE.helpers.escapeHtml;
        const linhas = e.pessoas.length
            ? e.pessoas.map(c => `<button type="button" class="org-p" data-colab="${esc(String(c.id))}" title="${esc(c.nome)}">
                    <span class="org-papel${this._ehMotorista(c) ? ' org-mot' : ''}">${this._papel(c)}</span>
                    <span class="org-pn">${esc(this._nomeCurto(c.nome))}</span>
                    ${c.status !== 'ATIVO' ? `<span class="org-st" title="${esc(c.status)}">${esc(this._status(c))}</span>` : ''}
                </button>`).join('')
            : '<div class="org-vaga">vaga sem ninguém</div>';
        return `<div class="org-eqc${e.sem ? ' org-eqc-sem' : ''}">
            <div class="org-eqc-topo"><b>${esc(e.rotulo)}</b><small>${e.pessoas.length}</small></div>
            ${linhas}
        </div>`;
    },

    _ramoSupervisor(s) {
        const esc = SGE.helpers.escapeHtml;
        const fechado = this._fechados.has(s.nome);
        const caixa = this._caixa({
            nome: this._nomeSup(s.nome), cargo: s.regime, cor: 'sup', qtd: s.equipe.length,
            extra: `${s.equipamentos.filter(e => !e.sem).length} EQUIP · ${s.mot} MOT · ${s.equipe.length - s.mot} OP`,
            attrs: `data-sup="${esc(s.nome)}" title="${fechado ? 'Mostrar' : 'Recolher'} os equipamentos"`,
            seta: `<span class="org-seta">${fechado ? '▸' : '▾'}</span>`,
        });
        return `<li>${caixa}${fechado ? '' : `<div class="org-col">${s.equipamentos.map(e => this._cartaoEquip(e)).join('')}</div>`}</li>`;
    },

    render() {
        const view = document.getElementById('organograma-view');
        if (!view) return;
        const esc = SGE.helpers.escapeHtml;
        const d = this._dados();
        const G = id => this.GRUPOS.find(g => g.id === id);

        const raiz = d.por.coord.length
            ? this._caixa({
                nome: d.por.coord.map(c => this._nomeCurto(c.nome)).join(' · '),
                cargo: d.por.coord.length > 1 ? 'Coordenação' : this._cap(d.por.coord[0].funcao || 'Coordenador'),
                cor: 'coord', extra: `${d.total} pessoas no efetivo`,
                attrs: d.por.coord.length === 1 ? `data-colab="${esc(String(d.por.coord[0].id))}"` : '',
            })
            : this._caixa({ nome: 'Coordenação', cargo: 'sem coordenador cadastrado', cor: 'coord', extra: `${d.total} pessoas no efetivo` });

        const totalSup = d.supervisores.reduce((s, x) => s + x.equipe.length, 0);
        const grupo = (id) => {
            const g = G(id), lista = d.por[id];
            return `<li>${this._caixa({ nome: g.nome, cor: id, qtd: lista.length })}${this._ramoPessoas(lista, id, g.cargo)}</li>`;
        };

        view.innerHTML = `
        <div class="org-tela">
            <div class="org-topo">
                <div>
                    <h2 class="org-titulo">Organograma</h2>
                    <p class="org-sub">Arraste para mover · rodinha do mouse ou dois dedos para aproximar · clique no supervisor para recolher · clique na pessoa para abrir o painel.</p>
                </div>
                <div class="org-ferr">
                    <button type="button" class="org-btn" data-acao="menos" title="Afastar">−</button>
                    <span class="org-zoom" id="org-zoom">100%</span>
                    <button type="button" class="org-btn" data-acao="mais" title="Aproximar">+</button>
                    <button type="button" class="org-btn" data-acao="ajustar" title="Caber tudo na tela">Ajustar</button>
                    <button type="button" class="org-btn" data-acao="${this._fechados.size ? 'abrir' : 'fechar'}">${this._fechados.size ? 'Abrir todos' : 'Recolher todos'}</button>
                    <button type="button" class="org-btn" data-acao="imprimir">Imprimir</button>
                </div>
            </div>
            <div class="org-canvas" id="org-canvas">
                <div class="org-palco" id="org-palco">
                    <div class="org-arvore">
                        <ul><li>${raiz}<ul>
                            <li>${this._caixa({ nome: 'Supervisores', cor: 'sup', qtd: totalSup, extra: `${d.supervisores.length} equipes` })}<ul>${d.supervisores.map(s => this._ramoSupervisor(s)).join('')}</ul></li>
                            ${grupo('plan')}
                            ${grupo('seg')}
                            ${grupo('alm')}
                        </ul></li></ul>
                    </div>
                </div>
            </div>
            ${d.semSup.length ? `<p class="org-aviso">${d.semSup.length} ${d.semSup.length === 1 ? 'pessoa está' : 'pessoas estão'} sem supervisor ativo e não aparecem na árvore.</p>` : ''}
        </div>`;

        view.onclick = (ev) => this._clique(ev, d);
        this._ligarQuadro();
    },

    _clique(ev, d) {
        if (this._arrastou) { this._arrastou = false; return; }
        const b = ev.target.closest('[data-sup],[data-colab],[data-acao]');
        if (!b) return;
        const a = b.dataset.acao;
        if (a === 'imprimir') return window.print();
        if (a === 'mais' || a === 'menos') return this._zoomCentro(a === 'mais' ? 1.25 : 0.8);
        if (a === 'ajustar') return this._ajustar();
        if (a === 'abrir') { this._fechados.clear(); return this.render(); }
        if (a === 'fechar') { d.supervisores.forEach(s => this._fechados.add(s.nome)); return this.render(); }
        if (b.dataset.sup) {
            const n = b.dataset.sup;
            this._fechados.has(n) ? this._fechados.delete(n) : this._fechados.add(n);
            return this.render();
        }
        const col = (SGE.state.colaboradores || []).find(c => String(c.id) === b.dataset.colab);
        if (col && SGE.drawer) SGE.drawer.open(col);
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
