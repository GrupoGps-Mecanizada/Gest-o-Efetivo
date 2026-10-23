'use strict';

/**
 * SGE — Tabela com filtro de cabeçalho igual ao AutoFiltro do Excel (port do filtro-excel da Matriz do SST)
 * Menu de cada coluna: Classificar de A a Z / de Z a A / por Cor · Remover classificação · Limpar Filtro ·
 * Filtrar por Cor · Filtros de Texto · Pesquisar · (Selecionar Tudo) + valores · OK / Cancelar.
 * Só mostra: clique seleciona a linha (Ctrl soma), dois cliques abrem o colaborador.
 *
 * Aba: { id, nome, colunas, linhas, chave(l), corLinha?(l), rotuloContagem? } — corLinha devolve { chave, rotulo, rgb } ou null.
 * Coluna: { id, rotulo, largura, centro?, valor(l), pessoa?(l), sub?(l), colorida? } — sub = linha pequena embaixo
 * (ex.: matrícula); colorida = a célula ganha a cor da situação (como a célula de status no SST).
 * Visual igual à Matriz do SST: cabeçalho claro, 1ª coluna congelada, linhas de 52 px, status pintado.
 * Mesma interface da planilha antiga: { atualizar(abas), irPara(), abaAtiva(), exportar(), imprimir(), tema(), destruir() }.
 */
window.SGE = window.SGE || {};

