'use strict';

/**
 * SGE — Matriz do efetivo (modelo Excel)
 * Mesmo formato da planilha "EFETIVOS MECANIZADA": aba RELAÇÃO (resumo com contagens), aba GERAL
 * (Nome · Supervisor/Status · Equipamento), uma aba por supervisor (PLACA · MOTORISTA · OPERADOR 1 ·
 * OPERADOR 2, uma linha por equipamento), TURNO 16HRS e as abas FÉRIAS, SOBRA e ATESTADO. A planilha é só para ver e pesquisar: dois cliques num nome
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
        vagaMais: 'M12 5v14M5 12h14',
        vagaMenos: 'M5 12h14',
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
    const natural = (a, b) => a.localeCompare(b, 'pt-BR', { numeric: true });
    const MESES = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    const NAO_APLICAVEL = 'NÃO APLICÁVEL';

    /* ─── Quem vai para qual aba ─── */
    const ehMotorista = (c) => /MOTORISTA/i.test(c.funcao || '');
    const temSupervisor = (c) => !!c.supervisor && c.supervisor !== 'SEM SUPERVISOR';
    /** placa/vaga como na planilha: "AP-12" vira "AP 12", "AV-02 - EQUIP 1" vira "AV 02 - EQUIP 1"; quem está num setor mostra o setor */
    function placaDe(c) {
        if (c.setor_id && c.setor && c.setor !== 'SEM SETOR') return maiusculo(c.setor);
        if (c.equipamento && c.equipamento !== 'SEM EQUIPAMENTO' && c.equipamento !== 'NÃO INFORMADA') return maiusculo(c.equipamento).replace('-', ' ');
        return null;
    }
    /** funções de apoio (não são equipe de caminhão): linha própria no resumo, na ordem da planilha */
    const FUNCOES_APOIO = [
        ['COORDENADOR', /COORDENADOR/],
        ['TECNICO DE SEGURANÇA', /SEGURAN/],
        ['MECANICO (SERVITEC)', /MEC[AÂ]NIC/],
        ['PLANEJADOR', /PLANEJ|PROGRAMADOR/],
        ['ALMOXARIFE', /ALMOXARIF/],
        ['ESTAGIÁRIO', /ESTAGI/],
        ['SUPERVISORES', /SUPERVISOR|ENCARREGADO/],
    ];
    const funcaoApoio = (c) => {
        const f = maiusculo(c.funcao);
        const achou = FUNCOES_APOIO.find(([, re]) => re.test(f));
        return achou ? achou[0] : c.categoria === 'GESTAO' ? 'OUTRAS FUNÇÕES' : null;
    };
    // turma das 16 horas: no cadastro ela é um 'supervisor' chamado "16 HORAS" (o regime nem sempre está preenchido)
    const ehTurno16 = (c) => /^16\s*H/.test(maiusculo(c.supervisor).trim());
    function grupoDe(c) {
        const s = maiusculo(c.status);
        if (s === 'DESLIGADO' || s === 'INATIVO') return null; // fora do quadro
        if (s.startsWith('FÉRIAS') || s.startsWith('FERIAS')) return 'ferias';
        if (s === 'AFASTADO') return 'atestado';
        if (funcaoApoio(c)) return 'gestao';
        // sobra = sem supervisor; quem tem supervisor e não tem placa fica na aba dele, numa linha sem placa (como na planilha)
        if (!temSupervisor(c)) return 'sobra';
        return ehTurno16(c) ? 'turno16' : 'equipe';
    }
    /** mês das férias: a que está em andamento ou a próxima agendada */
    function mesDasFerias(c) {
        const lista = (SGE.state.ferias || []).filter((f) => f.employee_id === c.id && f.data_inicio && f.status !== 'CANCELADA');
        const atual = lista.find((f) => f.status === 'EM_ANDAMENTO') || lista.sort((a, b) => String(b.data_inicio).localeCompare(String(a.data_inicio)))[0];
        if (!atual) return '';
        const m = Number(String(atual.data_inicio).slice(5, 7));
        return MESES[m - 1] || '';
    }

    /* ─── Colunas ─── */
    const colPessoa = (id, rotulo, largura, campo) => ({ id, rotulo, largura, valor: (l) => (l[campo] ? l[campo].nome : null), pessoa: (l) => (l[campo] ? l[campo].id : null) });

    /** aba de um supervisor: uma linha por equipamento, com motorista e até dois operadores */
    function abaEquipe(sup, pessoas, opcoes = {}) {
        const porPlaca = new Map();
        for (const c of pessoas) {
            const p = placaDe(c) || '';
            if (!porPlaca.has(p)) porPlaca.set(p, { mot: [], op: [] });
            porPlaca.get(p)[ehMotorista(c) ? 'mot' : 'op'].push(c);
        }
        const vagas = opcoes.vagas && SGE.vagas ? SGE.vagas.doSupervisor(sup.nome).map((x) => x.eq) : [];
        for (const eq of vagas) {
            const p = SGE.vagas.rotulo(eq);
            if (!porPlaca.has(p)) porPlaca.set(p, { mot: [], op: [] });
        }
        const linhas = [];
        // linhas sem placa vão para o fim da aba, como na planilha
        for (const placa of [...porPlaca.keys()].sort((a, b) => (a === '') - (b === '') || natural(a, b))) {
            const { mot, op } = porPlaca.get(placa);
            mot.sort(porNome);
            op.sort(porNome);
            const n = Math.max(mot.length, Math.ceil(op.length / 2), 1);
            for (let i = 0; i < n; i++) linhas.push({ chave: `${placa}#${i}`, placa, mot: mot[i], op1: op[2 * i], op2: op[2 * i + 1] });
        }
        // título como na planilha: "EQUIPE" + tipos de equipamento do supervisor
        const tipos = SGE.CONFIG.equipTipos || {};
        const siglas = [...pessoas.map((c) => SGE.equip && SGE.equip.parseEquip(c.equipamento)).filter(Boolean).map((x) => x.sigla), ...vagas.map((e) => e.sigla)];
        const nomes = [...new Set(siglas.filter((s) => tipos[s]).map((s) => maiusculo(tipos[s].nome)))];
        return {
            id: opcoes.id || `sup-${sup.id}`,
            nome: opcoes.nome || maiusculo(sup.nome),
            rotuloGeral: opcoes.rotuloGeral || maiusculo(sup.nome),
            titulo: opcoes.semEquipe ? nomes.join(' E ') || maiusculo(sup.nome) : `EQUIPE ${nomes.length ? nomes.join(' E ') : maiusculo(sup.nome)}`,
            cabecalho: 'equipe',
            chave: (l) => l.chave,
            linhas,
            colunas: [
                { id: 'placa', rotulo: 'PLACA', largura: 156, centro: true, valor: (l) => l.placa },
                colPessoa('mot', 'MOTORISTA', 272, 'mot'),
                colPessoa('op1', 'OPERADOR 1', 252, 'op1'),
                colPessoa('op2', 'OPERADOR 2', 295, 'op2'),
            ],
        };
    }

    /** abas FÉRIAS, SOBRA e ATESTADO: motoristas e operadores lado a lado (listas independentes) */
    function abaLista(id, nome, pessoas, comMes) {
        const grupos = new Map();
        for (const c of pessoas) {
            const g = comMes ? mesDasFerias(c) : '';
            if (!grupos.has(g)) grupos.set(g, { mot: [], op: [] });
            grupos.get(g)[ehMotorista(c) ? 'mot' : 'op'].push(c);
        }
        const ordem = [...grupos.keys()].sort((a, b) => (MESES.indexOf(a) + 13) % 13 - (MESES.indexOf(b) + 13) % 13);
        const linhas = [];
        for (const g of ordem) {
            const { mot, op } = grupos.get(g);
            mot.sort(porNome);
            op.sort(porNome);
            for (let i = 0; i < Math.max(mot.length, op.length); i++) linhas.push({ chave: `${g}#${i}`, mes: i === 0 ? g : '', mot: mot[i], op: op[i] });
        }
        const colunas = [colPessoa('mot', 'MOTORISTA', 270, 'mot'), colPessoa('op', comMes || id === 'sobra' ? 'OPERADOR 1' : 'OPERADOR', 270, 'op')];
        if (id !== 'atestado') colunas.unshift({ id: 'mes', rotulo: 'MÊS', largura: 150, centro: true, valor: (l) => l.mes });
        return { id, nome, titulo: `EFETIVOS DE ${nome}`, cabecalho: 'equipe', chave: (l) => l.chave, linhas, colunas };
    }

    /** aba GERAL: igual à fórmula da planilha (equipes por coluna, depois férias, sobra e atestado) */
    function abaGeral(equipes, listas, gestao) {
        const linhas = [];
        for (const aba of equipes) {
            for (const campo of ['mot', 'op1', 'op2']) for (const l of aba.linhas) if (l[campo]) linhas.push({ c: l[campo], sup: aba.rotuloGeral, eq: l.placa });
        }
        for (const aba of listas) {
            for (const campo of ['mot', 'op']) for (const l of aba.linhas) if (l[campo]) linhas.push({ c: l[campo], sup: aba.nome, eq: NAO_APLICAVEL });
        }
        for (const c of gestao) linhas.push({ c, sup: funcaoApoio(c) || 'GESTÃO', eq: NAO_APLICAVEL });
        return {
            id: 'geral',
            nome: 'GERAL',
            cabecalho: 'geral',
            chave: (l) => l.c.id,
            linhas,
            colunas: [
                { id: 'nome', rotulo: 'Nome Colaborador', largura: 254, valor: (l) => l.c.nome, pessoa: (l) => l.c.id },
                { id: 'sup', rotulo: 'Supervisor / Status', largura: 160, valor: (l) => l.sup },
                { id: 'eq', rotulo: 'Equipamento', largura: 144, valor: (l) => l.eq },
            ],
        };
    }

    /** aba RELAÇÃO: contagens por função e por supervisor (como a primeira aba da planilha) */
    function abaRelacao(grupos, equipes, turno) {
        const conta = (lista, motorista) => lista.filter((c) => ehMotorista(c) === motorista).length;
        const operacao = [...grupos.equipe, ...grupos.turno16];
        const apoio = new Map();
        for (const c of grupos.gestao) apoio.set(funcaoApoio(c), (apoio.get(funcaoApoio(c)) || 0) + 1);
        const qtd = (nome) => apoio.get(nome) || 0;
        const funcoes = [
            ['MOTORISTA', conta(operacao, true)],
            ['OPERADOR DE EQUIPAMENTOS', conta(operacao, false)],
            ['COORDENADOR', qtd('COORDENADOR')],
            ['TECNICO DE SEGURANÇA', qtd('TECNICO DE SEGURANÇA')],
            ['MECANICO (SERVITEC)', qtd('MECANICO (SERVITEC)')],
            ['PLANEJADOR', qtd('PLANEJADOR')],
            ['ALMOXARIFE', qtd('ALMOXARIFE')],
            ['FERISTAS MOTORISTA', conta(grupos.ferias, true)],
            ['FERISTAS OPERADOR', conta(grupos.ferias, false)],
            ['ESTAGIÁRIO', qtd('ESTAGIÁRIO')],
            ['SOBRA MOTORISTA', conta(grupos.sobra, true)],
            ['SOBRA OPERADOR', conta(grupos.sobra, false)],
            // linhas que não existem na planilha só aparecem se houver alguém (assim o total fecha)
            ...(grupos.atestado.length ? [['ATESTADO', grupos.atestado.length]] : []),
            ...(qtd('OUTRAS FUNÇÕES') ? [['OUTRAS FUNÇÕES', qtd('OUTRAS FUNÇÕES')]] : []),
            ['SUPERVISORES', qtd('SUPERVISORES')],
        ];
        const total = funcoes.reduce((s, [, n]) => s + n, 0);
        const linhas = funcoes.map(([a, b]) => ({ chave: `f:${a}`, a, b }));
        linhas.push({ chave: 'total', a: 'TOTAL DE EFETIVO', b: total });
        linhas.push({ chave: 'vazio', tipo: 'vazio' });
        linhas.push({ chave: 'cab2', tipo: 'cab2', a: 'SUPERVISORES', b: 'MOTORISTA', c: 'OPERADOR' });
        for (const aba of [...equipes, ...(turno ? [turno] : [])]) {
            let m = 0;
            let o = 0;
            for (const l of aba.linhas) {
                if (l.mot) m++;
                if (l.op1) o++;
                if (l.op2) o++;
            }
            linhas.push({ chave: `s:${aba.id}`, a: aba.rotuloGeral, b: m, c: o });
        }
        const PRETA = { t: { s: 1, cl: { rgb: '#000000' } }, b: { s: 1, cl: { rgb: '#000000' } }, l: { s: 1, cl: { rgb: '#000000' } }, r: { s: 1, cl: { rgb: '#000000' } } };
        const estilo = (l, col) => {
            if (l.tipo === 'vazio') return { bd: null };
            if (col === 'c' && l.c == null && l.tipo !== 'cab2') return { bd: null }; // a 1ª tabela só tem 2 colunas
            const base = { ff: 'Arial', fs: 11, bl: 1, bd: PRETA, ht: col === 'a' && l.chave.startsWith('s:') ? 1 : 2 };
            return l.tipo === 'cab2' ? { ...base, bg: { rgb: '#1F054F' }, cl: { rgb: '#FFFFFF' } } : base;
        };
        return {
            id: 'relacao',
            nome: 'RELAÇÃO DE EFETIVOS MECANIZADA',
            titulo: 'EFETIVO MECANIZADA',
            estiloTitulo: { ff: 'Arial', fs: 26, bl: 0, bg: { rgb: '#FFFFFF' }, cl: { rgb: '#253356' }, bd: null },
            semFiltro: true,
            cabecalho: 'equipe',
            chave: (l) => l.chave,
            linhas,
            colunas: [
                { id: 'a', rotulo: 'FUNÇÃO', largura: 260, valor: (l) => l.a, estilo: (l) => estilo(l, 'a') },
                { id: 'b', rotulo: 'QUANTIDADE', largura: 120, centro: true, valor: (l) => l.b, estilo: (l) => estilo(l, 'b') },
                { id: 'c', rotulo: '', largura: 120, centro: true, valor: (l) => l.c, estilo: (l) => estilo(l, 'c') },
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
        const grupos = { equipe: [], turno16: [], ferias: [], sobra: [], atestado: [], gestao: [] };
        for (const c of pessoasVisiveis()) {
            const g = grupoDe(c);
            if (g) grupos[g].push(c);
        }
        // abas dos supervisores na ordem do cadastro; supervisor sem cadastro ativo entra no fim
        const porSup = new Map();
        for (const c of grupos.equipe) {
            if (!porSup.has(c.supervisor)) porSup.set(c.supervisor, []);
            porSup.get(c.supervisor).push(c);
        }
        // com busca ou filtro, as vagas vazias somem (mostra só quem combina)
        const semFiltro = !st.busca.trim() && filtrosAtivos().length === 0;
        const temVagas = (s) => semFiltro && SGE.vagas && SGE.vagas.doSupervisor(s.nome).length > 0;
        const supTurno = (SGE.state.supervisores || []).find((s) => ehTurno16({ supervisor: s.nome }));
        const cadastrados = (SGE.state.supervisores || []).filter((s) => s !== supTurno && s.nome !== 'SEM SUPERVISOR' && (porSup.has(s.nome) || (s.ativo && temVagas(s))));
        const extras = [...porSup.keys()].filter((n) => !cadastrados.some((s) => s.nome === n)).map((n, i) => ({ id: `x${i}`, nome: n }));
        const equipes = [...cadastrados, ...extras].map((s) => abaEquipe(s, porSup.get(s.nome) || [], { vagas: semFiltro }));
        const turno = grupos.turno16.length || (supTurno && temVagas(supTurno))
            ? abaEquipe(supTurno || { id: 'turno16', nome: 'TURNO 16HRS' }, grupos.turno16, { id: 'turno16', nome: 'TURNO 16HRS 7H AS 15H', rotuloGeral: 'TURNO 16HRS', semEquipe: true, vagas: semFiltro })
            : null;
        const listas = [abaLista('ferias', 'FÉRIAS', grupos.ferias, true), abaLista('sobra', 'SOBRA', grupos.sobra, false), abaLista('atestado', 'ATESTADO', grupos.atestado, false)];
        const comTurno = turno ? [...equipes, turno] : equipes;
        return [abaRelacao(grupos, equipes, turno), abaGeral(comTurno, listas, grupos.gestao.sort(porNome)), ...comTurno, ...listas];
    }

    const colaborador = (id) => (SGE.state.colaboradores || []).find((c) => String(c.id) === String(id));

    /* ─── Tela ─── */
    function montarTela(view) {
        view.innerHTML = `
            <h1 class="sr-only">Matriz do efetivo</h1>
            <div class="mz-tela"><div class="mz-planilha"></div></div>`;
        st.planilha = SGE.planilha.criar(view.querySelector('.mz-planilha'), {
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
        const pessoas = pessoasVisiveis().filter((c) => grupoDe(c)).length;
        const total = (SGE.state.colaboradores || []).filter((c) => grupoDe(c)).length;
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
            ${gestao ? `${secao('Vagas')}
            ${item({ acao: 'vaga-add', rotulo: 'Adicionar vaga', titulo: 'Nova linha (equipamento) na aba do supervisor, mesmo sem ninguém nela', d: ICONE.vagaMais })}
            ${item({ acao: 'vaga-del', rotulo: 'Remover vaga vazia', titulo: 'Tira uma linha vazia da aba do supervisor', d: ICONE.vagaMenos })}` : ''}
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
            'vaga-add': () => SGE.vagas.abrirAdicionar(supervisorDaAba()),
            'vaga-del': () => SGE.vagas.abrirRemover(supervisorDaAba()),
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

    /** supervisor da aba aberta (para já vir escolhido em Adicionar/Remover vaga) */
    function supervisorDaAba() {
        const id = st.planilha && st.planilha.abaAtiva ? st.planilha.abaAtiva() : null;
        const sups = SGE.state.supervisores || [];
        if (id === 'turno16') {
            const s = sups.find((x) => ehTurno16({ supervisor: x.nome }));
            return s ? s.nome : undefined;
        }
        if (id && id.startsWith('sup-')) {
            const s = sups.find((x) => String(x.id) === id.slice(4));
            return s ? s.nome : undefined;
        }
        return undefined;
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
