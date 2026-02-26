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
        const ferias = data.filter(c => c.status === 'FÉRIAS' || c.status === 'FERIAS').length;
        const semId = data.filter(c => c.status === 'SEM_ID' || !c.matricula_gps).length;
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

        if (window.ChartDataLabels) {
            Chart.register(ChartDataLabels);
        }

        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = '#64748b';
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 56, 104, 0.9)';
        Chart.defaults.plugins.tooltip.padding = 10;
        Chart.defaults.plugins.tooltip.cornerRadius = 6;

        // Desativar datalabels globalmente — cada gráfico configura os seus
        Chart.defaults.plugins.datalabels = { display: false };

        var self = this;
        var palette = this.getPalette();

        // ── Helper: legenda com quantidade (dataset único) ──
        function legendWithQty(chart) {
            var d = chart.data;
            return d.labels.map(function (label, i) {
                var val = d.datasets[0].data[i];
                return {
                    text: label + '   ' + val,
                    fillStyle: d.datasets[0].backgroundColor[i],
                    strokeStyle: d.datasets[0].backgroundColor[i],
                    pointStyle: 'circle',
                    hidden: false,
                    index: i
                };
            });
        }

        // ── Helper: legenda com total (multi-dataset) ──
        function legendMultiTotal(chart) {
            return chart.data.datasets.map(function (ds, i) {
                var total = ds.data.reduce(function (a, b) { return a + b; }, 0);
                return {
                    text: ds.label + '   ' + total,
                    fillStyle: ds.backgroundColor,
                    strokeStyle: ds.backgroundColor,
                    pointStyle: 'circle',
                    hidden: false,
                    datasetIndex: i
                };
            });
        }

        var legendBottom = {
            position: 'bottom',
            labels: {
                boxWidth: 10,
                usePointStyle: true,
                padding: 16,
                font: { size: 11 }
            }
        };

        var legendBottomWithQty = {
            position: 'bottom',
            labels: {
                boxWidth: 10,
                usePointStyle: true,
                padding: 16,
                font: { size: 11 },
                generateLabels: legendWithQty
            }
        };

        // ────────────────────────────────────────────────────────────
        // 1. Distribuição por Status (Doughnut)
        //    Labels: BRANCO CENTRADO DENTRO DA FATIA (apenas se ≥ 8% do total)
        //    Valores menores ficam apenas na legenda.
        // ────────────────────────────────────────────────────────────
        var statusColorMap = {
            'ATIVO': self.colors.success,
            'FÉRIAS': self.colors.warning,
            'FERIAS': self.colors.warning,
            'AFASTADO': self.colors.amber,
            'DESLIGADO': self.colors.purple,
            'INATIVO': self.colors.danger,
            'EM AVISO': self.colors.indigo,
            'EM CONTRATAÇÃO': self.colors.teal,
            'FALTA': self.colors.rose,
            'SEM_ID': self.colors.danger,
            'OUTROS': self.colors.slate
        };

        var statusMap = {};
        data.forEach(function (c) {
            var s = (c.status || '').toUpperCase();
            if (!s) return;
            statusMap[s] = (statusMap[s] || 0) + 1;
        });

        var statusLabels = Object.keys(statusMap);
        var statusValues = Object.values(statusMap);
        var statusTotal = statusValues.reduce(function (a, b) { return a + b; }, 0);
        var statusColors = statusLabels.map(function (lbl) {
            return statusColorMap[lbl] || '#64748b';
        });

        this.charts.status = new Chart(document.getElementById('chartStatus'), {
            type: 'doughnut',
            data: {
                labels: statusLabels,
                datasets: [{
                    data: statusValues,
                    backgroundColor: statusColors,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '62%',
                plugins: {
                    legend: legendBottomWithQty,
                    datalabels: {
                        // Mostrar APENAS em fatias com pelo menos 8% do total
                        display: function (ctx) {
                            var val = ctx.dataset.data[ctx.dataIndex];
                            return statusTotal > 0 && (val / statusTotal) >= 0.08;
                        },
                        // Branco, centrado dentro da fatia
                        color: '#ffffff',
                        anchor: 'center',
                        align: 'center',
                        font: { weight: 'bold', size: 13 },
                        formatter: function (val) { return val; }
                    }
                }
            }
        });

        // ────────────────────────────────────────────────────────────
        // 2. Efetivo por Função (Polar Area)
        //    Labels: apenas na legenda. Interno removido para evitar sobreposição.
        // ────────────────────────────────────────────────────────────
        var funcaoCounts = {};
        data.forEach(function (c) {
            var f = c.funcao || 'N/A';
            funcaoCounts[f] = (funcaoCounts[f] || 0) + 1;
        });

        var funcaoColors = ['#0f3868', '#38bdf8', '#10b981', '#8b5cf6', '#f43f5e', '#d97706', '#14b8a6', '#6366f1', '#f59e0b', '#ef4444'];
        var funcaoKeys = Object.keys(funcaoCounts);
        var funcaoVals = Object.values(funcaoCounts);
        var funcaoTotal = funcaoVals.reduce(function (a, b) { return a + b; }, 0);

        this.charts.funcao = new Chart(document.getElementById('chartFuncao'), {
            type: 'polarArea',
            data: {
                labels: funcaoKeys,
                datasets: [{
                    data: funcaoVals,
                    backgroundColor: funcaoKeys.map(function (_, i) { return funcaoColors[i % funcaoColors.length] + 'CC'; }),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 10,
                            usePointStyle: true,
                            padding: 16,
                            font: { size: 11 },
                            generateLabels: function (chart) {
                                return funcaoKeys.map(function (label, i) {
                                    var col = funcaoColors[i % funcaoColors.length] || '#64748b';
                                    return {
                                        text: label + '   ' + funcaoVals[i],
                                        fillStyle: col,
                                        strokeStyle: col,
                                        pointStyle: 'circle',
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                        }
                    },
                    datalabels: {
                        // Branco centrado apenas se ≥ 15% do total
                        display: function (ctx) {
                            var val = ctx.dataset.data[ctx.dataIndex];
                            return funcaoTotal > 0 && (val / funcaoTotal) >= 0.15;
                        },
                        color: '#ffffff',
                        anchor: 'center',
                        align: 'center',
                        font: { weight: 'bold', size: 12 },
                        formatter: function (val) { return val; }
                    }
                },
                scales: {
                    r: { ticks: { display: false }, grid: { color: 'rgba(0,0,0,0.06)' } }
                }
            }
        });

        // ────────────────────────────────────────────────────────────
        // 3. Alocação de Equipamento (Pie)
        //    Labels: BRANCO CENTRADO DENTRO DA FATIA
        // ────────────────────────────────────────────────────────────
        var comEquip = 0;
        var semEquip = 0;
        data.forEach(function (c) {
            if (c.equipamento && c.equipamento.trim().length > 0 && c.equipamento.toUpperCase() !== 'N/A') comEquip++;
            else semEquip++;
        });

        var equipTotal = comEquip + semEquip;
        var equipColors = [self.colors.primary, self.colors.slate];

        this.charts.equipamento = new Chart(document.getElementById('chartEquipamento'), {
            type: 'pie',
            data: {
                labels: ['Com Equipamento', 'Sem Equipamento'],
                datasets: [{
                    data: [comEquip, semEquip],
                    backgroundColor: equipColors,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: legendBottomWithQty,
                    datalabels: {
                        display: function (ctx) {
                            var val = ctx.dataset.data[ctx.dataIndex];
                            return equipTotal > 0 && (val / equipTotal) >= 0.08;
                        },
                        color: '#ffffff',
                        anchor: 'center',
                        align: 'center',
                        font: { weight: 'bold', size: 14 },
                        formatter: function (val) { return val; }
                    }
                }
            }
        });

        // ────────────────────────────────────────────────────────────
        // 4. Distribuição por Regime (Bar Vertical)
        //    Labels: BRANCO CENTRADO DENTRO DA BARRA
        //    Acima da barra (azul escuro) quando barra for muito pequena
        // ────────────────────────────────────────────────────────────
        var regimeCounts = {};
        data.forEach(function (c) {
            var r = c.regime || 'Sem Registro';
            regimeCounts[r] = (regimeCounts[r] || 0) + 1;
        });

        var sortedRegimes = Object.entries(regimeCounts).sort(function (a, b) { return b[1] - a[1]; });
        var regimeMax = sortedRegimes.length > 0 ? sortedRegimes[0][1] : 1;

        this.charts.regime = new Chart(document.getElementById('chartRegime'), {
            type: 'bar',
            data: {
                labels: sortedRegimes.map(function (i) { return i[0]; }),
                datasets: [{
                    label: 'Quantidade',
                    data: sortedRegimes.map(function (i) { return i[1]; }),
                    backgroundColor: self.colors.secondary,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        display: true,
                        // Dentro da barra se ≥ 15% do máximo, senão acima
                        anchor: function (ctx) {
                            var val = ctx.dataset.data[ctx.dataIndex];
                            return (val / regimeMax) >= 0.15 ? 'center' : 'end';
                        },
                        align: function (ctx) {
                            var val = ctx.dataset.data[ctx.dataIndex];
                            return (val / regimeMax) >= 0.15 ? 'center' : 'top';
                        },
                        color: function (ctx) {
                            var val = ctx.dataset.data[ctx.dataIndex];
                            return (val / regimeMax) >= 0.15 ? '#ffffff' : self.colors.primary;
                        },
                        font: { weight: 'bold', size: 12 },
                        formatter: function (val) { return val; }
                    }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                }
            }
        });

        // ────────────────────────────────────────────────────────────
        // 5. Composição de Status por Regime (Stacked Bar)
        //    Labels: BRANCO CENTRADO DENTRO DO SEGMENTO
        //    Só exibe se o segmento for ≥ 15% do total da barra (evita sobreposição)
        // ────────────────────────────────────────────────────────────
        var regimesParaStatus = Object.keys(regimeCounts);
        var datasetAtivo = [];
        var datasetFerias = [];
        var datasetOutros = [];

        regimesParaStatus.forEach(function (r) {
            var colsInR = data.filter(function (c) { return (c.regime || 'Sem Registro') === r; });
            datasetAtivo.push(colsInR.filter(function (c) { return c.status === 'ATIVO'; }).length);
            datasetFerias.push(colsInR.filter(function (c) { return c.status === 'FÉRIAS' || c.status === 'FERIAS'; }).length);
            datasetOutros.push(colsInR.filter(function (c) {
                return c.status !== 'ATIVO' && c.status !== 'FÉRIAS' && c.status !== 'FERIAS';
            }).length);
        });

        this.charts.statusRegime = new Chart(document.getElementById('chartStatusRegime'), {
            type: 'bar',
            data: {
                labels: regimesParaStatus,
                datasets: [
                    { label: 'Ativos', data: datasetAtivo, backgroundColor: self.colors.success },
                    { label: 'Férias', data: datasetFerias, backgroundColor: self.colors.warning },
                    { label: 'Outros', data: datasetOutros, backgroundColor: self.colors.slate }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 10,
                            usePointStyle: true,
                            padding: 16,
                            font: { size: 11 },
                            generateLabels: legendMultiTotal
                        }
                    },
                    datalabels: {
                        display: function (ctx) {
                            var val = ctx.dataset.data[ctx.dataIndex];
                            if (!val || val <= 0) return false;
                            // Total desta coluna (soma de todos os datasets)
                            var colTotal = 0;
                            ctx.chart.data.datasets.forEach(function (ds) {
                                colTotal += (ds.data[ctx.dataIndex] || 0);
                            });
                            // Mostrar apenas se o segmento ≥ 15% da coluna
                            return colTotal > 0 && (val / colTotal) >= 0.15;
                        },
                        color: '#ffffff',
                        anchor: 'center',
                        align: 'center',
                        font: { weight: 'bold', size: 11 },
                        formatter: function (val) { return val; }
                    }
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }
                }
            }
        });

        // ────────────────────────────────────────────────────────────
        // 6. Lotação por Supervisor (Horizontal Bar)
        //    Labels: BRANCO DENTRO DA BARRA (início direito) ou azul fora quando pequena
        // ────────────────────────────────────────────────────────────
        var supCounts = {};
        data.forEach(function (c) {
            var s = c.supervisor || 'Não Atribuído';
            supCounts[s] = (supCounts[s] || 0) + 1;
        });

        var sortedSup = Object.entries(supCounts).sort(function (a, b) { return b[1] - a[1]; });
        var supMax = sortedSup.length > 0 ? sortedSup[0][1] : 1;
        var barColors = sortedSup.map(function (_, i) { return palette[i % palette.length]; });

        this.charts.supervisor = new Chart(document.getElementById('chartSupervisor'), {
            type: 'bar',
            data: {
                labels: sortedSup.map(function (s) { return s[0]; }),
                datasets: [{
                    label: 'Colaboradores',
                    data: sortedSup.map(function (s) { return s[1]; }),
                    backgroundColor: barColors,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        display: true,
                        anchor: function (ctx) {
                            var val = ctx.dataset.data[ctx.dataIndex];
                            return (val / supMax) >= 0.2 ? 'end' : 'end';
                        },
                        align: function (ctx) {
                            var val = ctx.dataset.data[ctx.dataIndex];
                            return (val / supMax) >= 0.2 ? 'start' : 'right';
                        },
                        color: function (ctx) {
                            var val = ctx.dataset.data[ctx.dataIndex];
                            return (val / supMax) >= 0.2 ? '#ffffff' : self.colors.primary;
                        },
                        font: { weight: 'bold', size: 12 },
                        formatter: function (val) { return val; }
                    }
                },
                scales: {
                    x: { beginAtZero: true, ticks: { precision: 0 } }
                }
            }
        });
    }
};
