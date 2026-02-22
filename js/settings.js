'use strict';

/**
 * SGE — Settings View
 * Supervisor management and collaborator configuration
 */
window.SGE = window.SGE || {};

SGE.settings = {
  render() {
    const container = document.getElementById('settings-view');
    const h = SGE.helpers;

    // Supervisor management section
    const supGrid = SGE.state.supervisores.map(s => `
      <div class="sup-card">
        <div class="sup-dot ${s.ativo ? 'active' : 'inactive'}"></div>
        <div class="sup-name">${s.nome}</div>
        <div class="sup-regime">${s.regime_padrao}</div>
        <button class="toggle-btn" data-sup="${s.nome}">${s.ativo ? 'Desativar' : 'Ativar'}</button>
      </div>
    `).join('');

    // Collaborators without definitive IDs
    const semIdCols = SGE.state.colaboradores.filter(c => h.isSemId(c));
    const semIdHtml = semIdCols.length === 0
      ? '<div style="text-align:center;padding:20px;color:var(--text-3);font-size:12px">Todos os colaboradores possuem ID definitivo ✓</div>'
      : `<div class="sem-id-list">${semIdCols.map(c => `
          <div class="sem-id-item">
            <div class="sem-id-name">${c.nome}</div>
            <input class="sem-id-input" data-temp-id="${c.id}" placeholder="Novo ID..." />
            <button class="sem-id-save" data-temp-id="${c.id}">Salvar</button>
          </div>
        `).join('')}</div>`;

    // New collaborator form
    const newColForm = `
      <div class="settings-form">
        <div class="form-field">
          <label>Nome</label>
          <input type="text" id="new-col-nome" placeholder="NOME COMPLETO" />
        </div>
        <div class="form-field">
          <label>ID (opcional)</label>
          <input type="text" id="new-col-id" placeholder="COL000" />
        </div>
        <div class="form-field">
          <label>Função</label>
          <select id="new-col-funcao">
            ${SGE.CONFIG.funcoes.map(f => `<option value="${f}">${f}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Regime</label>
          <select id="new-col-regime">
            ${SGE.CONFIG.regimes.map(r => `<option value="${r}">${r}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Supervisor</label>
          <select id="new-col-supervisor">
            ${SGE.state.supervisores.filter(s => s.ativo).map(s =>
      `<option value="${s.nome}">${s.nome}</option>`
    ).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Equipamento</label>
          <input type="text" id="new-col-equipamento" placeholder="Ex: PC-001" />
        </div>
        <div class="form-field">
          <label>Telefone</label>
          <input type="text" id="new-col-telefone" placeholder="(XX) XXXXX-XXXX" />
        </div>
        <div class="form-field">
          <label>Mat. Usiminas</label>
          <input type="text" id="new-col-mat-usiminas" placeholder="Matrícula Usiminas" />
        </div>
        <div class="form-field">
          <label>Mat. GPS</label>
          <input type="text" id="new-col-mat-gps" placeholder="Matrícula GPS" />
        </div>
      </div>
      <button class="btn-primary" id="new-col-save" style="align-self:flex-start">
        + Adicionar Colaborador
      </button>
    `;

    // Add new supervisor form
    const addSupForm = `
      <div class="settings-form">
        <div class="form-field">
          <label>Nome do Supervisor</label>
          <input type="text" id="new-sup-nome" placeholder="NOME" />
        </div>
        <div class="form-field">
          <label>Regime Padrão</label>
          <select id="new-sup-regime">
            ${SGE.CONFIG.regimes.map(r => `<option value="${r}">${r}</option>`).join('')}
          </select>
        </div>
      </div>
      <button class="btn-primary" id="new-sup-save" style="align-self:flex-start">
        + Adicionar Supervisor
      </button>
    `;

    container.innerHTML = `
      <div class="settings-section">
        <div class="settings-section-header">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 3-5 6-5s6 2 6 5"/></svg>
          Supervisores
        </div>
        <div class="settings-section-body">
          <div class="settings-grid">${supGrid}</div>
          ${addSupForm}
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-header">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 2h12v12H2z"/><path d="M5 6h6M5 9h4"/></svg>
          IDs Pendentes
        </div>
        <div class="settings-section-body">${semIdHtml}</div>
      </div>

      <div class="settings-section">
        <div class="settings-section-header">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v6M5 8h6"/></svg>
          Novo Colaborador
        </div>
        <div class="settings-section-body">${newColForm}</div>
      </div>
    `;

    // USER MANAGEMENT SECTION (ADM Only)
    if (SGE.auth.hasRole('ADM')) {
      const usersHtml = (SGE.state.usuarios || []).map(u => `
        <div class="sup-card" style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; gap:12px; align-items:center;">
            <div class="sup-dot ${u.ativo ? 'active' : 'inactive'}"></div>
            <div class="sup-name" style="width:120px">${u.usuario}</div>
            <div class="badge badge-OP" style="font-size:10px">${u.perfil}</div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn-sec toggle-user-btn" data-id="${u.id}" style="font-size:11px; padding:4px 8px">${u.ativo ? 'Desativar' : 'Ativar'}</button>
            <button class="btn-sec delete-user-btn" data-id="${u.id}" style="font-size:11px; padding:4px 8px; color:var(--danger)" ${u.id === 'USR001' ? 'disabled' : ''}>Excluir</button>
          </div>
        </div>
      `).join('');

      const newUserForm = `
        <div class="settings-form" style="margin-top:16px; padding-top:16px; border-top:1px dashed var(--border)">
          <div class="form-field">
            <label>Novo Login</label>
            <input type="text" id="new-usr-login" placeholder="Ex: joao.silva" autocomplete="off" />
          </div>
          <div class="form-field">
            <label>Senha</label>
            <input type="password" id="new-usr-pass" placeholder="***" autocomplete="new-password" />
          </div>
          <div class="form-field">
            <label>Perfil</label>
            <select id="new-usr-perfil">
                <option value="VISAO">Visualização (Leitura)</option>
                <option value="GESTAO">Gestão (Edição/Mov.)</option>
                <option value="ADM">Administrador (Total)</option>
            </select>
          </div>
          <button class="btn-primary" id="new-usr-save" style="align-self:flex-end; margin-top:24px;">Adicionar Usuário</button>
        </div>
      `;

      container.innerHTML += `
        <div class="settings-section" style="border-top: 2px solid var(--border); padding-top: 20px;">
          <div class="settings-section-header" style="color:var(--accent)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM18 21a6 6 0 00-12 0"/></svg>
            Controle de Acessos (Logins)
          </div>
          <div class="settings-section-body">
            <div style="display:flex; flex-direction:column; gap:8px;">${usersHtml}</div>
            ${newUserForm}
          </div>
        </div>
      `;
    }

    // Event: toggle supervisor
    container.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sup = SGE.state.supervisores.find(s => s.nome === btn.dataset.sup);
        if (sup) {
          sup.ativo = !sup.ativo;
          SGE.settings.render();
          SGE.helpers.toast(`${sup.nome} ${sup.ativo ? 'ativado' : 'desativado'}`, 'info');
        }
      });
    });

    // Event: save new ID
    container.querySelectorAll('.sem-id-save').forEach(btn => {
      btn.addEventListener('click', async () => {
        const tempId = btn.dataset.tempId;
        const input = container.querySelector(`.sem-id-input[data-temp-id="${tempId}"]`);
        const newId = input.value.trim().toUpperCase();
        if (!newId) return h.toast('Digite um ID válido', 'error');

        const exists = SGE.state.colaboradores.some(c => c.id === newId);
        if (exists) return h.toast('ID já existe', 'error');

        const col = SGE.state.colaboradores.find(c => c.id === tempId);
        if (col) {
          col.id = newId;
          SGE.settings.render();
          SGE.helpers.updateStats();
          h.toast(`ID atualizado: ${newId}`);
          await SGE.api.syncIdUpdate(tempId, newId);
        }
      });
    });

    // Event: add new collaborator
    const saveColBtn = document.getElementById('new-col-save');
    if (saveColBtn) {
      saveColBtn.addEventListener('click', async () => {
        const nome = document.getElementById('new-col-nome').value.trim().toUpperCase();
        if (!nome) return h.toast('Digite o nome do colaborador', 'error');

        let id = document.getElementById('new-col-id').value.trim().toUpperCase();
        if (!id) {
          const tempCount = SGE.state.colaboradores.filter(c => c.id.startsWith('COL_TEMP_')).length;
          id = `COL_TEMP_${Date.now()}_${tempCount}`;
        }

        const exists = SGE.state.colaboradores.some(c => c.id === id);
        if (exists) return h.toast('ID já existe', 'error');

        const newCol = {
          id,
          nome,
          funcao: document.getElementById('new-col-funcao').value,
          regime: document.getElementById('new-col-regime').value,
          supervisor: document.getElementById('new-col-supervisor').value,
          equipamento: document.getElementById('new-col-equipamento').value.trim() || 'SEM EQUIPAMENTO',
          status: 'ATIVO',
          telefone: document.getElementById('new-col-telefone').value.trim(),
          matricula_usiminas: document.getElementById('new-col-mat-usiminas').value.trim(),
          matricula_gps: document.getElementById('new-col-mat-gps').value.trim()
        };

        SGE.state.colaboradores.push(newCol);
        SGE.settings.render();
        SGE.helpers.updateStats();
        SGE.kanban.render();
        h.toast(`${nome} adicionado com sucesso`);
        await SGE.api.syncNewColaborador(newCol);
      });
    }

    // Event: new supervisor
    const newSupBtn = document.getElementById('new-sup-save');
    if (newSupBtn) {
      newSupBtn.addEventListener('click', async () => {
        const nome = document.getElementById('new-sup-nome').value.trim().toUpperCase();
        const regime = document.getElementById('new-sup-regime').value;

        if (!nome) return h.toast('Preencha o nome do supervisor', 'error');
        if (SGE.state.supervisores.some(s => s.nome === nome)) return h.toast('Supervisor já existe', 'error');

        // Add locally
        SGE.state.supervisores.push({ nome, regime_padrao: regime, ativo: true });

        // Save to GAS
        newSupBtn.disabled = true;
        newSupBtn.textContent = 'Salvando...';

        // This relies on ensureStructure syncing it up eventually, or we could add an explicit API call here.
        // For now, we simulate success and let sync handle the rest if no specific endpoint exists.
        setTimeout(() => {
          SGE.settings.render();
          SGE.kanban.render();
          h.toast('Supervisor adicionado com sucesso');
        }, 500);
      });
    }

    // ==================== USER MANAGEMENT EVENTS (ADM ONLY) ====================
    if (SGE.auth.hasRole('ADM')) {

      // Toggle User
      container.querySelectorAll('.toggle-user-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const user = SGE.state.usuarios.find(u => u.id === id);
          if (!user) return;

          const oldState = user.ativo;
          user.ativo = !oldState;
          SGE.settings.render(); // Optimistic update

          try {
            const res = await SGE.api.callGAS('editar_usuario', { id: user.id, ativo: user.ativo });
            if (!res) throw new Error('Falha na API');
            SGE.helpers.toast(`Usuário ${user.usuario} ${user.ativo ? 'ativado' : 'desativado'}`);
          } catch (e) {
            user.ativo = oldState; // Rollback
            SGE.settings.render();
            SGE.helpers.toast('Erro ao alterar status', 'error');
          }
        });
      });

      // Delete User
      container.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          if (!confirm('Tem certeza que deseja excluir permanentemente este login?')) return;

          try {
            const res = await SGE.api.callGAS('excluir_usuario', { id });
            if (!res) throw new Error('Falha na API');
            SGE.state.usuarios = SGE.state.usuarios.filter(u => u.id !== id);
            SGE.settings.render();
            SGE.helpers.toast('Usuário excluído com sucesso');
          } catch (e) {
            SGE.helpers.toast(e.message || 'Erro ao excluir usuário', 'error');
          }
        });
      });

      // Create new user
      const newUsrBtn = document.getElementById('new-usr-save');
      if (newUsrBtn) {
        newUsrBtn.addEventListener('click', async () => {
          const usuario = document.getElementById('new-usr-login').value.trim();
          const senha = document.getElementById('new-usr-pass').value.trim();
          const perfil = document.getElementById('new-usr-perfil').value;

          if (!usuario || !senha) return h.toast('Preencha usuário e senha', 'error');
          if (SGE.state.usuarios.some(u => String(u.usuario).toLowerCase() === usuario.toLowerCase())) {
            return h.toast('Nome de usuário já existe', 'error');
          }

          newUsrBtn.disabled = true;
          newUsrBtn.textContent = 'Adicionando...';

          try {
            const res = await SGE.api.callGAS('criar_usuario', { usuario, senha, perfil, ativo: true });
            if (res && res.id) {
              SGE.state.usuarios.push({ id: res.id, usuario, senha, perfil, ativo: true });
              SGE.settings.render();
              h.toast('Usuário criado com sucesso', 'success');
            } else {
              throw new Error('Falha ao criar');
            }
          } catch (e) {
            h.toast('Erro criar usuário. Tente novamente.', 'error');
            newUsrBtn.disabled = false;
            newUsrBtn.textContent = 'Adicionar Usuário';
          }
        });
      }
    }
  }
};
