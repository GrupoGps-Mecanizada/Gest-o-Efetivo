'use strict';

/**
 * SGE — Movimentar (P-035)
 * Botão fixo no topo (só para editores) que abre uma janela em 3 passos: Quem? Para onde? Por quê?
 * Antes de gravar mostra o resumo em português; depois de gravar aparece "Desfazer".
 * Grava pela função do banco gps_mec.efetivo_gps_mec_movimentar (tudo junto ou nada, com o motivo),
 * que também alimenta o histórico que ninguém apaga.
 * Pessoa nova: o cadastro é do SST (decisão de 08/10).
 */
window.SGE = window.SGE || {};

SGE.movimentar = (() => {
    const SST_NOVA_PESSOA = 'https://sge-portal.pages.dev/sst/colaborador/novo';
    const MOTIVOS = ['Férias', 'Atestado', 'Remanejamento', 'Pedido do supervisor', 'Volta ao trabalho', 'Desligamento', 'Outro'];
    const STATUS = { ferias: 'FÉRIAS', atestado: 'AFASTADO', ativo: 'ATIVO', desligado: 'DESLIGADO' };

    /* ─── Lógica (sem tela; testada à parte) ─── */
    const L = {
        maiusculo: (s) => String(s || '').toLocaleUpperCase('pt-BR'),
        semAcento: (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR'),
        ehMotorista: (c) => /MOTORISTA/i.test(c.funcao || ''),

        /** situação como o dono fala: trabalhando, ferias, atestado, sobra, desligado */
        situacao(c) {
            const s = L.maiusculo(c.status);
            if (s === 'DESLIGADO' || s === 'INATIVO') return 'desligado';
            if (s.startsWith('FÉRIAS') || s.startsWith('FERIAS')) return 'ferias';
            if (s === 'AFASTADO') return 'atestado';
            if (!c.supervisor_id) return 'sobra';
            return 'trabalhando';
        },

        supervisor: (id) => (SGE.state.supervisores || []).find((s) => s.id === id) || null,
        equipamento: (id) => (SGE.state.equipamentos || []).find((e) => e.id === id) || null,
        rotuloEq: (eq) => (eq ? `${eq.sigla}-${eq.numero || ''}`.replace(/-$/, '').toLocaleUpperCase('pt-BR').replace('-', ' ') : ''),

        /** onde a pessoa está, em português ("na AP 12, equipe JOÃO", "na Sobra", "de férias") */
        lugar(c) {
            const st = L.situacao(c);
            if (st === 'ferias') return 'de férias';
            if (st === 'atestado') return 'de atestado';
            if (st === 'desligado') return 'desligado';
            if (st === 'sobra') return 'na Sobra';
            const sup = L.supervisor(c.supervisor_id);
            const eq = L.equipamento(c.equipment_id);
            const equipe = sup ? `equipe ${sup.nome}` : 'sem equipe';
            return eq ? `na ${L.rotuloEq(eq)}, ${equipe}` : `na ${equipe}, sem equipamento`;
        },

        /** quem já ocupa o lugar dessa função (motorista: 1; operador: 2) na vaga */
        ocupantes(supId, eqId, motorista, excetoId) {
            return (SGE.state.colaboradores || []).filter((c) => c.id !== excetoId
                && L.situacao(c) === 'trabalhando'
                && c.supervisor_id === supId && c.equipment_id === eqId
                && L.ehMotorista(c) === motorista);
        },
        cheia(supId, eqId, motorista, excetoId) {
            return L.ocupantes(supId, eqId, motorista, excetoId).length >= (motorista ? 1 : 2);
        },

        dataBR: (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : ''),
        retrato: (c) => ({ colaborador_id: c.id, status: c.status, supervisor_id: c.supervisor_id || null, equipment_id: c.equipment_id || null, data_volta: c.data_volta || null }),

        /**
         * Monta o que será gravado e a frase do resumo.
         * destino: { tipo: 'equipamento'|'voltar', supId, eqId } ou { tipo: 'ferias'|'atestado'|'sobra'|'desligado', dataVolta }
         * ocupante (opcional): { pessoa, acao: 'trocar'|'sobra'|'manter' }
         */
        plano(pessoa, destino, ocupante) {
            const mudancas = [];
            const antes = [L.retrato(pessoa)];
            const frases = [];
            const nome = pessoa.nome;
            const de = L.lugar(pessoa);
            const ate = destino.dataVolta ? ` até ${L.dataBR(destino.dataVolta)}` : '';

            if (destino.tipo === 'equipamento' || destino.tipo === 'voltar') {
                const sup = L.supervisor(destino.supId);
                const eq = L.equipamento(destino.eqId);
                mudancas.push({ colaborador_id: pessoa.id, status: STATUS.ativo, supervisor_id: destino.supId, equipment_id: destino.eqId || null, data_volta: null });
                const para = eq ? `a ${L.rotuloEq(eq)}, equipe ${sup ? sup.nome : ''}` : `a equipe ${sup ? sup.nome : ''}, sem equipamento`;
                frases.push(destino.tipo === 'voltar' ? `${nome} volta ao trabalho (estava ${de}) e vai para ${para}.` : `${nome} sai ${de.replace(/^na /, 'da ')} e vai para ${para}.`);
                if (ocupante && ocupante.acao !== 'manter') {
                    const o = ocupante.pessoa;
                    antes.push(L.retrato(o));
                    if (ocupante.acao === 'trocar' && L.situacao(pessoa) === 'trabalhando') {
                        mudancas.push({ colaborador_id: o.id, status: STATUS.ativo, supervisor_id: pessoa.supervisor_id, equipment_id: pessoa.equipment_id || null, data_volta: null });
                        frases.push(`${o.nome} vai para o lugar de ${nome}: ${de.replace(/^na /, '')}.`);
                    } else {
                        mudancas.push({ colaborador_id: o.id, status: STATUS.ativo, supervisor_id: null, equipment_id: null, data_volta: null });
                        frases.push(`${o.nome} sai da vaga e vai para a Sobra.`);
                    }
                } else if (ocupante) {
                    frases.push(`${ocupante.pessoa.nome} continua na vaga (fica gente a mais).`);
                }
            } else if (destino.tipo === 'ferias' || destino.tipo === 'atestado') {
                // continua na equipe (para voltar mais fácil), mas sai do equipamento
                mudancas.push({ colaborador_id: pessoa.id, status: STATUS[destino.tipo], supervisor_id: pessoa.supervisor_id || null, equipment_id: null, data_volta: destino.dataVolta || null });
                frases.push(`${nome} sai ${de.replace(/^na /, 'da ')} e vai para ${destino.tipo === 'ferias' ? 'férias' : 'atestado'}${ate}.`);
            } else if (destino.tipo === 'sobra') {
                mudancas.push({ colaborador_id: pessoa.id, status: STATUS.ativo, supervisor_id: null, equipment_id: null, data_volta: destino.dataVolta || null });
                frases.push(`${nome} sai ${de.replace(/^na /, 'da ')} e vai para a Sobra${ate}.`);
            } else if (destino.tipo === 'desligado') {
                mudancas.push({ colaborador_id: pessoa.id, status: STATUS.desligado, supervisor_id: null, equipment_id: null, data_volta: null });
                frases.push(`Desligamento de ${nome}: sai das vagas e o histórico fica guardado.`);
            }
            return { mudancas, antes, frase: frases.join(' ') };
        },

        /** motivo que já vem marcado para cada destino */
        motivoSugerido: (tipo) => ({ ferias: 'Férias', atestado: 'Atestado', voltar: 'Volta ao trabalho', desligado: 'Desligamento' }[tipo] || 'Remanejamento'),

        /** busca por nome ou matrícula, sem ligar para acento */
        buscar(texto, limite = 8) {
            const t = L.semAcento(texto).trim();
            if (!t) return [];
            return (SGE.state.colaboradores || [])
                .filter((c) => L.semAcento(c.nome).includes(t) || String(c.matricula_gps || '').includes(t) || String(c.matricula_usiminas || '').includes(t))
                .sort((a, b) => (L.situacao(a) === 'desligado') - (L.situacao(b) === 'desligado') || String(a.nome).localeCompare(String(b.nome), 'pt-BR'))
                .slice(0, limite);
        },
    };

    /* ─── Banco ─── */
    async function gravar(mudancas, motivo, observacao) {
        const { data, error } = await window.supabase.schema('gps_mec')
            .rpc('efetivo_gps_mec_movimentar', { p_mudancas: mudancas, p_motivo: motivo, p_observacao: observacao || null });
        if (error) throw error;
        return data;
    }

    async function souEditor() {
        try {
            const { data, error } = await window.supabase.schema('gps_mec').rpc('efetivo_gps_mec_e_editor');
            return !error && data === true;
        } catch (_) {
            return false; // na dúvida, só consulta
        }
    }

    /* ─── Tela ─── */
    const esc = (v) => SGE.helpers.escapeHtml(v);
    let st = null; // estado da janela aberta

    function montarBotao() {
        const main = document.getElementById('main');
        if (!main || document.getElementById('mov-barra')) return;
        const barra = document.createElement('div');
        barra.id = 'mov-barra';
        barra.className = 'mov-barra';
        barra.innerHTML = '<button type="button" class="mov-botao" id="mov-abrir">Movimentar</button>';
        main.prepend(barra);
        barra.querySelector('#mov-abrir').addEventListener('click', () => abrir());
    }

    function abrir(colabId) {
        fechar();
        st = { passo: 1, pessoa: null, destino: null, ocupante: null, motivo: null, obs: '', dataVolta: '' };
        const fundo = document.createElement('div');
        fundo.className = 'mov-fundo';
        fundo.id = 'mov-fundo';
        fundo.innerHTML = '<div class="mov-janela" role="dialog" aria-modal="true" aria-labelledby="mov-titulo"></div>';
        fundo.addEventListener('mousedown', (e) => { if (e.target === fundo) fechar(); });
        document.body.appendChild(fundo);
        document.addEventListener('keydown', teclaEsc);
        const pessoa = colabId && (SGE.state.colaboradores || []).find((c) => c.id === colabId);
        if (pessoa) { st.pessoa = pessoa; st.passo = 2; }
        desenhar();
    }

    function fechar() {
        const f = document.getElementById('mov-fundo');
        if (f) f.remove();
        document.removeEventListener('keydown', teclaEsc);
        st = null;
    }
    const teclaEsc = (e) => { if (e.key === 'Escape') fechar(); };

    function cabecalho() {
        const passos = ['Quem?', 'Para onde?', 'Por quê?'];
        return `<div class="mov-topo">
            <h2 id="mov-titulo">Movimentar</h2>
            <button type="button" class="mov-x" data-acao="fechar" aria-label="Fechar">×</button>
        </div>
        <ol class="mov-passos">${passos.map((p, i) => `<li class="${i + 1 === st.passo ? 'atual' : i + 1 < st.passo ? 'feito' : ''}">${i + 1} ${p}</li>`).join('')}</ol>`;
    }

    function linhaPessoa(c) {
        const funcao = c.funcao ? `${esc(c.funcao)} · ` : '';
        return `<button type="button" class="mov-linha" data-pessoa="${esc(c.id)}">
            <span class="mov-linha-nome">${esc(c.nome)}</span>
            <span class="mov-linha-info">${funcao}${esc(L.lugar(c))}</span>
        </button>`;
    }

    function passo1() {
        return `<div class="mov-corpo">
            <input type="search" class="mov-busca" id="mov-busca" placeholder="Nome ou matrícula" autocomplete="off" aria-label="Buscar pessoa por nome ou matrícula">
            <div class="mov-lista" id="mov-resultados"><p class="mov-dica">Digite para buscar.</p></div>
            <p class="mov-rodape">Pessoa nova? <a href="${SST_NOVA_PESSOA}" target="_blank" rel="noopener">Cadastrar no SST</a></p>
        </div>`;
    }

    function opcoesDestino() {
        const s = L.situacao(st.pessoa);
        const ops = [];
        if (s === 'ferias' || s === 'atestado' || s === 'sobra') ops.push(['voltar', 'Voltar ao trabalho', 'Escolher a vaga']);
        if (s !== 'desligado') ops.push(['equipamento', 'Trocar de equipamento ou supervisor', 'Ver as vagas']);
        if (s !== 'ferias') ops.push(['ferias', 'Férias', 'Com data de volta']);
        if (s !== 'atestado') ops.push(['atestado', 'Atestado', 'Com data de volta']);
        if (s !== 'sobra') ops.push(['sobra', 'Sobra', 'Sem supervisor']);
        if (s !== 'desligado') ops.push(['desligado', 'Desligado', 'Sai das vagas; o histórico fica']);
        if (s === 'desligado') ops.push(['voltar', 'Voltar ao trabalho', 'Escolher a vaga']);
        return ops;
    }

    function passo2() {
        const p = st.pessoa;
        const d = st.destino;
        let detalhe = '';
        if (d && (d.tipo === 'equipamento' || d.tipo === 'voltar')) detalhe = blocoVagas();
        else if (d && (d.tipo === 'ferias' || d.tipo === 'atestado' || d.tipo === 'sobra')) {
            detalhe = `<div class="mov-detalhe">
                <label class="mov-rotulo" for="mov-data">Volta em (opcional)</label>
                <input type="date" id="mov-data" class="mov-data" value="${esc(st.dataVolta)}">
                <div class="mov-acoes"><button type="button" class="mov-primario" data-acao="seguir">Continuar</button></div>
            </div>`;
        }
        return `<div class="mov-corpo">
            <p class="mov-quem"><strong>${esc(p.nome)}</strong> está ${esc(L.lugar(p))}. <button type="button" class="mov-link" data-acao="trocar-pessoa">Trocar pessoa</button></p>
            <div class="mov-lista">${opcoesDestino().map(([t, r, info]) => `<button type="button" class="mov-linha${d && d.tipo === t ? ' marcada' : ''}" data-destino="${t}">
                <span class="mov-linha-nome">${r}</span><span class="mov-linha-info">${info}</span></button>`).join('')}</div>
            ${detalhe}
        </div>`;
    }

    function blocoVagas() {
        const d = st.destino;
        const sups = (SGE.state.supervisores || []).filter((s) => s.ativo && s.nome !== 'SEM SUPERVISOR').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        if (!d.supId) d.supId = st.pessoa.supervisor_id || (sups[0] && sups[0].id) || null;
        const motorista = L.ehMotorista(st.pessoa);
        const vagas = (SGE.state.vagas || []).filter((v) => v.supervisor_id === d.supId)
            .map((v) => L.equipamento(v.equipment_id)).filter(Boolean)
            .sort((a, b) => L.rotuloEq(a).localeCompare(L.rotuloEq(b), 'pt-BR', { numeric: true }));
        const linhas = vagas.map((eq) => {
            const quem = L.ocupantes(d.supId, eq.id, motorista, st.pessoa.id);
            const cheia = quem.length >= (motorista ? 1 : 2);
            const atual = st.pessoa.supervisor_id === d.supId && st.pessoa.equipment_id === eq.id;
            const info = atual ? 'onde está hoje' : cheia ? `ocupada: ${quem.map((q) => q.nome).join(', ')}` : quem.length ? `livre (já tem ${quem.map((q) => q.nome).join(', ')})` : 'livre';
            return `<button type="button" class="mov-linha${d.eqId === eq.id ? ' marcada' : ''}${cheia ? ' cheia' : ''}" data-vaga="${esc(eq.id)}"${atual ? ' disabled' : ''}>
                <span class="mov-linha-nome">${esc(L.rotuloEq(eq))}</span><span class="mov-linha-info">${esc(info)}</span></button>`;
        });
        // livres primeiro
        linhas.sort((a, b) => a.includes(' cheia') - b.includes(' cheia'));
        let pergunta = '';
        if (d.eqId && L.cheia(d.supId, d.eqId, motorista, st.pessoa.id)) {
            const quem = L.ocupantes(d.supId, d.eqId, motorista, st.pessoa.id);
            const podeTrocar = L.situacao(st.pessoa) === 'trabalhando';
            pergunta = `<div class="mov-detalhe">
                <p class="mov-rotulo">A vaga já está ocupada. O que fazer com quem está nela?</p>
                <div class="mov-lista">${quem.map((q) => `
                    ${podeTrocar ? `<button type="button" class="mov-linha${st.ocupante && st.ocupante.pessoa.id === q.id && st.ocupante.acao === 'trocar' ? ' marcada' : ''}" data-ocupante="${esc(q.id)}" data-oq="trocar"><span class="mov-linha-nome">Trocar de lugar com ${esc(q.nome)}</span><span class="mov-linha-info">vai para ${esc(L.lugar(st.pessoa).replace(/^na /, 'a '))}</span></button>` : ''}
                    <button type="button" class="mov-linha${st.ocupante && st.ocupante.pessoa.id === q.id && st.ocupante.acao === 'sobra' ? ' marcada' : ''}" data-ocupante="${esc(q.id)}" data-oq="sobra"><span class="mov-linha-nome">Mandar ${esc(q.nome)} para a Sobra</span><span class="mov-linha-info">sai da vaga</span></button>`).join('')}
                    <button type="button" class="mov-linha${st.ocupante && st.ocupante.acao === 'manter' ? ' marcada' : ''}" data-ocupante="${esc(quem[0].id)}" data-oq="manter"><span class="mov-linha-nome">Deixar como está</span><span class="mov-linha-info">a vaga fica com gente a mais</span></button>
                </div>
            </div>`;
        }
        const pronto = d.eqId && (!L.cheia(d.supId, d.eqId, motorista, st.pessoa.id) || st.ocupante);
        return `<div class="mov-detalhe">
            <label class="mov-rotulo" for="mov-sup">Equipe</label>
            <select id="mov-sup" class="mov-select">${sups.map((s) => `<option value="${esc(s.id)}"${s.id === d.supId ? ' selected' : ''}>${esc(s.nome)}</option>`).join('')}</select>
            <div class="mov-lista mov-vagas">${linhas.join('') || '<p class="mov-dica">Essa equipe ainda não tem vagas. Crie a vaga na Matriz.</p>'}</div>
            ${pergunta}
            ${pronto ? '<div class="mov-acoes"><button type="button" class="mov-primario" data-acao="seguir">Continuar</button></div>' : ''}
        </div>`;
    }

    function passo3() {
        if (!st.motivo) st.motivo = L.motivoSugerido(st.destino.tipo);
        const plano = montarPlano();
        return `<div class="mov-corpo">
            <p class="mov-rotulo">Motivo</p>
            <div class="mov-pilulas">${MOTIVOS.map((m) => `<button type="button" class="mov-pilula${m === st.motivo ? ' marcada' : ''}" data-motivo="${esc(m)}">${esc(m)}</button>`).join('')}</div>
            <label class="mov-rotulo" for="mov-obs">Observação (opcional)</label>
            <textarea id="mov-obs" class="mov-obs" rows="2" maxlength="300">${esc(st.obs)}</textarea>
            <div class="mov-resumo">
                <p class="mov-rotulo">Resumo</p>
                <p class="mov-frase">${esc(plano.frase)}</p>
                <p class="mov-motivo-linha">Motivo: ${esc(st.motivo)}</p>
            </div>
            <div class="mov-acoes">
                <button type="button" class="mov-secundario" data-acao="voltar">Voltar</button>
                <button type="button" class="mov-primario" data-acao="confirmar">Confirmar</button>
            </div>
        </div>`;
    }

    function montarPlano() {
        const d = { ...st.destino, dataVolta: st.dataVolta || null };
        return L.plano(st.pessoa, d, st.ocupante);
    }

    function desenhar() {
        const j = document.querySelector('#mov-fundo .mov-janela');
        if (!j || !st) return;
        j.innerHTML = cabecalho() + (st.passo === 1 ? passo1() : st.passo === 2 ? passo2() : passo3());
        ligar(j);
        if (st.passo === 1) document.getElementById('mov-busca').focus();
    }

    function ligar(j) {
        j.querySelectorAll('[data-acao="fechar"]').forEach((b) => b.addEventListener('click', fechar));
        const busca = j.querySelector('#mov-busca');
        if (busca) {
            busca.addEventListener('input', () => {
                const r = L.buscar(busca.value);
                const caixa = j.querySelector('#mov-resultados');
                caixa.innerHTML = busca.value.trim() ? (r.map(linhaPessoa).join('') || '<p class="mov-dica">Ninguém com esse nome ou matrícula.</p>') : '<p class="mov-dica">Digite para buscar.</p>';
                caixa.querySelectorAll('[data-pessoa]').forEach((b) => b.addEventListener('click', () => escolherPessoa(b.dataset.pessoa)));
            });
            busca.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { const p = j.querySelector('[data-pessoa]'); if (p) escolherPessoa(p.dataset.pessoa); }
            });
        }
        j.querySelectorAll('[data-acao="trocar-pessoa"]').forEach((b) => b.addEventListener('click', () => { st.pessoa = null; st.destino = null; st.ocupante = null; st.passo = 1; desenhar(); }));
        j.querySelectorAll('[data-destino]').forEach((b) => b.addEventListener('click', () => {
            st.destino = { tipo: b.dataset.destino };
            st.ocupante = null;
            st.motivo = null;
            desenhar();
        }));
        const sup = j.querySelector('#mov-sup');
        if (sup) sup.addEventListener('change', () => { st.destino.supId = sup.value; st.destino.eqId = null; st.ocupante = null; desenhar(); });
        j.querySelectorAll('[data-vaga]').forEach((b) => b.addEventListener('click', () => { st.destino.eqId = b.dataset.vaga; st.ocupante = null; desenhar(); }));
        j.querySelectorAll('[data-ocupante]').forEach((b) => b.addEventListener('click', () => {
            const pessoa = (SGE.state.colaboradores || []).find((c) => c.id === b.dataset.ocupante);
            st.ocupante = { pessoa, acao: b.dataset.oq };
            desenhar();
        }));
        const data = j.querySelector('#mov-data');
        if (data) data.addEventListener('change', () => { st.dataVolta = data.value; });
        j.querySelectorAll('[data-acao="seguir"]').forEach((b) => b.addEventListener('click', () => { if (data) st.dataVolta = data.value; st.passo = 3; desenhar(); }));
        j.querySelectorAll('[data-motivo]').forEach((b) => b.addEventListener('click', () => { st.motivo = b.dataset.motivo; st.obs = (j.querySelector('#mov-obs') || {}).value || st.obs; desenhar(); }));
        const obs = j.querySelector('#mov-obs');
        if (obs) obs.addEventListener('input', () => { st.obs = obs.value; });
        j.querySelectorAll('[data-acao="voltar"]').forEach((b) => b.addEventListener('click', () => { st.passo = 2; desenhar(); }));
        j.querySelectorAll('[data-acao="confirmar"]').forEach((b) => b.addEventListener('click', () => confirmar(b)));
    }

    function escolherPessoa(id) {
        st.pessoa = (SGE.state.colaboradores || []).find((c) => c.id === id) || null;
        if (!st.pessoa) return;
        st.passo = 2;
        desenhar();
    }

    async function confirmar(botao) {
        const plano = montarPlano();
        const motivo = st.motivo;
        const obs = st.obs;
        botao.disabled = true;
        botao.textContent = 'Gravando...';
        try {
            await gravar(plano.mudancas, motivo, obs);
            fechar();
            await SGE.api.loadData(true);
            SGE.helpers.toastUndo('Movimentação gravada.', () => desfazer(plano.antes));
        } catch (e) {
            console.error('[Movimentar] Erro ao gravar:', e);
            botao.disabled = false;
            botao.textContent = 'Confirmar';
            SGE.helpers.toast(/editores/i.test(e.message || '') ? 'Só editores podem movimentar.' : 'Não consegui gravar. Nada foi mudado. Tente de novo.', 'error');
        }
    }

    async function desfazer(antes) {
        try {
            await gravar(antes, 'Desfazer', null);
            await SGE.api.loadData(true);
            SGE.helpers.toast('Desfeito. Tudo voltou como estava.', 'success');
        } catch (e) {
            console.error('[Movimentar] Erro ao desfazer:', e);
            SGE.helpers.toast('Não consegui desfazer. Faça o movimento de volta pelo Movimentar.', 'error');
        }
    }

    return { montarBotao, abrir, fechar, souEditor, _logica: L };
})();
