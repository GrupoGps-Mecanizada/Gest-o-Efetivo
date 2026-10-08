'use strict';

/**
 * SGE — Vagas (linhas das abas dos supervisores na Matriz)
 * Vaga = supervisor + equipamento (tabela gps_mec.efetivo_gps_mec_vagas). Um equipamento é compartilhado
 * entre turnos, por isso a vaga é do par. A vaga aparece na Matriz mesmo sem ninguém alocado.
 * Aqui: nomes dos equipamentos, vagas de cada supervisor e as janelas de adicionar e remover vaga.
 */
window.SGE = window.SGE || {};

SGE.vagas = {
  /** código do equipamento como o sistema guarda no colaborador ("AP-01", "MT") */
  codigo(eq) {
    return `${eq.sigla}-${eq.numero || ''}`.replace(/-$/, '');
  },

  /** nome como aparece na planilha ("AP 01", "AV 02 - EQUIP 1") — igual ao da Matriz; só o 1º traço separa sigla e número */
  rotulo(eq) {
    return this.codigo(eq).toLocaleUpperCase('pt-BR').replace('-', ' ');
  },

  equipamento(id) {
    return (SGE.state.equipamentos || []).find((e) => e.id === id) || null;
  },

  porCodigo(codigo) {
    return (SGE.state.equipamentos || []).find((e) => this.codigo(e) === codigo) || null;
  },

  supervisor(nome) {
    return (SGE.state.supervisores || []).find((s) => s.nome === nome) || null;
  },

  /** vagas de um supervisor (pelo nome), com o equipamento, na ordem natural das placas */
  doSupervisor(nomeSup) {
    const sup = this.supervisor(nomeSup);
    if (!sup) return [];
    return (SGE.state.vagas || [])
      .filter((v) => v.supervisor_id === sup.id)
      .map((v) => ({ vaga: v, eq: this.equipamento(v.equipment_id) }))
      .filter((x) => x.eq)
      .sort((a, b) => this.rotulo(a.eq).localeCompare(this.rotulo(b.eq), 'pt-BR', { numeric: true }));
  },

  /** quantas pessoas (fora desligados) estão no equipamento com esse supervisor */
  ocupacao(nomeSup, eq) {
    const codigo = this.codigo(eq);
    return (SGE.state.colaboradores || []).filter((c) => c.supervisor === nomeSup && c.equipamento === codigo && c.status !== 'DESLIGADO').length;
  },

  /** garante a vaga (usado ao mover alguém para um equipamento que ainda não era vaga do supervisor) */
  async garantir(nomeSup, eq) {
    const sup = this.supervisor(nomeSup);
    if (!sup || !eq) return;
    if ((SGE.state.vagas || []).some((v) => v.supervisor_id === sup.id && v.equipment_id === eq.id)) return;
    await SGE.api.syncVaga('add', { supervisor_id: sup.id, equipment_id: eq.id }, { silencioso: true });
  },

  _opcoesSupervisor(selecionado) {
    const esc = SGE.helpers.escapeHtml;
    return (SGE.state.supervisores || [])
      .filter((s) => s.ativo && s.nome !== 'SEM SUPERVISOR')
      .map((s) => `<option value="${esc(s.nome)}"${s.nome === selecionado ? ' selected' : ''}>${esc(s.nome)}</option>`)
      .join('');
  },

  /** janela "Adicionar vaga": supervisor (já vem o da aba aberta) + equipamento */
  abrirAdicionar(nomeSup) {
    if (!SGE.auth.hasRole('GESTAO')) return SGE.helpers.toast('Seu perfil não pode mudar as vagas.', 'error');
    const esc = SGE.helpers.escapeHtml;
    const corpo = document.createElement('div');
    const desenharEquip = () => {
      const sup = corpo.querySelector('#vaga-sup').value;
      const ja = new Set(this.doSupervisor(sup).map((x) => x.eq.id));
      const tipos = SGE.CONFIG.equipTipos || {};
      const grupos = new Map();
      for (const e of SGE.state.equipamentos || []) {
        if (ja.has(e.id)) continue;
        const g = (tipos[e.sigla] && tipos[e.sigla].nome) || e.sigla;
        if (!grupos.has(g)) grupos.set(g, []);
        grupos.get(g).push(e);
      }
      const html = [...grupos.keys()]
        .sort((a, b) => a.localeCompare(b, 'pt-BR'))
        .map((g) => `<optgroup label="${esc(g)}">${grupos
          .get(g)
          .sort((a, b) => this.rotulo(a).localeCompare(this.rotulo(b), 'pt-BR', { numeric: true }))
          .map((e) => `<option value="${esc(e.id)}">${esc(this.rotulo(e))}</option>`)
          .join('')}</optgroup>`)
        .join('');
      corpo.querySelector('#vaga-eq').innerHTML = html || '<option value="">Todos os equipamentos já são vagas deste supervisor</option>';
    };
    corpo.innerHTML = `
      <p class="ac-texto">A vaga vira uma linha na aba do supervisor, mesmo sem ninguém nela.</p>
      <div class="form-field"><label for="vaga-sup">Supervisor</label><select id="vaga-sup">${this._opcoesSupervisor(nomeSup)}</select></div>
      <div class="form-field"><label for="vaga-eq">Equipamento</label><select id="vaga-eq"></select></div>
      <p class="ac-texto"><small>Equipamento novo (que ainda não existe na lista) se cadastra em Configurações › Vagas.</small></p>`;
    corpo.querySelector('#vaga-sup').addEventListener('change', desenharEquip);
    desenharEquip();
    SGE.modal.open('Adicionar vaga', corpo, [
      { label: 'Cancelar', action: () => SGE.modal.close() },
      {
        label: 'Adicionar vaga',
        class: 'btn-confirm',
        action: async () => {
          const sup = this.supervisor(corpo.querySelector('#vaga-sup').value);
          const eqId = corpo.querySelector('#vaga-eq').value;
          if (!sup || !eqId) return SGE.helpers.toast('Escolha o supervisor e o equipamento.', 'error');
          const ok = await SGE.api.syncVaga('add', { supervisor_id: sup.id, equipment_id: eqId });
          if (ok) {
            SGE.modal.close();
            SGE.helpers.toast(`Vaga ${this.rotulo(this.equipamento(eqId))} adicionada em ${sup.nome}.`, 'success');
          }
        },
      },
    ]);
  },

  /** janela "Remover vaga": só sai vaga vazia (quem está nela precisa ser movido antes) */
  abrirRemover(nomeSup) {
    if (!SGE.auth.hasRole('GESTAO')) return SGE.helpers.toast('Seu perfil não pode mudar as vagas.', 'error');
    const esc = SGE.helpers.escapeHtml;
    const corpo = document.createElement('div');
    const desenhar = () => {
      const sup = corpo.querySelector('#vaga-sup').value;
      const lista = this.doSupervisor(sup);
      corpo.querySelector('#vaga-lista').innerHTML = lista.length
        ? lista
            .map(({ vaga, eq }) => {
              const n = this.ocupacao(sup, eq);
              return `<label class="vaga-item${n ? ' ocupada' : ''}"><input type="radio" name="vaga" value="${esc(vaga.id)}"${n ? ' disabled' : ''}>
                <b>${esc(this.rotulo(eq))}</b><span>${n ? `${n} pessoa(s) — mova antes de remover` : 'vazia'}</span></label>`;
            })
            .join('')
        : '<p class="ac-texto">Este supervisor não tem vagas cadastradas.</p>';
    };
    corpo.innerHTML = `
      <div class="form-field"><label for="vaga-sup">Supervisor</label><select id="vaga-sup">${this._opcoesSupervisor(nomeSup)}</select></div>
      <div id="vaga-lista" class="vaga-lista"></div>`;
    corpo.querySelector('#vaga-sup').addEventListener('change', desenhar);
    desenhar();
    SGE.modal.open('Remover vaga', corpo, [
      { label: 'Cancelar', action: () => SGE.modal.close() },
      {
        label: 'Remover vaga',
        class: 'btn-confirm',
        action: async () => {
          const marcada = corpo.querySelector('input[name="vaga"]:checked');
          if (!marcada) return SGE.helpers.toast('Escolha uma vaga vazia.', 'error');
          const ok = await SGE.api.syncVaga('delete', { id: marcada.value });
          if (ok) {
            SGE.modal.close();
            SGE.helpers.toast('Vaga removida.', 'success');
          }
        },
      },
    ]);
  },
};
