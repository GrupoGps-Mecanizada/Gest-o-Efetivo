'use strict';

/**
 * SGE — Matriz do efetivo (modelo Excel)
 * Uma aba só, uma linha por pessoa: COLABORADOR · STATUS · REGIME · LETRA · SUPERVISOR. Quem não está
 * trabalhando (férias, atestado, sobra, em aviso) tem a linha inteira pintada. A planilha é só para ver e pesquisar: dois cliques num nome
 * abrem o colaborador. Botão "Ferramentas" no canto: buscar, filtrar, exportar, imprimir e agir na seleção.
 */
window.SGE = window.SGE || {};

SGE.matriz = (() => {
    const ICONE = {
        busca: 'M21 21l-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z',
        filtros: 'M3 5h18l-7 8v6l-4 2v-8z',
        exportar: 'M12 4v11m0 0-4-4m4 4 4-4M4 19h16',
        imprimir: 'M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M7 14h10v7H7z',
        pessoa: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21a8 8 0 0 1 16 0',
        mover: 'M5 12h14M13 6l6 6-6 6',
        editar: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
        ferramentas: 'M4 6h9m4 0h3M4 12h3m4 0h9M4 18h11m4 0h1M15 4v4M9 10v4M17 16v4',
        fechar: 'M6 6l12 12M18 6 6 18',
        expandir: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
        recolherTela: 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5',
    };
    const svg = (d, cls = 'mz-ico') => `<svg viewBox="0 0 24 24" class="${cls}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
    const esc = (v) => SGE.helpers.escapeHtml(v);
    const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR');
    const maiusculo = (s) => String(s || '').toLocaleUpperCase('pt-BR');
    const porNome = (a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');

    /* ─── Uma linha por pessoa: COLABORADOR · STATUS · REGIME · LETRA · SUPERVISOR ─── */
    const temSupervisor = (c) => !!c.supervisor && c.supervisor !== 'SEM SUPERVISOR';
    // turma das 16 horas: no cadastro ela é um 'supervisor' chamado "16 HORAS" (o regime nem sempre está preenchido)
    const ehTurno16 = (c) => /^16\s*H/.test(maiusculo(c.supervisor).trim());
    // funções de apoio (coordenador, técnico, mecânico...) não são sobra mesmo sem supervisor
    const ehApoio = (c) => c.categoria === 'GESTAO' || /COORDENADOR|SEGURAN|MEC[AÂ]NIC|PLANEJ|PROGRAMADOR|ALMOXARIF|ESTAGI|SUPERVISOR|ENCARREGADO/.test(maiusculo(c.funcao));
    // cor da linha inteira por situação (quem trabalha fica branco); rgb = cor no Excel exportado
    const COR = {
        ferias: { chave: 'ferias', rotulo: 'Férias', rgb: '#DBE8FB' },
        atestado: { chave: 'atestado', rotulo: 'Atestado', rgb: '#FDE6CF' },
        sobra: { chave: 'sobra', rotulo: 'Sobra', rgb: '#E9EBEF' },
        aviso: { chave: 'aviso', rotulo: 'Em aviso', rgb: '#FBE1E1' },
    };
    const diaMes = (iso) => (iso ? `${String(iso).slice(8, 10)}/${String(iso).slice(5, 7)}` : '');

    /** volta das férias: a que está em andamento ou a próxima agendada */
    function voltaDasFerias(c) {
        const lista = (SGE.state.ferias || []).filter((f) => f.employee_id === c.id && f.data_retorno && (f.status === 'EM_ANDAMENTO' || f.status === 'AGENDADA'));
        const atual = lista.find((f) => f.status === 'EM_ANDAMENTO') || lista.sort((a, b) => String(a.data_inicio).localeCompare(String(b.data_inicio)))[0];
        return atual ? diaMes(atual.data_retorno) : '';
    }

    /** situação da pessoa: { texto, cor } — null = fora do quadro (desligado/inativo) */
    function situacaoDe(c) {
        const s = maiusculo(c.status);
        if (s === 'DESLIGADO' || s === 'INATIVO') return null;
        if (s.startsWith('FÉRIAS') || s.startsWith('FERIAS')) {
            const volta = voltaDasFerias(c);
            return { texto: volta ? `FÉRIAS · VOLTA ${volta}` : 'FÉRIAS', cor: COR.ferias };
        }
        if (s === 'AFASTADO') return { texto: 'ATESTADO', cor: COR.atestado };
        if (s === 'EM AVISO') return { texto: 'EM AVISO', cor: COR.aviso };
        if (s === 'EM CONTRATAÇÃO') return { texto: 'EM CONTRATAÇÃO', cor: null };
        if (!temSupervisor(c) && !ehApoio(c)) return { texto: 'SOBRA', cor: COR.sobra };
        return { texto: 'TRABALHANDO', cor: null };
    }

    /** regime e letra pela regra da escala ("4X4-A" vira 4x4 · A) */
    function regimeDe(c) {
        if (ehTurno16(c)) return { regime: '16 HORAS', letra: '–' };
        const g = SGE.escala ? SGE.escala.grupoDoRegime(c.regime) : { tipo: null, letra: null };
        const nomes = { '4x4': '4x4', ADM: 'ADM', '16H': '16 HORAS' };
        return { regime: nomes[g.tipo] || maiusculo(c.regime) || '–', letra: g.letra || '–' };
    }

    function supervisorDe(c, sit) {
        if (sit.texto === 'SOBRA') return '–';
        if (ehTurno16(c) || !temSupervisor(c)) return 'SEM SUPERVISOR';
        return maiusculo(c.supervisor);
    }

    function abaColaboradores(pessoas) {
        const linhas = [];
        for (const c of pessoas) {
            const sit = situacaoDe(c);
            if (!sit) continue;
            linhas.push({ c, sit, ...regimeDe(c), sup: supervisorDe(c, sit) });
        }
        linhas.sort((a, b) => porNome(a.c, b.c));
        return {
            id: 'geral',
            nome: 'MATRIZ',
            chave: (l) => l.c.id,
            corLinha: (l) => l.sit.cor,
            linhas,
            colunas: [
                { id: 'nome', rotulo: 'COLABORADOR', largura: 290, valor: (l) => l.c.nome, pessoa: (l) => l.c.id },
                { id: 'status', rotulo: 'STATUS', largura: 200, valor: (l) => l.sit.texto },
                { id: 'regime', rotulo: 'REGIME', largura: 110, centro: true, valor: (l) => l.regime },
                { id: 'letra', rotulo: 'LETRA', largura: 80, centro: true, valor: (l) => l.letra },
                { id: 'sup', rotulo: 'SUPERVISOR', largura: 200, valor: (l) => l.sup },
            ],
        };
    }

    /* ─── Estado da tela ─── */
    const st = { planilha: null, selecao: [], busca: '', expandido: false, painel: null, fundo: null };

    function pessoasVisiveis() {
        let ls = SGE.helpers.filtrarColaboradores();
        const termo = semAcento(st.busca.trim());
        if (termo) ls = ls.filter((c) => semAcento(`${c.nome} ${c.matricula_gps || ''} ${c.matricula_usiminas || ''}`).includes(termo));
        return ls;
    }

    function montarAbas() {
        return [abaColaboradores(pessoasVisiveis())];
    }

    const colaborador = (id) => (SGE.state.colaboradores || []).find((c) => String(c.id) === String(id));

    /* ─── Tela ─── */
    function montarTela(view) {
        view.innerHTML = `
            <h1 class="sr-only">Matriz do efetivo</h1>
            <div class="mz-tela"><div class="mz-planilha"></div></div>`;
        st.planilha = SGE.tabela.criar(view.querySelector('.mz-planilha'), {
            nomeArquivo: 'planilha-efetivos-mecanizada',
            abaInicial: 'geral', // sempre abre na GERAL
            abas: montarAbas(),
            dica: 'dois cliques num nome abrem o colaborador',
            aoAbrir: (id) => {
                const c = colaborador(id);
                if (c) SGE.drawer.open(c);
            },
            aoSelecionar: (ids) => {
                st.selecao = ids.map(colaborador).filter(Boolean);
                if (st.painel) desenharPainel();
            },
            ferramentas: (lugar) => {
                lugar.innerHTML = `
                    <button type="button" class="mz-btn-ferramentas" aria-haspopup="dialog" aria-expanded="false" aria-label="Ferramentas da Matriz" title="Ferramentas: buscar, filtrar, exportar"></button>
                    <button type="button" class="mz-btn-expandir" aria-pressed="false" aria-label="Expandir a planilha para a tela toda"></button>`;
                lugar.querySelector('.mz-btn-ferramentas').addEventListener('click', () => (st.painel ? fecharPainel() : abrirPainel()));
                lugar.querySelector('.mz-btn-expandir').addEventListener('click', () => expandir(!st.expandido));
                atualizarBotoes(lugar);
            },
        });
    }

    function filtrosAtivos() {
        const f = SGE.state.filtros || {};
        const nomes = { regime: 'Regime', funcao: 'Função', status: 'Status', alocacao: 'Alocação', equipTurno: 'Turno', supervisor: 'Supervisor', categoria: 'Categoria' };
        const r = [];
        for (const [tipo, valores] of Object.entries(f)) for (const v of valores || []) r.push({ tipo, valor: v, rotulo: `${nomes[tipo] || tipo}: ${v}` });
        return r;
    }

    /** raiz: onde estão os botões (a barra da planilha ainda pode estar fora da tela quando é montada) */
    function atualizarBotoes(raiz = document.getElementById('matriz-view')) {
        const view = raiz;
        if (!view) return;
        const n = filtrosAtivos().length + (st.busca.trim() ? 1 : 0);
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
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50); // a planilha mede o espaço de novo
    }

    /* ─── Janela "Ferramentas" (port de barra-lateral do SST) ─── */
    function item({ acao, rotulo, titulo, d, ativo, contagem, primario }) {
        const cls = ['mz-item', primario ? 'mz-item--primario' : ativo ? 'mz-item--ativo' : ''].join(' ');
        return `<button type="button" class="${cls}" data-acao="${acao}" title="${esc(titulo || rotulo)}">
            ${svg(d)}<span class="mz-item-rotulo">${esc(rotulo)}</span>${contagem ? `<span class="mz-item-contagem">${contagem}</span>` : ''}</button>`;
    }
    const secao = (t) => `<p class="mz-secao">${esc(t)}</p>`;

    function desenharPainel() {
        const caixa = st.painel && st.painel.querySelector('.mz-painel-corpo');
        if (!caixa) return;
        // quem está digitando na busca continua digitando (o painel é redesenhado a cada filtro)
        const digitando = document.activeElement && document.activeElement.classList.contains('mz-busca-campo');
        const cursor = digitando ? document.activeElement.selectionStart : null;
        const etiquetas = filtrosAtivos();
        const pessoas = pessoasVisiveis().filter((c) => situacaoDe(c)).length;
        const total = (SGE.state.colaboradores || []).filter((c) => situacaoDe(c)).length;
        const gestao = SGE.auth.hasRole('GESTAO');
        const sel = st.selecao;
        let selecao = '';
        if (sel.length === 1) {
            selecao = `<p class="mz-sel-nome">${esc(sel[0].nome)}</p>
                ${item({ acao: 'abrir', rotulo: 'Abrir colaborador', d: ICONE.pessoa, primario: true })}
                ${gestao ? item({ acao: 'mover', rotulo: 'Mover de supervisor', d: ICONE.mover }) : ''}
                ${gestao ? item({ acao: 'editar', rotulo: 'Editar dados', d: ICONE.editar }) : ''}`;
        } else if (sel.length > 1) {
            selecao = `<p class="mz-sel-nome">${sel.length} colaboradores selecionados</p>
                ${gestao ? item({ acao: 'massa', rotulo: 'Editar os selecionados', d: ICONE.editar, primario: true }) : ''}`;
        }
        caixa.innerHTML = `
            <div class="mz-busca">
                ${svg(ICONE.busca)}
                <input type="search" class="mz-busca-campo" placeholder="Buscar nome ou matrícula" aria-label="Buscar por nome ou matrícula" value="${esc(st.busca)}">
            </div>
            ${item({ acao: 'filtros', rotulo: 'Filtros', titulo: 'Filtrar por supervisor, função, regime, status, categoria, alocação e turno', d: ICONE.filtros, ativo: etiquetas.length > 0, contagem: etiquetas.length })}
            ${etiquetas.length || st.busca.trim()
                ? `<div class="mz-etiquetas">${etiquetas
                      .map((e, i) => `<button type="button" class="mz-etiqueta" data-etiqueta="${i}" aria-label="Remover ${esc(e.rotulo)}">${esc(e.rotulo)} <span aria-hidden="true">×</span></button>`)
                      .join('')}<button type="button" class="mz-limpar" data-acao="limpar">Limpar tudo</button></div>`
                : ''}
            ${secao('Ações')}
            ${item({ acao: 'exportar', rotulo: 'Exportar Excel', titulo: 'Exporta todas as abas como estão: filtradas (só o que aparece) ou completas, no mesmo formato', d: ICONE.exportar, primario: true })}
            ${item({ acao: 'imprimir', rotulo: 'Imprimir', titulo: 'Imprimir a aba aberta como está na tela', d: ICONE.imprimir })}
            ${secao('Planilha')}
            ${selecao}
            <div class="mz-ajuda">
                <p><b>${pessoas} de ${total} pessoas</b> · só para ver e pesquisar (Ctrl+F); nada ali altera os dados.</p>
                <p>Abas embaixo: Relação (resumo), GERAL, uma por supervisor, Turno 16hrs, Férias, Sobra e Atestado. Dois cliques num nome abrem o colaborador; selecione nomes para agir em vários.</p>
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
                SGE.navigation._persistFilters();
                SGE.navigation.buildFilterDropdown();
                SGE.navigation._updateFilterBadge();
                render();
            }
            return;
        }
        const b = e.target.closest('[data-acao]');
        if (!b) return;
        const sel = st.selecao;
        const um = sel[0];
        const acoes = {
            filtros: () => {
                const painel = document.getElementById('filter-dropdown-panel');
                if (painel) setTimeout(() => painel.classList.remove('hidden'), 0);
            },
            limpar: () => {
                st.busca = '';
                const limpar = document.getElementById('filter-clear-all');
                if (limpar) limpar.click();
                else render();
            },
            exportar: () => st.planilha && st.planilha.exportar(),
            imprimir: () => st.planilha && st.planilha.imprimir(),
            abrir: () => um && SGE.drawer.open(um),
            mover: () => um && SGE.modal.openMoveSelector(um),
            editar: () => um && SGE.modal.openEdit(um),
            massa: () => SGE.acoesColaborador.editarEmMassa(sel.map((c) => c.id), render),
        };
        // "Limpar tudo" deixa a janela aberta; as outras ações fecham
        if (b.dataset.acao !== 'limpar') fecharPainel();
        if (acoes[b.dataset.acao]) acoes[b.dataset.acao]();
    }

    /* ─── Público ─── */
    /** entrar = veio de outra tela (abre na GERAL); sem isso é só atualização dos dados (fica na aba atual) */
    function render(entrar = false) {
        const view = document.getElementById('matriz-view');
        if (!view) return;
        if (!st.planilha || !view.querySelector('.mz-planilha')) montarTela(view);
        else {
            st.planilha.atualizar(montarAbas());
            if (entrar) st.planilha.irPara('geral');
        }
        atualizarBotoes();
        if (st.painel) desenharPainel();
    }

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || SGE.state.activeView !== 'matriz') return;
        const modal = document.getElementById('modal-overlay');
        if (modal && modal.classList.contains('open')) return;
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
