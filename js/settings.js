'use strict';

/**
 * SGE — Settings View
 * Supervisor management and collaborator configuration
 */
window.SGE = window.SGE || {};

SGE.settings = {
  render() {
    console.log('[SGE Settings] render() CALLED');
    const container = document.getElementById('settings-view');
    console.log('[SGE Settings] container found:', !!container);
    if (!container) { console.error('[SGE Settings] Container #settings-view not found!'); return; }
    const h = SGE.helpers;
    console.log('[SGE Settings] Data counts -> supervisores:', SGE.state.supervisores.length, ', equipamentos:', SGE.state.equipamentos.length, ', funcoes:', SGE.CONFIG.funcoes.length);

    // Force scrolling styles inline — CSS specificity issues can't override inline styles
    container.style.overflowY = 'auto';
    container.style.overflowX = 'hidden';

    try {

      // Supervisor management section
      const supGrid = SGE.state.supervisores.map(s => `
      <div class="config-row">
        <div class="sup-dot ${s.ativo ? 'active' : 'inactive'}" style="margin-right:12px; flex-shrink:0;"></div>
        <div class="config-row-title" style="flex:0 0 150px">${s.nome}</div>
        <div class="config-row-subtitle" style="flex:1; margin-left:0">${s.regime_padrao}</div>
        <div class="config-actions">
          <button class="btn-icon-sq edit-sup-btn" data-sup="${s.nome}" title="Editar">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button class="btn-icon-sq toggle-btn" data-sup="${s.nome}" title="${s.ativo ? 'Desativar' : 'Ativar'}">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${s.ativo ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>' : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>'}</svg>
          </button>
          <button class="btn-icon-sq danger del-sup-btn" data-sup="${s.nome}" title="Excluir" ${SGE.state.colaboradores.some(c => c.supervisor === s.nome) ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `).join('');

      // Dynamic Regimes Section
      const regimesHtml = SGE.CONFIG.regimes.map(r => `
      <div class="config-row">
        <div class="config-row-title">${r}</div>
        <div class="config-actions">
          <button class="btn-icon-sq edit-regime-btn" data-reg="${r}" title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button class="btn-icon-sq danger del-regime-btn" data-reg="${r}" title="Excluir" ${SGE.state.colaboradores.some(c => c.regime === r) ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `).join('');

      // Dynamic Funcoes Section
      const funcoesHtml = SGE.CONFIG.funcoes.map(f => `
      <div class="config-row">
        <div class="config-row-title">${f}</div>
        <div class="config-actions">
          <button class="btn-icon-sq edit-funcao-btn" data-func="${f}" title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button class="btn-icon-sq danger del-funcao-btn" data-func="${f}" title="Excluir" ${SGE.state.colaboradores.some(c => c.funcao === f) ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `).join('');

      // Dynamic Equipamentos Section
      const eqKeys = Object.keys(SGE.CONFIG.equipTipos);
      const equipHtml = eqKeys.map(k => {
        const eq = SGE.CONFIG.equipTipos[k];
        return `
      <div class="config-row">
        <div style="width:12px;height:12px;border-radius:3px;background:${eq.cor}; flex-shrink:0;"></div>
        <div class="config-row-title" style="margin-left:8px; flex:0 0 50px">${k}</div>
        <div class="config-row-subtitle" style="flex:1; margin-left:0">${eq.nome}</div>
        <div class="config-actions">
          <button class="btn-icon-sq edit-equip-btn" data-eq="${k}" title="Editar">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button class="btn-icon-sq danger del-equip-btn" data-eq="${k}" title="Excluir">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
      `;
      }).join('');

      // Dynamic Vagas Section
      const vagasHtml = SGE.state.equipamentos.map(eq => {
        const eqName = eq.numero ? `${eq.sigla} - ${eq.numero}` : eq.sigla;
        return `
      <div class="config-row">
        <div class="config-row-title" style="flex:0 0 100px">${eqName}</div>
        <div class="config-row-subtitle" style="flex:1; margin-left:0">${eq.escala || 'Sem Escala'} | ${eq.status}</div>
        <div class="config-actions">
          <button class="btn-icon-sq edit-vaga-btn" data-id="${eq.id}" title="Editar">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button class="btn-icon-sq danger del-vaga-btn" data-id="${eq.id}" title="Excluir">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
      `;
      }).join('');

      // Dynamic Statuses Section
      const statusesHtml = SGE.CONFIG.statuses.map(s => `
      <div class="config-row">
        <div class="config-row-title">${s}</div>
        <div class="config-actions">
          <button class="btn-icon-sq edit-status-btn" data-status="${s}" title="Editar">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button class="btn-icon-sq danger del-status-btn" data-status="${s}" title="Excluir" ${SGE.state.colaboradores.some(c => c.status === s) ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `).join('');

      // Dynamic Motivos Section
      const motivosHtml = SGE.CONFIG.motivos.map(m => `
      <div class="config-row">
        <div class="config-row-title" style="white-space:normal; font-size:12px">${m}</div>
        <div class="config-actions">
          <button class="btn-icon-sq edit-motivo-btn" data-motivo="${m}" title="Editar">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button class="btn-icon-sq danger del-motivo-btn" data-motivo="${m}" title="Excluir">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `).join('');

      // Collaborators without definitive IDs
      const semIdCols = SGE.state.colaboradores.filter(c => h.isSemId(c));
      const semIdHtml = semIdCols.length === 0
        ? '<div style="text-align:center;padding:20px;color:var(--text-3);font-size:12px">Todos os colaboradores possuem Matrícula GPS ✓</div>'
        : `<div class="sem-id-list">${semIdCols.map(c => `
          <div class="sem-id-item">
            <div class="sem-id-name">${c.nome}</div>
            <input class="sem-id-input" data-temp-id="${c.id}" placeholder="Nova Matrícula..." />
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
          <label>Matrícula GPS</label>
          <input type="text" id="new-col-mat-gps" placeholder="Obrigatório" />
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
        <div class="form-field" style="display:none">
          <label>Mat. GPS (oculto)</label>
          <input type="text" id="new-col-mat-gps-old" placeholder="Matrícula GPS" />
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

      // Config Blocks Forms
      const addConfigForms = `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        
        <div class="settings-section">
          <div class="settings-section-header config-header-wrap">
            <span>Regimes (Escalas)</span>
            <button class="btn-primary btn-add-small" id="btn-add-regime">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Adicionar
            </button>
          </div>
          <div class="settings-section-body" style="padding: 10px 18px 18px 18px;">
            <div class="config-list">${regimesHtml}</div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-header config-header-wrap">
            <span>Funções</span>
            <button class="btn-primary btn-add-small" id="btn-add-funcao">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Adicionar
            </button>
          </div>
          <div class="settings-section-body" style="padding: 10px 18px 18px 18px;">
            <div class="config-list">${funcoesHtml}</div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-header config-header-wrap">
            <span>Equipamentos (Tipos)</span>
            <button class="btn-primary btn-add-small" id="btn-add-equip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Adicionar
            </button>
          </div>
          <div class="settings-section-body" style="padding: 10px 18px 18px 18px;">
            <div class="config-list" style="max-height:260px; overflow-y:auto">${equipHtml}</div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-header config-header-wrap">
            <span>Vagas (Alocação)</span>
            <button class="btn-primary btn-add-small" id="btn-add-vaga">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Adicionar
            </button>
          </div>
          <div class="settings-section-body" style="padding: 10px 18px 18px 18px;">
            <div class="config-list" style="max-height:260px; overflow-y:auto">${vagasHtml}</div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-header config-header-wrap">
            <span>Status (Situação)</span>
            <button class="btn-primary btn-add-small" id="btn-add-status">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Adicionar
            </button>
          </div>
          <div class="settings-section-body" style="padding: 10px 18px 18px 18px;">
            <div class="config-list">${statusesHtml}</div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-header config-header-wrap">
            <span>Motivos de Mov.</span>
            <button class="btn-primary btn-add-small" id="btn-add-motivo">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Adicionar
            </button>
          </div>
          <div class="settings-section-body" style="padding: 10px 18px 18px 18px;">
            <div class="config-list" style="max-height:260px; overflow-y:auto">${motivosHtml}</div>
          </div>
        </div>

      </div>
    `;

      container.innerHTML = `
      <div class="settings-section">
        <div class="settings-section-header">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 3-5 6-5s6 2 6 5"/></svg>
          Supervisores
        </div>
        <div class="settings-section-body" style="padding: 10px 18px 18px 18px;">
          <div class="config-list" style="max-height: 260px; overflow-y: auto;">${supGrid}</div>
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--border);">
            ${addSupForm}
          </div>
        </div>
      </div>

      <!-- Configurações Dinâmicas do Sistema -->
      ${addConfigForms}

      <div class="settings-section">
        <div class="settings-section-header">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 2h12v12H2z"/><path d="M5 6h6M5 9h4"/></svg>
          Matrículas Pendentes / Sem Matrícula GPS
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

      console.log('[SGE Settings] innerHTML SET successfully, length:', container.innerHTML.length);

      // DEBUG: log computed styles to find the CSS visibility bug
      const cs = getComputedStyle(container);
      console.log('[SGE Settings] COMPUTED STYLES:', {
        display: cs.display,
        overflow: cs.overflow,
        overflowY: cs.overflowY,
        height: cs.height,
        visibility: cs.visibility,
        opacity: cs.opacity,
        position: cs.position,
        zIndex: cs.zIndex,
        width: container.offsetWidth,
        height_px: container.offsetHeight,
        scrollHeight: container.scrollHeight,
        classList: container.className,
        parentDisplay: getComputedStyle(container.parentElement).display,
        parentOverflow: getComputedStyle(container.parentElement).overflow,
        parentHeight: container.parentElement.offsetHeight
      });

      // USER MANAGEMENT SECTION (ADM Only)
      if (SGE.auth.hasRole('ADM')) {
        const usersHtml = (SGE.state.usuarios || []).map(u => `
        <div class="sup-card" style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; gap:12px; align-items:center;">
            <div class="sup-dot ${u.ativo ? 'active' : 'inactive'}"></div>
            <div class="sup-name" style="width:120px">${u.usuario}</div>
            <div class="badge" style="font-size:10px;background:#e6eef9;color:#2c5ea8;border:1px solid #b0c8e8;">${u.perfil}</div>
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
        btn.addEventListener('click', async () => {
          const sup = SGE.state.supervisores.find(s => s.nome === btn.dataset.sup);
          if (sup) {
            sup.ativo = !sup.ativo;
            SGE.settings.render();
            SGE.api.refreshUI();
            SGE.api.cacheData();
            SGE.helpers.toast(`${sup.nome} ${sup.ativo ? 'ativado' : 'desativado'}`, 'info');
            await SGE.api.syncSupervisor('update', { id: sup.id, ativo: sup.ativo });
          }
        });
      });

      // Event: delete supervisor
      container.querySelectorAll('.del-sup-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const supName = btn.dataset.sup;
          if (SGE.state.colaboradores.some(c => c.supervisor === supName)) {
            return h.toast('Não é possível excluir um supervisor que possui colaboradores vinculados.', 'error');
          }

          SGE.modal.confirm({
            title: 'Excluir Supervisor',
            message: `Tem certeza que deseja excluir o supervisor <b>${supName}</b>?`,
            onConfirm: async () => {
              const sup = SGE.state.supervisores.find(s => s.nome === supName);
              SGE.state.supervisores = SGE.state.supervisores.filter(s => s.nome !== supName);
              SGE.CONFIG.ordemKanban = SGE.CONFIG.ordemKanban.filter(n => n !== supName);
              SGE.configManager.save();
              SGE.settings.render();
              SGE.api.refreshUI();
              SGE.api.cacheData();
              h.toast('Supervisor excluído com sucesso', 'success');
              if (sup && sup.id) await SGE.api.syncSupervisor('delete', { id: sup.id });
            }
          });
        });
      });

      // Event: save new ID
      container.querySelectorAll('.sem-id-save').forEach(btn => {
        btn.addEventListener('click', async () => {
          const tempId = btn.dataset.tempId;
          const input = container.querySelector(`.sem-id-input[data-temp-id="${tempId}"]`);
          const newMatricula = input.value.trim().toUpperCase();
          if (!newMatricula) return h.toast('Digite uma Matrícula válida', 'error');

          // Note: the backend uses UUID, so we simply PATCH the 'matricula_gps' and 'status' (remove SEM_ID)

          const exists = SGE.state.colaboradores.some(c => c.matricula_gps === newMatricula);
          if (exists) return h.toast('Matrícula já existe', 'error');

          const col = SGE.state.colaboradores.find(c => c.id === tempId);
          if (col) {
            col.matricula_gps = newMatricula;
            if (col.status === 'SEM_ID') col.status = 'ATIVO'; // Default recovery if status was frozen due to missing ID
            SGE.settings.render();
            SGE.api.refreshUI();
            SGE.api.cacheData();
            h.toast(`Matrícula atualizada: ${newMatricula}`);

            await SGE.api.syncEditColaborador({
              colaborador_id: tempId,
              matricula_gps: newMatricula,
              status: col.status
            });
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
          SGE.api.refreshUI();
          SGE.api.cacheData();
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

          newSupBtn.disabled = true;
          newSupBtn.textContent = 'Salvando...';

          const result = await SGE.api.syncSupervisor('create', { nome, regime_padrao: regime, ativo: true });

          if (result) {
            SGE.state.supervisores.push({ id: result.id, nome, regime_padrao: regime, ativo: true });
            SGE.settings.render();
            SGE.api.refreshUI();
            SGE.api.cacheData();
            h.toast('Supervisor adicionado com sucesso');
          } else {
            newSupBtn.disabled = false;
            newSupBtn.textContent = '+ Adicionar Supervisor';
          }
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

            // Supabase client SDK does not support admin user management from the browser
            user.ativo = oldState; // Rollback
            SGE.settings.render();
            SGE.helpers.toast('Gerenciamento de usuários requer configuração do Supabase Admin (Edge Function). Em desenvolvimento.', 'info');
          });
        });

        // Delete User
        container.querySelectorAll('.delete-user-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;

            SGE.modal.confirm({
              title: 'Excluir Login',
              message: 'Tem certeza que deseja excluir permanentemente este login?',
              onConfirm: async () => {
                // Supabase client SDK does not support admin user deletion from the browser
                SGE.helpers.toast('Exclusão de usuários requer configuração do Supabase Admin (Edge Function). Em desenvolvimento.', 'info');
              }
            });
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

            // Supabase client SDK does not support admin user creation from the browser
            // Users should register via the login page's "Criar uma conta" flow
            h.toast('Criação de usuários via admin requer Supabase Edge Function. Use o formulário de registro na tela de login.', 'info');
            newUsrBtn.disabled = false;
            newUsrBtn.textContent = 'Adicionar Usuário';
          });
        }
      }

      // ==================== DYNAMIC CONFIG EVENTS ====================

      // Delete Regime
      container.querySelectorAll('.del-regime-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          SGE.modal.confirm({
            title: 'Excluir Regime',
            message: `Tem certeza que deseja excluir o regime <b>${btn.dataset.reg}</b>?`,
            onConfirm: () => {
              SGE.CONFIG.regimes = SGE.CONFIG.regimes.filter(r => r !== btn.dataset.reg);
              SGE.configManager.save();
              SGE.settings.render();
              SGE.api.refreshUI();
              SGE.api.cacheData();
              h.toast('Regime excluído', 'success');
            }
          });
        });
      });

      const addRegBtn = document.getElementById('btn-add-regime');
      if (addRegBtn) {
        addRegBtn.addEventListener('click', () => {
          SGE.modal.openDynamic({
            title: 'Adicionar Regime',
            fields: [{ id: 'nome', label: 'Nome do Regime', placeholder: 'Ex: 12HS-A', uppercase: true }],
            onConfirm: (vals) => {
              const inp = vals.nome.trim();
              if (!inp) { h.toast('Digite o nome do regime', 'error'); return false; }
              if (SGE.CONFIG.regimes.includes(inp)) { h.toast('Regime já existe', 'error'); return false; }
              SGE.CONFIG.regimes.push(inp);
              SGE.configManager.save();
              SGE.settings.render();
              SGE.api.refreshUI();
              h.toast('Regime adicionado', 'success');
            }
          });
        });
      }

      // Edit Regime
      container.querySelectorAll('.edit-regime-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const oldVal = btn.dataset.reg;
          SGE.modal.openDynamic({
            title: 'Editar Regime',
            subtitle: 'Atualizará todos os colaboradores associados',
            fields: [{ id: 'nome', label: 'Nome', value: oldVal, uppercase: true }],
            onConfirm: (vals) => {
              const cleanVal = vals.nome.trim();
              if (!cleanVal || cleanVal === oldVal) return;
              if (SGE.CONFIG.regimes.includes(cleanVal)) { h.toast('Regime já existe', 'error'); return false; }

              SGE.CONFIG.regimes[SGE.CONFIG.regimes.indexOf(oldVal)] = cleanVal;

              const updates = [];
              SGE.state.colaboradores.forEach(c => {
                if (c.regime === oldVal) {
                  c.regime = cleanVal;
                  updates.push({ id: c.id, regime: cleanVal });
                }
              });
              SGE.configManager.save();
              SGE.settings.render();
              SGE.api.refreshUI();
              SGE.api.cacheData();
              h.toast('Regime atualizado', 'success');

              if (updates.length > 0) SGE.api.syncBatchColaboradores(updates);
            },
            onDelete: () => {
              const delBtn = container.querySelector(`.del-regime-btn[data-reg="${oldVal}"]`);
              if (delBtn && delBtn.hasAttribute('disabled')) {
                SGE.helpers.toast('Não é possível excluir: existem colaboradores usando esta configuração.', 'error');
              } else if (delBtn) {
                delBtn.click();
              }
              return false;
            }
          });
        });
      });

      // Delete Função
      container.querySelectorAll('.del-funcao-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          SGE.modal.confirm({
            title: 'Excluir Função',
            message: `Tem certeza que deseja excluir a função <b>${btn.dataset.func}</b>?`,
            onConfirm: () => {
              SGE.CONFIG.funcoes = SGE.CONFIG.funcoes.filter(f => f !== btn.dataset.func);
              SGE.configManager.save();
              SGE.settings.render();
              SGE.api.refreshUI();
              SGE.api.cacheData();
              h.toast('Função excluída', 'success');
            }
          });
        });
      });

      const addFuncBtn = document.getElementById('btn-add-funcao');
      if (addFuncBtn) {
        addFuncBtn.addEventListener('click', () => {
          SGE.modal.openDynamic({
            title: 'Adicionar Função',
            fields: [{ id: 'nome', label: 'Nome da Função', placeholder: 'Ex: AJUDANTE', uppercase: true }],
            onConfirm: (vals) => {
              const inp = vals.nome.trim();
              if (!inp) { h.toast('Digite o nome da função', 'error'); return false; }
              if (SGE.CONFIG.funcoes.includes(inp)) { h.toast('Função já existe', 'error'); return false; }
              SGE.CONFIG.funcoes.push(inp);
              SGE.configManager.save();
              SGE.settings.render();
              SGE.api.refreshUI();
              h.toast('Função adicionada', 'success');
            }
          });
        });
      }

      // Edit Função
      container.querySelectorAll('.edit-funcao-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const oldVal = btn.dataset.func;
          SGE.modal.openDynamic({
            title: 'Editar Função',
            subtitle: 'Atualizará todos os colaboradores sob esta função',
            fields: [{ id: 'nome', label: 'Nome', value: oldVal, uppercase: true }],
            onConfirm: (vals) => {
              const cleanVal = vals.nome.trim();
              if (!cleanVal || cleanVal === oldVal) return;
              if (SGE.CONFIG.funcoes.includes(cleanVal)) { h.toast('Função já existe', 'error'); return false; }

              SGE.CONFIG.funcoes[SGE.CONFIG.funcoes.indexOf(oldVal)] = cleanVal;

              const updates = [];
              SGE.state.colaboradores.forEach(c => {
                if (c.funcao === oldVal) {
                  c.funcao = cleanVal;
                  updates.push({ id: c.id, funcao: cleanVal });
                }
              });
              SGE.configManager.save();
              SGE.settings.render();
              SGE.api.refreshUI();
              SGE.api.cacheData();
              h.toast('Função atualizada', 'success');

              if (updates.length > 0) SGE.api.syncBatchColaboradores(updates);
            },
            onDelete: () => {
              const delBtn = container.querySelector(`.del-funcao-btn[data-func="${oldVal}"]`);
              if (delBtn && delBtn.hasAttribute('disabled')) {
                SGE.helpers.toast('Não é possível excluir: existem colaboradores usando esta configuração.', 'error');
              } else if (delBtn) {
                delBtn.click();
              }
              return false;
            }
          });
        });
      });

      // Delete Equipamento
      container.querySelectorAll('.del-equip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          SGE.modal.confirm({
            title: 'Excluir Equipamento',
            message: `Tem certeza que deseja excluir o equipamento <b>${btn.dataset.eq}</b>?`,
            onConfirm: () => {
              delete SGE.CONFIG.equipTipos[btn.dataset.eq];
              SGE.configManager.save();
              SGE.settings.render();
              SGE.api.refreshUI();
              SGE.api.cacheData();
              h.toast('Equipamento excluído', 'success');
            }
          });
        });
      });

      const addEqBtn = document.getElementById('btn-add-equip');
      if (addEqBtn) {
        addEqBtn.addEventListener('click', () => {
          SGE.modal.openDynamic({
            title: 'Adicionar Equipamento',
            fields: [
              { id: 'sigla', label: 'Sigla', placeholder: 'Ex: TR', uppercase: true },
              { id: 'nome', label: 'Nome Completo', placeholder: 'Ex: Trator' },
              { id: 'cor', label: 'Cor do Badge', type: 'color', value: '#cccccc' }
            ],
            onConfirm: (vals) => {
              const sigla = vals.sigla.trim();
              const nome = vals.nome.trim();
              if (!sigla || !nome) { h.toast('Preencha sigla e nome', 'error'); return false; }
              if (SGE.CONFIG.equipTipos[sigla]) { h.toast('Sigla já existe', 'error'); return false; }

              SGE.CONFIG.equipTipos[sigla] = { nome, cor: vals.cor };
              SGE.configManager.save();
              SGE.settings.render();
              SGE.api.refreshUI();
              h.toast('Equipamento adicionado', 'success');
            }
          });
        });
      }

      // Edit Equipamento
      container.querySelectorAll('.edit-equip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const oldVal = btn.dataset.eq;
          const eqData = SGE.CONFIG.equipTipos[oldVal];

          SGE.modal.openDynamic({
            title: 'Editar Equipamento',
            fields: [
              { id: 'sigla', label: 'Sigla (Atualiza os colaboradores afetados)', value: oldVal, uppercase: true },
              { id: 'nome', label: 'Nome do Equipamento', value: eqData.nome },
              { id: 'cor', label: 'Cor do Badge', type: 'color', value: eqData.cor }
            ],
            onConfirm: (vals) => {
              const cleanSigla = vals.sigla.trim();
              const newNome = vals.nome.trim();

              if (!cleanSigla || !newNome) { h.toast('Preencha sigla e nome', 'error'); return false; }
              if (cleanSigla !== oldVal && SGE.CONFIG.equipTipos[cleanSigla]) {
                h.toast('Essa sigla já está em uso por outro equipamento', 'error');
                return false;
              }

              if (cleanSigla !== oldVal) {
                SGE.CONFIG.equipTipos[cleanSigla] = { nome: newNome, cor: vals.cor };
                delete SGE.CONFIG.equipTipos[oldVal];
                const updates = [];
                SGE.state.colaboradores.forEach(c => {
                  if (c.equipamento && c.equipamento.startsWith(oldVal)) {
                    c.equipamento = c.equipamento.replace(oldVal, cleanSigla);
                    updates.push({ id: c.id, equipamento: c.equipamento });
                  }
                });
                if (updates.length > 0) SGE.api.syncBatchColaboradores(updates);
              } else {
                SGE.CONFIG.equipTipos[oldVal] = { nome: newNome, cor: vals.cor };
              }

              SGE.configManager.save();
              SGE.settings.render();
              SGE.api.refreshUI();
              SGE.api.cacheData();
              h.toast('Equipamento atualizado', 'success');
            },
            onDelete: () => {
              const delBtn = container.querySelector(`.del-equip-btn[data-eq="${oldVal}"]`);
              if (delBtn) delBtn.click();
              return false;
            }
          });
        });
      });

      // ==================== VAGAS (EQUIPMENT) EVENTS ====================

      container.querySelectorAll('.del-vaga-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const vaga = SGE.state.equipamentos.find(e => e.id === id);
          if (!vaga) return;

          SGE.modal.confirm({
            title: 'Excluir Vaga',
            message: `Tem certeza que deseja excluir a vaga <b>${vaga.sigla} ${vaga.numero || ''}</b>?`,
            onConfirm: async () => {
              const res = await SGE.api.syncEquipamento('delete', { id });
              if (res) {
                SGE.state.equipamentos = SGE.state.equipamentos.filter(e => e.id !== id);
                SGE.settings.render();
                SGE.api.refreshUI();
                h.toast('Vaga excluída com sucesso', 'success');
              }
            }
          });
        });
      });

      const addVagaBtn = document.getElementById('btn-add-vaga');
      if (addVagaBtn) {
        addVagaBtn.addEventListener('click', () => {
          SGE.modal.openDynamic({
            title: 'Adicionar Vaga',
            fields: [
              { id: 'sigla', type: 'select', label: 'Tipo (Sigla)', value: Object.keys(SGE.CONFIG.equipTipos)[0], options: Object.keys(SGE.CONFIG.equipTipos).map(k => ({ value: k, label: k })) },
              { id: 'numero', label: 'Número', placeholder: 'Ex: 01', uppercase: true },
              { id: 'escala', type: 'select', label: 'Escala', value: 'ADM', options: SGE.CONFIG.regimes.map(r => ({ value: r, label: r })) },
              { id: 'status', type: 'select', label: 'Status', value: 'ATIVO', options: [{ value: 'ATIVO', label: 'ATIVO' }, { value: 'INATIVO', label: 'INATIVO' }, { value: 'MANUTENÇÃO', label: 'MANUTENÇÃO' }] }
            ],
            onConfirm: async (vals) => {
              const sigla = vals.sigla.trim();
              const num = vals.numero.trim();
              if (!sigla) { h.toast('Sigla obrigatória', 'error'); return false; }

              const res = await SGE.api.syncEquipamento('create', { sigla, numero: num, escala: vals.escala, status: vals.status });
              if (res) {
                SGE.state.equipamentos.push(res);
                SGE.settings.render();
                SGE.api.refreshUI();
                h.toast('Vaga adicionada com sucesso', 'success');
              }
            }
          });
        });
      }

      container.querySelectorAll('.edit-vaga-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const vaga = SGE.state.equipamentos.find(e => e.id === id);
          if (!vaga) return;

          SGE.modal.openDynamic({
            title: 'Editar Vaga',
            fields: [
              { id: 'sigla', type: 'select', label: 'Tipo (Sigla)', value: vaga.sigla, options: Object.keys(SGE.CONFIG.equipTipos).map(k => ({ value: k, label: k })) },
              { id: 'numero', label: 'Número', value: vaga.numero || '', uppercase: true },
              { id: 'escala', type: 'select', label: 'Escala', value: vaga.escala, options: SGE.CONFIG.regimes.map(r => ({ value: r, label: r })) },
              { id: 'status', type: 'select', label: 'Status', value: vaga.status, options: [{ value: 'ATIVO', label: 'ATIVO' }, { value: 'INATIVO', label: 'INATIVO' }, { value: 'MANUTENÇÃO', label: 'MANUTENÇÃO' }] }
            ],
            onConfirm: async (vals) => {
              const sigla = vals.sigla.trim();
              const num = vals.numero.trim();
              if (!sigla) { h.toast('Sigla obrigatória', 'error'); return false; }

              const res = await SGE.api.syncEquipamento('update', { id, sigla, numero: num, escala: vals.escala, status: vals.status });
              if (res) {
                Object.assign(vaga, { sigla, numero: num, escala: vals.escala, status: vals.status });
                SGE.settings.render();
                SGE.api.refreshUI();
                h.toast('Vaga atualizada', 'success');
              }
            },
            onDelete: async () => {
              SGE.modal.confirm({
                title: 'Excluir Vaga',
                message: `Tem certeza que deseja excluir esta vaga?`,
                onConfirm: async () => {
                  const res = await SGE.api.syncEquipamento('delete', { id });
                  if (res) {
                    SGE.state.equipamentos = SGE.state.equipamentos.filter(e => e.id !== id);
                    SGE.settings.render();
                    SGE.api.refreshUI();
                    h.toast('Vaga excluída com sucesso', 'success');
                  }
                }
              });
              return false; // don't close current modal yet, confirm modal will sit on top or replace
            }
          });
        });
      });

      // ==================== STATUS EVENTS ====================

      container.querySelectorAll('.del-status-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          SGE.modal.confirm({
            title: 'Excluir Status',
            message: `Tem certeza que deseja excluir o status <b>${btn.dataset.status}</b>?`,
            onConfirm: () => {
              SGE.CONFIG.statuses = SGE.CONFIG.statuses.filter(s => s !== btn.dataset.status);
              SGE.configManager.save();
              SGE.settings.render();
              SGE.api.refreshUI();
              SGE.api.cacheData();
              h.toast('Status excluído', 'success');
            }
          });
        });
      });

      const addStatusBtn = document.getElementById('btn-add-status');
      if (addStatusBtn) {
        addStatusBtn.addEventListener('click', () => {
          SGE.modal.openDynamic({
            title: 'Adicionar Status',
            fields: [{ id: 'nome', label: 'Nome do Status', placeholder: 'Ex: EM TREINAMENTO', uppercase: true }],
            onConfirm: (vals) => {
              const inp = vals.nome.trim();
              if (!inp) { h.toast('Digite o status', 'error'); return false; }
              if (SGE.CONFIG.statuses.includes(inp)) { h.toast('Status já existe', 'error'); return false; }
              SGE.CONFIG.statuses.push(inp);
              SGE.configManager.save();
              SGE.settings.render();
              SGE.api.refreshUI();
              h.toast('Status adicionado', 'success');
            }
          });
        });
      }

      container.querySelectorAll('.edit-status-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const oldVal = btn.dataset.status;
          SGE.modal.openDynamic({
            title: 'Editar Status',
            subtitle: 'Atualizará todos os colaboradores sob este status',
            fields: [{ id: 'nome', label: 'Nome', value: oldVal, uppercase: true }],
            onConfirm: (vals) => {
              const cleanVal = vals.nome.trim();
              if (!cleanVal || cleanVal === oldVal) return;
              if (SGE.CONFIG.statuses.includes(cleanVal)) { h.toast('Status já existe', 'error'); return false; }

              SGE.CONFIG.statuses[SGE.CONFIG.statuses.indexOf(oldVal)] = cleanVal;

              const updates = [];
              SGE.state.colaboradores.forEach(c => {
                if (c.status === oldVal) {
                  c.status = cleanVal;
                  updates.push({ id: c.id, status: cleanVal });
                }
              });
              SGE.configManager.save();
              SGE.settings.render();
              SGE.api.refreshUI();
              SGE.api.cacheData();
              h.toast('Status atualizado', 'success');

              if (updates.length > 0) SGE.api.syncBatchColaboradores(updates);
            },
            onDelete: () => {
              const delBtn = container.querySelector(`.del-status-btn[data-status="${oldVal}"]`);
              if (delBtn && delBtn.hasAttribute('disabled')) {
                SGE.helpers.toast('Não é possível excluir: existem colaboradores usando esta configuração.', 'error');
              } else if (delBtn) {
                delBtn.click();
              }
              return false;
            }
          });
        });
      });

      // ==================== MOTIVOS EVENTS ====================

      container.querySelectorAll('.del-motivo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          SGE.modal.confirm({
            title: 'Excluir Motivo',
            message: `Tem certeza que deseja excluir o motivo <b>${btn.dataset.motivo}</b>?`,
            onConfirm: () => {
              SGE.CONFIG.motivos = SGE.CONFIG.motivos.filter(m => m !== btn.dataset.motivo);
              SGE.configManager.save();
              SGE.settings.render();
              SGE.api.refreshUI();
              h.toast('Motivo excluído', 'success');
            }
          });
        });
      });

      const addMotivoBtn = document.getElementById('btn-add-motivo');
      if (addMotivoBtn) {
        addMotivoBtn.addEventListener('click', () => {
          SGE.modal.openDynamic({
            title: 'Adicionar Motivo',
            fields: [{ id: 'nome', label: 'Nome do Motivo', placeholder: 'Ex: Férias', uppercase: false }],
            onConfirm: (vals) => {
              const inp = vals.nome.trim();
              if (!inp) { h.toast('Digite o motivo', 'error'); return false; }
              if (SGE.CONFIG.motivos.includes(inp)) { h.toast('Motivo já existe', 'error'); return false; }
              SGE.CONFIG.motivos.push(inp);
              SGE.configManager.save();
              SGE.settings.render();
              SGE.api.refreshUI();
              h.toast('Motivo adicionado', 'success');
            }
          });
        });
      }

      container.querySelectorAll('.edit-motivo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const oldVal = btn.dataset.motivo;
          SGE.modal.openDynamic({
            title: 'Editar Motivo',
            fields: [{ id: 'nome', label: 'Texto', value: oldVal, uppercase: false }],
            onConfirm: (vals) => {
              const cleanVal = vals.nome.trim();
              if (!cleanVal || cleanVal === oldVal) return;
              if (SGE.CONFIG.motivos.includes(cleanVal)) { h.toast('Motivo já existe', 'error'); return false; }

              SGE.CONFIG.motivos[SGE.CONFIG.motivos.indexOf(oldVal)] = cleanVal;
              SGE.configManager.save();
              SGE.settings.render();
              SGE.api.refreshUI();
              h.toast('Motivo atualizado', 'success');
            },
            onDelete: () => {
              const delBtn = container.querySelector(`.del-motivo-btn[data-motivo="${oldVal}"]`);
              if (delBtn) delBtn.click();
              return false;
            }
          });
        });
      });

      // Edit Supervisor
      container.querySelectorAll('.edit-sup-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const supName = btn.dataset.sup;
          const sup = SGE.state.supervisores.find(s => s.nome === supName);
          if (!sup) return;

          SGE.modal.openDynamic({
            title: 'Editar Supervisor',
            fields: [
              { id: 'nome', label: 'Nome do Supervisor (Atualiza todos que usam)', value: sup.nome, uppercase: true },
              {
                id: 'regime',
                label: 'Regime Padrão',
                type: 'select',
                value: sup.regime_padrao,
                options: SGE.CONFIG.regimes.map(r => ({ value: r, label: r }))
              }
            ],
            onConfirm: async (vals) => {
              const newName = vals.nome.trim();
              const newRegime = vals.regime;

              if (!newName) { h.toast('Digite o nome do supervisor', 'error'); return false; }

              const oldName = sup.nome;
              sup.nome = newName;
              sup.regime_padrao = newRegime;

              // 1. Persist supervisor change to Supabase
              await SGE.api.syncSupervisor('update', {
                id: sup.id,
                nome: newName,
                regime_padrao: newRegime
              });

              // 2. Cascade: reassign all collaborators if name changed
              if (oldName !== newName) {
                const updates = [];
                SGE.state.colaboradores.forEach(c => {
                  if (c.supervisor === oldName) {
                    c.supervisor = newName;
                    updates.push({ id: c.id, supervisor: newName });
                  }
                });
                if (updates.length > 0) await SGE.api.syncBatchColaboradores(updates);

                // Update kanban order config
                const kIdx = SGE.CONFIG.ordemKanban.indexOf(oldName);
                if (kIdx !== -1) {
                  SGE.CONFIG.ordemKanban[kIdx] = newName;
                }
              }

              // 3. Persist config and refresh ALL views
              SGE.configManager.save();
              SGE.settings.render();
              SGE.api.refreshUI();
              SGE.api.cacheData();
              h.toast('Supervisor editado com sucesso', 'success');
            },
            onDelete: () => {
              const delBtn = container.querySelector(`.del-sup-btn[data-sup="${supName}"]`);
              if (delBtn && delBtn.hasAttribute('disabled')) {
                SGE.helpers.toast('Não é possível excluir: existem colaboradores sob este supervisor.', 'error');
              } else if (delBtn) {
                delBtn.click();
              }
              return false;
            }
          });
        });
      });

    } catch (err) {
      console.error('[SGE Settings] Render error:', err);
      container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--red);">
        <h3>Erro ao carregar Configuracoes</h3>
        <p style="font-size:12px;color:var(--text-3);margin-top:8px;">${err.message}</p>
        <button class="btn-primary" onclick="SGE.settings.render()" style="margin-top:16px;">Tentar Novamente</button>
      </div>`;
    }
  }
};
