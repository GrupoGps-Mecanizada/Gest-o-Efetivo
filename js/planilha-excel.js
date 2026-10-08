'use strict';

/**
 * SGE — Planilha estilo Excel com várias abas (Univer, código aberto Apache-2.0)
 * Mesma planilha da Matriz do SST, em JS puro: seleciona células, linhas e colunas; filtro no cabeçalho;
 * Ctrl+F pesquisa; troca de abas; Ctrl+C cola no Excel formatado.
 * NADA aqui altera os dados: digitar, colar, apagar ou substituir numa célula não vale (a célula volta).
 * Para mudar um dado: dois cliques no nome (a tela decide o que abre) ou a seleção + botões da tela.
 *
 * Cada aba: { id, nome, titulo?, estiloTitulo?, semFiltro?, cabecalho: 'geral'|'equipe', colunas, linhas, chave(l) }.
 * Coluna: { id, rotulo, largura, centro?, valor(l), pessoa?(l), estilo?(l) } — pessoa = id do colaborador da
 * célula; estilo = ajuste do visual só daquela linha (ex.: cabeçalho de uma segunda tabela no resumo).
 * Uma coluna escondida no fim guarda a chave de cada linha: assim a linha é reconhecida mesmo depois de
 * filtrar ou classificar.
 *
 * O pacote do Univer (vendor/univer) é o mesmo 1.0.3 do SST, empacotado com scripts/univer-entrada.js.
 */
window.SGE = window.SGE || {};