SGE.tabela = (() => {
    const VAZIAS = '(Vazias)';
    const OPERADORES = [
        ['igual', 'É Igual a...'],
        ['diferente', 'É Diferente de...'],
        ['comeca', 'Começa com...'],
        ['termina', 'Termina com...'],
        ['contem', 'Contém...'],
        ['naoContem', 'Não Contém...'],
    ];
    const LARGURA_MENU = 270;
    const comparador = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });
    const norm = (s) => String(s).toLocaleLowerCase('pt-BR');
    const esc = (v) => SGE.helpers.escapeHtml(v == null ? '' : String(v));

    /* ─── Regras do filtro (as mesmas de lib/tabela/filtro.ts do SST) ─── */
    function passaTexto(v, t) {
        const a = norm(v);
        const b = norm(t.valor);
        return { igual: a === b, diferente: a !== b, comeca: a.startsWith(b), termina: a.endsWith(b), contem: a.includes(b), naoContem: !a.includes(b) }[t.op];
    }
    const filtroAtivo = (f) => !!f && (f.valores !== undefined || !!f.texto || !!f.cor);
    function passa(l, col, f, ler) {
        const { texto, cor } = ler(l, col);
        if (f.valores && !f.valores.includes(texto === '' ? VAZIAS : texto)) return false;
        if (f.texto && !passaTexto(texto, f.texto)) return false;
        if (f.cor && cor !== f.cor) return false;
        return true;
    }
    /** aplica os filtros de todas as colunas (menos `exceto`, usado para montar a lista de valores dela) */
    function filtrar(linhas, filtros, ler, exceto) {
        const ativos = Object.entries(filtros).filter(([c, f]) => c !== exceto && filtroAtivo(f));
        return ativos.length ? linhas.filter((l) => ativos.every(([c, f]) => passa(l, c, f, ler))) : linhas;
    }
    /** valores distintos em ordem crescente como no Excel; "(Vazias)" por último */
    function distintos(linhas, col, ler) {
        const vistos = new Set(linhas.map((l) => ler(l, col).texto || VAZIAS));
        return [...vistos].sort((a, b) => (a === VAZIAS ? 1 : b === VAZIAS ? -1 : comparador.compare(a, b)));
    }
    /** classificação estável: vazias sempre no fim, empate mantém a ordem anterior */
    function classificar(linhas, o, ler) {
        if (!o) return linhas;
        const idx = new Map(linhas.map((l, i) => [l, i]));
        const sinal = o.direcao === 'asc' ? 1 : -1;
        return [...linhas].sort((a, b) => {
            const va = ler(a, o.coluna);
            const vb = ler(b, o.coluna);
            if (o.cor) return (va.cor === o.cor ? 0 : 1) - (vb.cor === o.cor ? 0 : 1) || idx.get(a) - idx.get(b);
            if (!va.texto !== !vb.texto) return va.texto ? -1 : 1;
            return sinal * comparador.compare(va.texto, vb.texto) || idx.get(a) - idx.get(b);
        });
    }

    /* ─── Ícones ─── */
    const ICONE_AZ = (inverso) =>
        `<svg viewBox="0 0 16 16" class="tb-ico" aria-hidden="true"><text x="0" y="7" font-size="6.5" font-weight="700" fill="currentColor">${inverso ? 'Z' : 'A'}</text><text x="0" y="15" font-size="6.5" font-weight="700" fill="currentColor">${inverso ? 'A' : 'Z'}</text><path d="M11.5 2v11m-2.5-2.5 2.5 2.5 2.5-2.5" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>`;
    const ICONE_LIMPAR = '<svg viewBox="0 0 16 16" class="tb-ico" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M1.5 2.5h9L7 7v5l-2 1V7z"/><path d="M10.5 10l4 4m0-4-4 4"/></svg>';
    function iconeBotao(ativo, direcao) {
        let d;
        if (ativo) d = `<path d="M2.5 3h9L8 7.5V12l-2 1V7.5z" fill="currentColor" fill-opacity="0.25"/>${direcao ? `<path d="${direcao === 'desc' ? 'M13.5 8v5m-1.5-1.5 1.5 1.5 1.5-1.5' : 'M13.5 13V8m-1.5 1.5L13.5 8 15 9.5'}"/>` : ''}`;
        else if (direcao === 'asc') d = '<path d="M8 13V3M4.5 6.5 8 3l3.5 3.5"/>';
        else if (direcao === 'desc') d = '<path d="M8 3v10M4.5 9.5 8 13l3.5-3.5"/>';
        else d = '<path d="M4 6l4 4 4-4"/>';
        return `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
    }

    /** abaixo do botão; sobe se não couber até o fim da tela */
    function posicaoMenu(r) {
        const margem = 8;
        const left = Math.max(margem, Math.min(r.left, window.innerWidth - LARGURA_MENU - margem));
        const abaixo = window.innerHeight - r.bottom - margem;
        const acima = r.top - margem;
        if (abaixo >= 420 || abaixo >= acima) return { left, top: r.bottom + 2, altura: abaixo };
        const altura = Math.min(acima, 560);
        return { left, top: r.top - altura - 2, altura };
    }

    function criar(caixa, opcoes) {
        const props = { dica: 'dois cliques num nome abrem o colaborador', nomeArquivo: 'tabela', ...opcoes };
        let aba = props.abas[0];
        let filtros = {};
        let ordem = null;
        let selecionados = new Set();
        let ultimaClicada = null;
        let menu = null;
        let visiveis = [];

        const lerCelula = (l, colId) => {
            const col = aba.colunas.find((c) => c.id === colId);
            const v = col ? col.valor(l) : '';
            const cor = aba.corLinha ? aba.corLinha(l) : null;
            return { texto: v == null ? '' : String(v).trim(), cor: cor ? cor.chave : undefined };
        };
        /** cores presentes na coluna (as linhas pintadas), para Filtrar/Classificar por Cor */
        const coresDe = (linhas) => {
            const m = new Map();
            for (const l of linhas) {
                const c = aba.corLinha && aba.corLinha(l);
                if (c && !m.has(c.chave)) m.set(c.chave, c);
            }
            return [...m.values()];
        };

        caixa.classList.add('tb-caixa');
        caixa.innerHTML = `
            <div class="tb-barra">
                <div class="tb-ferramentas"></div>
                <span class="tb-conta" aria-live="polite"></span>
                <button type="button" class="tb-limpar" hidden>Limpar filtros</button>
                <span class="tb-espaco"></span>
                <button type="button" class="tb-acao" data-tb="excel"><span>Excel</span></button>
                <button type="button" class="tb-acao" data-tb="imprimir"><span>Imprimir</span></button>
            </div>
            <div class="tb-rolar"><table class="tb"><colgroup></colgroup><thead></thead><tbody></tbody></table></div>
            <p class="tb-dica">${esc(props.dica)}</p>`;
        const rolar = caixa.querySelector('.tb-rolar');
        // sombra na 1ª coluna quando a tabela rola para o lado (como no SST)
        rolar.addEventListener('scroll', () => caixa.classList.toggle('tb-rolou', rolar.scrollLeft > 0), { passive: true });
        const tabela = caixa.querySelector('.tb');
        const conta = caixa.querySelector('.tb-conta');
        const btnLimpar = caixa.querySelector('.tb-limpar');
        if (props.ferramentas) props.ferramentas(caixa.querySelector('.tb-ferramentas'));

        function desenhar() {
            const linhas = classificar(filtrar(aba.linhas, filtros, lerCelula), ordem, lerCelula);
            visiveis = linhas;
            const chaves = new Set(aba.linhas.map((l) => String(aba.chave(l))));
            for (const k of [...selecionados]) if (!chaves.has(k)) selecionados.delete(k);

            tabela.querySelector('colgroup').innerHTML = aba.colunas.map((c) => `<col style="width:${c.largura}px">`).join('');
            tabela.querySelector('thead').innerHTML = `<tr>${aba.colunas
                .map((c) => {
                    const ativo = filtroAtivo(filtros[c.id]);
                    const dir = ordem && ordem.coluna === c.id ? ordem.direcao : null;
                    const marcado = ativo || dir ? ' tb-filtro-on' : '';
                    const aberto = menu && menu.coluna === c.id;
                    const primeira = c === aba.colunas[0];
                    const rotulo = primeira ? `${esc(c.rotulo)}<small>${linhas.length} de ${aba.linhas.length} ${esc(aba.rotuloContagem || 'linhas')}</small>` : esc(c.rotulo);
                    const cls = [primeira ? 'tb-fixa' : '', c.centro ? 'tb-centro' : ''].filter(Boolean).join(' ');
                    return `<th scope="col"${cls ? ` class="${cls}"` : ''}><div class="tb-cab"><span>${rotulo}</span><button type="button" class="tb-filtro${marcado}" data-col="${esc(c.id)}" aria-haspopup="dialog" aria-expanded="${aberto}" aria-label="Filtrar e classificar ${esc(c.rotulo)}${ativo ? ' (filtro ativo)' : ''}" title="${ativo ? `${esc(c.rotulo)}: filtro ativo` : `Filtrar ${esc(c.rotulo)}`}">${iconeBotao(ativo, dir)}</button></div></th>`;
                })
                .join('')}</tr>`;
            tabela.querySelector('tbody').innerHTML = linhas.length
                ? linhas
                      .map((l) => {
                          const k = String(aba.chave(l));
                          const cor = aba.corLinha && aba.corLinha(l);
                          return `<tr data-k="${esc(k)}"${selecionados.has(k) ? ' class="tb-sel"' : ''}>${aba.colunas
                              .map((c, i) => {
                                  const cls = [i === 0 ? 'tb-fixa' : '', c.centro ? 'tb-centro' : '', c.colorida && cor ? `tb-st tb-st-${cor.chave}` : ''].filter(Boolean).join(' ');
                                  const sub = c.sub ? c.sub(l) : '';
                                  const conteudo = i === 0 ? `<span class="tb-nome">${esc(c.valor(l))}</span>${sub ? `<span class="tb-sub">${esc(sub)}</span>` : ''}` : esc(c.valor(l));
                                  return `<td${cls ? ` class="${cls}"` : ''}>${conteudo}</td>`;
                              })
                              .join('')}</tr>`;
                      })
                      .join('')
                : `<tr><td class="tb-vazio" colspan="${aba.colunas.length}">Nenhuma linha com esses filtros.</td></tr>`;
            const algum = Object.values(filtros).some(filtroAtivo);
            conta.textContent = algum ? `Filtrado: ${linhas.length} de ${aba.linhas.length}` : '';
            btnLimpar.hidden = !algum && !ordem;
        }

        const porChave = (k) => aba.linhas.find((l) => String(aba.chave(l)) === k);
        const idPessoa = (l) => {
            const c = aba.colunas.find((x) => x.pessoa);
            return c && l ? c.pessoa(l) : null;
        };
        function avisarSelecao() {
            if (!props.aoSelecionar) return;
            props.aoSelecionar([...selecionados].map((k) => idPessoa(porChave(k))).filter((x) => x != null));
        }

        tabela.addEventListener('click', (e) => {
            const b = e.target.closest('.tb-filtro');
            if (b) {
                e.stopPropagation();
                if (menu && menu.coluna === b.dataset.col) fecharMenu();
                else abrirMenu(b.dataset.col, b.getBoundingClientRect());
                return;
            }
            const tr = e.target.closest('tbody tr[data-k]');
            if (!tr) return;
            const k = tr.dataset.k;
            if (e.shiftKey && ultimaClicada) {
                const ks = visiveis.map((l) => String(aba.chave(l)));
                const [a, z] = [ks.indexOf(ultimaClicada), ks.indexOf(k)].sort((x, y) => x - y);
                if (a >= 0) ks.slice(a, z + 1).forEach((x) => selecionados.add(x));
            } else if (e.ctrlKey || e.metaKey) {
                if (selecionados.has(k)) selecionados.delete(k);
                else selecionados.add(k);
            } else selecionados = new Set([k]);
            ultimaClicada = k;
            tabela.querySelectorAll('tbody tr[data-k]').forEach((x) => x.classList.toggle('tb-sel', selecionados.has(x.dataset.k)));
            avisarSelecao();
        });
        tabela.addEventListener('dblclick', (e) => {
            const tr = e.target.closest('tbody tr[data-k]');
            const id = tr && idPessoa(porChave(tr.dataset.k));
            if (id != null && props.aoAbrir) props.aoAbrir(id);
        });
        btnLimpar.addEventListener('click', () => {
            filtros = {};
            ordem = null;
            desenhar();
        });
        caixa.querySelector('[data-tb="excel"]').addEventListener('click', exportar);
        caixa.querySelector('[data-tb="imprimir"]').addEventListener('click', imprimir);

        /* ─── Menu do filtro (mesma estrutura do Excel) ─── */
        function fecharMenu() {
            if (!menu) return;
            menu.el.remove();
            document.removeEventListener('mousedown', menu.fora);
            document.removeEventListener('keydown', menu.tecla);
            rolar.removeEventListener('scroll', fecharMenu);
            window.removeEventListener('resize', fecharMenu);
            const col = menu.coluna;
            menu = null;
            const b = tabela.querySelector(`.tb-filtro[data-col="${CSS.escape(col)}"]`);
            if (b) b.setAttribute('aria-expanded', 'false');
        }

        function abrirMenu(coluna, ancora) {
            fecharMenu();
            const col = aba.colunas.find((c) => c.id === coluna);
            const filtro = filtros[coluna];
            const base = filtrar(aba.linhas, filtros, lerCelula, coluna);
            const todos = distintos(base, coluna, lerCelula);
            const cores = coresDe(base);
            const est = { marcados: new Set(filtro && filtro.valores ? filtro.valores : todos), busca: '', marcadosBusca: new Set(), adicionar: false, sub: null, texto: filtro && filtro.texto ? { ...filtro.texto } : null };
            const pos = posicaoMenu(ancora);
            const el = document.createElement('div');
            el.className = 'tb-menu';
            el.setAttribute('role', 'dialog');
            el.setAttribute('aria-label', `Filtro de ${col.rotulo}`);
            Object.assign(el.style, { left: `${pos.left}px`, top: `${pos.top}px`, maxHeight: `${pos.altura}px`, width: `${LARGURA_MENU}px` });
            document.body.appendChild(el);

            const aplicar = (f) => {
                if (f) filtros[coluna] = f;
                else delete filtros[coluna];
                fecharMenu();
                desenhar();
            };
            const ordenar = (o) => {
                ordem = o;
                fecharMenu();
                desenhar();
            };
            const minhaOrdem = ordem && ordem.coluna === coluna ? ordem : null;
            const item = (acao, icone, rotulo, { desativado, marcado } = {}) =>
                `<button type="button" class="tb-mi${marcado ? ' tb-mi-on' : ''}" data-m="${acao}"${desativado ? ' disabled' : ''}><span class="tb-mi-ico">${icone || ''}</span><span class="tb-mi-txt">${rotulo}</span></button>`;
            const sub = (id, rotulo, corpo, { desativado, marcado } = {}) =>
                `<div><button type="button" class="tb-mi${marcado ? ' tb-mi-on' : ''}" data-sub="${id}" aria-expanded="${est.sub === id}"${desativado ? ' disabled' : ''}><span class="tb-mi-ico"></span><span class="tb-mi-txt">${rotulo}</span><span class="tb-seta${est.sub === id ? ' tb-seta-on' : ''}" aria-hidden="true">›</span></button>${est.sub === id ? `<div class="tb-submenu">${corpo}</div>` : ''}</div>`;
            const itemCor = (acao, c, marcado) =>
                `<button type="button" class="tb-mi${marcado ? ' tb-mi-on' : ''}" data-m="${acao}" data-cor="${esc(c.chave)}"><span class="tb-amostra" style="background:${esc(c.rgb)}"></span>${esc(c.rotulo)}</button>`;

            function desenharMenu() {
                const termo = norm(est.busca.trim());
                const resultados = termo ? todos.filter((t) => norm(t).includes(termo)) : todos;
                const selecao = termo ? est.marcadosBusca : est.marcados;
                const tudo = resultados.length > 0 && resultados.every((t) => selecao.has(t));
                const algum = resultados.some((t) => selecao.has(t));
                const podeOk = termo ? est.marcadosBusca.size > 0 || est.adicionar : est.marcados.size > 0;
                const opTexto = est.texto && OPERADORES.find(([o]) => o === est.texto.op);
                el.innerHTML = `
                    <div class="tb-grupo">
                        ${item('az', ICONE_AZ(false), 'Classificar de A a Z', { marcado: minhaOrdem && !minhaOrdem.cor && minhaOrdem.direcao === 'asc' })}
                        ${item('za', ICONE_AZ(true), 'Classificar de Z a A', { marcado: minhaOrdem && !minhaOrdem.cor && minhaOrdem.direcao === 'desc' })}
                        ${sub('classCor', 'Classificar por Cor', cores.map((c) => itemCor('classCor', c, minhaOrdem && minhaOrdem.cor === c.chave)).join(''), { desativado: !cores.length })}
                        ${minhaOrdem ? item('semOrdem', '<span aria-hidden="true">↺</span>', 'Remover classificação') : ''}
                    </div>
                    <div class="tb-grupo">
                        ${item('limpar', ICONE_LIMPAR, `Limpar Filtro de "${esc(col.rotulo)}"`, { desativado: !filtroAtivo(filtro) })}
                        ${sub('filtCor', 'Filtrar por Cor', cores.map((c) => itemCor('filtCor', c, filtro && filtro.cor === c.chave)).join(''), { desativado: !cores.length })}
                        ${sub(
                            'texto',
                            'Filtros de Texto',
                            OPERADORES.map(([o, r]) => `<button type="button" class="tb-op${est.texto && est.texto.op === o ? ' tb-op-on' : ''}" data-op="${o}">${r}</button>`).join('') +
                                (est.texto
                                    ? `<form class="tb-form-texto"><p>Mostrar linhas onde "${esc(col.rotulo)}" ${esc(opTexto[1].replace('...', '').toLowerCase())}:</p><input class="tb-input" data-campo="texto" value="${esc(est.texto.valor)}" aria-label="Valor do filtro de texto"><button type="submit" class="tb-ok">Aplicar</button></form>`
                                    : ''),
                            { marcado: filtro && !!filtro.texto },
                        )}
                    </div>
                    <div class="tb-valores-caixa">
                        <div class="tb-busca"><input class="tb-input" data-campo="busca" placeholder="Pesquisar" value="${esc(est.busca)}" aria-label="Pesquisar valores de ${esc(col.rotulo)}"></div>
                        <div class="tb-valores" role="group" aria-label="Valores">
                            <label class="tb-caixinha"><input type="checkbox" data-tudo${tudo ? ' checked' : ''}> <span>${termo ? '(Selecionar Todos os Resultados da Pesquisa)' : '(Selecionar Tudo)'}</span></label>
                            ${termo ? `<label class="tb-caixinha"><input type="checkbox" data-adicionar${est.adicionar ? ' checked' : ''}> <span>Adicionar seleção atual ao filtro</span></label>` : ''}
                            ${resultados.map((t) => `<label class="tb-caixinha tb-recuo${t === VAZIAS ? ' tb-italico' : ''}"><input type="checkbox" data-valor="${esc(t)}"${selecao.has(t) ? ' checked' : ''}> <span>${esc(t)}</span></label>`).join('')}
                            ${resultados.length ? '' : '<p class="tb-nada">Nenhuma correspondência</p>'}
                        </div>
                        <div class="tb-botoes"><button type="button" class="tb-ok" data-m="ok"${podeOk ? '' : ' disabled'}>OK</button><button type="button" class="tb-cancelar" data-m="cancelar">Cancelar</button></div>
                    </div>`;
                const tudoCx = el.querySelector('[data-tudo]');
                if (tudoCx) tudoCx.indeterminate = !tudo && algum;
            }

            function ok() {
                const termo = norm(est.busca.trim());
                let escolhidos;
                if (termo) {
                    const b = est.adicionar ? new Set(filtro && filtro.valores ? filtro.valores : todos) : new Set();
                    for (const t of est.marcadosBusca) b.add(t);
                    escolhidos = [...b];
                } else escolhidos = [...est.marcados];
                const semFiltro = escolhidos.length === todos.length && todos.every((t) => escolhidos.includes(t));
                aplicar(semFiltro ? undefined : { valores: escolhidos });
            }

            el.addEventListener('click', (e) => {
                const s = e.target.closest('[data-sub]');
                if (s) {
                    est.sub = est.sub === s.dataset.sub ? null : s.dataset.sub;
                    return desenharMenu();
                }
                const op = e.target.closest('[data-op]');
                if (op) {
                    est.texto = { op: op.dataset.op, valor: est.texto && est.texto.op === op.dataset.op ? est.texto.valor : '' };
                    desenharMenu();
                    const i = el.querySelector('[data-campo="texto"]');
                    if (i) i.focus();
                    return;
                }
                const m = e.target.closest('[data-m]');
                if (!m) return;
                const acoes = {
                    az: () => ordenar({ coluna, direcao: 'asc' }),
                    za: () => ordenar({ coluna, direcao: 'desc' }),
                    classCor: () => ordenar({ coluna, direcao: 'asc', cor: m.dataset.cor }),
                    semOrdem: () => ordenar(null),
                    limpar: () => aplicar(undefined),
                    filtCor: () => aplicar({ cor: m.dataset.cor }),
                    ok,
                    cancelar: fecharMenu,
                };
                if (acoes[m.dataset.m]) acoes[m.dataset.m]();
            });
            el.addEventListener('change', (e) => {
                const termo = norm(est.busca.trim());
                const alvo = termo ? est.marcadosBusca : est.marcados;
                const resultados = termo ? todos.filter((t) => norm(t).includes(termo)) : todos;
                if (e.target.matches('[data-tudo]')) resultados.forEach((t) => (e.target.checked ? alvo.add(t) : alvo.delete(t)));
                else if (e.target.matches('[data-adicionar]')) est.adicionar = e.target.checked;
                else if (e.target.dataset.valor !== undefined) {
                    if (e.target.checked) alvo.add(e.target.dataset.valor);
                    else alvo.delete(e.target.dataset.valor);
                }
                desenharMenu();
            });
            el.addEventListener('input', (e) => {
                if (e.target.dataset.campo === 'texto') est.texto.valor = e.target.value;
                if (e.target.dataset.campo !== 'busca') return;
                est.busca = e.target.value;
                // pesquisa nova: todos os resultados começam marcados (como no Excel)
                const t = norm(est.busca.trim());
                est.marcadosBusca = new Set(t ? todos.filter((x) => norm(x).includes(t)) : []);
                const cursor = e.target.selectionStart;
                desenharMenu();
                const i = el.querySelector('[data-campo="busca"]');
                i.focus();
                i.setSelectionRange(cursor, cursor);
            });
            el.addEventListener('submit', (e) => {
                e.preventDefault();
                if (est.texto && est.texto.valor.trim()) aplicar({ texto: { op: est.texto.op, valor: est.texto.valor.trim() } });
            });

            const fora = (e) => !el.contains(e.target) && !e.target.closest('.tb-filtro') && fecharMenu();
            const tecla = (e) => e.key === 'Escape' && fecharMenu();
            document.addEventListener('mousedown', fora);
            document.addEventListener('keydown', tecla);
            rolar.addEventListener('scroll', fecharMenu);
            window.addEventListener('resize', fecharMenu);
            menu = { el, coluna, fora, tecla };
            const b = tabela.querySelector(`.tb-filtro[data-col="${CSS.escape(coluna)}"]`);
            if (b) b.setAttribute('aria-expanded', 'true');
            desenharMenu();
        }

        /* ─── Exportar / imprimir como está (filtrado e classificado) ─── */
        function retrato() {
            const P = SGE.planilha;
            const cab = { ...P.ESTILO.cabEquipe };
            const linhas = [{ altura: 26, celulas: aba.colunas.map((c) => ({ v: c.rotulo, s: cab })) }];
            for (const l of visiveis) {
                const cor = aba.corLinha && aba.corLinha(l);
                linhas.push({
                    altura: 22,
                    celulas: aba.colunas.map((c) => {
                        const s = { ...P.ESTILO.dadoEquipe, ...(c.centro ? { ht: 2 } : {}), ...(cor && c.colorida ? { bg: { rgb: cor.rgb } } : {}) };
                        const v = c.valor(l);
                        return { v: v == null || v === '' ? null : String(v), s };
                    }),
                });
            }
            return { nome: aba.nome, cabecalho: 0, larguras: aba.colunas.map((c) => c.largura), linhas, mesclas: [], filtro: true, visiveis: visiveis.length, total: aba.linhas.length };
        }
        async function exportar() {
            const btn = caixa.querySelector('[data-tb="excel"]');
            btn.disabled = true;
            btn.querySelector('span').textContent = 'Gerando…';
            try {
                const r = retrato();
                const filtrada = r.visiveis < r.total;
                const hoje = new Date().toISOString().slice(0, 10);
                SGE.planilha.baixar(await SGE.planilha.arquivoExcel([r]), `${props.nomeArquivo}-${hoje}${filtrada ? '-filtrada' : ''}.xlsx`);
                SGE.helpers.toast(`Exportada${filtrada ? ` filtrada (${r.visiveis} de ${r.total})` : ''}.`, 'success');
            } catch (e) {
                console.error('[SGE Tabela] exportar', e);
                SGE.helpers.toast(e.message || 'Não foi possível gerar o Excel.', 'error');
            } finally {
                btn.disabled = false;
                btn.querySelector('span').textContent = 'Excel';
            }
        }
        function imprimir() {
            SGE.planilha.imprimirHtml(SGE.planilha.htmlImpressao(retrato()));
        }

        desenhar();
        return {
            atualizar(abas) {
                aba = abas[0];
                fecharMenu();
                desenhar();
            },
            irPara() {},
            abaAtiva: () => aba.id,
            exportar,
            imprimir,
            tema() {}, // as cores vêm do CSS (claro e escuro)
            destruir() {
                fecharMenu();
                caixa.innerHTML = '';
            },
        };
    }

    return { criar };
})();
