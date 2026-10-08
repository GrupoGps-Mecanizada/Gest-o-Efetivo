'use strict';

/**
 * SGE — Dashboard Avançado v2
 * Central de BI — GPS Mecanizada
 */
window.SGE = window.SGE || {};

SGE.dashboard = {
    charts: {},
    activeTab: 'executivo',

    // Design Tokens matching preview
    theme: {
        bg: '#161b22',
        border: '#2a3447',
        text1: '#e6edf3',
        text2: '#9fb3c8',
        text3: '#5e7a96',
        blue: '#4a9eff',
        teal: '#26d97f',
        amber: '#f0a946',
        rose: '#f25c6e',
        purple: '#9b72ff',
        cyan: '#22d3ee',
        indigo: '#818cf8',
        orange: '#f97316'
    },

    // Profissional SVG Icons (Lucide style)
    icons: {
        executivo: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>`,
        operacional: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
        efetivoTotal: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        ativos: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
        semMatricula: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
        ferias: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
        gestao: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
        cobertura: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`,
        vencidos: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
        vencer30: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        alert: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
    },

    render() {
        const view = document.getElementById('viz-view');
        if (!view) return;

        let colabs = SGE.helpers.filtrarColaboradores();
        const total = colabs.length;

        view.innerHTML = `
            <div class="dashboard-container">

                <!-- TABS -->
                <div class="tabs">
                    <button class="dash-tab-btn ${this.activeTab === 'executivo' ? 'active' : ''}" data-tab="executivo">${this.icons.executivo} Executivo</button>
                    <button class="dash-tab-btn ${this.activeTab === 'operacional' ? 'active' : ''}" data-tab="operacional">${this.icons.operacional} Operacional</button>
                </div>

                <div id="dashboard-content"></div>
            </div>
        `;

        // Switch listeners
        view.querySelectorAll('.dash-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.activeTab = e.currentTarget.dataset.tab;
                this.render();
            });
        });

        // Current Tab
        const content = document.getElementById('dashboard-content');
        if (this.activeTab === 'executivo') this.renderExecutivo(colabs, content);
        if (this.activeTab === 'operacional') this.renderOperacional(colabs, content);
    },

    destroyCharts() {
        Object.values(this.charts).forEach(c => c && c.destroy());
        this.charts = {};
    },

    initChartDefaults() {
        if (!window.Chart) return false;
        Chart.defaults.color = this.theme.text3;
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(22, 27, 34, 0.95)';
        Chart.defaults.plugins.tooltip.borderColor = this.theme.border;
        Chart.defaults.plugins.tooltip.borderWidth = 1;
        Chart.defaults.plugins.tooltip.cornerRadius = 8;
        Chart.defaults.plugins.tooltip.titleColor = this.theme.text1;
        Chart.defaults.plugins.tooltip.bodyColor = this.theme.text2;
        Chart.defaults.devicePixelRatio = Math.max(window.devicePixelRatio || 1, 2);
        return true;
    },

    /* ═══════════════════ TAB EXECUTIVO ═══════════════════ */
    renderExecutivo(data, container) {
        const total = data.length;
        const ativos = data.filter(c => c.status === 'ATIVO').length;
        const semId = data.filter(c => !c.matricula_gps).length;
        const feriasVal = data.filter(c => c.status === 'FÉRIAS' || c.status === 'FERIAS').length;
        const opCount = data.filter(c => c.categoria === 'OPERACIONAL').length;
        const gestaoCount = data.filter(c => c.categoria === 'GESTAO' || c.categoria === 'GESTÃO').length;

        container.innerHTML = `
            <div class="dash-tab-content active">
                <div class="kpi-grid">
                    <div class="kpi-card" style="--kpi-accent:var(--accent);--glow-color:rgba(74,158,255,.05)">
                        <div class="kpi-icon" style="color:var(--accent)">${this.icons.efetivoTotal}</div>
                        <div class="kpi-body"><h4>Efetivo Total</h4><div class="kpi-val">${total}</div><div class="kpi-sub">Total na base</div></div>
                    </div>
                    <div class="kpi-card" style="--kpi-accent:${this.theme.teal}">
                        <div class="kpi-icon" style="color:${this.theme.teal}">${this.icons.ativos}</div>
                        <div class="kpi-body"><h4>Taxa de Ativos</h4><div class="kpi-val" style="color:${this.theme.teal}">${total > 0 ? (ativos / total * 100).toFixed(1) : 0}%</div><div class="kpi-sub">${ativos} colaboradores</div></div>
                    </div>
                    <div class="kpi-card" style="--kpi-accent:${this.theme.rose}">
                        <div class="kpi-icon" style="color:${this.theme.rose}">${this.icons.semMatricula}</div>
                        <div class="kpi-body"><h4>Sem Matrícula</h4><div class="kpi-val" style="color:${this.theme.rose}">${semId}</div><div class="kpi-sub">Pendências ID</div></div>
                    </div>
                    <div class="kpi-card" style="--kpi-accent:${this.theme.amber}">
                        <div class="kpi-icon" style="color:${this.theme.amber}">${this.icons.ferias}</div>
                        <div class="kpi-body"><h4>Férias Hoje</h4><div class="kpi-val" style="color:${this.theme.amber}">${feriasVal}</div><div class="kpi-sub">Em gozo agora</div></div>
                    </div>
                    <div class="kpi-card" style="--kpi-accent:${this.theme.blue}">
                        <div class="kpi-icon" style="color:${this.theme.blue}">${this.icons.operacional}</div>
                        <div class="kpi-body"><h4>Operacional</h4><div class="kpi-val">${opCount}</div><div class="kpi-sub">Categoria de campo</div></div>
                    </div>
                    <div class="kpi-card" style="--kpi-accent:${this.theme.purple}">
                        <div class="kpi-icon" style="color:${this.theme.purple}">${this.icons.gestao}</div>
                        <div class="kpi-body"><h4>Gestão</h4><div class="kpi-val">${gestaoCount}</div><div class="kpi-sub">Liderança e Apoio</div></div>
                    </div>
                </div>

                <div class="charts-grid">
                    <div class="chart-card span-4">
                        <div class="chart-header"><span class="chart-title">Status do Efetivo</span><span class="chart-hint">Porcentagem</span></div>
                        <div class="chart-container"><canvas id="c-status"></canvas></div>
                    </div>
                    <div class="chart-card span-8">
                        <div class="chart-header"><span class="chart-title">Headcount por Supervisor</span><span class="chart-hint">Top 8</span></div>
                        <div class="chart-container"><canvas id="c-sup"></canvas></div>
                    </div>
                </div>

                <div class="charts-grid">
                    <div class="chart-card span-4">
                        <div class="chart-header"><span class="chart-title">Distribuição por Turno</span></div>
                        <div class="chart-container"><canvas id="c-turno"></canvas></div>
                    </div>
                    <div class="chart-card span-4">
                        <div class="chart-header"><span class="chart-title">Por Tipo de Equipamento</span></div>
                        <div class="chart-container"><canvas id="c-equip"></canvas></div>
                    </div>
                    <div class="chart-card span-4">
                        <div class="chart-header"><span class="chart-title">Categoria</span></div>
                        <div class="chart-container"><canvas id="c-cat"></canvas></div>
                    </div>
                </div>
            </div>
        `;

        this.destroyCharts();
        if (!this.initChartDefaults()) return;

        // Data Preparation
        const statusMap = {};
        data.forEach(c => statusMap[c.status] = (statusMap[c.status] || 0) + 1);

        this.charts.status = new Chart(document.getElementById('c-status'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusMap),
                datasets: [{
                    data: Object.values(statusMap),
                    backgroundColor: [this.theme.teal, this.theme.amber, this.theme.orange, this.theme.indigo, this.theme.rose],
                    borderWidth: 2, borderColor: '#fff'
                }]
            },
            options: { cutout: '65%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 10 } } } } }
        });

        // Supervisor Count
        const supMap = {};
        data.forEach(c => { if (c.supervisor) supMap[c.supervisor] = (supMap[c.supervisor] || 0) + 1; });
        const topSups = Object.entries(supMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

        this.charts.sup = new Chart(document.getElementById('c-sup'), {
            type: 'bar',
            data: {
                labels: topSups.map(i => i[0]),
                datasets: [{ data: topSups.map(i => i[1]), backgroundColor: this.theme.blue + 'dd', borderRadius: 4 }]
            },
            options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } }
        });

        // Distribution by Shift (Regime)
        const regimeMap = {};
        data.forEach(c => { if (c.regime) regimeMap[c.regime] = (regimeMap[c.regime] || 0) + 1; });
        const regLabels = Object.keys(regimeMap).sort();

        this.charts.turno = new Chart(document.getElementById('c-turno'), {
            type: 'bar',
            data: {
                labels: regLabels,
                datasets: [{ data: regLabels.map(k => regimeMap[k]), backgroundColor: this.theme.indigo + 'cc', borderRadius: 4 }]
            },
            options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });

        // Alocacao Types
        const eqMap = {};
        data.forEach(c => {
            const aloc = (c.setor_id && c.setor !== 'SEM SETOR') ? c.setor : c.equipamento;
            if (aloc) eqMap[aloc] = (eqMap[aloc] || 0) + 1;
        });
        const eqSorted = Object.entries(eqMap).sort((a, b) => b[1] - a[1]).slice(0, 7);

        this.charts.equip = new Chart(document.getElementById('c-equip'), {
            type: 'pie',
            data: {
                labels: eqSorted.map(i => i[0]),
                datasets: [{ data: eqSorted.map(i => i[1]), backgroundColor: [this.theme.blue, this.theme.purple, this.theme.teal, this.theme.amber, this.theme.cyan, this.theme.indigo, this.theme.rose] }]
            },
            options: { plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 9 } } } } }
        });

        // Category
        const catMap = { 'OPERACIONAL': opCount, 'GESTAO': gestaoCount };
        this.charts.cat = new Chart(document.getElementById('c-cat'), {
            type: 'doughnut',
            data: {
                labels: ['Operacional', 'Gestao'],
                datasets: [{ data: [opCount, gestaoCount], backgroundColor: [this.theme.blue, this.theme.purple] }]
            },
            options: { cutout: '70%', plugins: { legend: { position: 'bottom' } } }
        });
    },

    /* ═══════════════════ TAB CAPACITAÇÃO ═══════════════════ */
    renderOperacional(data, container) {
        const ops = data.filter(c => c.categoria === 'OPERACIONAL');
        const eqSet = new Set();
        const eqColabs = ops.filter(c => c.equipamento || (c.setor_id && c.setor !== 'SEM SETOR'));
        eqColabs.forEach(c => {
            const aloc = (c.setor_id && c.setor !== 'SEM SETOR') ? c.setor : c.equipamento;
            eqSet.add(aloc);
        });

        // Heatmap calculation
        const turns = ['A', 'B', 'C', 'D', 'ADM'];
        const equipamentosESetores = Array.from(eqSet).sort();

        // Rows data
        const heatmapRows = equipamentosESetores.map(aloc => {
            const row = { name: aloc, total: 0 };
            turns.forEach(t => {
                const count = ops.filter(c => {
                    const cAloc = (c.setor_id && c.setor !== 'SEM SETOR') ? c.setor : c.equipamento;
                    if (cAloc !== aloc) return false;
                    const turno = SGE.equip ? SGE.equip.getTurno(c.regime) : (c.regime || '').includes(t);
                    return turno === t;
                }).length;
                row[t] = count;
                row.total += count;
            });
            return row;
        }).filter(r => r.total > 0);

        // Sem equipamento list
        const semEquip = ops.filter(c => !c.equipamento && (!c.setor_id || c.setor === 'SEM SETOR')).slice(0, 10);

        container.innerHTML = `
            <div class="dash-tab-content active">
                <div class="kpi-grid">
                    <div class="kpi-card"><div class="kpi-icon" style="color:${this.theme.blue}">${this.icons.operacional}</div><div class="kpi-body"><h4>Equipamentos</h4><div class="kpi-val">${eqSet.size}</div><div class="kpi-sub">Tipos em operação</div></div></div>
                    <div class="kpi-card"><div class="kpi-icon" style="color:${this.theme.teal}">${this.icons.ativos}</div><div class="kpi-body"><h4>Alocação</h4><div class="kpi-val">${eqColabs.length}</div><div class="kpi-sub">Colabs em equipamentos</div></div></div>
                    <div class="kpi-card"><div class="kpi-icon" style="color:${this.theme.amber}">${this.icons.alert}</div><div class="kpi-body"><h4>Sem Alocação</h4><div class="kpi-val" style="color:${this.theme.amber}">${ops.length - eqColabs.length}</div><div class="kpi-sub">Operacionais voantes/sem eq</div></div></div>
                    <div class="kpi-card"><div class="kpi-icon" style="color:${this.theme.cyan}">${this.icons.efetivoTotal}</div><div class="kpi-body"><h4>Média Colab/Eq</h4><div class="kpi-val">${eqSet.size > 0 ? (eqColabs.length / eqSet.size).toFixed(1) : 0}</div><div class="kpi-sub">Relação de cobertura</div></div></div>
                </div>

                <div class="chart-card span-12" style="margin-bottom:16px">
                    <div class="chart-header">
                        <span class="chart-title">Mapa de Cobertura: Alocação × Turno</span>
                        <span class="chart-hint">Verde ≥ 2 · Amarelo = 1 · Vermelho = 0</span>
                    </div>
                    <div class="data-table-wrap" style="padding:16px">
                        <table class="heatmap-table">
                            <thead>
                                <tr><th>Alocação</th>${turns.map(t => `<th>T ${t}</th>`).join('')}</tr>
                            </thead>
                            <tbody>
                                ${heatmapRows.map(row => `
                                    <tr>
                                        <td><div class="equip-dot" style="background:${this.theme.blue}"></div> ${row.name}</td>
                                        ${turns.map(t => {
            const v = row[t];
            const cls = v >= 2 ? 'cell-ok' : (v === 1 ? 'cell-low' : 'cell-empty');
            return `<td class="${cls}">${v}</td>`;
        }).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="charts-grid">
                    <div class="chart-card span-12">
                        <div class="chart-header"><span class="chart-title" style="color:${this.theme.amber}">🔍 Amostragem: Operacionais sem Equipamento (${ops.length - eqColabs.length})</span></div>
                        <div class="scroll-list" style="padding: 16px">
                            ${semEquip.map(c => `
                                <div class="mini-card" style="border-left-color:${this.theme.amber}">
                                    <div class="mini-card-title">${c.nome}</div>
                                    <div class="mini-card-sub">${c.funcao} · ${c.regime || 'S/ Regime'} · Sup: ${c.supervisor || '—'}</div>
                                </div>
                            `).join('') || '<div style="text-align:center;padding:20px;color:var(--text-3)">Nenhum operacional voante detectado</div>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};
