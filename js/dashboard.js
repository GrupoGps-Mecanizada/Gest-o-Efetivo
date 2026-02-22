'use strict';

/**
 * SGE — Dashboard Avançado
 * Análise Executiva de Efetivo
 */
window.SGE = window.SGE || {};

SGE.dashboard = {
    charts: {},
    colors: {
        primary: '#0f3868',
        secondary: '#38bdf8',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        purple: '#8b5cf6',
        slate: '#64748b',
        teal: '#14b8a6',
        rose: '#f43f5e',
        amber: '#d97706',
        indigo: '#6366f1'
    },

    getPalette() {
        return [
            this.colors.primary, this.colors.secondary, this.colors.teal,
            this.colors.purple, this.colors.rose, this.colors.amber,
            this.colors.success, this.colors.indigo, this.colors.warning
        ];
    },

    render() {
        const view = document.getElementById('viz-view');
        if (!view) return;

        let data = SGE.state.colaboradores || [];

        // Verifica se há filtro ativo para o dashboard (opcional, aplicaremos os filtros globais se necessário)
        // No momento, refletimos todo o cenário.

        if (data.length === 0) {
            view.innerHTML = `
                <div class="no-data-message" style="width:100%;padding-top:80px;text-align:center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;color:var(--text-3);margin-bottom:16px;">
                        <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h3 style="color:var(--text-2);margin:0">Nenhum dado de Efetivo disponível.</h3>
                </div>`;
            return;
        }

        view.innerHTML = `
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <div>
                        <h2 class="dashboard-title">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                            Análise Executiva
                        </h2>
                        <p class="dashboard-subtitle">Visão geral do sistema atualizada em tempo real.</p>
                    </div>
                    <button class="btn btn-primary" onclick="SGE.dashboard.render()" title="Recalcular Gráficos">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                        Atualizar Telas
                    </button>
                </div>

                <div class="kpi-grid" id="dashboard-kpis"></div>

                <div class="charts-grid">
                    <!-- Esquerda Superior (Rosca) -->
                    <div class="chart-card span-4">
                        <div class="chart-header">
                            <h3 class="chart-title">Distribuição por Status</h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="chartStatus"></canvas>
                        </div>
                    </div>
                    
                    <!-- Centro Superior (Radar ou Pie) -->
                    <div class="chart-card span-4">
                        <div class="chart-header">
                            <h3 class="chart-title">Efetivo por Função</h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="chartFuncao"></canvas>
                        </div>
                    </div>

                    <!-- Direita Superior (Doughnut) -->
                    <div class="chart-card span-4">
                        <div class="chart-header">
                            <h3 class="chart-title">Alocação de Equipamento</h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="chartEquipamento"></canvas>
                        </div>
                    </div>

                    <!-- Esquerda Central (Barras Agrupadas) -->
                    <div class="chart-card span-6">
                        <div class="chart-header">
                            <h3 class="chart-title">Distribuição por Regime de Trabalho</h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="chartRegime"></canvas>
                        </div>
                    </div>

                    <!-- Direita Central (Barras Empilhadas) -->
                    <div class="chart-card span-6">
                        <div class="chart-header">
                            <h3 class="chart-title">Composição de Status por Regime</h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="chartStatusRegime"></canvas>
                        </div>
                    </div>

                    <!-- Inferior Total (Barras Horizontais) -->
                    <div class="chart-card span-12 horizontal-bar">
                        <div class="chart-header">
                            <h3 class="chart-title">Lotação por Supervisor</h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="chartSupervisor"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderKPIs(data);
        this.renderCharts(data);
    },

    renderKPIs(data) {
        const total = data.length;
        const ativos = data.filter(c => c.status === 'ATIVO').length;
        const ferias = data.filter(c => c.status === 'FÉRIAS').length;
        const semId = data.filter(c => c.status === 'SEM_ID' || !c.id).length;
        const faltas = data.filter(c => c.status === 'FALTA' || c.status === 'AFASTADO').length;

        document.getElementById('dashboard-kpis').innerHTML = `
            <div class="kpi-card">
                <div class="kpi-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div class="kpi-info">
                    <h4>Efetivo Total</h4>
                    <div class="kpi-val">${total}</div>
                </div>
            </div>
            <div class="kpi-card success">
                <div class="kpi-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <div class="kpi-info">
                    <h4>Operação Ativa</h4>
                    <div class="kpi-val">${ativos} <span style="font-size:12px;color:var(--text-3);font-weight:500;">(${(ativos / total * 100).toFixed(1)}%)</span></div>
                </div>
            </div>
            <div class="kpi-card warning">
                <div class="kpi-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <div class="kpi-info">
                    <h4>Em Férias / Afast.</h4>
                    <div class="kpi-val">${ferias + faltas}</div>
                </div>
            </div>
            <div class="kpi-card danger">
                <div class="kpi-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <div class="kpi-info">
                    <h4>Sem ID ou Pendentes</h4>
                    <div class="kpi-val">${semId}</div>
                </div>
            </div>
        `;
    },

    destroyAllCharts() {
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key]) {
                this.charts[key].destroy();
            }
        });
        this.charts = {};
    },

    renderCharts(data) {
        if (!window.Chart) {
            console.error('SGE: Chart.js library is not loaded');
            return;
        }

        this.destroyAllCharts();

        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = "#64748b";
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 56, 104, 0.9)';
        Chart.defaults.plugins.tooltip.padding = 10;
        Chart.defaults.plugins.tooltip.cornerRadius = 6;

        const palette = this.getPalette();

        // ----------------------------------------------------
        // 1. Distribuição por Status (Doughnut)
        // ----------------------------------------------------
        const statusMap = { 'ATIVO': 0, 'FÉRIAS': 0, 'AFASTADO': 0, 'FALTA': 0, 'SEM_ID': 0, 'OUTROS': 0 };
        data.forEach(c => {
            const s = c.status?.toUpperCase() || '';
            if (statusMap[s] !== undefined) statusMap[s]++;
            else if (s) statusMap['OUTROS']++;
        });

        // Limpar zeros
        Object.keys(statusMap).forEach(k => { if (statusMap[k] === 0) delete statusMap[k]; });

        this.charts.status = new Chart(document.getElementById('chartStatus'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusMap),
                datasets: [{
                    data: Object.values(statusMap),
                    backgroundColor: [this.colors.success, this.colors.warning, this.colors.amber, this.colors.rose, this.colors.danger, this.colors.slate],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } }
                }
            }
        });

        // ----------------------------------------------------
        // 2. Efetivo por Função (Polar Area)
        // ----------------------------------------------------
        const funcaoCounts = {};
        data.forEach(c => {
            const f = c.funcao || 'N/A';
            funcaoCounts[f] = (funcaoCounts[f] || 0) + 1;
        });

        this.charts.funcao = new Chart(document.getElementById('chartFuncao'), {
            type: 'polarArea',
            data: {
                labels: Object.keys(funcaoCounts),
                datasets: [{
                    data: Object.values(funcaoCounts),
                    backgroundColor: [
                        'rgba(15, 56, 104, 0.7)',
                        'rgba(56, 189, 248, 0.7)',
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(139, 92, 246, 0.7)',
                        'rgba(244, 63, 94, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } }
                },
                scales: {
                    r: { ticks: { display: false } }
                }
            }
        });

        // ----------------------------------------------------
        // 3. Alocação de Equipamento (Pie)
        // ----------------------------------------------------
        let comEquip = 0;
        let semEquip = 0;
        data.forEach(c => {
            if (c.equipamento && c.equipamento.trim().length > 0 && c.equipamento.toUpperCase() !== 'N/A') comEquip++;
            else semEquip++;
        });

        this.charts.equipamento = new Chart(document.getElementById('chartEquipamento'), {
            type: 'pie',
            data: {
                labels: ['Com Equipamento', 'Sem Equipamento'],
                datasets: [{
                    data: [comEquip, semEquip],
                    backgroundColor: [this.colors.primary, this.colors.slate],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } }
                }
            }
        });

        // ----------------------------------------------------
        // 4. Distribuição por Regime (Bar)
        // ----------------------------------------------------
        const regimeCounts = {};
        data.forEach(c => {
            const r = c.regime || 'Sem Registro';
            regimeCounts[r] = (regimeCounts[r] || 0) + 1;
        });

        const sortedRegimes = Object.entries(regimeCounts).sort((a, b) => b[1] - a[1]);

        this.charts.regime = new Chart(document.getElementById('chartRegime'), {
            type: 'bar',
            data: {
                labels: sortedRegimes.map(i => i[0]),
                datasets: [{
                    label: 'Quantidade',
                    data: sortedRegimes.map(i => i[1]),
                    backgroundColor: this.colors.secondary,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // ----------------------------------------------------
        // 5. Composição de Status por Regime (Stacked Bar)
        // ----------------------------------------------------
        // Quais status ocorrem em cada regime
        const regimesParaStatus = Object.keys(regimeCounts);

        // Count Ativos vs Férias vs Outros per Regime
        const datasetAtivo = [];
        const datasetFerias = [];
        const datasetOutros = [];

        regimesParaStatus.forEach(r => {
            const colsInR = data.filter(c => (c.regime || 'Sem Registro') === r);
            datasetAtivo.push(colsInR.filter(c => c.status === 'ATIVO').length);
            datasetFerias.push(colsInR.filter(c => c.status === 'FÉRIAS').length);
            datasetOutros.push(colsInR.filter(c => c.status !== 'ATIVO' && c.status !== 'FÉRIAS').length);
        });

        this.charts.statusRegime = new Chart(document.getElementById('chartStatusRegime'), {
            type: 'bar',
            data: {
                labels: regimesParaStatus,
                datasets: [
                    { label: 'Ativos', data: datasetAtivo, backgroundColor: this.colors.success },
                    { label: 'Férias', data: datasetFerias, backgroundColor: this.colors.warning },
                    { label: 'Outros', data: datasetOutros, backgroundColor: this.colors.slate }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } }
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                }
            }
        });

        // ----------------------------------------------------
        // 6. Lotação por Supervisor (Horizontal Bar)
        // ----------------------------------------------------
        const supCounts = {};
        data.forEach(c => {
            const s = c.supervisor || 'Não Atribuído';
            supCounts[s] = (supCounts[s] || 0) + 1;
        });

        const sortedSup = Object.entries(supCounts).sort((a, b) => b[1] - a[1]);

        // Gerar array de cores propostas pelo palette (cíclico)
        const barColors = sortedSup.map((_, i) => palette[i % palette.length]);

        this.charts.supervisor = new Chart(document.getElementById('chartSupervisor'), {
            type: 'bar',
            data: {
                labels: sortedSup.map(s => s[0]),
                datasets: [{
                    label: 'Colaboradores',
                    data: sortedSup.map(s => s[1]),
                    backgroundColor: barColors,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y', // torna horizontal
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { beginAtZero: true }
                }
            }
        });
    }
};