SGE.planilha = (() => {
    const TEXTO = 1;
    const NUMERO = 2;
    const ESQUERDA = 1;
    const CENTRO = 2;
    const DUPLO_CLIQUE = 3;
    const FINA = 1;
    const MEDIA = 8;
    const VERSAO = '1.0.3';
    /** linhas vazias depois dos dados (como no Excel) */
    const FOLGA = 20;

    /* ─── Formato da planilha "EFETIVOS MECANIZADA" (tema do arquivo original) ─── */
    const FONTE = 'Century Gothic';
    const AZUL_EQUIPE = '#253356'; // accent1 escurecido 50% (título e cabeçalho das equipes)
    const AZUL_GERAL = '#242852'; // dk2 (cabeçalho da aba GERAL)
    const LINHA_TABELA = '#4A66AC'; // accent1 (bordas do estilo de tabela "Claro 9")
    const COR_ABA = '#0070C0'; // cor das abas na planilha original
    const borda = (rgb, s = FINA) => ({ t: { s, cl: { rgb } }, b: { s, cl: { rgb } }, l: { s, cl: { rgb } }, r: { s, cl: { rgb } } });
    const ESTILO = {
        titulo: { ff: 'Arial', fs: 11, bl: 1, bg: { rgb: AZUL_EQUIPE }, cl: { rgb: '#F2F2F2' }, ht: CENTRO, vt: CENTRO, bd: borda('#000000', MEDIA) },
        cabEquipe: { ff: FONTE, fs: 11, bl: 1, bg: { rgb: AZUL_EQUIPE }, cl: { rgb: '#FFFFFF' }, ht: CENTRO, vt: CENTRO, bd: borda(LINHA_TABELA) },
        cabGeral: { ff: FONTE, fs: 11, bl: 1, bg: { rgb: AZUL_GERAL }, cl: { rgb: '#FFFFFF' }, ht: ESQUERDA, vt: CENTRO },
        dadoEquipe: { ff: FONTE, fs: 11, ht: ESQUERDA, vt: CENTRO, bd: borda(LINHA_TABELA) },
        dadoGeral: { ff: FONTE, fs: 11, ht: ESQUERDA, vt: CENTRO },
    };

    const bruto = (v) => (v == null || (typeof v === 'string' && v.trim() === '') ? null : String(v).trim());
    const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    /* ─── Carregar o pacote (uma vez só) ─── */
    let pacote = null;
    function carregar() {
        if (window.SGEUniver) return Promise.resolve(window.SGEUniver);
        pacote ??= new Promise((ok, falha) => {
            if (!document.querySelector('link[data-univer]')) {
                const css = document.createElement('link');
                css.rel = 'stylesheet';
                css.href = `vendor/univer/univer.css?v=${VERSAO}`;
                css.dataset.univer = '';
                document.head.appendChild(css);
            }
            const s = document.createElement('script');
            s.src = `vendor/univer/univer.js?v=${VERSAO}`;
            s.async = true;
            s.onload = () => (window.SGEUniver ? ok(window.SGEUniver) : falha(new Error('Univer não carregou')));
            s.onerror = () => {
                pacote = null; // falhou (rede): tenta de novo na próxima
                s.remove();
                falha(new Error('Sem internet para abrir a planilha.'));
            };
            document.head.appendChild(s);
        });
        return pacote;
    }

    /** Baixa a planilha quando o navegador estiver ocioso (só no computador e sem economia de dados). */
    function precarregar() {
        const economia = navigator.connection && navigator.connection.saveData;
        if (economia || window.matchMedia('(max-width: 767px)').matches) return;
        const quando = window.requestIdleCallback || ((f) => setTimeout(f, 1500));
        setTimeout(() => quando(() => carregar().catch(() => {})), 3000);
    }

    /* ─── Exportar / imprimir "como está" (port de planilha-visivel do SST, agora com abas e mesclas) ─── */
    function hex(cor) {
        if (!cor) return null;
        const c = String(cor).trim();
        const m = /^#?([0-9a-f]{6})$/i.exec(c) || /^#?([0-9a-f]{3})$/i.exec(c);
        if (m) return (m[1].length === 3 ? m[1].replace(/./g, (x) => x + x) : m[1]).toUpperCase();
        const r = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(c);
        return r ? [r[1], r[2], r[3]].map((x) => Number(x).toString(16).padStart(2, '0')).join('').toUpperCase() : null;
    }
    const estiloBorda = (s) => (s === 13 ? 'thick' : s && s >= 8 && s <= 12 ? 'medium' : s === 7 ? 'double' : s === 3 ? 'dotted' : s === 4 ? 'dashed' : 'thin');
    const HORIZ = { 1: 'left', 2: 'center', 3: 'right' };
    const VERT = { 1: 'top', 2: 'middle', 3: 'bottom' };

    function marcaDagua() {
        const u = SGE.auth && SGE.auth.currentUser;
        const quem = u ? u.nome || u.usuario || u.email || 'usuário' : 'usuário';
        const agora = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }).format(new Date());
        return `SGE · Gestão de Efetivo · Exportado por ${quem} em ${agora} · USO INTERNO · Contém dados pessoais (LGPD): não compartilhar fora da finalidade`;
    }

    let excelJs = null;
    function carregarExcelJs() {
        if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
        excelJs ??= new Promise((ok, falha) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
            s.onload = () => ok(window.ExcelJS);
            s.onerror = () => {
                excelJs = null;
                falha(new Error('Sem internet para gerar o Excel.'));
            };
            document.head.appendChild(s);
        });
        return excelJs;
    }

    /** Arquivo .xlsx com todas as abas como estão (filtros aplicados, cores, mesclas e larguras). */
    async function arquivoExcel(retratos) {
        const Excel = await carregarExcelJs();
        const wb = new Excel.Workbook();
        wb.creator = 'SGE';
        const marca = marcaDagua().replace(/&/g, '&&');
        for (const r of retratos) {
            const ws = wb.addWorksheet(r.nome.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31));
            ws.properties.tabColor = { argb: `FF${COR_ABA.slice(1)}` };
            ws.headerFooter.oddHeader = `&L&8${marca}`;
            ws.headerFooter.oddFooter = '&R&8Página &P de &N';
            ws.pageSetup = { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: `1:${r.cabecalho + 1}` };
            r.larguras.forEach((px, i) => (ws.getColumn(i + 1).width = Math.max(4, Math.round((px / 7) * 10) / 10)));
            r.linhas.forEach((linha, ri) => {
                const row = ws.getRow(ri + 1);
                row.height = Math.round(linha.altura * 0.75);
                linha.celulas.forEach((c, ci) => {
                    const cell = row.getCell(ci + 1);
                    const s = c.s;
                    if (c.v != null && c.v !== '') cell.value = c.v;
                    const bg = hex(s.bg && s.bg.rgb);
                    if (bg) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bg}` } };
                    const cor = hex(s.cl && s.cl.rgb);
                    cell.font = {
                        name: s.ff || FONTE,
                        size: s.fs || 11,
                        bold: s.bl === 1,
                        italic: s.it === 1,
                        underline: !!(s.ul && s.ul.s),
                        strike: !!(s.st && s.st.s),
                        ...(cor ? { color: { argb: `FF${cor}` } } : {}),
                    };
                    cell.alignment = { horizontal: s.ht ? HORIZ[s.ht] : undefined, vertical: s.vt ? VERT[s.vt] : 'middle', wrapText: s.tb === 3 };
                    if (s.bd) {
                        const lado = (b) => (b && b.s ? { style: estiloBorda(b.s), color: { argb: `FF${hex(b.cl && b.cl.rgb) || 'BFBFBF'}` } } : undefined);
                        cell.border = { top: lado(s.bd.t), bottom: lado(s.bd.b), left: lado(s.bd.l), right: lado(s.bd.r) };
                    }
                });
            });
            for (const m of r.mesclas) ws.mergeCells(m.r1 + 1, m.c1 + 1, m.r2 + 1, m.c2 + 1);
            ws.views = [{ state: 'frozen', xSplit: 0, ySplit: r.cabecalho + 1 }];
            if (r.filtro && r.linhas.length > r.cabecalho + 1) ws.autoFilter = { from: { row: r.cabecalho + 1, column: 1 }, to: { row: r.linhas.length, column: r.larguras.length } };
        }
        return wb.xlsx.writeBuffer();
    }

    function baixar(conteudo, nome) {
        const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = nome;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }

    function css(s) {
        const p = [];
        const bg = hex(s.bg && s.bg.rgb);
        if (bg) p.push(`background:#${bg}`);
        const cor = hex(s.cl && s.cl.rgb);
        if (cor) p.push(`color:#${cor}`);
        if (s.bl === 1) p.push('font-weight:700');
        if (s.it === 1) p.push('font-style:italic');
        const deco = [s.ul && s.ul.s && 'underline', s.st && s.st.s && 'line-through'].filter(Boolean).join(' ');
        if (deco) p.push(`text-decoration:${deco}`);
        if (s.fs) p.push(`font-size:${Number(s.fs)}pt`);
        // só letras, números, espaço, vírgula e hífen: nada que feche o atributo ou injete código na impressão
        if (s.ff) p.push(`font-family:${String(s.ff).replace(/[^\p{L}\p{N} ,-]/gu, '')}`);
        if (s.ht) p.push(`text-align:${HORIZ[s.ht] || 'left'}`);
        if (s.vt) p.push(`vertical-align:${VERT[s.vt] || 'middle'}`);
        p.push(s.tb === 3 ? 'white-space:normal' : 'white-space:nowrap');
        for (const [lado, nome] of [['t', 'top'], ['b', 'bottom'], ['l', 'left'], ['r', 'right']]) {
            const b = s.bd && s.bd[lado];
            if (b && b.s) p.push(`border-${nome}:${b.s >= 8 ? 2 : 1}px solid #${hex(b.cl && b.cl.rgb) || 'BFBFBF'}`);
        }
        return p.join(';');
    }

    /** Página pronta para imprimir a aba aberta (paisagem, cabeçalho repetido, mesclas do título). */
    function htmlImpressao(r) {
        const largura = r.larguras.reduce((a, b) => a + b, 0);
        const zoom = Math.min(1, 1060 / Math.max(1, largura)); // largura útil de uma A4 em paisagem
        const ocupadas = new Set();
        const inicio = new Map();
        for (const m of r.mesclas) {
            inicio.set(`${m.r1}:${m.c1}`, m);
            for (let a = m.r1; a <= m.r2; a++) for (let b = m.c1; b <= m.c2; b++) if (a !== m.r1 || b !== m.c1) ocupadas.add(`${a}:${b}`);
        }
        const tr = (l, ri, tag) =>
            `<tr style="height:${l.altura}px">${l.celulas
                .map((c, ci) => {
                    if (ocupadas.has(`${ri}:${ci}`)) return '';
                    const m = inicio.get(`${ri}:${ci}`);
                    const span = m ? ` rowspan="${m.r2 - m.r1 + 1}" colspan="${m.c2 - m.c1 + 1}"` : '';
                    return `<${tag}${span} style="${css(c.s)}">${esc(c.v == null ? '' : c.v)}</${tag}>`;
                })
                .join('')}</tr>`;
        const cab = r.linhas.slice(0, r.cabecalho + 1);
        const corpo = r.linhas.slice(r.cabecalho + 1);
        const filtro = r.visiveis < r.total ? `filtrado: ${r.visiveis} de ${r.total} linhas` : `${r.total} linhas`;
        return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(r.nome)}</title><style>
@page { size: A4 landscape; margin: 8mm; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
body { margin: 0; font-family: '${FONTE}', Arial, sans-serif; font-size: 10pt; color: #111; }
.topo { display: flex; justify-content: space-between; font-size: 8pt; color: #555; margin-bottom: 4px; }
table { border-collapse: collapse; table-layout: fixed; zoom: ${zoom.toFixed(3)}; }
th, td { padding: 1px 4px; overflow: hidden; text-overflow: ellipsis; font-weight: normal; }
thead { display: table-header-group; }
tr { page-break-inside: avoid; }
</style></head><body>
<div class="topo"><b>${esc(r.nome)} · ${new Date().toLocaleDateString('pt-BR')} · ${filtro}</b><span>${esc(marcaDagua())}</span></div>
<table><colgroup>${r.larguras.map((w) => `<col style="width:${w}px">`).join('')}</colgroup>
<thead>${cab.map((l, i) => tr(l, i, 'th')).join('')}</thead><tbody>${corpo.map((l, i) => tr(l, i + cab.length, 'td')).join('')}</tbody></table>
</body></html>`;
    }

    /** Imprime uma página HTML sem abrir outra janela (iframe escondido). */
    function imprimirHtml(html) {
        const f = document.createElement('iframe');
        f.setAttribute('aria-hidden', 'true');
        Object.assign(f.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
        document.body.appendChild(f);
        const d = f.contentDocument;
        d.open();
        d.write(html);
        d.close();
        setTimeout(() => {
            f.contentWindow.focus();
            f.contentWindow.print();
            setTimeout(() => f.remove(), 60000);
        }, 250);
    }

    const ICONE_EXCEL = '<svg viewBox="0 0 24 24" class="pl-ico pl-ico--excel" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11m0 0-4-4m4 4 4-4M4 19h16"/></svg>';
    const ICONE_IMPRIMIR = '<svg viewBox="0 0 24 24" class="pl-ico" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M7 14h10v7H7z"/></svg>';
    const ICONE_RESETAR = '<svg viewBox="0 0 24 24" class="pl-ico" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/></svg>';

    /**
     * Nitidez: com o Windows ampliado (125%, 150%) a área de desenho pode cair numa fração de pixel da tela
     * (ex.: 178,75) e o navegador borra para encaixar. Aqui cada desenho é deslocado (menos de 1 pixel) para
     * começar num pixel exato da tela. Roda de novo quando a tela muda de tamanho ou de zoom.
     */
    function manterNitido(area) {
        let pedido = 0;
        const alinhar = () => {
            pedido = 0;
            const dpr = window.devicePixelRatio || 1;
            area.querySelectorAll('canvas').forEach((cv) => {
                cv.style.translate = '';
                const r = cv.getBoundingClientRect();
                if (!r.width) return;
                const dx = (Math.round(r.left * dpr) - r.left * dpr) / dpr;
                const dy = (Math.round(r.top * dpr) - r.top * dpr) / dpr;
                if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) cv.style.translate = `${dx.toFixed(3)}px ${dy.toFixed(3)}px`;
            });
        };
        const agendar = () => {
            if (!pedido) pedido = requestAnimationFrame(() => requestAnimationFrame(alinhar));
        };
        const tamanho = new ResizeObserver(agendar);
        tamanho.observe(area);
        // o Univer troca/redimensiona os desenhos sozinho: alinha de novo quando isso acontece
        const mudancas = new MutationObserver(agendar);
        mudancas.observe(area, { childList: true, subtree: true, attributes: true, attributeFilter: ['width', 'height'] });
        let zoom = null;
        const vigiarZoom = () => {
            if (zoom) zoom.removeEventListener('change', aoMudarZoom);
            zoom = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
            zoom.addEventListener('change', aoMudarZoom);
        };
        const aoMudarZoom = () => {
            vigiarZoom();
            agendar();
        };
        vigiarZoom();
        window.addEventListener('resize', agendar);
        agendar();
        return () => {
            tamanho.disconnect();
            mudancas.disconnect();
            if (zoom) zoom.removeEventListener('change', aoMudarZoom);
            window.removeEventListener('resize', agendar);
        };
    }

    /* ─── Montagem de cada aba ─── */
    const cabecalhoDe = (aba) => (aba.titulo ? 2 : 0); // linha do cabeçalho (título ocupa as linhas 0 e 1)
    const chaveDe = (aba, l) => String(aba.chave(l));
    const estiloDado = (aba, col) => {
        const base = aba.cabecalho === 'equipe' ? ESTILO.dadoEquipe : ESTILO.dadoGeral;
        return col.centro ? { ...base, ht: CENTRO } : base;
    };
    const celula = (aba, col, l) => {
        const extra = col.estilo ? col.estilo(l) : null;
        const s = extra ? { ...estiloDado(aba, col), ...extra } : estiloDado(aba, col);
        const valor = col.valor(l);
        if (typeof valor === 'number') return { v: valor, t: NUMERO, s }; // contagens entram como número
        const v = bruto(valor);
        return v == null ? { v: null, s } : { v, t: TEXTO, s };
    };
    /** valor certo das células fixas (título e cabeçalho) */
    function fixa(aba, r, c) {
        const cab = cabecalhoDe(aba);
        const colId = aba.colunas.length;
        if (aba.titulo && r < cab) return r === 0 && c === 0 ? aba.titulo : null;
        if (r === cab) return c === colId ? 'CHAVE' : aba.colunas[c] ? aba.colunas[c].rotulo : null;
        return undefined; // não é célula fixa
    }

    /**
     * Cria a planilha dentro de `caixa`.
     * opcoes: { nomeArquivo, abas, abaInicial, aoAbrir(pessoaId), aoSelecionar(pessoaIds), ferramentas(el), dica }
     * Devolve { atualizar(abas), irPara(idDaAba), exportar(), imprimir(), tema(escuro), destruir() }.
     */
    function criar(caixa, opcoes) {
        const props = { dica: 'dois cliques num nome abrem o colaborador', nomeArquivo: 'planilha', ...opcoes };
        let ativo = true;
        let pronto = false;
        let univerInst = null;
        let api = null;
        let retratar = null;
        let resetar = null;
        let aplicar = null;
        let pendente = null;
        let observador = null;
        let pararNitidez = null;
        let abrirAba = null;
        let abaPedida = props.abaInicial || null;

        caixa.classList.add('pl');
        caixa.innerHTML = '<div class="pl-area"></div><div class="pl-abrindo">Abrindo planilha…</div>';
        const area = caixa.querySelector('.pl-area');
        const abrindo = caixa.querySelector('.pl-abrindo');

        // botões da tela no começo da barra da planilha (antes do "desfazer")
        const barra = document.createElement('div');
        barra.className = 'planilha-barra-extra';
        const lugarFerramentas = document.createElement('span');
        lugarFerramentas.className = 'pl-ferramentas';
        const botao = (cls, titulo, html) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = cls;
            b.title = titulo;
            b.innerHTML = html;
            return b;
        };
        const btnExcel = botao('pl-btn', 'Exportar para o Excel como está na tela: todas as abas, filtradas (só o que aparece) ou completas, com o mesmo formato', `${ICONE_EXCEL}<span>Excel</span>`);
        const btnImprimir = botao('pl-btn', 'Imprimir a aba aberta como está na tela (folha em paisagem)', `${ICONE_IMPRIMIR}<span>Imprimir</span>`);
        const btnResetar = botao('pl-btn pl-btn--resetar', 'Voltar a planilha ao original: tira filtros, pesquisa, cores, seleção e rolagem (os dados não mudam)', `${ICONE_RESETAR}<span>Resetar</span>`);
        btnResetar.hidden = true;
        barra.append(lugarFerramentas, btnExcel, btnImprimir, btnResetar);
        if (props.ferramentas) props.ferramentas(lugarFerramentas);
        const setAlterada = (sim) => (btnResetar.hidden = !sim);

        async function exportar() {
            const rs = retratar && retratar();
            if (!rs || !rs.length) return;
            btnExcel.disabled = true;
            btnExcel.querySelector('span').textContent = 'Gerando…';
            try {
                const filtrada = rs.some((r) => r.visiveis < r.total);
                const hoje = new Date().toISOString().slice(0, 10);
                baixar(await arquivoExcel(rs), `${props.nomeArquivo}-${hoje}${filtrada ? '-filtrada' : ''}.xlsx`);
                SGE.helpers.toast(`Exportada${filtrada ? ' filtrada' : ''}: ${rs.length} abas.`, 'success');
            } catch (e) {
                console.error('[SGE Planilha] exportar', e);
                SGE.helpers.toast(e.message || 'Não foi possível gerar o Excel.', 'error');
            } finally {
                btnExcel.disabled = false;
                btnExcel.querySelector('span').textContent = 'Excel';
            }
        }
        function imprimir() {
            const rs = retratar && retratar(true);
            if (rs && rs[0]) imprimirHtml(htmlImpressao(rs[0]));
        }
        btnExcel.addEventListener('click', exportar);
        btnImprimir.addEventListener('click', imprimir);
        btnResetar.addEventListener('click', () => resetar && resetar());

        (async () => {
            try {
                const U = await carregar();
                if (!ativo) return;
                const criado = U.createUniver({
                    locale: U.LocaleType.PT_BR,
                    locales: { [U.LocaleType.PT_BR]: U.mergeLocales(...U.locais.map((x) => x.default || x)) },
                    darkMode: !!(SGE.darkMode && SGE.darkMode.isDark()),
                    presets: [
                        // abas (Início, Fórmulas…) na mesma linha dos botões de desfazer/refazer
                        U.UniverSheetsCorePreset({ container: area, ribbonType: 'simple' }),
                        U.UniverSheetsFilterPreset(),
                        U.UniverSheetsFindReplacePreset(),
                    ],
                });
                univerInst = criado.univer;
                api = criado.univerAPI;

                // estado vivo de cada aba (lido pelos eventos do Univer, que são registrados uma vez)
                let vivo = new Map();
                let estrutura = '';
                let unidade = null;
                let versao = 0;
                let selecao = null;
                let comandos = null;
                let interno = false;
                let quietoAte = 0;
                const pasta = () => api.getActiveWorkbook();
                const folhaAtiva = () => pasta() && pasta().getActiveSheet();
                const folhaPorId = (id) => pasta() && pasta().getSheetBySheetId(id);
                const chaveDaLinha = (ws, info, r) => {
                    const v = ws.getRange(r, info.aba.colunas.length).getRawValue();
                    return v == null || v === '' ? '' : String(v);
                };
                const filtradas = (ws) => {
                    try {
                        return new Set((ws.getFilter() && ws.getFilter().getFilteredOutRows()) || []);
                    } catch (e) {
                        return new Set();
                    }
                };
                const assinatura = (abas) =>
                    abas.map((a) => `${a.id}~${a.nome}~${a.titulo || ''}~${a.colunas.map((c) => `${c.id}:${c.largura}`).join(',')}~${a.linhas.map((l) => chaveDe(a, l)).join(',')}`).join('|');

                const aoMudarSelecao = (selections) => {
                    const ws = folhaAtiva();
                    const info = ws && vivo.get(ws.getSheetId());
                    if (!info || !props.aoSelecionar) return;
                    const escondidas = filtradas(ws);
                    const ids = new Set();
                    for (const f of selections) {
                        const fim = Math.min(f.endRow, info.totalLinhas - 1);
                        const c0 = Math.max(0, f.startColumn);
                        const c1 = Math.min(f.endColumn, info.aba.colunas.length - 1);
                        for (let r = Math.max(f.startRow, info.cab + 1); r <= fim; r++) {
                            if (escondidas.has(r)) continue;
                            const l = info.mapa.get(chaveDaLinha(ws, info, r));
                            if (!l) continue;
                            for (let c = c0; c <= c1; c++) {
                                const col = info.aba.colunas[c];
                                const p = col && col.pessoa ? col.pessoa(l) : null;
                                if (p != null && p !== '') ids.add(p);
                            }
                        }
                    }
                    props.aoSelecionar([...ids]);
                };

                /** dados de uma aba no formato do Univer */
                function folhaDe(aba) {
                    const cab = cabecalhoDe(aba);
                    const colId = aba.colunas.length;
                    const cellData = {};
                    const mergeData = [];
                    if (aba.titulo) {
                        const st = aba.estiloTitulo ? { ...ESTILO.titulo, ...aba.estiloTitulo } : ESTILO.titulo;
                        cellData[0] = { 0: { v: aba.titulo, t: TEXTO, s: st } };
                        cellData[1] = {};
                        for (let c = 1; c < colId; c++) cellData[0][c] = { s: st };
                        for (let c = 0; c < colId; c++) cellData[1][c] = { s: st };
                        mergeData.push({ startRow: 0, endRow: 1, startColumn: 0, endColumn: colId - 1 });
                    }
                    const estiloCab = aba.cabecalho === 'equipe' ? ESTILO.cabEquipe : ESTILO.cabGeral;
                    cellData[cab] = {};
                    aba.colunas.forEach((c, i) => (cellData[cab][i] = { v: c.rotulo, t: TEXTO, s: estiloCab }));
                    cellData[cab][colId] = { v: 'CHAVE', t: TEXTO };
                    aba.linhas.forEach((l, i) => {
                        const linha = {};
                        aba.colunas.forEach((c, j) => (linha[j] = celula(aba, c, l)));
                        linha[colId] = { v: chaveDe(aba, l), t: TEXTO };
                        cellData[cab + 1 + i] = linha;
                    });
                    const columnData = {};
                    aba.colunas.forEach((c, i) => (columnData[i] = { w: c.largura }));
                    columnData[colId] = { w: 60, hd: 1 };
                    const rowData = { [cab]: { h: 26 } };
                    if (aba.titulo) {
                        const h = aba.estiloTitulo && aba.estiloTitulo.fs > 14 ? 30 : 20; // título grande (resumo)
                        rowData[0] = { h };
                        rowData[1] = { h };
                    }
                    const totalLinhas = cab + 1 + aba.linhas.length + FOLGA;
                    return {
                        totalLinhas,
                        dados: {
                            id: aba.id,
                            name: aba.nome,
                            rowCount: totalLinhas,
                            columnCount: colId + 1,
                            cellData,
                            columnData,
                            rowData,
                            mergeData,
                            defaultRowHeight: 22,
                            tabColor: COR_ABA,
                            freeze: { xSplit: 0, ySplit: cab + 1, startRow: cab + 1, startColumn: 0 },
                        },
                    };
                }

                /** cria (ou troca) a pasta de trabalho com estas abas */
                const montar = (abas, manterLugar = true) => {
                    let abaAtiva = null;
                    let rolagem = null;
                    try {
                        const ws = folhaAtiva();
                        if (ws) {
                            abaAtiva = ws.getSheetId();
                            const s = ws.getScrollState && ws.getScrollState();
                            if (s) rolagem = { r: s.sheetViewStartRow, c: s.sheetViewStartColumn };
                        }
                    } catch (e) { /* primeira montagem */ }
                    if (selecao) selecao.dispose();
                    if (comandos) comandos.dispose();
                    quietoAte = Date.now() + 1200;
                    setAlterada(false);
                    const sheets = {};
                    const novo = new Map();
                    for (const aba of abas) {
                        const f = folhaDe(aba);
                        sheets[aba.id] = f.dados;
                        novo.set(aba.id, { aba, cab: cabecalhoDe(aba), totalLinhas: f.totalLinhas, mapa: new Map(aba.linhas.map((l) => [chaveDe(aba, l), l])) });
                    }
                    vivo = novo;
                    estrutura = assinatura(abas);
                    const antiga = unidade;
                    unidade = `planilha-${++versao}`;
                    api.createWorkbook({ id: unidade, name: props.nomeArquivo, sheetOrder: abas.map((a) => a.id), sheets });
                    if (antiga) api.disposeUnit(antiga);
                    const wb = pasta();
                    // filtro no cabeçalho de cada aba (como no Excel)
                    for (const [id, info] of vivo) {
                        try {
                            const ws = folhaPorId(id);
                            if (ws && info.aba.linhas.length && !info.aba.semFiltro) ws.getRange(info.cab, 0, info.aba.linhas.length + 1, info.aba.colunas.length).createFilter();
                        } catch (e) { /* aba sem filtro */ }
                    }
                    if (manterLugar && abaAtiva && vivo.has(abaAtiva)) {
                        try {
                            const ws = folhaPorId(abaAtiva);
                            wb.setActiveSheet(ws);
                            if (rolagem && (rolagem.r > 1 || rolagem.c > 1) && ws.scrollToCell) ws.scrollToCell(rolagem.r, rolagem.c);
                        } catch (e) { /* fica na primeira aba */ }
                    }
                    selecao = wb ? wb.onSelectionChange((s) => aoMudarSelecao(s)) : null;
                    comandos = wb
                        ? wb.onCommandExecuted((c) => {
                              // "cell-edit" é interno do editor; trocar de aba e rolar não contam como "mexeu"
                              if (interno || Date.now() < quietoAte || /cell-edit|worksheet-activ|scroll|selection/.test(c.id)) return;
                              setAlterada(true);
                          })
                        : null;
                    if (props.aoSelecionar) props.aoSelecionar([]);
                };

                /** mesma estrutura: reescreve só as células cujo valor mudou */
                const atualizarCelulas = (abas) => {
                    interno = true;
                    try {
                        for (const aba of abas) {
                            const info = vivo.get(aba.id);
                            const ws = folhaPorId(aba.id);
                            if (!info || !ws) continue;
                            const linhaDe = new Map();
                            for (let r = info.cab + 1; r < info.totalLinhas; r++) {
                                const k = chaveDaLinha(ws, info, r);
                                if (k) linhaDe.set(k, r);
                            }
                            const antiga = info.aba;
                            info.aba = aba;
                            for (const l of aba.linhas) {
                                const k = chaveDe(aba, l);
                                const r = linhaDe.get(k);
                                const antes = info.mapa.get(k);
                                info.mapa.set(k, l);
                                if (!r || !antes) continue;
                                aba.colunas.forEach((c, i) => {
                                    const a = antiga.colunas[i] ? bruto(antiga.colunas[i].valor(antes)) : null;
                                    const b = bruto(c.valor(l));
                                    if (a !== b) ws.getRange(r, i).setValue(celula(aba, c, l));
                                });
                            }
                        }
                    } finally {
                        interno = false;
                    }
                };

                aplicar = (abas) => (assinatura(abas) !== estrutura ? montar(abas) : atualizarCelulas(abas));

                let ultimoAviso = 0;
                const avisarSoLeitura = () => {
                    if (Date.now() - ultimoAviso < 4000) return;
                    ultimoAviso = Date.now();
                    SGE.helpers.toast(`A planilha é só para ver e pesquisar: nada aqui muda os dados (${props.dica}).`, 'info');
                };
                const folhaDoEvento = (p) => (p.worksheet && p.worksheet.getSheetId ? p.worksheet : folhaAtiva());

                // edição de célula nunca abre; dois cliques num nome abrem o colaborador
                api.addEvent(api.Event.BeforeSheetEditStart, (p) => {
                    p.cancel = true;
                    const ws = folhaDoEvento(p);
                    const info = ws && vivo.get(ws.getSheetId());
                    if (!info || p.row <= info.cab) return;
                    const l = info.mapa.get(chaveDaLinha(ws, info, p.row));
                    const col = info.aba.colunas[p.column];
                    const pessoa = l && col && col.pessoa ? col.pessoa(l) : null;
                    if (p.eventType === DUPLO_CLIQUE && pessoa != null && pessoa !== '' && props.aoAbrir) props.aoAbrir(pessoa);
                    else if (p.eventType !== DUPLO_CLIQUE || !l) avisarSoLeitura();
                });

                // colou, apagou, recortou, substituiu, arrastou: o valor volta ao que é no sistema
                let corrigindo = false;
                api.addEvent(api.Event.SheetValueChanged, (p) => {
                    if (corrigindo) return;
                    const ws = folhaDoEvento(p);
                    const info = ws && vivo.get(ws.getSheetId());
                    if (!info) return;
                    corrigindo = true;
                    interno = true;
                    try {
                        const { aba, cab, totalLinhas } = info;
                        const colId = aba.colunas.length;
                        let voltou = false;
                        for (const f of p.effectedRanges) {
                            const r0 = f.getRow();
                            const c0 = f.getColumn();
                            const r1 = Math.min(r0 + f.getHeight(), totalLinhas);
                            const c1 = Math.min(c0 + f.getWidth(), colId + 1);
                            for (let r = r0; r < r1; r++) {
                                for (let c = c0; c < c1; c++) {
                                    const atualCel = ws.getRange(r, c);
                                    const atual = bruto(atualCel.getRawValue());
                                    const certoFixo = fixa(aba, r, c);
                                    if (certoFixo !== undefined) {
                                        if (atual !== bruto(certoFixo)) {
                                            atualCel.setValue({ v: certoFixo, t: TEXTO });
                                            voltou = true;
                                        }
                                        continue;
                                    }
                                    if (c === colId) continue;
                                    const l = info.mapa.get(chaveDaLinha(ws, info, r));
                                    const esperado = l && aba.colunas[c] ? bruto(aba.colunas[c].valor(l)) : null;
                                    if (atual !== esperado) {
                                        atualCel.setValue(l && aba.colunas[c] ? celula(aba, aba.colunas[c], l) : { v: '' });
                                        voltou = true;
                                    }
                                }
                            }
                        }
                        if (voltou) avisarSoLeitura();
                    } finally {
                        corrigindo = false;
                        interno = false;
                    }
                });

                montar(props.abas, false);
                // mostra a aba pedida (ex.: GERAL) em vez da primeira
                abrirAba = (id) => {
                    try {
                        const ws = id && folhaPorId(id);
                        if (ws) pasta().setActiveSheet(ws);
                    } catch (e) { /* aba não existe: fica onde está */ }
                };
                abrirAba(abaPedida);
                abaPedida = null;

                // retrato das abas como estão: o que o filtro deixou, colunas visíveis, larguras, estilos e mesclas
                retratar = (soAtiva = false) => {
                    const wb = pasta();
                    if (!wb) return null;
                    const foto = wb.save();
                    const estilo = (s) => (typeof s === 'string' ? (foto.styles && foto.styles[s]) || {} : s || {});
                    const ids = soAtiva ? [folhaAtiva().getSheetId()] : foto.sheetOrder || [...vivo.keys()];
                    return ids
                        .filter((id) => vivo.has(id) && foto.sheets[id])
                        .map((id) => {
                            const info = vivo.get(id);
                            const fs = foto.sheets[id];
                            const ws = folhaPorId(id);
                            const cel = fs.cellData || {};
                            const lin = fs.rowData || {};
                            const col = fs.columnData || {};
                            const escondidas = ws ? filtradas(ws) : new Set();
                            let ultima = info.cab;
                            for (const r of Object.keys(cel).map(Number)) {
                                if (Object.entries(cel[r] || {}).some(([c, x]) => Number(c) < info.aba.colunas.length && x && x.v != null && x.v !== '')) ultima = Math.max(ultima, r);
                            }
                            const linhas = [];
                            for (let r = 0; r <= ultima; r++) if (!escondidas.has(r) && !(lin[r] && lin[r].hd)) linhas.push(r);
                            const visCols = [];
                            for (let c = 0; c < info.aba.colunas.length; c++) if (!(col[c] && col[c].hd)) visCols.push(c);
                            const posLinha = new Map(linhas.map((r, i) => [r, i]));
                            const posCol = new Map(visCols.map((c, i) => [c, i]));
                            const mesclas = (fs.mergeData || [])
                                .filter((m) => posLinha.has(m.startRow) && posLinha.has(m.endRow) && posCol.has(m.startColumn) && posCol.has(m.endColumn))
                                .map((m) => ({ r1: posLinha.get(m.startRow), r2: posLinha.get(m.endRow), c1: posCol.get(m.startColumn), c2: posCol.get(m.endColumn) }));
                            return {
                                nome: fs.name || info.aba.nome,
                                cabecalho: info.cab,
                                filtro: !info.aba.semFiltro,
                                larguras: visCols.map((c) => (col[c] && col[c].w) || 88),
                                mesclas,
                                linhas: linhas.map((r) => ({
                                    altura: (lin[r] && lin[r].h) || 22,
                                    celulas: visCols.map((c) => {
                                        const d = cel[r] && cel[r][c];
                                        return { v: d && d.v != null ? d.v : null, s: { ...estilo(col[c] && col[c].s), ...estilo(lin[r] && lin[r].s), ...estilo(d && d.s) } };
                                    }),
                                })),
                                visiveis: linhas.filter((r) => r > info.cab).length,
                                total: info.mapa.size,
                            };
                        });
                };
                // "Resetar": planilha de volta ao original (sem filtros, cores, seleção, pesquisa e rolagem)
                resetar = () => montar([...vivo.values()].map((i) => i.aba), true);

                // espaço para os botões da tela no começo da barra da planilha (antes do "desfazer")
                const acharBarra = () => {
                    if (!ativo) return;
                    const cab = area.querySelector('header[data-u-comp="headerbar"]');
                    if (!cab) return void requestAnimationFrame(acharBarra);
                    cab.prepend(barra);
                    observador = new ResizeObserver(() => (cab.style.paddingLeft = barra.offsetWidth ? `${barra.offsetWidth + 10}px` : ''));
                    observador.observe(barra);
                };
                acharBarra();
                pararNitidez = manterNitido(area);
                pronto = true;
                abrindo.remove();
                if (pendente) {
                    const abas = pendente;
                    pendente = null;
                    aplicar(abas);
                }
            } catch (e) {
                console.error('[SGE Planilha]', e);
                if (!ativo) return;
                caixa.innerHTML = `<p class="pl-erro">${esc(e.message || 'Não foi possível abrir a planilha.')} Recarregue a página (F5).</p>`;
            }
        })();

        return {
            /** abas novas (filtros, dados salvos): sem recriar a planilha quando dá */
            atualizar(abas) {
                props.abas = abas;
                if (pronto && aplicar) aplicar(abas);
                else pendente = abas;
            },
            /** mostra uma aba (pelo id); se a planilha ainda está abrindo, mostra assim que abrir */
            irPara(id) {
                if (pronto && abrirAba) abrirAba(id);
                else abaPedida = id;
            },
            exportar,
            imprimir,
            /** acompanha o tema claro/escuro do sistema */
            tema(escuro) {
                try {
                    if (api && api.toggleDarkMode) api.toggleDarkMode(!!escuro);
                } catch (e) { /* versão sem tema escuro: fica como está */ }
            },
            destruir() {
                ativo = false;
                if (observador) observador.disconnect();
                if (pararNitidez) pararNitidez();
                const u = univerInst;
                setTimeout(() => u && u.dispose(), 0);
                caixa.innerHTML = '';
            },
        };
    }

    return { criar, carregar, precarregar };
})();
