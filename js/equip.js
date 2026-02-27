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
    const match = val.match(/^([A-Z]{2,3})(?:-(.*))?$/);
    if (!match) return null;

    let num = match[2] || '';
    if (/^\d$/.test(num)) num = '0' + num; // Auto-pad "8" to "08"

    return { sigla: match[1], numero: num };
  },

  /**
   * Get turno label from regime
   */
  getTurno(regime) {
    if (!regime) return 'S/R';
    const r = String(regime).toUpperCase().trim();

    // Try intelligent extraction first (works for "4x4-A", "24HS A", "A", etc)
    if (r === 'A' || r.endsWith('-A') || r.endsWith(' A') || r === '4X4-A') return 'A';
    if (r === 'B' || r.endsWith('-B') || r.endsWith(' B') || r === '4X4-B') return 'B';
    if (r === 'C' || r.endsWith('-C') || r.endsWith(' C') || r === '4X4-C') return 'C';
    if (r === 'D' || r.endsWith('-D') || r.endsWith(' D') || r === '4X4-D') return 'D';
    if (r.includes('ADM')) return 'ADM';
    if (r.includes('16H') || r.includes('16 H')) return '16H';

    // Strict fallback map matching
    return SGE.CONFIG.turnoMap[regime] || 'S/R';
  },

  /**
   * Build equipment data structure from state
   */
  buildEquipData() {
    const tipos = SGE.CONFIG.equipTipos;
    const equipMap = {};
    const turnos = ['A', 'B', 'C', 'D', 'ADM', '16H', 'S/R'];

    // 1. Initialize strictly from backend master list
    if (SGE.state.equipamentos && Array.isArray(SGE.state.equipamentos)) {
      SGE.state.equipamentos.forEach(eq => {
        // Handle null/undefined in numero cleanly
        const eqStr = eq.numero ? `${eq.sigla}-${eq.numero}` : eq.sigla;
        const parsed = SGE.equip.parseEquip(eqStr);
        if (!parsed || !tipos[parsed.sigla]) return;

        // Use strictly normalized keys to avoid duplicates
        const key = parsed.sigla + '-' + parsed.numero;
        equipMap[key] = {
          sigla: parsed.sigla,
          numero: parsed.numero,
          label: parsed.numero ? parsed.sigla + '-' + parsed.numero : parsed.sigla,
          tipo: tipos[parsed.sigla],
          escala: eq.escala || '24HS', // default payload to 24HS if newly migrated
          turnos: {}
        };
        turnos.forEach(t => { equipMap[key].turnos[t] = []; });
      });
    }

    // Virtual equipment to host all unallocated collaborators
    equipMap['UNALLOCATED'] = {
      sigla: 'UNALLOCATED',
      numero: '',
      label: 'S/R',
      tipo: { nome: 'Sem Equipamento Definido', cor: '#94a3b8' },
      escala: '24HS', // Render all turnos to catch everyone
      turnos: { 'A': [], 'B': [], 'C': [], 'D': [], 'ADM': [], '16H': [], 'S/R': [] },
      isVirtual: true
    };

    // 2. Populate with active collaborators
    SGE.state.colaboradores.forEach(c => {
      const parsed = SGE.equip.parseEquip(c.equipamento);
      const turno = SGE.equip.getTurno(c.regime);

      if (!parsed || !tipos[parsed.sigla] || !equipMap[parsed.sigla + '-' + parsed.numero]) {
        // Did not match any official map? Send to unallocated
        equipMap['UNALLOCATED'].turnos[turno].push(c);
        return;
      }

      const key = parsed.sigla + '-' + parsed.numero;
      if (!equipMap[key].turnos[turno]) equipMap[key].turnos[turno] = [];
      equipMap[key].turnos[turno].push(c);
    });

    // Cleanup: If nobody is unallocated, block the virtual card from rendering
    let hasUnallocated = false;
    Object.values(equipMap['UNALLOCATED'].turnos).forEach(arr => {
      if (arr.length > 0) hasUnallocated = true;
    });
    if (!hasUnallocated) delete equipMap['UNALLOCATED'];

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

    // Sort: by sigla then numero numerically (Push UNALLOCATED to the bottom)
    entries.sort((a, b) => {
      if (a.isVirtual && !b.isVirtual) return 1;
      if (!a.isVirtual && b.isVirtual) return -1;
      if (a.sigla !== b.sigla) return a.sigla.localeCompare(b.sigla);
      const numA = parseInt(a.numero) || 0;
      const numB = parseInt(b.numero) || 0;
      if (numA !== numB) return numA - numB;
      return (a.numero || '').localeCompare(b.numero || '');
    });

    // Count totals
    const totalEquip = entries.length;
    const totalColab = entries.reduce((sum, e) => {
      return sum + Object.values(e.turnos).reduce((s, arr) => s + arr.length, 0);
    }, 0);

    // Fixed display order for group rows
    const groupOrder = ['AP', 'AV', 'HV', 'ASP', 'BK', 'CJ', 'MT', 'UNALLOCATED'];

    // Build groups HTML — horizontal rows
    const groupsHtml = groupOrder.map(sigla => {
      const groupEntries = entries.filter(e => e.sigla === sigla);
      if (groupEntries.length === 0) return '';

      const tipoInfo = tipos[sigla] || { nome: 'Sem Equipamento Definido', cor: '#94a3b8' };
      const groupMemberCount = groupEntries.reduce((sum, e) => {
        return sum + Object.values(e.turnos).reduce((s, arr) => s + arr.length, 0);
      }, 0);

      return `
        <div class="equip-group-row">
          <div class="equip-group-header">
            <div class="equip-group-color" style="background:${tipoInfo.cor}"></div>
            <span class="equip-group-title">${tipoInfo.nome}</span>
            <span class="equip-group-count">${groupEntries.length} equip · ${groupMemberCount} colab</span>
            <div class="equip-group-line"></div>
          </div>
          <div class="equip-group-cards">
            ${groupEntries.map(eq => SGE.equip.renderCard(eq, state.filtroTurno)).join('')}
          </div>
        </div>
      `;
    }).join('');

    const viewContainer = document.getElementById('equip-view');
    const savedScroll = viewContainer ? viewContainer.scrollTop : 0;

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
        ${turnos.filter(t => t !== 'S/R').map(t => `
          <button class="equip-turno-btn ${state.filtroTurno === t ? 'active' : ''}" data-turno="${t}">${t}</button>
        `).join('')}
      </div>
      <div class="equip-groups-container" id="equip-grid">
        ${entries.length === 0 ? `
          <div class="no-data-message" style="width:100%">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 9h20M9 3v18"/>
            </svg>
            <h3>Nenhum equipamento encontrado</h3>
            <p>Normalize os equipamentos primeiro para visualizá-los aqui.</p>
          </div>
        ` : groupsHtml}
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
    if (viewContainer) viewContainer.scrollTop = savedScroll;
  },

  /**
   * Render a single equipment card
   */
  renderCard(eq, filtroTurno) {
    // Collect all specific turn members to calculate valid slots total.
    // We now count S/R as well, because if they are here, we need to see them to fix them.
    let totalValidMembers = 0;
    Object.keys(eq.turnos).forEach(t => { totalValidMembers += eq.turnos[t].length; });

    // Decide which turnos to render based on configured Escala property and actual members
    let turnosOfThisEquip = [];

    // "Escala" determines the structural skeleton. Values: '24HS', 'ADM', '16H'.
    if (eq.isVirtual) {
      // Show every shift drawer that physically has a lost member inside
      turnosOfThisEquip = ['A', 'B', 'C', 'D', 'ADM', '16H', 'S/R'];
    } else {
      if (eq.escala === '24HS' || eq.escala === '24H' || eq.escala === '4x4') turnosOfThisEquip = ['A', 'B', 'C', 'D'];
      else if (eq.escala === 'ADM') turnosOfThisEquip = ['ADM'];
      else if (eq.escala === '16H' || eq.escala === '16HS') turnosOfThisEquip = ['16H'];
      else turnosOfThisEquip = ['A', 'B', 'C', 'D']; // safe default

      // Force display of any shift that actually has assigned members to prevent them from becoming invisible
      Object.keys(eq.turnos).forEach(t => {
        if (eq.turnos[t].length > 0 && !turnosOfThisEquip.includes(t)) {
          turnosOfThisEquip.push(t);
        }
      });

      // Maintain sensible visual order
      const sortOrder = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'ADM': 5, '16H': 6, 'S/R': 7 };
      turnosOfThisEquip.sort((a, b) => (sortOrder[a] || 99) - (sortOrder[b] || 99));
    }

    // If a specific UI filter is set ("A", "ADM"), only show that specific shift-drawer, if this equip covers it
    if (filtroTurno !== 'TODOS' && !eq.isVirtual) {
      turnosOfThisEquip = turnosOfThisEquip.filter(t => t === filtroTurno);
    }

    // For virtual, only show the drawers that actually have people inside
    if (eq.isVirtual) {
      turnosOfThisEquip = turnosOfThisEquip.filter(t => eq.turnos[t] && eq.turnos[t].length > 0);
    }

    // Hide the equipment altogether if it doesn't have the user's selected shift inside its skeleton
    if (filtroTurno !== 'TODOS' && turnosOfThisEquip.length === 0) return '';

    const turnoRows = turnosOfThisEquip.map(t => {
      const members = eq.turnos[t] || [];
      return `
        <div class="equip-turno-row">
          <div class="equip-turno-label" ${t === 'S/R' ? 'style="background:var(--danger);color:white;border-color:var(--danger)"' : ''}>${t}</div>
          <div class="equip-turno-members">
            ${members.length === 0
          ? '<span class="equip-empty-turno">—</span>'
          : members.map(c => {
            const statusStr = String(c.status || 'ATIVO').toUpperCase();
            const color = SGE.equip.getStatusColor(statusStr);
            const isInactive = ['DESLIGADO', 'INATIVO', 'AFASTADO', 'FÉRIAS', 'FERIAS'].includes(statusStr);
            const opacity = isInactive ? '0.6' : '1';
            const textDecoration = (statusStr === 'DESLIGADO' || statusStr === 'INATIVO') ? 'line-through' : 'none';

            return `
                <span class="equip-member" data-id="${c.id}" title="${c.nome} (${c.funcao}) - Status: ${c.status}" style="border-left: 3px solid ${color}; opacity: ${opacity};">
                  <div style="display:flex; flex-direction:column; gap:1px; line-height:1.2;">
                    <span style="text-decoration: ${textDecoration}">${SGE.equip.abbreviateName(c.nome)}</span>
                    <span style="font-size:8px; font-weight:700; color:${color}; letter-spacing:0.5px;">${statusStr}</span>
                  </div>
                  <span class="equip-member-funcao">${c.funcao}</span>
                </span>
              `}).join('')}
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
          <div class="equip-card-count">${totalValidMembers}</div>
        </div>
        <div class="equip-card-body">
          ${turnoRows}
        </div>
      </div>
    `;
  },

  /**
   * Helper to get color based on status
   */
  getStatusColor(status) {
    const s = String(status || '').toUpperCase();
    const map = {
      'ATIVO': 'var(--success, #10b981)',
      'FÉRIAS': 'var(--warning, #f59e0b)',
      'FERIAS': 'var(--warning, #f59e0b)',
      'AFASTADO': 'var(--amber, #d97706)',
      'DESLIGADO': 'var(--purple, #8b5cf6)',
      'INATIVO': 'var(--danger, #ef4444)',
      'EM AVISO': 'var(--indigo, #6366f1)',
      'EM CONTRATAÇÃO': 'var(--teal, #14b8a6)',
      'FALTA': 'var(--rose, #f43f5e)',
      'SEM_ID': 'var(--danger, #ef4444)'
    };
    return map[s] || 'var(--border, #334155)';
  },

  /**
   * Abbreviate a name to FIRST LAST
   */
  abbreviateName(nome) {
    if (!nome) return '—';
    const parts = nome.split(' ');
    if (parts.length === 1) return nome;
    return parts[0] + ' ' + parts[parts.length - 1]; // First and Last name
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
        const result = await SGE.api.syncNormalizeEquipments();
        if (result) {
          SGE.helpers.toast(`${result.updated} equipamentos normalizados`, 'success');
          SGE.equip.render();
        } else {
          SGE.helpers.toast('Erro ao normalizar', 'error');
        }
      });
    }
  }
};
