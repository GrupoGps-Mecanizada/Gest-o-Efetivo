'use strict';

/**
 * SGE — Modal Component
 * Handles move confirmation, edit, and move selector modals
 */
window.SGE = window.SGE || {};

SGE.modal = {
  /**
   * Open move confirmation modal
   */
  openMove(colaborador, supervisorDestino, source = 'btn') {
    SGE.state.pendingMove = { colaborador, supervisorDestino, source };
    SGE.state.modalContext = 'move';

    const supOld = SGE.state.supervisores.find(s => s.nome === colaborador.supervisor);
    const supNew = SGE.state.supervisores.find(s => s.nome === supervisorDestino);

    const header = document.querySelector('.modal-header');
    header.innerHTML = `
      <div class="modal-title">Confirmar Movimentação</div>
      <div class="modal-subtitle">${colaborador.nome} (${colaborador.id})</div>
    `;

    const body = document.querySelector('.modal-body');
    body.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <div class="modal-colname">${colaborador.supervisor}</div>
        <div class="move-arrow">
          <svg width="20" height="12" viewBox="0 0 20 12" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M0 6h18M14 1l5 5-5 5"/>
          </svg>
        </div>
        <div class="modal-colname">${supervisorDestino}</div>
      </div>
      <div class="form-field">
        <label>Regime Destino</label>
        <select id="modal-regime-dest">
          ${SGE.CONFIG.regimes.map(r =>
      `<option value="${r}" ${r === (supNew ? supNew.regime_padrao : '') ? 'selected' : ''}>${r}</option>`
    ).join('')}
        </select>
      </div>
      <div class="form-field">
        <label>Motivo da Movimentação</label>
        <select id="modal-motivo">
          ${SGE.CONFIG.motivos.map(m => `<option value="${m}">${m}</option>`).join('')}
        </select>
      </div>
      <div class="form-field">
        <label>Observação (opcional)</label>
        <input type="text" id="modal-obs" placeholder="Observação..." />
      </div>
    `;

    const footer = document.querySelector('.modal-footer');
    footer.innerHTML = `
      <button class="btn-cancel" id="modal-cancel">Cancelar</button>
      <button class="btn-confirm" id="modal-confirm">Confirmar Movimentação</button>
    `;

    document.getElementById('modal-cancel').addEventListener('click', SGE.modal.close);
    document.getElementById('modal-confirm').addEventListener('click', SGE.modal.confirmMove);

    document.getElementById('modal-overlay').classList.add('open');
  },

  /**
   * Confirm a move
   */
  async confirmMove() {
    const pending = SGE.state.pendingMove;
    if (!pending) return;

    const { colaborador, supervisorDestino } = pending;
    const novoRegime = document.getElementById('modal-regime-dest').value;
    const motivo = document.getElementById('modal-motivo').value;
    const obs = document.getElementById('modal-obs').value.trim();

    const supOld = colaborador.supervisor;
    const regOld = colaborador.regime;

    // Register movement
    const mov = {
      colaborador_id: colaborador.id,
      colaborador_nome: colaborador.nome,
      supervisor_origem: supOld,
      supervisor_destino: supervisorDestino,
      regime_origem: regOld,
      regime_destino: novoRegime,
      motivo: motivo,
      observacao: obs,
      created_at: new Date().toISOString(),
      usuario: SGE.CONFIG.usuario
    };

    SGE.state.movimentacoes.unshift(mov);

    // Update collaborator
    colaborador.supervisor = supervisorDestino;
    colaborador.regime = novoRegime;

    SGE.modal.close();
    SGE.helpers.updateStats();
    SGE.kanban.render();
    SGE.helpers.toast(`${colaborador.nome} movido para ${supervisorDestino}`);

    // Sync with backend
    await SGE.api.syncMove(mov);
  },

  /**
   * Open edit modal
   */
  openEdit(colaborador) {
    SGE.state.modalContext = 'edit';

    const header = document.querySelector('.modal-header');
    header.innerHTML = `
      <div class="modal-title">Editar Colaborador</div>
      <div class="modal-subtitle">${colaborador.nome} (${colaborador.id})</div>
    `;

    const body = document.querySelector('.modal-body');
    body.innerHTML = `
      <div class="edit-modal-form">
        <div class="form-field">
          <label>Nome</label>
          <input type="text" id="edit-nome" value="${colaborador.nome}" />
        </div>
        <div class="form-field">
          <label>Função</label>
          <select id="edit-funcao">
            ${SGE.CONFIG.funcoes.map(f =>
      `<option value="${f}" ${f === colaborador.funcao ? 'selected' : ''}>${f}</option>`
    ).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Regime</label>
          <select id="edit-regime">
            ${SGE.CONFIG.regimes.map(r =>
      `<option value="${r}" ${r === colaborador.regime ? 'selected' : ''}>${r}</option>`
    ).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Status</label>
          <select id="edit-status">
            ${SGE.CONFIG.statuses.map(s =>
      `<option value="${s}" ${s === colaborador.status ? 'selected' : ''}>${s}</option>`
    ).join('')}
          </select>
        </div>
        <div class="form-field" style="grid-column:1/-1">
          <label>Equipamento</label>
          <input type="text" id="edit-equipamento" value="${colaborador.equipamento || ''}" />
        </div>
        <div class="form-field">
          <label>Telefone</label>
          <input type="text" id="edit-telefone" value="${colaborador.telefone || ''}" placeholder="(XX) XXXXX-XXXX" />
        </div>
        <div class="form-field">
          <label>Mat. Usiminas</label>
          <input type="text" id="edit-mat-usiminas" value="${colaborador.matricula_usiminas || ''}" />
        </div>
        <div class="form-field">
          <label>Mat. GPS</label>
          <input type="text" id="edit-mat-gps" value="${colaborador.matricula_gps || ''}" />
        </div>
      </div>
    `;

    const footer = document.querySelector('.modal-footer');
    footer.innerHTML = `
      <button class="btn-cancel" id="modal-cancel">Cancelar</button>
      <button class="btn-confirm" id="modal-confirm">Salvar Alterações</button>
    `;

    document.getElementById('modal-cancel').addEventListener('click', SGE.modal.close);
    document.getElementById('modal-confirm').addEventListener('click', () => SGE.modal.confirmEdit(colaborador));

    document.getElementById('modal-overlay').classList.add('open');
  },

  /**
   * Confirm edit
   */
  async confirmEdit(colaborador) {
    colaborador.nome = document.getElementById('edit-nome').value.trim();
    colaborador.funcao = document.getElementById('edit-funcao').value;
    colaborador.regime = document.getElementById('edit-regime').value;
    colaborador.status = document.getElementById('edit-status').value;
    colaborador.equipamento = document.getElementById('edit-equipamento').value.trim();
    colaborador.telefone = document.getElementById('edit-telefone').value.trim();
    colaborador.matricula_usiminas = document.getElementById('edit-mat-usiminas').value.trim();
    colaborador.matricula_gps = document.getElementById('edit-mat-gps').value.trim();

    SGE.modal.close();
    SGE.helpers.updateStats();
    SGE.kanban.render();
    SGE.helpers.toast(`${colaborador.nome} atualizado`);

    // Sync with backend
    await SGE.api.syncEditColaborador(colaborador);
  },

  /**
   * Open move selector modal (choose destination supervisor)
   */
  openMoveSelector(colaborador) {
    SGE.state.modalContext = 'moveSelector';

    const header = document.querySelector('.modal-header');
    header.innerHTML = `
      <div class="modal-title">Mover Colaborador</div>
      <div class="modal-subtitle">Selecione o supervisor de destino para ${colaborador.nome}</div>
    `;

    const supAtivos = SGE.state.supervisores.filter(s => s.ativo && s.nome !== colaborador.supervisor);
    const body = document.querySelector('.modal-body');
    body.innerHTML = `
      <div class="settings-grid">
        ${supAtivos.map(s => `
          <div class="sup-card" style="cursor:pointer;transition:all .15s" data-sup="${s.nome}"
               onmouseover="this.style.borderColor='var(--accent)'"
               onmouseout="this.style.borderColor='var(--border)'">
            <div class="sup-dot active"></div>
            <div class="sup-name">${s.nome}</div>
            <div class="sup-regime">${s.regime_padrao}</div>
          </div>
        `).join('')}
      </div>
    `;

    const footer = document.querySelector('.modal-footer');
    footer.innerHTML = `<button class="btn-cancel" id="modal-cancel">Cancelar</button>`;

    document.getElementById('modal-cancel').addEventListener('click', SGE.modal.close);

    // Click handler for supervisor selection
    body.querySelectorAll('.sup-card').forEach(card => {
      card.addEventListener('click', () => {
        const sup = card.dataset.sup;
        SGE.modal.close();
        SGE.modal.openMove(colaborador, sup, 'btn');
      });
    });

    document.getElementById('modal-overlay').classList.add('open');
  },

  /**
   * Close modal
   */
  close() {
    document.getElementById('modal-overlay').classList.remove('open');
    SGE.state.pendingMove = null;
    SGE.state.modalContext = null;
  },

  /**
   * Universal Confirmation Modal (Replaces window.confirm)
   */
  confirm({ title = 'Confirmar Ação', message, confirmText = 'Confirmar', confirmColor = 'danger', onConfirm }) {
    SGE.state.modalContext = 'confirm';

    const header = document.querySelector('.modal-header');
    header.innerHTML = `
      <div class="modal-title">${title}</div>
    `;

    const body = document.querySelector('.modal-body');
    body.innerHTML = `
      <div class="modal-confirm-msg">${message}</div>
    `;

    const btnClass = confirmColor === 'danger' ? 'btn-danger-confirm' : 'btn-confirm';

    const footer = document.querySelector('.modal-footer');
    footer.innerHTML = `
      <button class="btn-cancel" id="modal-cancel">Cancelar</button>
      <button class="${btnClass}" id="modal-confirm">${confirmText}</button>
    `;

    document.getElementById('modal-cancel').addEventListener('click', SGE.modal.close);
    document.getElementById('modal-confirm').addEventListener('click', () => {
      if (onConfirm) onConfirm();
      SGE.modal.close();
    });

    document.getElementById('modal-overlay').classList.add('open');
  },

  /**
   * Universal Dynamic Form Modal (Replaces window.prompt)
   */
  openDynamic({ title, subtitle = '', fields, okText = 'Salvar', onConfirm }) {
    SGE.state.modalContext = 'dynamic';

    const header = document.querySelector('.modal-header');
    header.innerHTML = `
      <div class="modal-title">${title}</div>
      ${subtitle ? `<div class="modal-subtitle">${subtitle}</div>` : ''}
    `;

    // Generate fields DHTML
    const fieldsHtml = fields.map((f, i) => {
      let inputHtml = '';
      if (f.type === 'select') {
        inputHtml = `<select id="dyn-field-${i}">
          ${f.options.map(opt => `<option value="${opt.value}" ${opt.value === f.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
        </select>`;
      } else {
        // text, color, number
        inputHtml = `<input type="${f.type || 'text'}" id="dyn-field-${i}" value="${f.value || ''}" placeholder="${f.placeholder || ''}" ${f.uppercase ? 'style="text-transform:uppercase"' : ''} />`;
      }
      return `
        <div>
          <label>${f.label}</label>
          ${inputHtml}
        </div>
      `;
    }).join('');

    const body = document.querySelector('.modal-body');
    body.innerHTML = `
      <div class="modal-dynamic-form">
        ${fieldsHtml}
      </div>
    `;

    const footer = document.querySelector('.modal-footer');
    footer.innerHTML = `
      <button class="btn-cancel" id="modal-cancel">Cancelar</button>
      <button class="btn-confirm" id="modal-confirm">${okText}</button>
    `;

    document.getElementById('modal-cancel').addEventListener('click', SGE.modal.close);
    document.getElementById('modal-confirm').addEventListener('click', () => {
      // Collect values
      const values = fields.reduce((acc, f, i) => {
        let val = document.getElementById(`dyn-field-${i}`).value;
        if (f.uppercase) val = val.toUpperCase();
        acc[f.id] = val;
        return acc;
      }, {});

      if (onConfirm) {
        // If onConfirm returns explicit false, don't close
        if (onConfirm(values) !== false) {
          SGE.modal.close();
        }
      } else {
        SGE.modal.close();
      }
    });

    document.getElementById('modal-overlay').classList.add('open');
  }
};
