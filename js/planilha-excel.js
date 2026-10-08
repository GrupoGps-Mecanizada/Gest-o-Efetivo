'use strict';

/**
 * SGE — Planilha estilo Excel (Univer, código aberto Apache-2.0)
 * Mesma planilha da Matriz do SST, em JS puro: seleciona células, linhas e colunas; filtro no cabeçalho;
 * Ctrl+F pesquisa; cores, negrito e bordas; Ctrl+C cola no Excel formatado.
 * NADA aqui altera os dados: digitar, colar, apagar ou substituir numa célula não vale (a célula volta).
 * Para mudar um dado: dois cliques na linha (a tela decide o que abre) ou a seleção + botões da tela.
 *
 * Sem "piscar": a planilha é criada UMA vez. Se mudam as linhas ou a ordem das colunas, só a pasta de
 * trabalho é trocada; se mudam só valores, só as células que mudaram são reescritas.
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
    const FINA = 1; // borda fina (como a "Todas as bordas" do Excel)
    const borda = (rgb) => ({ t: { s: FINA, cl: { rgb } }, b: { s: FINA, cl: { rgb } }, l: { s: FINA, cl: { rgb } }, r: { s: FINA, cl: { rgb } } });
    const BORDA = borda('#BFBFBF');
    const CABECALHO = { bd: borda('#8EA9DB'), bg: { rgb: '#1F3864' }, cl: { rgb: '#FFFFFF' }, bl: 1, ht: ESQUERDA, vt: CENTRO, tb: 3, fs: 10 };
    /** linhas vazias depois dos dados (como no Excel) */
    const FOLGA = 30;
    const VERSAO = '1.0.3';

    /* ─── Datas (aaaa-mm-dd ↔ número de série do Excel) ─── */
    const RE_ISO = /^\d{4}-\d{2}-\d{2}$/;
    const DIA_MS = 86400000;
    const paraSerial = (iso) => {
        const [a, m, d] = iso.split('-').map(Number);
        return Math.round(Date.UTC(a, m - 1, d) / DIA_MS) + 25569;
    };
    const deSerial = (n) => new Date(Math.round((n - 25569) * DIA_MS)).toISOString().slice(0, 10);
    const formatarBR = (iso) => (iso ? iso.split('-').reverse().join('/') : '');

    /** Conteúdo da célula como o Univer guarda (datas viram número de série do Excel). */
    function celula(col, l, limparCor = false) {
        const v = col.valor(l);
        const cor = col.cor ? col.cor(l) : undefined;
        const s = { ht: ESQUERDA, bd: BORDA };
        if (cor) s.bg = { rgb: cor };
        else if (limparCor) s.bg = null;
        if (col.tipo === 'data') s.n = { pattern: 'dd/mm/yyyy' };
        if (v == null || v === '') return { v: null, s };
        if (col.tipo === 'data' && typeof v === 'string' && RE_ISO.test(v)) return { v: paraSerial(v), t: NUMERO, s };
        // coluna de número (matrícula) entra como número, como na planilha; zero à esquerda fica texto
        if (typeof v === 'number' || (col.tipo === 'numero' && /^[1-9]\d{0,14}$/.test(v))) return { v: Number(v), t: NUMERO, s };
        return { v: String(v), t: TEXTO, s };
    }
    const bruto = (v) => (v == null || (typeof v === 'string' && v.trim() === '') ? null : typeof v === 'number' ? v : String(v).trim());
    const iguais = (a, b) => (a == null || b == null ? a == b : typeof a === 'number' || typeof b === 'number' ? Number(a) === Number(b) : a === b);

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
                falha(new Error('Sem internet para abrir a planilha'));
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

    /* ─── Exportar / imprimir "como está" (port de planilha-visivel do SST) ─── */
    function hex(cor) {
        if (!cor) return null;
        const c = String(cor).trim();
        const m = /^#?([0-9a-f]{6})$/i.exec(c) || /^#?([0-9a-f]{3})$/i.exec(c);
        if (m) return (m[1].length === 3 ? m[1].replace(/./g, (x) => x + x) : m[1]).toUpperCase();
        const r = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(c);
        return r ? [r[1], r[2], r[3]].map((x) => Number(x).toString(16).padStart(2, '0')).join('').toUpperCase() : null;
    }
    const ehData = (s) => /d/i.test((s.n && s.n.pattern) || '') && /y/i.test((s.n && s.n.pattern) || '');
    const textoCelula = (v, s) => (v == null ? '' : typeof v === 'number' && ehData(s) ? formatarBR(deSerial(v)) : String(v));
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
                falha(new Error('Sem internet para gerar o Excel'));
            };
            document.head.appendChild(s);
        });
        return excelJs;
    }

    async function arquivoExcel(r) {
        const Excel = await carregarExcelJs();
        const wb = new Excel.Workbook();
        wb.creator = 'SGE';
        const ws = wb.addWorksheet(r.nome.slice(0, 31));
        ws.headerFooter.oddHeader = `&L&8${marcaDagua().replace(/&/g, '&&')}`;
        ws.headerFooter.oddFooter = '&R&8Página &P de &N';
        // impressão pelo Excel: paisagem, cabe na largura, cabeçalho repetido em todas as páginas
        ws.pageSetup = { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:1' };
        r.larguras.forEach((px, i) => (ws.getColumn(i + 1).width = Math.max(4, Math.round((px / 7) * 10) / 10)));
        r.linhas.forEach((linha, ri) => {
            const row = ws.getRow(ri + 1);
            row.height = Math.round(linha.altura * 0.75);
            linha.celulas.forEach((c, ci) => {
                const cell = row.getCell(ci + 1);
                const s = c.s;
                if (c.v != null && c.v !== '') {
                    cell.value = c.v;
                    if (typeof c.v === 'number' && ehData(s)) cell.numFmt = 'dd/mm/yyyy';
                }
                const bg = hex(s.bg && s.bg.rgb);
                if (bg) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bg}` } };
                const cor = hex(s.cl && s.cl.rgb);
                cell.font = {
                    name: s.ff || 'Arial',
                    size: s.fs || 10,
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
        ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
        ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, r.linhas.length), column: r.larguras.length } };
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

    const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

    function htmlImpressao(r) {
        const largura = r.larguras.reduce((a, b) => a + b, 0);
        const util = 1060; // largura útil de uma folha A4 em paisagem (px, margens de 8 mm)
        const zoom = Math.min(1, util / Math.max(1, largura));
        const [cab, ...corpo] = r.linhas;
        const tr = (l, tag) => `<tr style="height:${l.altura}px">${l.celulas.map((c) => `<${tag} style="${css(c.s)}">${esc(textoCelula(c.v, c.s))}</${tag}>`).join('')}</tr>`;
        const filtro = r.visiveis < r.total ? `filtrado: ${r.visiveis} de ${r.total} linhas` : `${r.total} linhas`;
        const hoje = new Date().toLocaleDateString('pt-BR');
        return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(r.nome)}</title><style>
@page { size: A4 landscape; margin: 8mm; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
body { margin: 0; font-family: Arial, sans-serif; font-size: 10pt; color: #111; }
.topo { display: flex; justify-content: space-between; font-size: 8pt; color: #555; margin-bottom: 4px; }
table { border-collapse: collapse; table-layout: fixed; zoom: ${zoom.toFixed(3)}; }
th, td { padding: 1px 4px; overflow: hidden; text-overflow: ellipsis; font-weight: normal; }
thead { display: table-header-group; }
tr { page-break-inside: avoid; }
</style></head><body>
<div class="topo"><b>${esc(r.nome)} · ${hoje} · ${filtro}</b><span>${esc(marcaDagua())}</span></div>
<table><colgroup>${r.larguras.map((w) => `<col style="width:${w}px">`).join('')}</colgroup>
<thead>${cab ? tr(cab, 'th') : ''}</thead><tbody>${corpo.map((l) => tr(l, 'td')).join('')}</tbody></table>
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
     * Cria a planilha dentro de `caixa`.
     * opcoes: { nome, linhas, colunas, chave(l), aoAbrir(l, colunaId), aoSelecionar(ls), ferramentas(el), dica }
     * colunas: [{ id, rotulo, largura, tipo?: 'texto'|'data'|'numero', valor(l), cor?(l) }]
     * Devolve { atualizar(linhas, colunas), exportar(), imprimir(), destruir() }.
     */
    function criar(caixa, opcoes) {
        const props = { dica: 'dois cliques numa linha para abrir o colaborador', ...opcoes };
        let ativo = true;
        let pronto = false;
        let univerInst = null;
        let api = null;
        let retratar = null;
        let resetar = null;
        let aplicar = null;
        let pendente = null;
        let observador = null;

        caixa.classList.add('pl');
        caixa.innerHTML = '<div class="pl-area"></div><div class="pl-abrindo">Abrindo planilha…</div>';
        const area = caixa.querySelector('.pl-area');
        const abrindo = caixa.querySelector('.pl-abrindo');

        // botões da tela no começo da barra da planilha (antes do "desfazer")
        const barra = document.createElement('div');
        barra.className = 'planilha-barra-extra';
        const lugarFerramentas = document.createElement('span');
        lugarFerramentas.className = 'pl-ferramentas';
        const btnExcel = document.createElement('button');
        btnExcel.type = 'button';
        btnExcel.className = 'pl-btn';
        btnExcel.title = 'Exportar para o Excel como está na tela: filtrada (só o que aparece) ou completa, com cores e formatação';
        btnExcel.innerHTML = `${ICONE_EXCEL}<span>Excel</span>`;
        const btnImprimir = document.createElement('button');
        btnImprimir.type = 'button';
        btnImprimir.className = 'pl-btn';
        btnImprimir.title = 'Imprimir como está na tela: filtrada ou completa, com cores (folha em paisagem)';
        btnImprimir.innerHTML = `${ICONE_IMPRIMIR}<span>Imprimir</span>`;
        const btnResetar = document.createElement('button');
        btnResetar.type = 'button';
        btnResetar.className = 'pl-btn pl-btn--resetar';
        btnResetar.hidden = true;
        btnResetar.title = 'Voltar a planilha ao original: tira filtros, pesquisa, cores, seleção e rolagem (os dados não mudam)';
        btnResetar.innerHTML = `${ICONE_RESETAR}<span>Resetar</span>`;
        barra.append(lugarFerramentas, btnExcel, btnImprimir, btnResetar);
        if (props.ferramentas) props.ferramentas(lugarFerramentas);

        const setAlterada = (sim) => (btnResetar.hidden = !sim);

        async function exportar() {
            const r = retratar && retratar();
            if (!r) return;
            btnExcel.disabled = true;
            btnExcel.querySelector('span').textContent = 'Gerando…';
            try {
                const filtrada = r.visiveis < r.total;
                const hoje = new Date().toISOString().slice(0, 10);
                baixar(await arquivoExcel(r), `${r.nome.replace(/[^\w.-]+/g, '-').toLowerCase()}-${hoje}${filtrada ? '-filtrada' : ''}.xlsx`);
                SGE.helpers.toast(filtrada ? `Exportada filtrada: ${r.visiveis} de ${r.total} linhas.` : `Exportada completa: ${r.total} linhas.`, 'success');
            } catch (e) {
                console.error('[SGE Planilha] exportar', e);
                SGE.helpers.toast(e.message || 'Não foi possível gerar o Excel.', 'error');
            } finally {
                btnExcel.disabled = false;
                btnExcel.querySelector('span').textContent = 'Excel';
            }
        }
        function imprimir() {
            const r = retratar && retratar();
            if (r) imprimirHtml(htmlImpressao(r));
        }
        btnExcel.addEventListener('click', exportar);
        btnImprimir.addEventListener('click', imprimir);
        btnResetar.addEventListener('click', () => resetar && resetar());

        (async () => {
            try {
                const U = await carregar();
                if (!ativo) return;
                const { createUniver, LocaleType, mergeLocales } = U;
                const criado = createUniver({
                    locale: LocaleType.PT_BR,
                    locales: { [LocaleType.PT_BR]: mergeLocales(...U.locais.map((x) => x.default || x)) },
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

                const vivo = { cols: [], mapa: new Map(), colId: 0, totalLinhas: 0, estrutura: '' };
                let unidade = null;
                let versao = 0;
                let selecao = null;
                let comandos = null;
                // operações do próprio sistema (montar, atualizar, desfazer edição) não contam como "mexeu"
                let interno = false;
                let quietoAte = 0;
                const folha = () => api.getActiveWorkbook() && api.getActiveWorkbook().getActiveSheet();
                // o id fica como texto (no Efetivo é texto; no SST era número): serve para os dois
                const idDaLinha = (r) => {
                    const ws = folha();
                    const v = ws ? ws.getRange(r, vivo.colId).getRawValue() : null;
                    return v == null || v === '' ? '' : String(v);
                };
                const chaveDe = (l) => String(props.chave(l));
                const assinatura = (ls, cs) => `${cs.map((c) => `${c.id}:${c.largura}`).join(',')}|${ls.map(chaveDe).join(',')}`;

                const aoMudarSelecao = (selections) => {
                    const ws = folha();
                    if (!ws || !props.aoSelecionar) return;
                    let escondidas = new Set();
                    try {
                        escondidas = new Set((ws.getFilter() && ws.getFilter().getFilteredOutRows()) || []);
                    } catch (e) { /* sem filtro ativo */ }
                    const ids = new Set();
                    for (const f of selections) {
                        const fim = Math.min(f.endRow, vivo.totalLinhas - 1);
                        for (let r = Math.max(f.startRow, 1); r <= fim; r++) {
                            if (escondidas.has(r)) continue;
                            const id = idDaLinha(r);
                            if (vivo.mapa.has(id)) ids.add(id);
                        }
                    }
                    props.aoSelecionar([...ids].map((x) => vivo.mapa.get(x)));
                };

                /** cria (ou troca) a pasta de trabalho com estas linhas e colunas */
                const montar = (dados, cols, manterRolagem = true) => {
                    const colId = cols.length; // coluna escondida com o id da linha (identifica a linha mesmo com filtro)
                    const cellData = { 0: {} };
                    cols.forEach((c, i) => (cellData[0][i] = { v: c.rotulo.toUpperCase(), t: TEXTO, s: CABECALHO }));
                    cellData[0][colId] = { v: 'ID', t: TEXTO, s: CABECALHO };
                    dados.forEach((l, r) => {
                        const linha = {};
                        cols.forEach((c, i) => (linha[i] = celula(c, l)));
                        linha[colId] = { v: chaveDe(l), t: TEXTO };
                        cellData[r + 1] = linha;
                    });
                    const columnData = {};
                    cols.forEach((c, i) => (columnData[i] = { w: c.largura }));
                    columnData[colId] = { w: 60, hd: 1 };

                    // mantém a rolagem ao trocar a pasta (quem filtrou continua olhando o mesmo lugar)
                    let rolagem = null;
                    try {
                        const ws = folha();
                        const s = ws && ws.getScrollState && ws.getScrollState();
                        if (s) rolagem = { r: s.sheetViewStartRow, c: s.sheetViewStartColumn };
                    } catch (e) { /* primeira montagem */ }
                    if (selecao) selecao.dispose();
                    if (comandos) comandos.dispose();
                    quietoAte = Date.now() + 1200;
                    setAlterada(false);
                    const antiga = unidade;
                    unidade = `planilha-${++versao}`;
                    vivo.cols = cols;
                    vivo.colId = colId;
                    vivo.totalLinhas = dados.length + 1 + FOLGA;
                    vivo.mapa = new Map(dados.map((l) => [chaveDe(l), l]));
                    vivo.estrutura = assinatura(dados, cols);
                    api.createWorkbook({
                        id: unidade,
                        name: props.nome,
                        sheetOrder: ['folha'],
                        sheets: {
                            folha: {
                                id: 'folha',
                                name: props.nome,
                                rowCount: vivo.totalLinhas,
                                columnCount: colId + 1,
                                cellData,
                                columnData,
                                rowData: { 0: { h: 46 } },
                                defaultRowHeight: 24,
                                freeze: { xSplit: 1, ySplit: 1, startRow: 1, startColumn: 1 },
                            },
                        },
                    });
                    if (antiga) api.disposeUnit(antiga);
                    const ws = folha();
                    if (ws) ws.getRange(0, 0, dados.length + 1, colId).createFilter();
                    if (manterRolagem && rolagem && (rolagem.r > 1 || rolagem.c > 1)) {
                        try {
                            if (ws && ws.scrollToCell) ws.scrollToCell(Math.min(rolagem.r, vivo.totalLinhas - 1), Math.min(rolagem.c, colId - 1));
                        } catch (e) { /* sem rolagem */ }
                    }
                    const wb = api.getActiveWorkbook();
                    selecao = wb ? wb.onSelectionChange((s) => aoMudarSelecao(s)) : null;
                    comandos = wb
                        ? wb.onCommandExecuted((c) => {
                              // "cell-edit" é interno do editor (roda sozinho ao abrir); o resto é ação de quem usa
                              if (!interno && Date.now() > quietoAte && !c.id.includes('cell-edit')) setAlterada(true);
                          })
                        : null;
                    if (props.aoSelecionar) props.aoSelecionar([]);
                };

                /** mesmas linhas e colunas: reescreve só as células cujo valor ou cor mudou */
                const atualizarCelulas = (novas, cols) => {
                    const ws = folha();
                    if (!ws) return;
                    const antigas = vivo.cols;
                    const linhaDe = new Map();
                    for (let r = 1; r < vivo.totalLinhas; r++) {
                        const x = idDaLinha(r);
                        if (x) linhaDe.set(x, r);
                    }
                    vivo.cols = cols; // antes de mudar as células: assim a mudança não é "desfeita"
                    interno = true;
                    try {
                        for (const l of novas) {
                            const k = chaveDe(l);
                            const r = linhaDe.get(k);
                            const antes = vivo.mapa.get(k);
                            if (!r || !antes) continue;
                            vivo.mapa.set(k, l);
                            cols.forEach((c, i) => {
                                const a = antigas[i] ? celula(antigas[i], antes) : {};
                                const b = celula(c, l);
                                const corAntes = antigas[i] && antigas[i].cor ? antigas[i].cor(antes) : undefined;
                                const corDepois = c.cor ? c.cor(l) : undefined;
                                if (!iguais(bruto(a.v), bruto(b.v)) || corAntes !== corDepois) ws.getRange(r, i).setValue(celula(c, l, true));
                            });
                        }
                    } finally {
                        interno = false;
                    }
                };

                aplicar = (ls, cs) => (assinatura(ls, cs) !== vivo.estrutura ? montar(ls, cs) : atualizarCelulas(ls, cs));

                let ultimoAviso = 0;
                const avisarSoLeitura = () => {
                    if (Date.now() - ultimoAviso < 4000) return;
                    ultimoAviso = Date.now();
                    SGE.helpers.toast(`A planilha é só para ver e pesquisar: nada aqui muda os dados (${props.dica}).`, 'info');
                };

                // edição de célula nunca abre; dois cliques abrem o que a tela decidir
                api.addEvent(api.Event.BeforeSheetEditStart, (p) => {
                    p.cancel = true;
                    if (p.row === 0) return;
                    const l = vivo.mapa.get(idDaLinha(p.row));
                    if (p.eventType === DUPLO_CLIQUE && l && props.aoAbrir) props.aoAbrir(l, (vivo.cols[p.column] && vivo.cols[p.column].id) || '');
                    else avisarSoLeitura();
                });

                // colou, apagou, recortou, substituiu, arrastou: o valor volta ao que é no sistema
                let corrigindo = false;
                api.addEvent(api.Event.SheetValueChanged, (p) => {
                    const ws = folha();
                    if (!ws || corrigindo) return;
                    corrigindo = true;
                    interno = true;
                    try {
                        const { cols, colId, totalLinhas } = vivo;
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
                                    if (r === 0) {
                                        const certo = c === colId ? 'ID' : cols[c] && cols[c].rotulo.toUpperCase();
                                        if (certo && atual !== certo) {
                                            atualCel.setValue({ v: certo, t: TEXTO, s: CABECALHO });
                                            voltou = true;
                                        }
                                        continue;
                                    }
                                    if (c === colId) continue;
                                    const l = vivo.mapa.get(idDaLinha(r));
                                    const esperado = l && cols[c] ? bruto(celula(cols[c], l).v) : null;
                                    if (!iguais(atual, esperado)) {
                                        atualCel.setValue(l && cols[c] ? celula(cols[c], l, true) : { v: '' });
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

                montar(props.linhas, props.colunas);

                // retrato da planilha como está: o que o filtro deixou, colunas visíveis, larguras, cores e formatação
                retratar = () => {
                    const wb = api.getActiveWorkbook();
                    const ws = wb && wb.getActiveSheet();
                    if (!wb || !ws) return null;
                    const foto = wb.save();
                    const folhaFoto = foto.sheets[ws.getSheetId()];
                    if (!folhaFoto) return null;
                    const estilo = (s) => (typeof s === 'string' ? (foto.styles && foto.styles[s]) || {} : s || {});
                    const cel = folhaFoto.cellData || {};
                    const lin = folhaFoto.rowData || {};
                    const col = folhaFoto.columnData || {};
                    let escondidas = new Set();
                    try {
                        escondidas = new Set((ws.getFilter() && ws.getFilter().getFilteredOutRows()) || []);
                    } catch (e) { /* sem filtro */ }
                    let ultima = 0;
                    for (const r of Object.keys(cel).map(Number)) {
                        if (Object.values(cel[r] || {}).some((c) => c && c.v != null && c.v !== '')) ultima = Math.max(ultima, r);
                    }
                    const linhas = [];
                    for (let r = 0; r <= ultima; r++) if (!escondidas.has(r) && !(lin[r] && lin[r].hd)) linhas.push(r);
                    const visCols = [];
                    for (let c = 0; c < vivo.colId; c++) if (!(col[c] && col[c].hd)) visCols.push(c);
                    return {
                        nome: props.nome,
                        larguras: visCols.map((c) => (col[c] && col[c].w) || 88),
                        linhas: linhas.map((r) => ({
                            altura: (lin[r] && lin[r].h) || (r === 0 ? 46 : 24),
                            celulas: visCols.map((c) => {
                                const d = cel[r] && cel[r][c];
                                return { v: d && d.v != null ? d.v : null, s: { ...estilo(col[c] && col[c].s), ...estilo(lin[r] && lin[r].s), ...estilo(d && d.s) } };
                            }),
                        })),
                        visiveis: linhas.filter((r) => r > 0).length,
                        total: vivo.mapa.size,
                    };
                };
                // "Resetar": planilha de volta ao original (sem filtros, cores, seleção, pesquisa e rolagem)
                resetar = () => montar(props.linhas, props.colunas, false);

                // espaço para os botões da tela no começo da barra da planilha (antes do "desfazer")
                const acharBarra = () => {
                    if (!ativo) return;
                    const cab = area.querySelector('header[data-u-comp="headerbar"]');
                    if (!cab) return void requestAnimationFrame(acharBarra);
                    cab.prepend(barra);
                    // a barra da planilha começa depois dos nossos botões (a largura muda quando o "Resetar" aparece)
                    observador = new ResizeObserver(() => (cab.style.paddingLeft = barra.offsetWidth ? `${barra.offsetWidth + 10}px` : ''));
                    observador.observe(barra);
                };
                acharBarra();
                pronto = true;
                abrindo.remove();
                if (pendente) {
                    const [ls, cs] = pendente;
                    pendente = null;
                    aplicar(ls, cs);
                }
            } catch (e) {
                console.error('[SGE Planilha]', e);
                if (!ativo) return;
                caixa.innerHTML = `<p class="pl-erro">${esc(e.message || 'Não foi possível abrir a planilha.')} Recarregue a página (F5).</p>`;
            }
        })();

        return {
            /** linhas ou colunas novas (filtros, layout, dados salvos): sem recriar a planilha */
            atualizar(linhas, colunas) {
                props.linhas = linhas;
                props.colunas = colunas;
                if (pronto && aplicar) aplicar(linhas, colunas);
                else pendente = [linhas, colunas];
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
                const u = univerInst;
                // descarta depois do navegador terminar de desenhar (o Univer desmonta a própria árvore)
                setTimeout(() => u && u.dispose(), 0);
                caixa.innerHTML = '';
            },
        };
    }

    return { criar, carregar, precarregar };
})();
