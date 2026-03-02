'use strict';

/**
 * SGE — Dashboard Avançado
 * Análise Executiva de Efetivo
 */
window.SGE = window.SGE || {};

SGE.dashboard = {
    charts: {},
    activeTab: 'geral',
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

        let colabs = SGE.helpers.filtrarColaboradores();

        if (colabs.length === 0) {
            view.innerHTML = `
                <div class="no-data-message" style="width:100%;padding-top:80px;text-align:center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;color:var(--text-3);margin-bottom:16px;">
                        <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h3 style="color:var(--text-2);margin:0">Nenhum dado de Efetivo disponível para análise.</h3>
                </div>`;
            return;
        }

        view.innerHTML = `
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <div>
                        <h2 class="dashboard-title">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                            Análise Executiva Premium
                        </h2>
                        <p class="dashboard-subtitle">Visão panorâmica cruzando Efetivo, Treinamentos e Histórico (Atualizado em RT).</p>
                    </div>
                </div>

                <div class="dashboard-tabs">
                    <button class="dash-tab-btn ${this.activeTab === 'geral' ? 'active' : ''}" data-tab="geral">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                        Visão Geral
                    </button>
                    <button class="dash-tab-btn ${this.activeTab === 'capacitacao' ? 'active' : ''}" data-tab="capacitacao">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                        Capacitação (NRs)
                    </button>
                    <button class="dash-tab-btn ${this.activeTab === 'saude' ? 'active' : ''}" data-tab="saude">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                        Saúde & Disciplina
                    </button>
                </div>

                <div id="dashboard-content"></div>
            </div>
        `;

        // Add listeners
        view.querySelectorAll('.dash-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.activeTab = e.currentTarget.dataset.tab;
                this.render(); // re-render core
            });
        });

        // Initialize proper content
        if (this.activeTab === 'geral') this.renderGeral(colabs);
        if (this.activeTab === 'capacitacao') this.renderCapacitacao(colabs);
        if (this.activeTab === 'saude') this.renderSaude(colabs);
    },

    destroyAllCharts() {
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key]) {
                this.charts[key].destroy();
            }
        });
        this.charts = {};
    },

    setupChartDefaults() {
        if (!window.Chart) return false;
        if (window.ChartDataLabels) Chart.register(ChartDataLabels);
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = '#64748b';
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 56, 104, 0.9)';
        Chart.defaults.plugins.tooltip.padding = 10;
        Chart.defaults.plugins.tooltip.cornerRadius = 6;
        Chart.defaults.plugins.datalabels = { display: false };
        return true;
    },

    /* -------------------------------------------------------------
       TAB 1: VISÃO GERAL (EFETIVO PURAMENTE)
       ------------------------------------------------------------- */
    renderGeral(data) {
        const content = document.getElementById('dashboard-content');

        const total = data.length;
        const ativos = data.filter(c => c.status === 'ATIVO').length;
        const semId = data.filter(c => c.status === 'SEM_ID' || !c.matricula_gps).length;
        const opCount = data.filter(c => c.categoria === 'OPERACIONAL').length;

        content.innerHTML = `
            <div class="kpi-grid" style="margin-bottom: 24px;">
                <div class="kpi-card" style="border-left: 4px solid var(--primary);">
                    <div class="kpi-icon" style="color: var(--primary); background: rgba(15, 56, 104, 0.08);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <div class="kpi-info">
                        <h4>Efetivo Total</h4>
                        <div class="kpi-val">${total}</div>
                        <div class="kpi-subtext">Base filtrada selecionada</div>
                    </div>
                </div>
                
                <div class="kpi-card" style="border-left: 4px solid var(--success);">
                    <div class="kpi-icon" style="color: var(--success); background: rgba(16, 185, 129, 0.1);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <div class="kpi-info">
                        <h4>Operação Ativa</h4>
                        <div class="kpi-val">${ativos} <span style="font-size:14px;color:var(--text-3);font-weight:600;">(${(total > 0 ? (ativos / total * 100) : 0).toFixed(1)}%)</span></div>
                        <div class="kpi-subtext">Nas frentes de trabalho ou folga</div>
                    </div>
                </div>

                <div class="kpi-card" style="border-left: 4px solid var(--danger);">
                    <div class="kpi-icon" style="color: var(--danger); background: rgba(239, 68, 68, 0.1);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M15 11l-6 6"></path><path d="M9 11l6 6"></path></svg>
                    </div>
                    <div class="kpi-info">
                        <h4>Pendências ID</h4>
                        <div class="kpi-val">${semId}</div>
                        <div class="kpi-subtext">Aguardando matrícula GPS</div>
                    </div>
                </div>

                <div class="kpi-card" style="border-left: 4px solid #0369a1;">
                    <div class="kpi-icon" style="color: #0369a1; background: rgba(3, 105, 161, 0.08);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                    </div>
                    <div class="kpi-info">
                        <h4>Força Operacional</h4>
                        <div class="kpi-val">${opCount}</div>
                        <div class="kpi-subtext">Equipamentos e Chão de fábrica</div>
                    </div>
                </div>
            </div>

            <div class="charts-grid">
                <div class="chart-card span-4">
                    <div class="chart-header">
                        <h3 class="chart-title">Distribuição por Status</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="chartStatusG"></canvas>
                    </div>
                </div>
                
                <div class="chart-card span-8">
                    <div class="chart-header">
                        <h3 class="chart-title">Efetivo por Função</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="chartFuncaoG"></canvas>
                    </div>
                </div>
                
                <div class="chart-card span-12 horizontal-bar">
                    <div class="chart-header">
                        <h3 class="chart-title">Lotação (Escala x Regime)</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="chartRegimeG"></canvas>
                    </div>
                </div>
            </div>
        `;

        this.destroyAllCharts();
        if (!this.setupChartDefaults()) return;

        // --- Status Chart ---
        const statusMap = {};
        data.forEach(c => {
            const s = (c.status || 'OUTROS').toUpperCase();
            statusMap[s] = (statusMap[s] || 0) + 1;
        });

        const statusColorMap = {
            'ATIVO': this.colors.success,
            'FÉRIAS': this.colors.warning,
            'FERIAS': this.colors.warning,
            'AFASTADO': this.colors.amber,
            'DESLIGADO': this.colors.purple,
            'INATIVO': this.colors.danger,
            'EM AVISO': this.colors.indigo,
            'EM CONTRATAÇÃO': this.colors.teal,
            'FALTA': this.colors.rose,
            'SEM_ID': this.colors.danger,
            'OUTROS': this.colors.slate
        };

        this.charts.status = new Chart(document.getElementById('chartStatusG'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusMap),
                datasets: [{
                    data: Object.values(statusMap),
                    backgroundColor: Object.keys(statusMap).map(k => statusColorMap[k] || '#ccc'),
                    borderWidth: 2,
                    borderColor: '#ffffff',
                }]
            },
            options: {
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } }
                }
            }
        });

        // --- Funções Chart ---
        const funcaoMap = {};
        data.forEach(c => {
            const f = c.funcao || 'Outros';
            funcaoMap[f] = (funcaoMap[f] || 0) + 1;
        });

        const sortedF = Object.entries(funcaoMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
        this.charts.funcoes = new Chart(document.getElementById('chartFuncaoG'), {
            type: 'bar',
            data: {
                labels: sortedF.map(i => i[0]),
                datasets: [{
                    label: 'Colaboradores',
                    data: sortedF.map(i => i[1]),
                    backgroundColor: this.colors.secondary,
                    borderRadius: 4
                }]
            },
            options: {
                plugins: { legend: { display: false } }
            }
        });

        // --- Regime ---
        const regimeMap = {};
        data.forEach(c => {
            const r = c.regime || 'Sem Registro';
            regimeMap[r] = (regimeMap[r] || 0) + 1;
        });

        const sortedReg = Object.entries(regimeMap).sort((a, b) => b[1] - a[1]);
        this.charts.regimes = new Chart(document.getElementById('chartRegimeG'), {
            type: 'bar',
            data: {
                labels: sortedReg.map(i => i[0]),
                datasets: [{
                    label: 'Quantidade',
                    data: sortedReg.map(i => i[1]),
                    backgroundColor: this.colors.primary,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                plugins: { legend: { display: false } }
            }
        });
    },

    /* -------------------------------------------------------------
       TAB 2: CAPACITAÇÃO (NRs e Cursos)
       ------------------------------------------------------------- */
    renderCapacitacao(data) {
        const content = document.getElementById('dashboard-content');

        const binds = (SGE.state.colaboradorTreinamentos || []);

        // Match filtered users
        const activeIds = new Set(data.map(c => c.id));
        const activeBinds = binds.filter(b => activeIds.has(b.employee_id));

        let expired = 0;
        let valid = 0;
        const now = new Date();

        activeBinds.forEach(b => {
            if (!b.validade) return;
            const vDate = new Date(b.validade);
            if (vDate < now) expired++;
            else valid++;
        });

        // Total of unique employees that have AT LEAST ONE training
        const trainedIds = new Set(activeBinds.map(b => b.employee_id));
        const coverRate = data.length > 0 ? (trainedIds.size / data.length) * 100 : 0;

        content.innerHTML = `
            <div class="kpi-grid" style="margin-bottom: 24px;">
                <div class="kpi-card" style="border-left: 4px solid var(--indigo);">
                    <div class="kpi-icon" style="color: var(--indigo); background: rgba(99, 102, 241, 0.1);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                    </div>
                    <div class="kpi-info">
                        <h4>Cobertura de Treinamento</h4>
                        <div class="kpi-val">${coverRate.toFixed(1)}%</div>
                        <div class="kpi-subtext">${trainedIds.size} de ${data.length} colabs possuem histórico</div>
                    </div>
                </div>

                <div class="kpi-card" style="border-left: 4px solid var(--success);">
                    <div class="kpi-icon" style="color: var(--success); background: rgba(16, 185, 129, 0.1);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div class="kpi-info">
                        <h4>Certificados Válidos</h4>
                        <div class="kpi-val">${valid}</div>
                        <div class="kpi-subtext">Cursos dentro do prazo atestados</div>
                    </div>
                </div>

                <div class="kpi-card" style="border-left: 4px solid var(--danger);">
                    <div class="kpi-icon" style="color: var(--danger); background: rgba(239, 68, 68, 0.1);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    </div>
                    <div class="kpi-info">
                        <h4>Certificados Vencidos</h4>
                        <div class="kpi-val">${expired}</div>
                        <div class="kpi-subtext">Necessitam reciclagem urgente</div>
                    </div>
                </div>
            </div>

            <div class="charts-grid">
                <div class="chart-card span-6">
                    <div class="chart-header">
                        <h3 class="chart-title">Status dos Certificados Presentes</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="chartTValidade"></canvas>
                    </div>
                </div>
                
                <div class="chart-card span-6">
                    <div class="chart-header">
                        <h3 class="chart-title">Top 5 Cursos mais Realizados</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="chartTTop"></canvas>
                    </div>
                </div>
            </div>
        `;

        this.destroyAllCharts();
        if (!this.setupChartDefaults()) return;

        // Chart Válidos x Vencidos
        this.charts.tValidade = new Chart(document.getElementById('chartTValidade'), {
            type: 'doughnut',
            data: {
                labels: ['Válidos', 'Vencidos / Irregulares'],
                datasets: [{
                    data: [valid, expired],
                    backgroundColor: [this.colors.success, this.colors.danger]
                }]
            },
            options: { cutout: '65%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } } }
        });

        // Top 5 cursos
        const courseCount = {};
        const catMap = {};
        (SGE.state.treinamentosCatalogo || []).forEach(t => catMap[t.id] = t.nome);

        activeBinds.forEach(b => {
            const name = catMap[b.treinamento_id] || 'Desconhecido';
            courseCount[name] = (courseCount[name] || 0) + 1;
        });
        const sortedCourses = Object.entries(courseCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

        this.charts.tTop = new Chart(document.getElementById('chartTTop'), {
            type: 'bar',
            data: {
                labels: sortedCourses.map(i => i[0]),
                datasets: [{
                    data: sortedCourses.map(i => i[1]),
                    backgroundColor: this.colors.indigo,
                    borderRadius: 4
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    },

    /* -------------------------------------------------------------
       TAB 3: SAÚDE (Afastamentos, Férias, Advertências)
       ------------------------------------------------------------- */
    renderSaude(data) {
        const content = document.getElementById('dashboard-content');

        // Match filtered users
        const activeIds = new Set(data.map(c => c.id));

        const ferias = (SGE.state.ferias || []).filter(f => activeIds.has(f.employee_id));
        const advs = (SGE.state.advertencias || []).filter(a => activeIds.has(a.employee_id));

        const fAtivas = ferias.filter(f => f.status === 'ATIVA').length;
        const fAgendadas = ferias.filter(f => f.status === 'AGENDADA').length;

        const aVerbal = advs.filter(a => a.tipo === 'VERBAL').length;
        const aEscrita = advs.filter(a => a.tipo === 'ESCRITA').length;
        const aSusp = advs.filter(a => a.tipo === 'SUSPENSAO').length;

        content.innerHTML = `
           <div class="kpi-grid" style="margin-bottom: 24px;">
               <div class="kpi-card" style="border-left: 4px solid var(--warning);">
                   <div class="kpi-icon" style="color: var(--warning); background: rgba(245, 158, 11, 0.1);">
                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                   </div>
                   <div class="kpi-info">
                       <h4>Férias Ativas</h4>
                       <div class="kpi-val">${fAtivas}</div>
                       <div class="kpi-subtext">Pessoal atualmente repousando</div>
                   </div>
               </div>

               <div class="kpi-card" style="border-left: 4px solid var(--teal);">
                   <div class="kpi-icon" style="color: var(--teal); background: rgba(20, 184, 166, 0.1);">
                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                   </div>
                   <div class="kpi-info">
                       <h4>Férias Agendadas</h4>
                       <div class="kpi-val">${fAgendadas}</div>
                       <div class="kpi-subtext">Próximos períodos concedidos</div>
                   </div>
               </div>

               <div class="kpi-card" style="border-left: 4px solid var(--rose);">
                   <div class="kpi-icon" style="color: var(--rose); background: rgba(244, 63, 94, 0.1);">
                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                   </div>
                   <div class="kpi-info">
                       <h4>Total de Advertências</h4>
                       <div class="kpi-val">${advs.length}</div>
                       <div class="kpi-subtext">Base histórica</div>
                   </div>
               </div>
           </div>

           <div class="charts-grid">
               <div class="chart-card span-6">
                   <div class="chart-header">
                       <h3 class="chart-title">Gravidade Disciplinar</h3>
                   </div>
                   <div class="chart-container">
                       <canvas id="chartSDAdvs"></canvas>
                   </div>
               </div>
               
               <div class="chart-card span-6">
                   <div class="chart-header">
                       <h3 class="chart-title">Status de Férias</h3>
                   </div>
                   <div class="chart-container">
                       <canvas id="chartSDFerias"></canvas>
                   </div>
               </div>
           </div>
       `;

        this.destroyAllCharts();
        if (!this.setupChartDefaults()) return;

        // Gravidade
        this.charts.sdAdvs = new Chart(document.getElementById('chartSDAdvs'), {
            type: 'bar',
            data: {
                labels: ['Verbal', 'Escrita', 'Suspensão'],
                datasets: [{
                    data: [aVerbal, aEscrita, aSusp],
                    backgroundColor: [this.colors.warning, this.colors.orange || '#f97316', this.colors.danger],
                    borderRadius: 4
                }]
            },
            options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
        });

        // Férias
        this.charts.sdFerias = new Chart(document.getElementById('chartSDFerias'), {
            type: 'polarArea',
            data: {
                labels: ['Ativas', 'Agendadas', 'Concluídas'],
                datasets: [{
                    data: [fAtivas, fAgendadas, ferias.filter(f => f.status === 'CONCLUIDA').length],
                    backgroundColor: [
                        'rgba(245, 158, 11, 0.7)',
                        'rgba(20, 184, 166, 0.7)',
                        'rgba(100, 116, 139, 0.7)'
                    ]
                }]
            },
            options: { plugins: { legend: { position: 'right' } } }
        });
    }
};
