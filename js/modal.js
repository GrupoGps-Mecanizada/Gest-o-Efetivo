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
        <label>Data da Mudança</label>
        <input type="date" id="modal-data" value="${new Date().toISOString().split('T')[0]}" />
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

    // Get new fields including effective_date
    const txData = document.getElementById('modal-data').value;
    const novoRegime = document.getElementById('modal-regime-dest').value;
    const motivo = document.getElementById('modal-motivo').value;
    const obs = document.getElementById('modal-obs').value.trim();

    const supOld = colaborador.supervisor;
    const regOld = colaborador.regime || '—';

    // Register movement locally first for optimistic UI response
    const mov = {
      colaborador_id: colaborador.id,
      colaborador_nome: colaborador.nome,
      supervisor_origem: supOld,
      supervisor_destino: supervisorDestino,
      regime_origem: regOld,
      regime_destino: novoRegime || '—',
      motivo: motivo,
      observacao: obs,
      effective_date: txData,
      created_at: new Date().toISOString(),
      usuario: SGE.auth.currentUser ? (SGE.auth.currentUser.nome || SGE.auth.currentUser.usuario) : SGE.CONFIG.usuario
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
   * Open edit modal with Setor OR Equipamento field based on category
   */
  openEdit(colaborador) {
    SGE.state.modalContext = 'edit';
    // Store the ID so we can find the correct object after reload
    SGE.state._editingColabId = colaborador.id;

    const isGestao = colaborador.categoria === 'GESTAO';

    const header = document.querySelector('.modal-header');
    header.innerHTML = `
      <div class="modal-title">Editar Colaborador</div>
      <div class="modal-subtitle">${colaborador.nome} (${colaborador.matricula_gps || 'S/ MAT'})</div>
    `;

    // Build combined Alocacao options
    const setorOptions = (SGE.state.setores || [])
      .filter(s => s.status === 'ATIVO')
      .map(s => {
        const isSelected = s.id === colaborador.setor_id;
        return `<option value="ST:${s.id}" ${isSelected ? 'selected' : ''}>${s.nome}</option>`;
      })
      .join('');

    const equipOptions = (SGE.state.equipamentos || []).map(e => {
      const equipName = `${e.sigla}-${e.numero || ''}`.replace(/-$/, '');
      const isSelected = !colaborador.setor_id && equipName === colaborador.equipamento;
      return `<option value="EQ:${equipName}" ${isSelected ? 'selected' : ''}>${equipName}</option>`;
    }).join('');

    const body = document.querySelector('.modal-body');
    body.innerHTML = `
      <div class="edit-modal-form">
        <div class="form-field">
          <label>Nome</label>
          <input type="text" id="edit-nome" value="${colaborador.nome}" />
        </div>
        <div class="form-field">
          <label>CR</label>
          <input type="text" id="edit-cr" value="${colaborador.cr || ''}" />
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
        <div class="form-field">
          <label>Categoria</label>
          <select id="edit-categoria">
            <option value="OPERACIONAL" ${!isGestao ? 'selected' : ''}>Operacional</option>
            <option value="GESTAO" ${isGestao ? 'selected' : ''}>Gestão</option>
          </select>
        </div>
        <div class="form-field" id="edit-wrapper-alocacao" style="grid-column:1/-1;">
          <label>Alocação (Equipamento ou Setor)</label>
          <select id="edit-alocacao">
            <option value="NONE:">Sem Alocação</option>
            <optgroup label="Equipamentos">
              ${equipOptions}
            </optgroup>
            <optgroup label="Setores">
              ${setorOptions}
            </optgroup>
          </select>
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

    // No category toggle required anymore: Sector and Equipment can be independently set.

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
   * Confirm edit — reads fresh values from form and sends to API
   */
  async confirmEdit(colaborador) {
    // Read values from form
    const nome = document.getElementById('edit-nome').value.trim();
    const cr = document.getElementById('edit-cr').value.trim();
    const funcao = document.getElementById('edit-funcao').value;
    const regime = document.getElementById('edit-regime').value;
    const status = document.getElementById('edit-status').value;
    const categoria = document.getElementById('edit-categoria').value;
    const alocacao = document.getElementById('edit-alocacao').value;
    const telefone = document.getElementById('edit-telefone').value.trim();
    const matricula_usiminas = document.getElementById('edit-mat-usiminas').value.trim();
    const matricula_gps = document.getElementById('edit-mat-gps').value.trim();

    let equipamento = 'SEM EQUIPAMENTO';
    let setorId = null;
    let setorNome = 'SEM SETOR';

    if (alocacao.startsWith('EQ:')) {
      equipamento = alocacao.substring(3);
    } else if (alocacao.startsWith('ST:')) {
      setorId = alocacao.substring(3);
      const sObj = (SGE.state.setores || []).find(s => s.id === setorId);
      if (sObj) setorNome = sObj.nome;
    }

    // Update the in-memory object
    colaborador.nome = nome;
    colaborador.cr = cr;
    colaborador.funcao = funcao;
    colaborador.regime = regime;
    colaborador.status = status;
    colaborador.categoria = categoria;
    colaborador.telefone = telefone;
    colaborador.matricula_usiminas = matricula_usiminas;
    colaborador.matricula_gps = matricula_gps;

    colaborador.equipamento = equipamento || 'SEM EQUIPAMENTO';
    colaborador.setor_id = setorId;
    colaborador.setor = setorNome;

    SGE.modal.close();
    SGE.helpers.updateStats();
    SGE.kanban.render();
    SGE.helpers.toast(`${colaborador.nome} atualizado`);

    // Sync with backend — pass complete data with explicit setor_id
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
               onmouseout="this.style.borderColor='var(--border)'"">
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
    SGE.state._editingColabId = null;
  },

  /**
   * Universal Confirm Modal
   */
  confirm({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', confirmColor = 'accent', onConfirm, onCancel }) {
    SGE.state.modalContext = 'confirm';

    const header = document.querySelector('.modal-header');
    header.innerHTML = `
      <div class="modal-title">${title}</div>
    `;

    const body = document.querySelector('.modal-body');
    body.innerHTML = `
      <div style="font-size: 14px; color: var(--text-2); margin-top: 10px; line-height: 1.5;">
        ${message}
      </div>
    `;

    const confirmBg = confirmColor === 'danger' ? 'var(--red)' : `var(--${confirmColor})`;

    const footer = document.querySelector('.modal-footer');
    footer.innerHTML = `
      <button class="btn-cancel" id="modal-cancel">${cancelText}</button>
      <button class="btn-confirm" id="modal-confirm" style="background: ${confirmBg}">${confirmText}</button>
    `;

    document.getElementById('modal-cancel').addEventListener('click', () => {
      if (onCancel) onCancel();
      SGE.modal.close();
    });

    document.getElementById('modal-confirm').addEventListener('click', () => {
      if (onConfirm) onConfirm();
      SGE.modal.close();
    });

    document.getElementById('modal-overlay').classList.add('open');
  },

  /**
   * Universal Dynamic Form Modal (Replaces window.prompt)
   */
  openDynamic({ title, subtitle = '', fields, okText = 'Salvar', onConfirm, onDelete }) {
    SGE.state.modalContext = 'dynamic';

    const header = document.querySelector('.modal-header');
    header.innerHTML = `
      <div class="modal-title">${title}</div>
      ${subtitle ? `<div class="modal-subtitle">${subtitle}</div>` : ''}
    `;

    const fieldsHtml = fields.map((f, i) => {
      let inputHtml = '';
      if (f.type === 'select') {
        inputHtml = `<select id="dyn-field-${i}">
          ${f.options.map(opt => `<option value="${opt.value}" ${opt.value === f.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
        </select>`;
      } else if (f.type === 'multiselect') {
        inputHtml = `<div class="multiselect-container" style="max-height:180px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:12px;background:var(--bg-2)">
          <input type="text" placeholder="Filtrar..." style="margin-bottom:8px;padding:6px;width:100%;font-size:12px;border:1px solid var(--border);border-radius:4px;" onkeyup="
            const q = this.value.toLowerCase();
            this.parentElement.querySelectorAll('label').forEach(lbl => {
               lbl.style.display = lbl.innerText.toLowerCase().includes(q) ? 'flex' : 'none';
            })
          "/>
          ${f.options.map(opt => `<label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer;font-size:13px;color:var(--text-1)"><input type="checkbox" class="dyn-multi-${i}" value="${opt.value}" ${f.values && f.values.includes(opt.value) ? 'checked' : ''} /> ${opt.label}</label>`).join('')}
        </div>`;
      } else {
        // text, color, number, date
        inputHtml = `<input type="${f.type || 'text'}" id="dyn-field-${i}" value="${f.value || ''}" placeholder="${f.placeholder || ''}" ${f.uppercase ? 'style="text-transform:uppercase"' : ''} ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.max !== undefined ? `max="${f.max}"` : ''} />`;
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
      ${onDelete ? `<button class="btn-cancel" style="color:var(--red); border-color:var(--red)40; margin-right:auto" id="modal-delete">Excluir</button>` : ''}
      <button class="btn-cancel" id="modal-cancel">Cancelar</button>
      <button class="btn-confirm" id="modal-confirm">${okText}</button>
    `;

    document.getElementById('modal-cancel').addEventListener('click', SGE.modal.close);

    if (onDelete) {
      document.getElementById('modal-delete').addEventListener('click', async () => {
        const btn = document.getElementById('modal-delete');
        btn.disabled = true;
        btn.textContent = 'Excluindo...';

        try {
          const res = await onDelete();
          if (res !== false) {
            SGE.modal.close();
          } else {
            btn.disabled = false;
            btn.textContent = 'Excluir';
          }
        } catch (e) {
          btn.disabled = false;
          btn.textContent = 'Excluir';
        }
      });
    }

    document.getElementById('modal-confirm').addEventListener('click', async () => {
      // Collect values
      const values = fields.reduce((acc, f, i) => {
        if (f.type === 'multiselect') {
          const checked = Array.from(document.querySelectorAll(`.dyn-multi-${i}:checked`)).map(cb => cb.value);
          acc[f.id] = checked;
        } else {
          let val = document.getElementById(`dyn-field-${i}`).value;
          if (f.uppercase) val = val.toUpperCase();
          acc[f.id] = val;
        }
        return acc;
      }, {});

      if (onConfirm) {
        const btn = document.getElementById('modal-confirm');
        const oldText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Aguarde...';

        try {
          // If onConfirm returns explicit false, don't close
          const res = await onConfirm(values);
          if (res !== false) {
            SGE.modal.close();
          } else {
            btn.disabled = false;
            btn.textContent = oldText;
          }
        } catch (e) {
          btn.disabled = false;
          btn.textContent = oldText;
        }
      } else {
        SGE.modal.close();
      }
    });

    document.getElementById('modal-overlay').classList.add('open');
  }
};
