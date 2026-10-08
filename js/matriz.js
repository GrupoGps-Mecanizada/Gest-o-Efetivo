'use strict';

/**
 * SGE — Matriz do efetivo (modelo Excel)
 * Mesma Matriz do SST: planilha estilo Excel (SGE.planilha), botão "Ferramentas" no canto da barra da
 * planilha (buscar, filtrar, só pendências, cores, colunas, exportar, imprimir, ações na seleção),
 * expandir para a tela toda e layout das colunas salvo por login (neste navegador).
 * A planilha é só para ver e pesquisar: dois cliques abrem o colaborador (ou os treinamentos/advertências).
 */
window.SGE = window.SGE || {};

SGE.matriz = (() => {
    /* ─── Cores das células (mesma paleta "Excel" da Matriz do SST) ─── */
    const COR = {
        verde: '#C6EFCE',
        amarelo: '#FFEB9C',
        vermelho: '#FFC7CE',
        laranja: '#F8CBAD',
        azul: '#DDEBF7',
        cinza: '#EDEDED',
        cinzaEscuro: '#D9D9D9',
    };
    const COR_REGIME = { A: '#E2EFDA', B: '#DDEBF7', C: '#FCE4D6', D: '#EDE2F6', ADM: '#EDEDED', '16H': '#FFF2CC' };

    const ICONE = {
        busca: 'M21 21l-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z',
        filtros: 'M3 5h18l-7 8v6l-4 2v-8z',
        pendencias: 'M12 8v5M12 16h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
        todas: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8.5 12.5l2.3 2.3 4.7-5',
        colunas: 'M4 4h4v16H4zM10 4h4v16h-4zM16 4h4v16h-4z',
        exportar: 'M12 4v11m0 0-4-4m4 4 4-4M4 19h16',
        imprimir: 'M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M7 14h10v7H7z',
        pessoa: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21a8 8 0 0 1 16 0',
        mover: 'M5 12h14M13 6l6 6-6 6',
        editar: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
        treinamento: 'M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5',
        ferramentas: 'M4 6h9m4 0h3M4 12h3m4 0h9M4 18h11m4 0h1M15 4v4M9 10v4M17 16v4',
        fechar: 'M6 6l12 12M18 6 6 18',
        expandir: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
        recolherTela: 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5',
    };
    const svg = (d, cls = 'mz-ico') => `<svg viewBox="0 0 24 24" class="${cls}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
    const esc = (v) => SGE.helpers.escapeHtml(v);
    const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR');

    /* ─── Dados derivados de cada colaborador ─── */
    const turno = (c) => (SGE.equip ? SGE.equip.getTurno(c.regime) : '');
    const alocacao = (c) => {
        if (c.setor_id && c.setor && c.setor !== 'SEM SETOR') return c.setor;
        if (c.equipamento && c.equipamento !== 'SEM EQUIPAMENTO') return c.equipamento;
        return null;
    };
    function avisos(c) {
        const h = SGE.helpers;
        const lista = [];
        if (h.isSemId(c)) lista.push({ g: 'critico', t: 'Sem ID' });
        if (!c.supervisor || c.supervisor === 'SEM SUPERVISOR') lista.push({ g: 'atencao', t: 'Sem supervisor' });
        if (h.isSemEquipamento(c)) lista.push({ g: 'atencao', t: 'Sem alocação' });
        const tr = treinos(c);
        if (tr.vencidos) lista.push({ g: 'critico', t: `${tr.vencidos} treinamento(s) vencido(s)` });
        else if (tr.aVencer) lista.push({ g: 'atencao', t: `${tr.aVencer} treinamento(s) a vencer` });
        return lista;
    }
    const corAvisos = (lista) => (lista.some((a) => a.g === 'critico') ? COR.vermelho : lista.length ? COR.amarelo : undefined);

    let cacheTreinos = null;
    function treinos(c) {
        if (!cacheTreinos) {
            cacheTreinos = new Map();
            const hoje = Date.now();
            for (const t of SGE.state.colaboradorTreinamentos || []) {
                const r = cacheTreinos.get(t.employee_id) || { total: 0, vencidos: 0, aVencer: 0 };
                r.total++;
                if (t.data_validade) {
                    const dias = Math.floor((new Date(t.data_validade) - hoje) / 86400000);
                    if (dias < 0) r.vencidos++;
                    else if (dias < 30) r.aVencer++;
                }
                cacheTreinos.set(t.employee_id, r);
            }
        }
        return cacheTreinos.get(c.id) || { total: 0, vencidos: 0, aVencer: 0 };
    }
    let cacheAdv = null;
    function advertencias(c) {
        if (!cacheAdv) {
            cacheAdv = new Map();
            for (const a of SGE.state.advertencias || []) cacheAdv.set(a.employee_id, (cacheAdv.get(a.employee_id) || 0) + 1);
        }
        return cacheAdv.get(c.id) || 0;
    }
    function corStatus(s) {
        const v = String(s || '').toUpperCase();
        if (v === 'ATIVO') return COR.verde;
        if (v.startsWith('FÉRIAS') || v.startsWith('FERIAS') || v.includes('CONTRAT')) return COR.azul;
        if (v === 'AFASTADO') return COR.laranja;
        if (v === 'EM AVISO') return COR.amarelo;
        if (v === 'DESLIGADO') return COR.cinzaEscuro;
        if (v === 'INATIVO') return COR.cinza;
        return undefined;
    }

    /* ─── Colunas possíveis (a do nome fica sempre fixa à esquerda) ─── */
    const GRUPO_DADOS = '';
    const GRUPO_ALOC = 'Alocação';
    const GRUPO_SEG = 'Segurança';
    const CANDIDATAS = [
        { id: 'avisos', rotulo: 'Avisos', largura: 240, grupo: GRUPO_DADOS, valor: (c) => avisos(c).map((a) => a.t).join(' · ') || null, cor: (c, todas) => corAvisos(avisos(c)) },
        { id: 'matricula_gps', rotulo: 'Matrícula', largura: 110, tipo: 'numero', grupo: GRUPO_DADOS, valor: (c) => c.matricula_gps || null },
        { id: 'matricula_usiminas', rotulo: 'Mat. Usiminas', largura: 120, grupo: GRUPO_DADOS, valor: (c) => c.matricula_usiminas || null },
        { id: 'categoria', rotulo: 'Categoria', largura: 120, grupo: GRUPO_DADOS, valor: (c) => (c.categoria === 'GESTAO' ? 'Gestão' : c.categoria ? 'Operacional' : null) },
        { id: 'funcao', rotulo: 'Função', largura: 210, grupo: GRUPO_DADOS, valor: (c) => c.funcao || null },
        { id: 'status', rotulo: 'Status', largura: 130, grupo: GRUPO_DADOS, valor: (c) => c.status || null, cor: (c, todas) => (todas ? corStatus(c.status) : c.status === 'AFASTADO' || c.status === 'EM AVISO' ? corStatus(c.status) : undefined) },
        { id: 'telefone', rotulo: 'Telefone', largura: 130, grupo: GRUPO_DADOS, valor: (c) => c.telefone || null },
        { id: 'cr', rotulo: 'CR', largura: 90, grupo: GRUPO_DADOS, valor: (c) => c.cr || null },
        { id: 'supervisor', rotulo: 'Supervisor', largura: 180, grupo: GRUPO_ALOC, valor: (c) => (c.supervisor && c.supervisor !== 'SEM SUPERVISOR' ? c.supervisor : null), cor: (c) => (!c.supervisor || c.supervisor === 'SEM SUPERVISOR' ? COR.amarelo : undefined) },
        { id: 'regime', rotulo: 'Regime', largura: 120, grupo: GRUPO_ALOC, valor: (c) => c.regime || null, cor: (c, todas) => (todas ? COR_REGIME[turno(c)] : undefined) },
        { id: 'turno', rotulo: 'Turno', largura: 80, grupo: GRUPO_ALOC, valor: (c) => (turno(c) && turno(c) !== 'S/R' ? turno(c) : null) },
        { id: 'alocacao', rotulo: 'Alocação', largura: 160, grupo: GRUPO_ALOC, valor: (c) => alocacao(c), cor: (c) => (SGE.helpers.isSemEquipamento(c) ? COR.amarelo : undefined) },
        { id: 'equipamento', rotulo: 'Equipamento', largura: 120, grupo: GRUPO_ALOC, valor: (c) => (c.equipamento && c.equipamento !== 'SEM EQUIPAMENTO' ? c.equipamento : null) },
        { id: 'setor', rotulo: 'Setor', largura: 150, grupo: GRUPO_ALOC, valor: (c) => (c.setor && c.setor !== 'SEM SETOR' ? c.setor : null) },
        {
            id: 'treinamentos',
            rotulo: 'Treinamentos',
            largura: 150,
            grupo: GRUPO_SEG,
            valor: (c) => {
                const t = treinos(c);
                if (!t.total) return null;
                return t.vencidos ? `${t.total} (${t.vencidos} vencido${t.vencidos > 1 ? 's' : ''})` : t.aVencer ? `${t.total} (${t.aVencer} a vencer)` : t.total;
            },
            cor: (c, todas) => {
                const t = treinos(c);
                return t.vencidos ? COR.vermelho : t.aVencer ? COR.amarelo : todas && t.total ? COR.verde : undefined;
            },
        },
        { id: 'advertencias', rotulo: 'Advertências', largura: 120, grupo: GRUPO_SEG, valor: (c) => advertencias(c) || null, cor: (c) => (advertencias(c) ? COR.laranja : undefined) },
    ];
    const LAYOUT_PADRAO = { ordem: [], ocultas: ['telefone', 'cr', 'equipamento', 'setor'] };
    const PREF_PADRAO = { layout: LAYOUT_PADRAO, cores: 'todas', somentePendencias: false };

    /** Põe as colunas na ordem salva; as que surgiram depois entram logo após a vizinha da ordem padrão. */
    function aplicarOrdem(padrao, ordem) {
        const porId = new Map(padrao.map((c) => [c.id, c]));
        const saida = ordem.filter((id, i) => porId.has(id) && ordem.indexOf(id) === i).map((id) => porId.get(id));
        const presentes = new Set(saida.map((c) => c.id));
        padrao.forEach((c, i) => {
            if (presentes.has(c.id)) return;
            let pos = 0;
            for (let k = i - 1; k >= 0; k--) {
                const j = saida.findIndex((x) => x.id === padrao[k].id);
                if (j >= 0) {
                    pos = j + 1;
                    break;
                }
            }
            saida.splice(pos, 0, c);
            presentes.add(c.id);
        });
        return saida;
    }
    const mover = (lista, de, para) => {
        const r = [...lista];
        const [x] = r.splice(de, 1);
        r.splice(Math.max(0, Math.min(para, r.length)), 0, x);
        return r;
    };

    /* ─── Estado da tela ─── */
    const st = {
        planilha: null,
        selecao: [],
        busca: '',
        expandido: false,
        painel: null,
        pref: null,
    };

    const chavePref = () => `SGE_MATRIZ:${(SGE.auth && SGE.auth.currentUser && SGE.auth.currentUser.id) || 'local'}`;
    function lerPref() {
        try {
            const p = JSON.parse(localStorage.getItem(chavePref()) || 'null');
            return p ? { ...PREF_PADRAO, ...p, layout: { ...LAYOUT_PADRAO, ...(p.layout || {}) } } : { ...PREF_PADRAO };
        } catch (e) {
            return { ...PREF_PADRAO };
        }
    }
    function gravarPref(mud) {
        st.pref = { ...pref(), ...mud };
        try {
            localStorage.setItem(chavePref(), JSON.stringify(st.pref));
        } catch (e) { /* navegador sem espaço ou em modo privado: vale só nesta aba */ }
    }
    const pref = () => (st.pref ??= lerPref());

    /* ─── Linhas e colunas ─── */
    function filtrosAtivos() {
        const f = SGE.state.filtros || {};
        const nomes = { regime: 'Regime', funcao: 'Função', status: 'Status', alocacao: 'Alocação', equipTurno: 'Turno', supervisor: 'Supervisor', categoria: 'Categoria' };
        const r = [];
        for (const [tipo, valores] of Object.entries(f)) for (const v of valores || []) r.push({ tipo, valor: v, rotulo: `${nomes[tipo] || tipo}: ${v}` });
        return r;
    }

    function linhasVisiveis() {
        cacheTreinos = null;
        cacheAdv = null;
        let ls = SGE.helpers.filtrarColaboradores();
        const termo = semAcento(st.busca.trim());
        if (termo) ls = ls.filter((c) => semAcento(`${c.nome} ${c.matricula_gps || ''} ${c.matricula_usiminas || ''}`).includes(termo));
        if (pref().somentePendencias) ls = ls.filter((c) => avisos(c).length > 0);
        return [...ls].sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'));
    }

    function colunasVisiveis() {
        const p = pref();
        const ocultas = new Set(p.layout.ocultas);
        const todas = p.cores === 'todas';
        const nome = { id: 'nome', rotulo: 'Colaborador', largura: 290, valor: (c) => c.nome || null, cor: (c) => corAvisos(avisos(c)) };
        const resto = aplicarOrdem(CANDIDATAS, p.layout.ordem)
            .filter((c) => !ocultas.has(c.id))
            .map((c) => ({ ...c, cor: c.cor ? (l) => c.cor(l, todas) : undefined }));
        return [nome, ...resto];
    }

    /* ─── Tela ─── */
    function montarTela(view) {
        view.innerHTML = `
            <h1 class="sr-only">Matriz do efetivo</h1>
            <div class="mz-tela">
                <div class="mz-planilha"></div>
            </div>`;
        st.planilha = SGE.planilha.criar(view.querySelector('.mz-planilha'), {
            nome: 'Efetivo',
            linhas: linhasVisiveis(),
            colunas: colunasVisiveis(),
            chave: (c) => c.id,
            dica: 'dois cliques numa linha abrem o colaborador; em Treinamentos ou Advertências, a lista dele',
            aoAbrir: (c, coluna) => {
                if (coluna === 'treinamentos') return SGE.acoesColaborador.abrirTreinamentos(c.id);
                if (coluna === 'advertencias') return SGE.acoesColaborador.abrirAdvertencias(c.id);
                SGE.drawer.open(c);
            },
            aoSelecionar: (ls) => {
                st.selecao = ls;
                if (st.painel) desenharPainel();
            },
            ferramentas: (lugar) => {
                lugar.innerHTML = `
                    <button type="button" class="mz-btn-ferramentas" aria-haspopup="dialog" aria-expanded="false" aria-label="Ferramentas da Matriz" title="Ferramentas: buscar, filtrar, colunas, exportar">
                        ${svg(ICONE.ferramentas, 'mz-ico mz-ico--16')}<span class="mz-contagem" hidden></span>
                    </button>
                    <button type="button" class="mz-btn-expandir" aria-pressed="false" aria-label="Expandir a planilha para a tela toda" title="Expandir: a planilha cobre a tela toda">
                        ${svg(ICONE.expandir, 'mz-ico mz-ico--16')}
                    </button>`;
                lugar.querySelector('.mz-btn-ferramentas').addEventListener('click', () => (st.painel ? fecharPainel() : abrirPainel()));
                lugar.querySelector('.mz-btn-expandir').addEventListener('click', () => expandir(!st.expandido));
                atualizarBotoes();
            },
        });
    }

    function atualizarBotoes() {
        const view = document.getElementById('matriz-view');
        if (!view) return;
        const n = filtrosAtivos().length + (st.busca.trim() ? 1 : 0) + (pref().somentePendencias ? 1 : 0);
        const cont = view.querySelector('.mz-contagem');
        if (cont) {
            cont.textContent = n;
            cont.hidden = !n || !!st.painel;
        }
        const bf = view.querySelector('.mz-btn-ferramentas');
        if (bf) {
            bf.setAttribute('aria-expanded', String(!!st.painel));
            bf.innerHTML = `${svg(st.painel ? ICONE.fechar : ICONE.ferramentas, 'mz-ico mz-ico--16')}<span class="mz-contagem"${!n || st.painel ? ' hidden' : ''}>${n}</span>`;
        }
        const be = view.querySelector('.mz-btn-expandir');
        if (be) {
            be.setAttribute('aria-pressed', String(st.expandido));
            be.classList.toggle('ativo', st.expandido);
            be.title = st.expandido ? 'Sair da tela cheia (volta a barra de cima)' : 'Expandir: a planilha cobre a tela toda';
            be.innerHTML = svg(st.expandido ? ICONE.recolherTela : ICONE.expandir, 'mz-ico mz-ico--16');
        }
    }

    function expandir(sim) {
        st.expandido = sim;
        const view = document.getElementById('matriz-view');
        if (view) view.classList.toggle('mz-cheia', sim);
        atualizarBotoes();
        // a planilha mede o espaço de novo
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }

    /* ─── Janela "Ferramentas" (port de barra-lateral do SST) ─── */
    function item({ acao, rotulo, titulo, d, ativo, contagem, primario, manter, desativado }) {
        const cls = ['mz-item', primario ? 'mz-item--primario' : ativo ? 'mz-item--ativo' : ''].join(' ');
        return `<button type="button" class="${cls}" data-acao="${acao}"${manter ? ' data-manter' : ''}${manter ? ` aria-pressed="${!!ativo}"` : ''} title="${esc(titulo || rotulo)}"${desativado ? ' disabled' : ''}>
            ${svg(d)}<span class="mz-item-rotulo">${esc(rotulo)}</span>${contagem ? `<span class="mz-item-contagem">${contagem}</span>` : ''}</button>`;
    }
    const secao = (t) => `<p class="mz-secao">${esc(t)}</p>`;

    function desenharPainel() {
        const caixa = st.painel && st.painel.querySelector('.mz-painel-corpo');
        if (!caixa) return;
        // quem está digitando na busca continua digitando (o painel é redesenhado a cada filtro)
        const digitando = document.activeElement && document.activeElement.classList.contains('mz-busca-campo');
        const cursor = digitando ? document.activeElement.selectionStart : null;
        const p = pref();
        const etiquetas = filtrosAtivos();
        const linhas = linhasVisiveis().length;
        const total = (SGE.state.colaboradores || []).length;
        const gestao = SGE.auth.hasRole('GESTAO');
        const sel = st.selecao;
        let selecao = '';
        if (sel.length === 1) {
            selecao = `<p class="mz-sel-nome">${esc(sel[0].nome)}</p>
                ${item({ acao: 'abrir', rotulo: 'Abrir colaborador', d: ICONE.pessoa, primario: true })}
                ${gestao ? item({ acao: 'mover', rotulo: 'Mover de supervisor', d: ICONE.mover }) : ''}
                ${gestao ? item({ acao: 'editar', rotulo: 'Editar dados', d: ICONE.editar }) : ''}
                ${item({ acao: 'treinos-um', rotulo: 'Ver treinamentos', d: ICONE.treinamento })}`;
        } else if (sel.length > 1) {
            selecao = `<p class="mz-sel-nome">${sel.length} colaboradores selecionados</p>
                ${gestao ? item({ acao: 'massa', rotulo: 'Editar os selecionados', d: ICONE.editar, primario: true }) : ''}
                ${gestao ? item({ acao: 'treino-massa', rotulo: 'Vincular treinamento', d: ICONE.treinamento }) : ''}`;
        }
        caixa.innerHTML = `
            <div class="mz-busca">
                ${svg(ICONE.busca)}
                <input type="search" class="mz-busca-campo" placeholder="Buscar nome ou matrícula" aria-label="Buscar por nome ou matrícula" value="${esc(st.busca)}">
            </div>
            ${item({ acao: 'filtros', rotulo: 'Filtros', titulo: 'Filtrar por supervisor, função, regime, status, categoria, alocação e turno', d: ICONE.filtros, ativo: etiquetas.length > 0, contagem: etiquetas.length })}
            ${item({ acao: 'pendencias', rotulo: 'Só pendências', titulo: 'Mostrar só quem tem aviso: sem ID, sem supervisor, sem alocação ou treinamento vencendo', d: ICONE.pendencias, ativo: p.somentePendencias, manter: true })}
            ${etiquetas.length || st.busca.trim()
                ? `<div class="mz-etiquetas">${etiquetas
                      .map((e, i) => `<button type="button" class="mz-etiqueta" data-etiqueta="${i}" aria-label="Remover ${esc(e.rotulo)}">${esc(e.rotulo)} <span aria-hidden="true">×</span></button>`)
                      .join('')}<button type="button" class="mz-limpar" data-acao="limpar">Limpar tudo</button></div>`
                : ''}
            ${secao('Cores')}
            <div class="mz-escolha" role="tablist" aria-label="Cores nas células">
                <button type="button" role="tab" data-cores="todas" aria-selected="${p.cores === 'todas'}">${svg(ICONE.todas, 'mz-ico mz-ico--16')}Todas</button>
                <button type="button" role="tab" data-cores="pendencias" aria-selected="${p.cores === 'pendencias'}">${svg(ICONE.pendencias, 'mz-ico mz-ico--16')}Pendências</button>
            </div>
            <div class="mz-espaco"></div>
            ${item({ acao: 'colunas', rotulo: 'Colunas', titulo: 'Escolher e ordenar as colunas (salvo no seu login, neste navegador)', d: ICONE.colunas })}
            ${secao('Ações')}
            ${item({ acao: 'exportar', rotulo: 'Exportar Excel', titulo: 'Exporta a planilha como está: filtrada (só o que aparece) ou completa, com cores e formatação', d: ICONE.exportar, primario: true })}
            ${item({ acao: 'imprimir', rotulo: 'Imprimir', titulo: 'Imprimir a planilha como está na tela (filtrada ou completa, com cores)', d: ICONE.imprimir })}
            ${secao('Planilha')}
            ${selecao}
            <div class="mz-ajuda">
                <p><b>${linhas} de ${total} linhas</b> · só para ver e pesquisar (Ctrl+F); nada ali altera os dados.</p>
                <p>Dois cliques numa linha abrem o colaborador; em Treinamentos ou Advertências, a lista dele. Selecione linhas para agir em várias.</p>
                <p>Cores e formatação feitas na planilha são temporárias.</p>
            </div>`;
        const campo = caixa.querySelector('.mz-busca-campo');
        campo.addEventListener('input', buscar);
        if (digitando) {
            campo.focus();
            campo.setSelectionRange(cursor, cursor);
        }
        atualizarBotoes();
    }

    const buscar = SGE.helpers.debounce((e) => {
        st.busca = e.target.value;
        render();
    }, 200);

    function abrirPainel() {
        const view = document.getElementById('matriz-view');
        if (!view || st.painel) return;
        const fundo = document.createElement('button');
        fundo.type = 'button';
        fundo.className = 'mz-painel-fundo';
        fundo.tabIndex = -1;
        fundo.setAttribute('aria-label', 'Fechar ferramentas');
        fundo.addEventListener('click', fecharPainel);
        const painel = document.createElement('div');
        painel.className = 'mz-painel';
        painel.setAttribute('role', 'dialog');
        painel.setAttribute('aria-label', 'Ferramentas da Matriz');
        painel.innerHTML = `
            <div class="mz-painel-topo">
                <span>Ferramentas</span>
                <button type="button" class="mz-painel-fechar" aria-label="Fechar" title="Fechar (Esc)">${svg(ICONE.fechar, 'mz-ico mz-ico--16')}</button>
            </div>
            <div class="mz-painel-corpo"></div>`;
        painel.querySelector('.mz-painel-fechar').addEventListener('click', fecharPainel);
        painel.addEventListener('click', aoClicarPainel);
        view.querySelector('.mz-tela').append(fundo, painel);
        st.painel = painel;
        st.fundo = fundo;
        desenharPainel();
        const campo = painel.querySelector('.mz-busca-campo');
        if (campo && window.matchMedia('(min-width: 768px)').matches) campo.focus();
    }

    function fecharPainel() {
        if (st.painel) st.painel.remove();
        if (st.fundo) st.fundo.remove();
        st.painel = null;
        st.fundo = null;
        atualizarBotoes();
    }

    function aoClicarPainel(e) {
        const etq = e.target.closest('[data-etiqueta]');
        if (etq) {
            const a = filtrosAtivos()[Number(etq.dataset.etiqueta)];
            if (a) {
                SGE.state.filtros[a.tipo] = (SGE.state.filtros[a.tipo] || []).filter((v) => v !== a.valor);
                sincronizarFiltrosGlobais();
            }
            return;
        }
        const cores = e.target.closest('[data-cores]');
        if (cores) {
            gravarPref({ cores: cores.dataset.cores });
            render();
            desenharPainel();
            return;
        }
        const b = e.target.closest('[data-acao]');
        if (!b) return;
        const sel = st.selecao;
        const um = sel[0];
        const acoes = {
            filtros: () => abrirFiltrosGlobais(),
            pendencias: () => {
                gravarPref({ somentePendencias: !pref().somentePendencias });
                render();
                desenharPainel();
            },
            limpar: () => {
                st.busca = '';
                gravarPref({ somentePendencias: false });
                const limpar = document.getElementById('filter-clear-all');
                if (limpar) limpar.click();
                else render();
                desenharPainel();
            },
            colunas: () => abrirEditorColunas(),
            exportar: () => st.planilha && st.planilha.exportar(),
            imprimir: () => st.planilha && st.planilha.imprimir(),
            abrir: () => um && SGE.drawer.open(um),
            mover: () => um && SGE.modal.openMoveSelector(um),
            editar: () => um && SGE.modal.openEdit(um),
            'treinos-um': () => um && SGE.acoesColaborador.abrirTreinamentos(um.id),
            massa: () => SGE.acoesColaborador.editarEmMassa(sel.map((c) => c.id), render),
            'treino-massa': () => SGE.acoesColaborador.vincularTreinamentoEmMassa(sel.map((c) => c.id), render),
        };
        // alternâncias deixam a janela aberta; ações que abrem outra tela fecham
        if (!b.hasAttribute('data-manter') && b.dataset.acao !== 'limpar') fecharPainel();
        if (acoes[b.dataset.acao]) acoes[b.dataset.acao]();
    }

    /** Filtros: o mesmo painel de filtros da barra de cima (valem também para o Painel). */
    function abrirFiltrosGlobais() {
        const painel = document.getElementById('filter-dropdown-panel');
        if (painel) setTimeout(() => painel.classList.remove('hidden'), 0);
    }
    function sincronizarFiltrosGlobais() {
        SGE.navigation._persistFilters();
        SGE.navigation.buildFilterDropdown();
        SGE.navigation._updateFilterBadge();
        render();
        desenharPainel();
    }

    /* ─── Editor de colunas (port de editor-layout do SST) ─── */
    function abrirEditorColunas() {
        const p = pref();
        let ordem = aplicarOrdem(CANDIDATAS, p.layout.ordem);
        let ocultas = new Set(p.layout.ocultas);
        let busca = '';
        let arrastando = null;

        const fundo = document.createElement('div');
        fundo.className = 'mz-gaveta-fundo';
        const gaveta = document.createElement('aside');
        gaveta.className = 'mz-gaveta';
        gaveta.setAttribute('role', 'dialog');
        gaveta.setAttribute('aria-label', 'Colunas da planilha');
        gaveta.innerHTML = `
            <header class="mz-gaveta-topo">
                <div>
                    <h2>Colunas da planilha</h2>
                    <p><span class="mz-sobretitulo">Salvo no seu login, neste navegador</span><br>
                    Arraste para mudar a ordem e marque o que aparece. A coluna do nome fica sempre fixa à esquerda.</p>
                </div>
                <button type="button" class="mz-painel-fechar" data-ed="fechar" aria-label="Fechar">${svg(ICONE.fechar, 'mz-ico mz-ico--16')}</button>
            </header>
            <div class="mz-gaveta-corpo">
                <div class="mz-ed-barra">
                    <input type="search" class="mz-campo" data-ed="busca" placeholder="Buscar coluna ou grupo…" aria-label="Buscar coluna">
                    <button type="button" class="mz-btn-sec" data-ed="todas">Mostrar todas</button>
                    <button type="button" class="mz-btn-sec" data-ed="padrao" title="Ordem e colunas de fábrica">Restaurar padrão</button>
                </div>
                <ol class="mz-ed-lista" aria-label="Colunas da planilha, na ordem"></ol>
            </div>
            <footer class="mz-gaveta-rodape">
                <span class="mz-ed-conta"></span>
                <span class="mz-ed-botoes">
                    <button type="button" class="mz-btn-sec" data-ed="fechar">Cancelar</button>
                    <button type="button" class="mz-btn-pri" data-ed="salvar">Salvar layout</button>
                </span>
            </footer>`;
        document.body.append(fundo, gaveta);
        const lista = gaveta.querySelector('.mz-ed-lista');
        const nomeGrupo = (g) => g || 'Dados do colaborador';
        const combina = (c) => !busca || semAcento(`${c.rotulo} ${nomeGrupo(c.grupo)}`).includes(busca);

        const desenhar = () => {
            const trechos = [];
            ordem.forEach((c, i) => {
                const u = trechos[trechos.length - 1];
                if (u && u.grupo === c.grupo) u.fim = i + 1;
                else trechos.push({ grupo: c.grupo, inicio: i, fim: i + 1 });
            });
            lista.innerHTML = trechos
                .map((tr) => {
                    const itens = ordem.slice(tr.inicio, tr.fim);
                    if (!itens.some(combina)) return '';
                    const todos = itens.every((c) => !ocultas.has(c.id));
                    return `<li class="mz-ed-grupo">
                        <div class="mz-ed-grupo-topo">
                            <input type="checkbox" data-grupo="${tr.inicio}:${tr.fim}" ${todos ? 'checked' : ''} aria-label="Mostrar todas de ${esc(nomeGrupo(tr.grupo))}">
                            <span>${esc(nomeGrupo(tr.grupo))} <small>(${itens.length})</small></span>
                        </div>
                        <ul>${itens
                            .map((c, n) => {
                                const i = tr.inicio + n;
                                if (!combina(c)) return '';
                                const oculta = ocultas.has(c.id);
                                return `<li class="mz-ed-item${oculta ? ' oculta' : ''}" draggable="${!busca}" data-i="${i}">
                                    <span class="mz-ed-alca" aria-hidden="true" title="Arraste para mudar a ordem">⋮⋮</span>
                                    <input type="checkbox" data-col="${c.id}" ${oculta ? '' : 'checked'} aria-label="Mostrar ${esc(c.rotulo)}">
                                    <span class="mz-ed-rotulo">${esc(c.rotulo)}</span>
                                    <button type="button" class="mz-seta" data-sobe="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Subir ${esc(c.rotulo)}">▲</button>
                                    <button type="button" class="mz-seta" data-desce="${i}" ${i === ordem.length - 1 ? 'disabled' : ''} aria-label="Descer ${esc(c.rotulo)}">▼</button>
                                </li>`;
                            })
                            .join('')}</ul></li>`;
                })
                .join('');
            const vis = ordem.filter((c) => !ocultas.has(c.id)).length;
            gaveta.querySelector('.mz-ed-conta').textContent = `${vis + 1} de ${ordem.length + 1} colunas visíveis`;
        };

        const fechar = () => {
            fundo.remove();
            gaveta.remove();
            document.removeEventListener('keydown', aoTeclar);
        };
        const aoTeclar = (e) => e.key === 'Escape' && fechar();
        document.addEventListener('keydown', aoTeclar);
        fundo.addEventListener('click', fechar);

        gaveta.addEventListener('click', (e) => {
            const t = e.target;
            const ed = t.closest('[data-ed]');
            if (ed && ed.dataset.ed === 'fechar') return fechar();
            if (ed && ed.dataset.ed === 'todas') {
                ocultas = new Set();
                return desenhar();
            }
            if (ed && ed.dataset.ed === 'padrao') {
                ordem = aplicarOrdem(CANDIDATAS, LAYOUT_PADRAO.ordem);
                ocultas = new Set(LAYOUT_PADRAO.ocultas);
                return desenhar();
            }
            if (ed && ed.dataset.ed === 'salvar') {
                gravarPref({ layout: { ordem: ordem.map((c) => c.id), ocultas: [...ocultas] } });
                fechar();
                render();
                return SGE.helpers.toast('Layout da planilha salvo.', 'success');
            }
            if (t.dataset.sobe) {
                const i = Number(t.dataset.sobe);
                ordem = mover(ordem, i, i - 1);
                return desenhar();
            }
            if (t.dataset.desce) {
                const i = Number(t.dataset.desce);
                ordem = mover(ordem, i, i + 1);
                return desenhar();
            }
        });
        gaveta.addEventListener('change', (e) => {
            const t = e.target;
            if (t.dataset.col) {
                if (t.checked) ocultas.delete(t.dataset.col);
                else ocultas.add(t.dataset.col);
                return desenhar();
            }
            if (t.dataset.grupo) {
                const [a, b] = t.dataset.grupo.split(':').map(Number);
                ordem.slice(a, b).forEach((c) => (t.checked ? ocultas.delete(c.id) : ocultas.add(c.id)));
                return desenhar();
            }
        });
        gaveta.querySelector('[data-ed="busca"]').addEventListener('input', (e) => {
            busca = semAcento(e.target.value.trim());
            desenhar();
        });
        // arrastar e soltar
        lista.addEventListener('dragstart', (e) => {
            const li = e.target.closest('.mz-ed-item');
            if (!li) return;
            arrastando = Number(li.dataset.i);
            e.dataTransfer.effectAllowed = 'move';
            li.classList.add('arrastando');
        });
        lista.addEventListener('dragover', (e) => {
            const li = e.target.closest('.mz-ed-item');
            if (arrastando === null || !li) return;
            e.preventDefault();
            lista.querySelectorAll('.alvo-cima, .alvo-baixo').forEach((x) => x.classList.remove('alvo-cima', 'alvo-baixo'));
            const r = li.getBoundingClientRect();
            li.classList.add(e.clientY > r.top + r.height / 2 ? 'alvo-baixo' : 'alvo-cima');
        });
        lista.addEventListener('drop', (e) => {
            const li = e.target.closest('.mz-ed-item');
            if (arrastando === null || !li) return;
            e.preventDefault();
            const i = Number(li.dataset.i);
            const para = li.classList.contains('alvo-baixo') ? i + 1 : i;
            if (para !== arrastando) ordem = mover(ordem, arrastando, para > arrastando ? para - 1 : para);
            arrastando = null;
            desenhar();
        });
        lista.addEventListener('dragend', () => {
            arrastando = null;
            desenhar();
        });
        desenhar();
    }

    /* ─── Público ─── */
    function render() {
        const view = document.getElementById('matriz-view');
        if (!view) return;
        if (!st.planilha || !view.querySelector('.mz-planilha')) {
            st.pref = null; // o login pode ter mudado desde a última vez
            montarTela(view);
        } else {
            st.planilha.atualizar(linhasVisiveis(), colunasVisiveis());
        }
        atualizarBotoes();
        if (st.painel) desenharPainel();
    }

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || SGE.state.activeView !== 'matriz') return;
        if (document.querySelector('.mz-gaveta') || document.getElementById('modal-overlay')?.classList.contains('open')) return;
        if (st.painel) fecharPainel();
        else if (st.expandido) expandir(false);
    });

    return {
        render,
        /** tema claro/escuro mudou: a planilha acompanha */
        tema(escuro) {
            if (st.planilha) st.planilha.tema(escuro);
        },
        /** saiu da Matriz: fecha a janela de ferramentas e a tela cheia */
        sair() {
            fecharPainel();
            if (st.expandido) expandir(false);
        },
    };
})();
