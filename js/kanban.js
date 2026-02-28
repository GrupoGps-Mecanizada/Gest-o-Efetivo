'use strict';

/**
 * SGE — Kanban View
 * Renders kanban board with drag-and-drop for cards and columns.
 * Uses smart DOM morphing on background sync to avoid interrupting
 * user scroll, hover states, or drag operations.
 */
window.SGE = window.SGE || {};

SGE.kanban = {
    /**
     * Render the full kanban board.
     * On an already-rendered board, performs intelligent DOM morphing:
     * - Adds new cards
     * - Removes gone cards
     * - Updates changed cards in-place
     * - Never resets scroll positions
     */
    render() {
        const container = document.getElementById('kanban-view');
        if (!container) return;

        const filteredColabs = SGE.helpers.filtrarColaboradores();
        const supAtivos = SGE.state.supervisores.filter(s => s.ativo);

        // Sort supervisors by configured order
        const order = SGE.CONFIG.ordemKanban || [];
        supAtivos.sort((a, b) => {
            const idxA = order.indexOf(a.nome);
            const idxB = order.indexOf(b.nome);
            if (idxA === -1 && idxB === -1) return a.nome.localeCompare(b.nome);
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
        });

        // No data state
        if (supAtivos.length === 0 && SGE.state.colaboradores.length === 0) {
            container.innerHTML = `
        <div class="no-data-message" style="width:100%;padding-top:80px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="3" width="20" height="18" rx="2"/>
            <path d="M8 3v18M16 3v18"/>
          </svg>
          <h3>Nenhum dado carregado</h3>
          <p>Configure a URL do Google Apps Script em <strong>js/config.js</strong><br>para carregar os dados dos colaboradores do Google Sheets.</p>
        </div>`;
            return;
        }

        // Check if this is a first render (no columns exist yet)
        const existingCols = container.querySelectorAll('.kanban-col');
        const isFirstRender = existingCols.length === 0;

        if (isFirstRender) {
            SGE.kanban._fullRender(container, filteredColabs, supAtivos);
        } else {
            SGE.kanban._morphRender(container, filteredColabs, supAtivos);
        }
    },

    /**
     * Full (initial) render: build all columns from scratch.
     * Only called when container is empty.
     */
    _fullRender(container, filteredColabs, supAtivos) {
        const frag = document.createDocumentFragment();

        supAtivos.forEach((sup, idx) => {
            const membros = filteredColabs.filter(c => c.supervisor === sup.nome);
            const colEl = SGE.kanban._buildColumn(sup, idx, membros);
            frag.appendChild(colEl);
        });

        container.innerHTML = '';
        container.appendChild(frag);
    },

    /**
     * Smart morph render: update only what changed.
     * Preserves scroll positions and event listeners on unchanged cards.
     */
    _morphRender(container, filteredColabs, supAtivos) {
        // Save scroll states before any DOM changes
        const scrollState = { mainX: container.scrollLeft, cols: {} };
        container.querySelectorAll('.col-body').forEach(cb => {
            if (cb.dataset.supervisor) scrollState.cols[cb.dataset.supervisor] = cb.scrollTop;
        });

        // Build lookup of existing columns
        const existingColMap = {};
        container.querySelectorAll('.kanban-col').forEach(col => {
            existingColMap[col.dataset.supervisor] = col;
        });

        // Determine which supervisors are needed (in new order)
        const neededSupNames = supAtivos.map(s => s.nome);

        // Remove columns for supervisors no longer active
        Object.keys(existingColMap).forEach(name => {
            if (!neededSupNames.includes(name)) {
                existingColMap[name].remove();
                delete existingColMap[name];
            }
        });

        // Add or update columns
        supAtivos.forEach((sup, idx) => {
            const membros = filteredColabs.filter(c => c.supervisor === sup.nome);
            const existing = existingColMap[sup.nome];

            if (!existing) {
                // New column — insert at the correct position
                const newCol = SGE.kanban._buildColumn(sup, idx, membros);
                const refNode = container.children[idx] || null;
                container.insertBefore(newCol, refNode);
                existingColMap[sup.nome] = newCol;
            } else {
                // Update column header count
                const countEl = existing.querySelector('.col-count');
                if (countEl) countEl.textContent = membros.length;

                // Morph the column body
                const body = existing.querySelector('.col-body');
                if (body) {
                    SGE.kanban._morphColumnBody(body, sup, membros);
                }

                // Reorder column if needed (place it at the expected index)
                const currentIdx = Array.from(container.children).indexOf(existing);
                if (currentIdx !== idx) {
                    const refNode = container.children[idx] || null;
                    container.insertBefore(existing, refNode);
                }
            }
        });

        // Restore scroll states after all DOM mutations
        requestAnimationFrame(() => {
            container.scrollLeft = scrollState.mainX;
            container.querySelectorAll('.col-body').forEach(cb => {
                const sup = cb.dataset.supervisor;
                if (sup && scrollState.cols[sup] != null) {
                    cb.scrollTop = scrollState.cols[sup];
                }
            });
        });
    },

    /**
     * Morph just the cards inside a column body.
     * Adds, removes, and updates cards without touching unchanged ones.
     */
    _morphColumnBody(body, sup, membros) {
        if (membros.length === 0) {
            // If there's already an empty message, leave it; otherwise replace
            if (!body.querySelector('.empty-col')) {
                body.innerHTML = '<div class="empty-col">Nenhum colaborador</div>';
            }
            return;
        }

        // Remove empty-col placeholder if present
        const emptyEl = body.querySelector('.empty-col');
        if (emptyEl) emptyEl.remove();

        // Build a map of existing card elements by collaborator id
        const existingCards = {};
        body.querySelectorAll('.card[data-id]').forEach(card => {
            existingCards[card.dataset.id] = card;
        });

        const newIds = new Set(membros.map(m => m.id));

        // Remove cards that are no longer in this column
        Object.keys(existingCards).forEach(id => {
            if (!newIds.has(id)) {
                existingCards[id].remove();
                delete existingCards[id];
            }
        });

        // Add or update cards in order
        membros.forEach((col, i) => {
            const existing = existingCards[col.id];

            if (!existing) {
                // New card — create and insert at correct position
                const newCard = SGE.kanban.makeCard(col);
                const refNode = body.children[i] || null;
                body.insertBefore(newCard, refNode);
            } else {
                // Card exists — check if data changed and update in-place
                SGE.kanban._updateCardIfChanged(existing, col);

                // Reorder if needed
                const currentIdx = Array.from(body.children).indexOf(existing);
                if (currentIdx !== i) {
                    const refNode = body.children[i] || null;
                    body.insertBefore(existing, refNode);
                }
            }
        });
    },

    /**
     * Update a card's content in-place only if its displayed data changed.
     * Preserves event listeners and prevents unnecessary repaints.
     */
    _updateCardIfChanged(cardEl, col) {
        const h = SGE.helpers;
        const semId = h.isSemId(col);
        const isFerias = h.isFerias(col);

        // Compare key visible fields using data attributes for fast diffing
        const prev = {
            nome: cardEl.dataset.nome || '',
            funcao: cardEl.dataset.funcao || '',
            cr: cardEl.dataset.cr || '',
            regime: cardEl.dataset.regime || '',
            equipamento: cardEl.dataset.equipamento || '',
            ferias: cardEl.dataset.ferias || '',
            semId: cardEl.dataset.semId || ''
        };

        const next = {
            nome: col.nome || '',
            funcao: col.funcao || '',
            cr: col.cr || '',
            regime: col.regime || '',
            equipamento: col.equipamento || '',
            ferias: isFerias ? '1' : '',
            semId: semId ? '1' : ''
        };

        const changed = Object.keys(next).some(k => prev[k] !== next[k]);
        if (!changed) return; // Nothing to update — skip repaint

        // Stamp data attributes for future comparisons
        Object.assign(cardEl.dataset, next);

        const badgeRegime = h.regimeBadgeClass(col.regime);
        const funcaoStyle = SGE.CONFIG.getFuncaoBadgeStyle(col.funcao);
        const alertHtml = semId ? '<div class="card-alert" title="Sem ID definitivo"></div>' : '';
        const feriasHtml = isFerias ? '<span class="badge badge-SEM">Ferias</span>' : '';

        // Update inner HTML (preserves the card element and its drag listeners)
        cardEl.innerHTML = `
      ${alertHtml}
      <div class="card-top">
        <div class="card-name" style="font-weight: 600; font-size: 13px; margin-bottom: 4px; color: var(--text-1);">${col.nome}</div>
      </div>
      <div class="card-badges" style="margin-bottom: 6px;">
        <span class="badge" style="${funcaoStyle}">${col.funcao}</span>
        <span class="badge ${badgeRegime}">${col.regime}</span>
        <span class="badge" style="background:${col.categoria === 'OPERACIONAL' ? '#e0f2fe' : '#fef3c7'};color:${col.categoria === 'OPERACIONAL' ? '#0369a1' : '#92400e'};border:1px solid ${col.categoria === 'OPERACIONAL' ? '#bae6fd' : '#fde68a'};font-size:9px;">${col.categoria === 'OPERACIONAL' ? 'OP' : 'GES'}</span>
        ${feriasHtml}
      </div>
      <div class="card-vaga" style="margin-bottom: 6px;">${h.equipamentoIconSvg()} ${col.categoria === 'GESTAO' ? (col.supervisor || 'Sem Setor') : (col.equipamento || 'Sem equipamento')}</div>
      <div class="card-id" style="font-size: 11px; color: var(--text-3); border-top: 1px solid var(--border-color); padding-top: 6px; margin-top: auto;">
        MAT: <strong style="color: var(--text-2);">${col.matricula_gps || 'S/ MAT'}</strong>
        ${col.cr ? `<span style="margin-left:8px;">CR: <strong style="color: var(--text-2);">${col.cr}</strong></span>` : ''}
      </div>
    `;
    },

    /**
     * Build a full column element (used in first render and for new columns).
     */
    _buildColumn(sup, idx, membros) {
        const container = document.getElementById('kanban-view');
        const colEl = document.createElement('div');
        colEl.className = 'kanban-col';
        colEl.dataset.supervisor = sup.nome;
        colEl.dataset.supIdx = idx;

        if (SGE.auth.hasRole('GESTAO')) {
            colEl.draggable = true;
        }

        colEl.innerHTML = `
        <div class="col-header">
          <div class="col-title">
            ☰ ${sup.nome}
            <span class="col-count">${membros.length}</span>
          </div>
          <div class="col-regime">${sup.regime_padrao || 'Misto'}</div>
        </div>
        <div class="col-body" data-supervisor="${sup.nome}"></div>
      `;

        if (SGE.auth.hasRole('GESTAO')) {
            SGE.kanban._setupColumnDrag(colEl, idx, container);
        }

        const body = colEl.querySelector('.col-body');

        if (SGE.auth.hasRole('GESTAO')) {
            SGE.kanban._setupColumnDrop(body, sup);
        }

        if (membros.length === 0) {
            body.innerHTML = '<div class="empty-col">Nenhum colaborador</div>';
        } else {
            const bodyFrag = document.createDocumentFragment();
            membros.forEach(c => {
                const card = SGE.kanban.makeCard(c);
                // Stamp initial data attributes for future diffing
                const h = SGE.helpers;
                Object.assign(card.dataset, {
                    nome: c.nome || '',
                    funcao: c.funcao || '',
                    cr: c.cr || '',
                    regime: c.regime || '',
                    equipamento: c.equipamento || '',
                    ferias: h.isFerias(c) ? '1' : '',
                    semId: h.isSemId(c) ? '1' : ''
                });
                bodyFrag.appendChild(card);
            });
            body.appendChild(bodyFrag);
        }

        return colEl;
    },

    /**
     * Create a card element for a collaborator
     */
    makeCard(colaborador) {
        const el = document.createElement('div');
        el.className = 'card';
        if (SGE.auth.hasRole('GESTAO')) {
            el.draggable = true;
        }
        el.dataset.id = colaborador.id;

        const h = SGE.helpers;
        const semId = h.isSemId(colaborador);
        const badgeRegime = h.regimeBadgeClass(colaborador.regime);
        const funcaoStyle = SGE.CONFIG.getFuncaoBadgeStyle(colaborador.funcao);
        const alertHtml = semId ? '<div class="card-alert" title="Sem ID definitivo"></div>' : '';
        const feriasHtml = h.isFerias(colaborador) ? '<span class="badge badge-SEM">Ferias</span>' : '';

        el.innerHTML = `
      ${alertHtml}
      <div class="card-top">
        <div class="card-name" style="font-weight: 600; font-size: 13px; margin-bottom: 4px; color: var(--text-1);">${colaborador.nome}</div>
      </div>
      <div class="card-badges" style="margin-bottom: 6px;">
        <span class="badge" style="${funcaoStyle}">${colaborador.funcao}</span>
        <span class="badge ${badgeRegime}">${colaborador.regime}</span>
        <span class="badge" style="background:${colaborador.categoria === 'OPERACIONAL' ? '#e0f2fe' : '#fef3c7'};color:${colaborador.categoria === 'OPERACIONAL' ? '#0369a1' : '#92400e'};border:1px solid ${colaborador.categoria === 'OPERACIONAL' ? '#bae6fd' : '#fde68a'};font-size:9px;">${colaborador.categoria === 'OPERACIONAL' ? 'OP' : 'GES'}</span>
        ${feriasHtml}
      </div>
      <div class="card-vaga" style="margin-bottom: 6px;">${h.equipamentoIconSvg()} ${colaborador.categoria === 'GESTAO' ? (colaborador.supervisor || 'Sem Setor') : (colaborador.equipamento || 'Sem equipamento')}</div>
      <div class="card-id" style="font-size: 11px; color: var(--text-3); border-top: 1px solid var(--border-color); padding-top: 6px; margin-top: auto;">
        MAT: <strong style="color: var(--text-2);">${colaborador.matricula_gps || 'S/ MAT'}</strong>
        ${colaborador.cr ? `<span style="margin-left:8px;">CR: <strong style="color: var(--text-2);">${colaborador.cr}</strong></span>` : ''}
      </div>
    `;

        if (SGE.auth.hasRole('GESTAO')) {
            el.addEventListener('dragstart', e => {
                SGE.state.drag.cardData = colaborador;
                el.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
                SGE.state.drag.cardData = null;
            });
        }

        el.addEventListener('click', () => SGE.drawer.open(colaborador));

        return el;
    },

    /**
     * Setup column-level drag events for reordering
     */
    _setupColumnDrag(colEl, idx, container) {
        colEl.addEventListener('dragstart', e => {
            if (e.target.closest('.card')) return;
            SGE.state.drag.colSrcIdx = idx;
            colEl.classList.add('col-dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/col-drag', idx);
        });
        colEl.addEventListener('dragend', () => {
            colEl.classList.remove('col-dragging');
            SGE.state.drag.colSrcIdx = null;
            container.querySelectorAll('.col-drag-over').forEach(c => c.classList.remove('col-drag-over'));
        });
        colEl.addEventListener('dragover', e => {
            e.preventDefault();
            if (SGE.state.drag.colSrcIdx !== null && SGE.state.drag.colSrcIdx !== idx) {
                colEl.classList.add('col-drag-over');
            }
        });
        colEl.addEventListener('dragleave', e => {
            if (!colEl.contains(e.relatedTarget)) colEl.classList.remove('col-drag-over');
        });
        colEl.addEventListener('drop', e => {
            colEl.classList.remove('col-drag-over');
            const srcIdx = SGE.state.drag.colSrcIdx;
            if (srcIdx !== null && srcIdx !== idx) {
                e.preventDefault();
                e.stopPropagation();
                const moved = SGE.state.supervisores.splice(srcIdx, 1)[0];
                SGE.state.supervisores.splice(idx, 0, moved);
                SGE.state.drag.colSrcIdx = null;
                SGE.kanban.render();
                SGE.helpers.toast(`Coluna ${moved.nome} reordenada`, 'info');
                return;
            }
        });
    },

    /**
     * Setup card drop events on column body
     */
    _setupColumnDrop(body, sup) {
        body.addEventListener('dragover', e => {
            e.preventDefault();
            if (SGE.state.drag.cardData) body.classList.add('drag-over');
        });
        body.addEventListener('dragleave', e => {
            if (!body.contains(e.relatedTarget)) body.classList.remove('drag-over');
        });
        body.addEventListener('drop', e => {
            e.preventDefault();
            body.classList.remove('drag-over');
            if (SGE.state.drag.cardData && SGE.state.drag.cardData.supervisor !== sup.nome) {
                SGE.modal.openMove(SGE.state.drag.cardData, sup.nome, 'drag');
            }
        });
    },

    /**
     * Update kanban scroll arrow visibility
     */
    updateArrows() {
        const kv = document.getElementById('kanban-view');
        const leftBtn = document.getElementById('kanban-arrow-left');
        const rightBtn = document.getElementById('kanban-arrow-right');
        if (!kv || !leftBtn || !rightBtn) return;
        leftBtn.classList.toggle('hidden', kv.scrollLeft <= 10);
        rightBtn.classList.toggle('hidden', kv.scrollLeft >= kv.scrollWidth - kv.clientWidth - 10);
    }
};
