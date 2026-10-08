'use strict';

/**
 * SGE — Painel do colaborador (mesmo formato da gaveta do SST)
 * Gaveta à direita, com abas num trilho (Cadastro · Alocação · Férias · Movimentações · Alterações) e os
 * dados em tabelas rótulo | valor. A largura pode ser mudada arrastando a borda esquerda ou pelo botão
 * expandir, e fica guardada neste navegador. Rodapé: Excluir, Mover e Editar (só perfis de gestão).
 */
window.SGE = window.SGE || {};

SGE.drawer = {
  _aba: 'cadastro',
  _CHAVE_LARGURA: 'SGE_PAINEL_LARGURA',
  _MINIMO: 380,

  _esc(v) {
    return SGE.helpers.escapeHtml(v);
  },

  _data(iso) {
    if (!iso) return '';
    const d = String(iso).slice(0, 10).split('-');
    return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : String(iso);
  },

  /** tabela rótulo | valor (igual à TabelaCampos do SST): vazio vira "—" */
  _tabelaCampos(titulo, linhas) {
    const esc = this._esc;
    return `<div class="gv-tabela-caixa"><table class="gv-campos" aria-label="${esc(titulo)}"><tbody>${linhas
      .map(([rotulo, valor, html]) => {
        const vazio = valor == null || valor === '';
        return `<tr><th scope="row">${esc(rotulo)}</th><td>${vazio ? '<span class="gv-vazio">—</span>' : html ? valor : esc(valor)}</td></tr>`;
      })
      .join('')}</tbody></table></div>`;
  },

  /** tabela com cabeçalho (listas: férias, movimentações) */
  _tabelaLista(titulo, cabecalho, linhas, vazio) {
    if (!linhas.length) return `<p class="gv-nada">${this._esc(vazio)}</p>`;
    const esc = this._esc;
    return `<div class="gv-tabela-caixa"><table class="gv-lista" aria-label="${esc(titulo)}"><thead><tr>${cabecalho.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${linhas
      .map((l) => `<tr>${l.map((v) => `<td>${v == null || v === '' ? '<span class="gv-vazio">—</span>' : esc(v)}</td>`).join('')}</tr>`)
      .join('')}</tbody></table></div>`;
  },

  _abas(col) {
    const ferias = (SGE.state.ferias || []).filter((f) => f.employee_id === col.id);
    const movs = (SGE.state.movimentacoes || []).filter((m) => m.colaborador_id === col.id);
    return [
      ['cadastro', 'Cadastro', 0],
      ['alocacao', 'Alocação', 0],
      ['ferias', 'Férias', ferias.length],
      ['movimentacoes', 'Movimentações', movs.length],
      ['alteracoes', 'Alterações', 0],
    ];
  },

  _conteudo(col, aba) {
    const h = SGE.helpers;
    if (aba === 'cadastro') {
      const aviso = h.isSemId(col) ? '<div class="gv-aviso">Colaborador sem ID definitivo: resolva em Configurações.</div>' : '';
      return `${aviso}<h3 class="gv-secao">Cadastro</h3>${this._tabelaCampos('Cadastro', [
        ['Matrícula GPS', col.matricula_gps],
        ['Matrícula Usiminas', col.matricula_usiminas],
        ['Nome', col.nome],
        ['Categoria', col.categoria === 'GESTAO' ? 'Gestão' : col.categoria ? 'Operacional' : ''],
        ['Função', col.funcao],
        ['CR', col.cr],
        ['Telefone', col.telefone],
        ['Status', col.status],
      ])}<p class="gv-rodinha">Última atualização: ${col.ultima_edicao ? this._esc(h.formatDate(col.ultima_edicao)) : 'desconhecida'} · por ${this._esc(col.editado_por || 'Sistema')}</p>`;
    }
    if (aba === 'alocacao') {
      const temSetor = col.setor_id && col.setor && col.setor !== 'SEM SETOR';
      const temEquip = col.equipamento && col.equipamento !== 'SEM EQUIPAMENTO';
      const turno = SGE.equip ? SGE.equip.getTurno(col.regime) : '';
      return `<h3 class="gv-secao">Alocação</h3>${this._tabelaCampos('Alocação', [
        ['Supervisor', col.supervisor && col.supervisor !== 'SEM SUPERVISOR' ? col.supervisor : ''],
        ['Regime', col.regime],
        ['Turno', turno && turno !== 'S/R' ? turno : ''],
        ['Equipamento', temEquip ? col.equipamento : ''],
        ['Setor', temSetor ? col.setor : ''],
      ])}`;
    }
    if (aba === 'ferias') {
      const lista = (SGE.state.ferias || [])
        .filter((f) => f.employee_id === col.id)
        .sort((a, b) => String(b.data_inicio).localeCompare(String(a.data_inicio)));
      const dias = (f) => (f.data_inicio && f.data_retorno ? Math.round((new Date(f.data_retorno) - new Date(f.data_inicio)) / 86400000) : f.quantidade_dias || '');
      const situacao = { AGENDADA: 'Agendada', EM_ANDAMENTO: 'Em andamento', CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada' };
      return `<h3 class="gv-secao">Férias</h3>${this._tabelaLista(
        'Férias',
        ['Início', 'Retorno', 'Dias', 'Situação'],
        lista.map((f) => [this._data(f.data_inicio), this._data(f.data_retorno), String(dias(f)), situacao[f.status] || f.status]),
        'Nenhuma férias registrada.',
      )}`;
    }
    if (aba === 'movimentacoes') {
      const movs = (SGE.state.movimentacoes || []).filter((m) => m.colaborador_id === col.id);
      return `<h3 class="gv-secao">Movimentações</h3>${this._tabelaLista(
        'Movimentações',
        ['Data', 'Supervisor', 'Regime', 'Motivo'],
        movs.map((m) => [h.formatDate(m.created_at), `${m.supervisor_origem} → ${m.supervisor_destino}`, `${m.regime_origem} → ${m.regime_destino}`, m.motivo]),
        'Sem movimentações registradas.',
      )}`;
    }
    return '<h3 class="gv-secao">Alterações nos dados</h3><div id="drawer-alteracoes"><p class="gv-nada">Carregando…</p></div>';
  },

  _desenhar() {
    const col = SGE.state.drawerColaborador;
    const body = document.getElementById('drawer-body');
    if (!col || !body) return;
    const abas = this._abas(col);
    if (!abas.some(([k]) => k === this._aba)) this._aba = 'cadastro';
    body.innerHTML = `
      <div class="gv-trilho-caixa">
        <div class="gv-trilho" role="tablist" aria-label="Seções do colaborador">
          ${abas
            .map(([k, rotulo, n]) => `<button type="button" role="tab" class="gv-aba" data-aba="${k}" aria-selected="${this._aba === k}">${rotulo}${n ? `<span class="gv-aba-n">${n}</span>` : ''}</button>`)
            .join('')}
        </div>
      </div>
      <div role="tabpanel" class="gv-painel">${this._conteudo(col, this._aba)}</div>`;
    if (this._aba === 'alteracoes') this._carregarAlteracoes(col.id);
  },

  /**
   * Abre o painel do colaborador
   */
  open(col) {
    SGE.state.drawerColaborador = col;
    const h = SGE.helpers;
    document.getElementById('drawer-title').textContent = col.nome || '—';
    document.getElementById('drawer-id').textContent = (col.matricula_gps || 'sem matrícula') + (h.isSemId(col) ? ' · sem ID' : '');
    const sup = col.supervisor && col.supervisor !== 'SEM SUPERVISOR' ? col.supervisor : 'sem supervisor';
    document.getElementById('drawer-resumo').textContent = [col.funcao, sup, col.status !== 'ATIVO' && col.status].filter(Boolean).join(' · ');
    this._desenhar();

    const gaveta = document.getElementById('drawer');
    document.getElementById('drawer-overlay').classList.add('open');
    gaveta.classList.add('open');
    gaveta.setAttribute('aria-hidden', 'false');
    this._aplicarLargura();

    // botões de ação só para perfis de gestão
    const gestao = SGE.auth.hasRole('GESTAO');
    document.querySelectorAll('#drawer-footer .drawer-btn').forEach((btn) => (btn.style.display = gestao ? '' : 'none'));
    setTimeout(() => document.getElementById('drawer-close').focus(), 50);
  },

  /** histórico de campos (tabela compartilhada do SGE; se não existir, a aba avisa) */
  async _carregarAlteracoes(colId) {
    const caixa = document.getElementById('drawer-alteracoes');
    if (!caixa) return;
    const esc = this._esc;
    try {
      if (!window.supabase) throw new Error('sem conexão');
      const consulta = window.supabase
        .schema('gps_compartilhado')
        .from('gps_field_history')
        .select('changed_by, changed_at, changes')
        .eq('entity_type', 'colaborador')
        .eq('entity_id', String(colId))
        .order('changed_at', { ascending: false })
        .limit(20);
      // internet ruim: desiste em 10 segundos e avisa (em vez de ficar "carregando" para sempre)
      const limite = new Promise((_, falha) => setTimeout(() => falha(new Error('sem resposta, verifique a internet')), 10000));
      const { data, error } = await Promise.race([consulta, limite]);
      if (error) throw error;
      if (!document.getElementById('drawer-alteracoes')) return;
      const linhas = [];
      for (const e of data || []) {
        for (const c of Array.isArray(e.changes) ? e.changes : []) linhas.push([SGE.helpers.formatDate(e.changed_at), e.changed_by, c.campo, c.de, c.para]);
      }
      caixa.innerHTML = this._tabelaLista('Alterações', ['Quando', 'Quem', 'Campo', 'Antes', 'Depois'], linhas, 'Nenhuma alteração registrada.');
    } catch (e) {
      caixa.innerHTML = `<p class="gv-nada">Não foi possível carregar as alterações agora${e && e.message ? ` (${esc(e.message)})` : ''}.</p>`;
    }
  },

  /* ─── Largura ajustável (como a gaveta do SST) ─── */
  _lerLargura() {
    try {
      const v = Number(localStorage.getItem(this._CHAVE_LARGURA));
      return v >= this._MINIMO ? Math.min(v, window.innerWidth - 16) : null;
    } catch (e) {
      return null;
    }
  },
  _gravarLargura(v) {
    try {
      if (v == null) localStorage.removeItem(this._CHAVE_LARGURA);
      else localStorage.setItem(this._CHAVE_LARGURA, String(Math.round(v)));
    } catch (e) { /* sem espaço no navegador: vale só agora */ }
  },
  _aplicarLargura(v = this._lerLargura()) {
    const gaveta = document.getElementById('drawer');
    gaveta.style.width = v != null ? `${v}px` : '';
    const expandido = v != null && v >= window.innerWidth - 20;
    const botao = document.getElementById('drawer-expandir');
    botao.setAttribute('aria-label', expandido ? 'Reduzir o painel' : 'Expandir o painel');
    botao.title = expandido ? 'Reduzir (volta ao tamanho anterior)' : 'Expandir para quase a tela toda';
    botao.querySelector('path').setAttribute('d', expandido ? 'M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7' : 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7');
  },

  /** liga abas, Esc, expandir e arrastar a borda (uma vez, no início) */
  ligar() {
    const body = document.getElementById('drawer-body');
    body.addEventListener('click', (e) => {
      const b = e.target.closest('[data-aba]');
      if (!b || b.dataset.aba === this._aba) return;
      this._aba = b.dataset.aba;
      this._desenhar();
      const nova = body.querySelector(`[data-aba="${this._aba}"]`);
      if (nova) nova.focus();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !document.getElementById('drawer').classList.contains('open')) return;
      const modal = document.getElementById('modal-overlay');
      if (modal && modal.classList.contains('open')) return;
      this.close();
    });
    let antes = null;
    document.getElementById('drawer-expandir').addEventListener('click', () => {
      const atual = this._lerLargura();
      const maximo = window.innerWidth - 16;
      if (atual != null && atual >= maximo - 4) {
        this._gravarLargura(antes);
        this._aplicarLargura(antes);
      } else {
        antes = atual;
        this._gravarLargura(maximo);
        this._aplicarLargura(maximo);
      }
    });
    const alca = document.getElementById('drawer-alca');
    alca.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      alca.setPointerCapture(e.pointerId);
      const gaveta = document.getElementById('drawer');
      const calc = (x) => Math.max(this._MINIMO, Math.min(window.innerWidth - 16, window.innerWidth - 8 - x));
      const mover = (ev) => (gaveta.style.width = `${calc(ev.clientX)}px`);
      const soltar = (ev) => {
        alca.removeEventListener('pointermove', mover);
        alca.removeEventListener('pointerup', soltar);
        this._gravarLargura(calc(ev.clientX));
        this._aplicarLargura();
      };
      alca.addEventListener('pointermove', mover);
      alca.addEventListener('pointerup', soltar);
    });
    alca.addEventListener('dblclick', () => {
      this._gravarLargura(null);
      this._aplicarLargura(null);
    });
  },

  /**
   * Fecha o painel
   */
  close() {
    document.getElementById('drawer-overlay').classList.remove('open');
    const gaveta = document.getElementById('drawer');
    gaveta.classList.remove('open');
    gaveta.setAttribute('aria-hidden', 'true');
    SGE.state.drawerColaborador = null;
  },
};
