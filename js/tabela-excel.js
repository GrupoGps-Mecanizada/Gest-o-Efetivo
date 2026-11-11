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

    const FUNIL = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h18l-7 8.5V19l-4 2v-8.5z"/></svg>';

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
                    const cls = [primeira ? 'tb-fixa' : '', c.centro ? 'tb-centro' : ''].filter(Boolean).join(' ');
                    // cabeçalho igual ao do Controle de Medições: nome da coluna + funil (fica escuro quando filtra/ordena)
                    return `<th scope="col"${cls ? ` class="${cls}"` : ''}><div class="tb-cab"><span>${esc(c.rotulo)}</span><button type="button" class="tb-filtro${marcado}" data-col="${esc(c.id)}" aria-haspopup="dialog" aria-expanded="${aberto}" aria-label="Filtrar e ordenar ${esc(c.rotulo)}${ativo ? ' (filtro ativo)' : ''}" title="Filtrar e ordenar">${FUNIL}</button></div></th>`;
                })
                .join('')}</tr>`;
            tabela.querySelector('tbody').innerHTML = linhas.length
                ? linhas
                      .map((l) => {
                          const k = String(aba.chave(l));
                          const cor = aba.corLinha && aba.corLinha(l);
                          return `<tr data-k="${esc(k)}"${selecionados.has(k) ? ' class="tb-sel"' : ''}>${aba.colunas
                              .map((c, i) => {
                                  const cls = [i === 0 ? 'tb-fixa' : '', c.centro ? 'tb-centro' : '', c.classe || ''].filter(Boolean).join(' ');
                                  const sub = c.sub ? c.sub(l) : '';
                                  const v = c.valor(l);
                                  // situação vira etiqueta (como as do Controle de Medições), não pinta a célula inteira
                                  const conteudo = c.colorida && cor
                                      ? `<span class="tb-pill tb-pill-${esc(cor.chave)}">${esc(v)}</span>`
                                      : i === 0 ? `<span class="tb-nome">${esc(v)}</span>${sub ? `<span class="tb-sub">${esc(sub)}</span>` : ''}` : (v == null || v === '' ? '<span class="tb-vz">–</span>' : esc(v));
                                  return `<td${cls ? ` class="${cls}"` : ''}>${conteudo}</td>`;
                              })
                              .join('')}</tr>`;
                      })
                      .join('')
                : `<tr><td class="tb-vazio" colspan="${aba.colunas.length}">Nenhuma linha com esses filtros.</td></tr>`;
            const algum = Object.values(filtros).some(filtroAtivo);
            const rot = aba.rotuloContagem || 'linhas';
            conta.innerHTML = algum ? `<b>${linhas.length}</b> de ${aba.linhas.length} ${esc(rot)}` : `<b>${aba.linhas.length}</b> ${esc(rot)}`;
            const nf = Object.values(filtros).filter(filtroAtivo).length + (ordem ? 1 : 0);
            btnLimpar.hidden = !nf;
            btnLimpar.textContent = `Limpar filtros (${nf}) ×`;
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

        /* Menu do filtro igual ao do Controle de Medições (06/11/2026): título, De A a Z / De Z a A,
           Procurar, Selecionar tudo, valores com a quantidade, Limpar e Aplicar. */
        function abrirMenu(coluna, ancora) {
            fecharMenu();
            const col = aba.colunas.find((c) => c.id === coluna);
            const filtro = filtros[coluna];
            const base = filtrar(aba.linhas, filtros, lerCelula, coluna);
            const todos = distintos(base, coluna, lerCelula);
            const qtd = new Map();
            base.forEach((l) => { const t = lerCelula(l, coluna).texto || VAZIAS; qtd.set(t, (qtd.get(t) || 0) + 1); });
            const marcados = new Set(filtro && filtro.valores ? filtro.valores : todos);
            const minha = ordem && ordem.coluna === coluna ? ordem.direcao : null;
            const [txtAsc, txtDesc] = col.numero ? ['Menor para maior', 'Maior para menor'] : ['De A a Z', 'De Z a A'];

            const el = document.createElement('div');
            el.className = 'tbm';
            el.setAttribute('role', 'dialog');
            el.setAttribute('aria-label', `Filtro de ${col.rotulo}`);
            el.innerHTML = `
                <div class="tbm-h">${esc(col.rotulo)}</div>
                <div class="tbm-ord"><button type="button" data-m="az" class="${minha === 'asc' ? 'on' : ''}">${txtAsc}</button><button type="button" data-m="za" class="${minha === 'desc' ? 'on' : ''}">${txtDesc}</button></div>
                ${todos.length > 6 ? '<input class="tbm-q" placeholder="Procurar" aria-label="Procurar valores">' : ''}
                <label class="tbm-it tbm-all"><input type="checkbox" data-tudo${marcados.size === todos.length ? ' checked' : ''}><span>Selecionar tudo</span></label>
                <div class="tbm-l">${todos.map((t) => `<label class="tbm-it"><input type="checkbox" data-valor="${esc(t)}"${marcados.has(t) ? ' checked' : ''}><span${t === VAZIAS ? ' class="tbm-vazias"' : ''}>${esc(t)}</span><small>${qtd.get(t) || 0}</small></label>`).join('')}</div>
                <div class="tbm-f"><button type="button" class="tbm-bt" data-m="limpar">Limpar</button><span class="tbm-sp"></span><button type="button" class="tbm-pri" data-m="ok">Aplicar</button></div>`;
            document.body.appendChild(el);
            const r = ancora;
            el.style.left = `${Math.max(8, Math.min(window.innerWidth - LARGURA_MENU - 8, r.right - LARGURA_MENU + 14))}px`;
            el.style.top = `${Math.max(8, Math.min(r.bottom + 6, window.innerHeight - el.offsetHeight - 8))}px`;

            const caixas = () => [...el.querySelectorAll('.tbm-l input[data-valor]')];
            const visivel = (i) => i.closest('.tbm-it').style.display !== 'none';
            const sincTudo = () => {
                const l = caixas(), n = l.filter((i) => i.checked).length, t = el.querySelector('[data-tudo]');
                t.checked = n === l.length; t.indeterminate = n > 0 && n < l.length;
            };
            sincTudo();
            const ordenar = (o) => { ordem = o; fecharMenu(); desenhar(); };
            const aplicar = () => {
                const escolhidos = caixas().filter((i) => i.checked).map((i) => i.dataset.valor);
                if (escolhidos.length === todos.length) delete filtros[coluna];
                else filtros[coluna] = { valores: escolhidos };
                fecharMenu(); desenhar();
            };
            el.addEventListener('click', (e) => {
                const m = e.target.closest('[data-m]');
                if (!m) return;
                ({
                    az: () => ordenar({ coluna, direcao: 'asc' }),
                    za: () => ordenar({ coluna, direcao: 'desc' }),
                    limpar: () => { delete filtros[coluna]; if (ordem && ordem.coluna === coluna) ordem = null; fecharMenu(); desenhar(); },
                    ok: aplicar,
                })[m.dataset.m]();
            });
            el.addEventListener('change', (e) => {
                if (e.target.matches('[data-tudo]')) caixas().forEach((i) => { if (visivel(i)) i.checked = e.target.checked; });
                sincTudo();
            });
            el.addEventListener('input', (e) => {
                if (!e.target.matches('.tbm-q')) return;
                const q = norm(e.target.value.trim());
                el.querySelectorAll('.tbm-l .tbm-it').forEach((it) => { it.style.display = norm(it.textContent).includes(q) ? '' : 'none'; });
            });
            el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); aplicar(); } });

            const fora = (e) => !el.contains(e.target) && !e.target.closest('.tb-filtro') && fecharMenu();
            const tecla = (e) => e.key === 'Escape' && fecharMenu();
            document.addEventListener('mousedown', fora);
            document.addEventListener('keydown', tecla);
            rolar.addEventListener('scroll', fecharMenu);
            window.addEventListener('resize', fecharMenu);
            menu = { el, coluna, fora, tecla };
            const b = tabela.querySelector(`.tb-filtro[data-col="${CSS.escape(coluna)}"]`);
            if (b) b.setAttribute('aria-expanded', 'true');
            const q = el.querySelector('.tbm-q');
            if (q) q.focus();
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
