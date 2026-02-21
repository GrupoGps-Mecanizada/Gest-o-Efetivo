'use strict';

/**
 * SGE — Equipment View
 * Displays equipment cards grouped by type with collaborators organized by shift
 */
window.SGE = window.SGE || {};

SGE.equip = {
  /**
   * Parse equipment code into { sigla, numero }
   */
  parseEquip(equipStr) {
    if (!equipStr) return null;
    const val = String(equipStr).trim().toUpperCase();
    const match = val.match(/^([A-Z]{2,3})(?:-(.+))?$/);
    if (!match) return null;
    return { sigla: match[1], numero: match[2] || '' };
  },

  /**
   * Get turno label from regime
   */
  getTurno(regime) {
    return SGE.CONFIG.turnoMap[regime] || 'S/R';
  },

  /**
   * Build equipment data structure from state
   */
  buildEquipData() {
    const tipos = SGE.CONFIG.equipTipos;
    const equipMap = {};
    const turnos = ['A', 'B', 'C', 'D', 'ADM', '16H', 'S/R'];

    // 1. Initialize all equipments from backend master list
    if (SGE.state.equipamentos && Array.isArray(SGE.state.equipamentos)) {
      SGE.state.equipamentos.forEach(eq => {
        const parsed = SGE.equip.parseEquip(eq.sigla + '-' + eq.numero);
        if (!parsed || !tipos[parsed.sigla]) return;

        const key = parsed.sigla + '-' + parsed.numero;
        equipMap[key] = {
          sigla: parsed.sigla,
          numero: parsed.numero,
          label: parsed.numero ? parsed.sigla + '-' + parsed.numero : parsed.sigla,
          tipo: tipos[parsed.sigla],
          turnos: {}
        };
        turnos.forEach(t => { equipMap[key].turnos[t] = []; });
      });
    }

    // 2. Populate with active collaborators
    SGE.state.colaboradores.forEach(c => {
      const parsed = SGE.equip.parseEquip(c.equipamento);
      if (!parsed || !tipos[parsed.sigla]) return;

      const key = parsed.sigla + '-' + parsed.numero;
      if (!equipMap[key]) {
        equipMap[key] = {
          sigla: parsed.sigla,
          numero: parsed.numero,
          label: parsed.numero ? parsed.sigla + '-' + parsed.numero : parsed.sigla,
          tipo: tipos[parsed.sigla],
          turnos: {}
        };
        turnos.forEach(t => { equipMap[key].turnos[t] = []; });
      }

      const turno = SGE.equip.getTurno(c.regime);
      if (!equipMap[key].turnos[turno]) equipMap[key].turnos[turno] = [];
      equipMap[key].turnos[turno].push(c);
    });

    return equipMap;
  },

  /**
   * Main render function
   */
  render() {
    const view = document.getElementById('equip-view');
    if (!view) return;

    const equipData = SGE.equip.buildEquipData();
    const state = SGE.state.equip;
    const tipos = SGE.CONFIG.equipTipos;
    const turnos = ['A', 'B', 'C', 'D', 'ADM', '16H', 'S/R'];

    // Filter by type
    let entries = Object.values(equipData);
    if (state.filtroTipo !== 'TODOS') {
      entries = entries.filter(e => e.sigla === state.filtroTipo);
    }

    // Sort: by sigla then numero
    entries.sort((a, b) => {
      if (a.sigla !== b.sigla) return a.sigla.localeCompare(b.sigla);
      return (a.numero || '').localeCompare(b.numero || '');
    });

    // Count totals
    const totalEquip = entries.length;
    const totalColab = entries.reduce((sum, e) => {
      return sum + Object.values(e.turnos).reduce((s, arr) => s + arr.length, 0);
    }, 0);

    view.innerHTML = `
      <div class="equip-toolbar" id="equip-toolbar">
        <button class="equip-type-btn ${state.filtroTipo === 'TODOS' ? 'active' : ''}" data-tipo="TODOS">TODOS</button>
        ${Object.entries(tipos).map(([sigla, info]) => `
          <button class="equip-type-btn ${state.filtroTipo === sigla ? 'active' : ''}" data-tipo="${sigla}">
            <span class="equip-type-dot" style="background:${info.cor}"></span>
            ${sigla}
          </button>
        `).join('')}
        <div class="filter-sep"></div>
        <span style="font-size:10px;color:var(--text-3);font-weight:600;letter-spacing:.5px">TURNO</span>
        <button class="equip-turno-btn ${state.filtroTurno === 'TODOS' ? 'active' : ''}" data-turno="TODOS">Todos</button>
        ${turnos.map(t => `
          <button class="equip-turno-btn ${state.filtroTurno === t ? 'active' : ''}" data-turno="${t}">${t}</button>
        `).join('')}
      </div>
      <div class="equip-grid" id="equip-grid">
        ${entries.length === 0 ? `
          <div class="no-data-message" style="grid-column:1/-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 9h20M9 3v18"/>
            </svg>
            <h3>Nenhum equipamento encontrado</h3>
            <p>Normalize os equipamentos primeiro para visualizá-los aqui.</p>
          </div>
        ` : entries.map(eq => SGE.equip.renderCard(eq, state.filtroTurno, turnos)).join('')}
      </div>
      <div class="equip-action-bar">
        <button class="equip-action-btn" id="equip-normalize-btn">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M2 8a6 6 0 0111.47-2.4M14 8A6 6 0 012.53 10.4"/>
            <path d="M14 2v4h-4M2 14v-4h4"/>
          </svg>
          Normalizar Equipamentos
        </button>
        <span class="equip-stats">${totalEquip} equipamentos · ${totalColab} colaboradores alocados</span>
      </div>
    `;

    SGE.equip.setupListeners();
  },

  /**
   * Render a single equipment card
   */
  renderCard(eq, filtroTurno, turnos) {
    const turnosToShow = filtroTurno === 'TODOS' ? turnos : [filtroTurno];
    const totalMembers = turnosToShow.reduce((s, t) => s + (eq.turnos[t] || []).length, 0);

    const turnoRows = turnosToShow.map(t => {
      const members = eq.turnos[t] || [];
      return `
        <div class="equip-turno-row">
          <div class="equip-turno-label">${t}</div>
          <div class="equip-turno-members">
            ${members.length === 0
          ? '<span class="equip-empty-turno">—</span>'
          : members.map(c => `
                <span class="equip-member" data-id="${c.id}" title="${c.nome} (${c.funcao})">
                  <span class="equip-member-funcao">${c.funcao}</span>${SGE.equip.abbreviateName(c.nome)}
                </span>
              `).join('')}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="equip-card">
        <div class="equip-card-header">
          <div class="equip-card-color" style="background:${eq.tipo.cor}"></div>
          <div class="equip-card-info">
            <div class="equip-card-sigla">${eq.label}</div>
            <div class="equip-card-nome">${eq.tipo.nome}${eq.numero ? ' - ' + eq.numero : ''}</div>
          </div>
          <div class="equip-card-count">${totalMembers}</div>
        </div>
        <div class="equip-card-body">
          ${turnoRows}
        </div>
      </div>
    `;
  },

  /**
   * Abbreviate a name to first + last name
   */
  abbreviateName(nome) {
    if (!nome) return '—';
    const parts = nome.split(' ');
    if (parts.length <= 2) return nome;
    return parts[0] + ' ' + parts[parts.length - 1].substring(0, 3) + '.';
  },

  /**
   * Setup event listeners
   */
  setupListeners() {
    // Type filter buttons
    document.querySelectorAll('.equip-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        SGE.state.equip.filtroTipo = btn.dataset.tipo;
        SGE.equip.render();
      });
    });

    // Turno filter buttons
    document.querySelectorAll('.equip-turno-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        SGE.state.equip.filtroTurno = btn.dataset.turno;
        SGE.equip.render();
      });
    });

    // Member click → open drawer
    document.querySelectorAll('.equip-member').forEach(el => {
      el.addEventListener('click', () => {
        const col = SGE.state.colaboradores.find(c => c.id === el.dataset.id);
        if (col) SGE.drawer.open(col);
      });
    });

    // Normalize button
    const normalizeBtn = document.getElementById('equip-normalize-btn');
    if (normalizeBtn) {
      normalizeBtn.addEventListener('click', async () => {
        SGE.helpers.toast('Normalizando equipamentos...', 'info');
        const result = await SGE.api.callGAS('normalizar_equipamentos');
        if (result) {
          SGE.helpers.toast(`${result.updated} equipamentos normalizados`, 'success');
          // Reload data
          const data = await SGE.api.callGAS('listar_colaboradores');
          if (data) SGE.state.colaboradores = data;
          SGE.equip.render();
        } else {
          SGE.helpers.toast('Erro ao normalizar', 'error');
        }
      });
    }
  }
};
