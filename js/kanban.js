'use strict';

/**
 * SGE — Kanban View
 * Renders kanban board with drag-and-drop for cards and columns
 */
window.SGE = window.SGE || {};

SGE.kanban = {
    /**
     * Render the full kanban board
     */
    render() {
        const container = document.getElementById('kanban-view');

        // Save scroll states to prevent jumping during silent refresh
        const scrollState = { mainX: 0, mainY: 0, cols: {} };
        if (container) {
            scrollState.mainX = container.scrollLeft;
            scrollState.mainY = container.scrollTop;
            container.querySelectorAll('.col-body').forEach(cb => {
                const supName = cb.dataset.supervisor;
                if (supName) scrollState.cols[supName] = cb.scrollTop;
            });
        }

        const frag = document.createDocumentFragment();
        const cols = SGE.helpers.filtrarColaboradores();
        const supAtivos = SGE.state.supervisores.filter(s => s.ativo);

        // Sort supervisors explicitly by the configuration array
        const order = SGE.CONFIG.ordemKanban || [];
        supAtivos.sort((a, b) => {
            const idxA = order.indexOf(a.nome);
            const idxB = order.indexOf(b.nome);
            if (idxA === -1 && idxB === -1) return a.nome.localeCompare(b.nome);
            if (idxA === -1) return 1; // Unrecognized to bottom
            if (idxB === -1) return -1;
            return idxA - idxB;
        });

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

        supAtivos.forEach((sup, idx) => {
            const membros = cols.filter(c => c.supervisor === sup.nome);
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

            // Column drag (reorder supervisors)
            if (SGE.auth.hasRole('GESTAO')) {
                SGE.kanban._setupColumnDrag(colEl, idx, container);
            }

            const body = colEl.querySelector('.col-body');

            // Card drag events on column body
            if (SGE.auth.hasRole('GESTAO')) {
                SGE.kanban._setupColumnDrop(body, sup);
            }

            if (membros.length === 0) {
                body.innerHTML = '<div class="empty-col">Nenhum colaborador</div>';
            } else {
                const bodyFrag = document.createDocumentFragment();
                membros.forEach(c => bodyFrag.appendChild(SGE.kanban.makeCard(c)));
                body.appendChild(bodyFrag);
            }

            frag.appendChild(colEl);
        });

        container.innerHTML = '';
        container.appendChild(frag);

        // Restore scroll states
        container.scrollLeft = scrollState.mainX;
        container.scrollTop = scrollState.mainY;
        container.querySelectorAll('.col-body').forEach(cb => {
            const supName = cb.dataset.supervisor;
            if (supName && scrollState.cols[supName]) {
                cb.scrollTop = scrollState.cols[supName];
            }
        });
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
        const badgeFuncao = colaborador.funcao === 'MOT' ? 'badge-MOT' : 'badge-OP';
        const alertHtml = semId ? '<div class="card-alert" title="Sem ID definitivo"></div>' : '';
        const feriasHtml = h.isFerias(colaborador) ? '<span class="badge badge-SEM">🏖 Férias</span>' : '';

        el.innerHTML = `
      ${alertHtml}
      <div class="card-top">
        <div class="card-id">${colaborador.id}</div>
        <div class="card-name">${colaborador.nome}</div>
      </div>
      <div class="card-badges">
        <span class="badge ${badgeFuncao}">${colaborador.funcao}</span>
        <span class="badge ${badgeRegime}">${colaborador.regime}</span>
        ${feriasHtml}
      </div>
      <div class="card-vaga">${h.equipamentoIconSvg()} ${colaborador.equipamento || 'Sem equipamento'}</div>
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
