'use strict';

/**
 * SGE — History View
 * Displays movement history with filtering and CSV export
 */
window.SGE = window.SGE || {};

SGE.history = {
    render() {
        const container = document.getElementById('history-view');
        const savedScroll = container ? container.scrollTop : 0;
        const h = SGE.helpers;

        const filterInputs = container.querySelectorAll('.history-filter-input');
        const filters = {};
        filterInputs.forEach(inp => {
            if (inp.value.trim()) filters[inp.dataset.field] = inp.value.trim().toUpperCase();
        });

        let movs = [...SGE.state.movimentacoes];

        if (filters.colaborador) {
            movs = movs.filter(m =>
                (m.colaborador_nome || '').toUpperCase().includes(filters.colaborador) ||
                (m.colaborador_id || '').toUpperCase().includes(filters.colaborador)
            );
        }
        if (filters.origem) {
            movs = movs.filter(m => (m.supervisor_origem || '').toUpperCase().includes(filters.origem));
        }
        if (filters.destino) {
            movs = movs.filter(m => (m.supervisor_destino || '').toUpperCase().includes(filters.destino));
        }

        const tbody = document.getElementById('history-tbody');
        if (!tbody) return;

        if (movs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-3)">Nenhuma movimentação registrada</td></tr>`;
            return;
        }

        tbody.innerHTML = movs.map(m => `
      <tr>
        <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-3)">${h.formatDate(m.created_at)}</td>
        <td><strong>${m.colaborador_nome}</strong></td>
        <td style="font-family:var(--font-mono);font-size:11px">${m.colaborador_id}</td>
        <td>${m.supervisor_origem}<span class="mov-arrow">→</span>${m.supervisor_destino}</td>
        <td>${m.regime_origem}<span class="mov-arrow">→</span>${m.regime_destino}</td>
        <td>${m.motivo}</td>
        <td style="color:var(--text-3);font-size:11px">${m.observacao || '—'}</td>
        <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-3)">${m.usuario || '—'}</td>
      </tr>
    `).join('');

        if (container) container.scrollTop = savedScroll;
    },

    /**
     * Export movements to CSV
     */
    exportCSV() {
        if (SGE.state.movimentacoes.length === 0) {
            SGE.helpers.toast('Nenhuma movimentação para exportar', 'info');
            return;
        }

        const headers = ['Data', 'Colaborador', 'ID', 'Supervisor Origem', 'Supervisor Destino', 'Regime Origem', 'Regime Destino', 'Motivo', 'Observação', 'Usuário'];
        const rows = SGE.state.movimentacoes.map(m => [
            m.created_at,
            m.colaborador_nome,
            m.colaborador_id,
            m.supervisor_origem,
            m.supervisor_destino,
            m.regime_origem,
            m.regime_destino,
            m.motivo,
            m.observacao || '',
            m.usuario || ''
        ]);

        const csv = [headers, ...rows].map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `movimentacoes_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        SGE.helpers.toast('CSV exportado com sucesso');
    }
};
