/**
 * Sistema de Gestão de Efetivo - GrupoGPS
 * Arquivo principal com toda a lógica do sistema
 * Desenvolvido para ser modular e de fácil manutenção
 */

// ===== ESTADO GLOBAL =====
const Sistema = {
    // Dados do sistema
    dados: {
        funcionarios: [],
        faltas: [],
        atestados: [],
        ferias: [],
        treinamentos: [],
        pontos: []
    },
    
    // Estado da UI
    ui: {
        paginaAtual: 'dashboard',
        modalAberto: null,
        funcionarioEditando: null
    },
    
    // Configurações
    config: {
        autoSave: true,
        syncInterval: 300000, // 5 minutos
        maxNotifications: 5
    }
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema de Gestão de Efetivo carregado');
    
    // Carregar dados salvos
    CarregarDados.local();
    
    // Inicializar interface
    UI.inicializar();
    
    // Atualizar dashboard
    Dashboard.atualizar();
    
    // Configurar auto-save
    if (Sistema.config.autoSave) {
        setInterval(SalvarDados.local, 60000); // A cada minuto
    }
});

// ===== NAVEGAÇÃO E UI =====
const UI = {
    inicializar() {
        this.configurarEventos();
        this.configurarMenus();
        this.definirDataHoje();
    },
    
    configurarEventos() {
        // Toggle sidebar
        document.getElementById('sidebarToggle').addEventListener('click', this.alternarSidebar);
        
        // Menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const pagina = item.dataset.page;
                if (pagina) {
                    this.navegarPara(pagina);
                }
            });
        });
        
        // Botões principais
        document.getElementById('addFuncionarioBtn')?.addEventListener('click', Funcionarios.abrirModal);
        document.getElementById('addFaltaBtn')?.addEventListener('click', Faltas.abrirModal);
        document.getElementById('addAtestadoBtn')?.addEventListener('click', Atestados.abrirModal);
        document.getElementById('syncBtn')?.addEventListener('click', Integracao.sincronizar);
        
        // Modal closes
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.fecharModal(modal.id);
                }
            });
        });
        
        // Busca global
        document.getElementById('globalSearch')?.addEventListener('input', this.buscarGlobal);
        
        // Atalhos de teclado
        document.addEventListener('keydown', this.atalhosTeclado);
    },
    
    configurarMenus() {
        // Marcar primeiro item como ativo
        const primeiroItem = document.querySelector('.menu-item[data-page="dashboard"]');
        if (primeiroItem) {
            primeiroItem.classList.add('active');
        }
    },
    
    definirDataHoje() {
        const hoje = new Date().toISOString().split('T')[0];
        const inputs = document.querySelectorAll('input[type="date"]');
        inputs.forEach(input => {
            if (!input.value && input.id !== 'funcDataAdmissao') {
                input.value = hoje;
            }
        });
    },
    
    navegarPara(pagina) {
        // Remover active de todos os menus
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Adicionar active ao menu selecionado
        const menuAtivo = document.querySelector(`[data-page="${pagina}"]`);
        if (menuAtivo) {
            menuAtivo.classList.add('active');
        }
        
        // Esconder todas as páginas
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });
        
        // Mostrar página selecionada
        const paginaElement = document.getElementById(pagina);
        if (paginaElement) {
            paginaElement.classList.add('active');
            Sistema.ui.paginaAtual = pagina;
            
            // Atualizar conteúdo específico da página
            this.atualizarPagina(pagina);
        }
    },
    
    atualizarPagina(pagina) {
        switch(pagina) {
            case 'dashboard':
                Dashboard.atualizar();
                break;
            case 'funcionarios':
                Funcionarios.renderizarTabela();
                break;
            case 'faltas':
                Faltas.renderizarTabela();
                break;
            case 'atestados':
                Atestados.renderizarTabela();
                break;
            case 'escalas':
                Escalas.calcular();
                break;
        }
    },
    
    alternarSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
    },
    
    abrirModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            Sistema.ui.modalAberto = modalId;
        }
    },
    
    fecharModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            Sistema.ui.modalAberto = null;
            
            // Limpar formulário
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
            
            // Reset editing state
            Sistema.ui.funcionarioEditando = null;
        }
    },
    
    buscarGlobal(e) {
        const termo = e.target.value.toLowerCase();
        if (termo.length < 2) return;
        
        const resultados = Sistema.dados.funcionarios.filter(func => 
            func.nome.toLowerCase().includes(termo) ||
            func.matricula.toLowerCase().includes(termo)
        );
        
        // Mostrar resultados ou navegar para funcionários
        if (resultados.length > 0) {
            UI.navegarPara('funcionarios');
        }
    },
    
    atalhosTeclado(e) {
        if (e.ctrlKey) {
            switch(e.key) {
                case 's':
                    e.preventDefault();
                    SalvarDados.local();
                    Notificacoes.sucesso('Dados salvos localmente');
                    break;
                case 'k':
                    e.preventDefault();
                    document.getElementById('globalSearch')?.focus();
                    break;
            }
        }
        
        if (e.key === 'Escape' && Sistema.ui.modalAberto) {
            UI.fecharModal(Sistema.ui.modalAberto);
        }
    }
};

// ===== DASHBOARD =====
const Dashboard = {
    atualizar() {
        this.atualizarKPIs();
        this.atualizarAlertas();
    },
    
    atualizarKPIs() {
        const funcionarios = Sistema.dados.funcionarios;
        const ativos = funcionarios.filter(f => f.status === 'Ativo');
        
        // Total de funcionários
        document.getElementById('totalFuncionarios').textContent = funcionarios.length;
        
        // Funcionários ativos
        document.getElementById('funcionariosAtivos').textContent = ativos.length;
        
        // Faltas este mês
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const faltasMes = Sistema.dados.faltas.filter(f => 
            new Date(f.data) >= inicioMes
        ).length;
        document.getElementById('faltasMes').textContent = faltasMes;
        
        // Treinamentos vencendo
        const treinamentosVencendo = this.calcularTreinamentosVencendo();
        document.getElementById('treinamentosVencendo').textContent = treinamentosVencendo;
    },
    
    calcularTreinamentosVencendo() {
        const hoje = new Date();
        const em30Dias = new Date(hoje.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        return Sistema.dados.treinamentos.filter(t => {
            const vencimento = new Date(t.dataVencimento);
            return vencimento >= hoje && vencimento <= em30Dias;
        }).length;
    },
    
    atualizarAlertas() {
        const container = document.getElementById('alertsContainer');
        const alertas = [];
        
        // ASOs vencendo
        const hoje = new Date();
        const em30Dias = new Date(hoje.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        Sistema.dados.funcionarios.forEach(func => {
            if (func.aso) {
                const vencimento = new Date(func.aso);
                const dias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
                
                if (dias <= 0) {
                    alertas.push({
                        tipo: 'danger',
                        icone: 'exclamation-circle',
                        mensagem: `ASO vencido: ${func.nome}`
                    });
                } else if (dias <= 30) {
                    alertas.push({
                        tipo: 'warning',
                        icone: 'exclamation-triangle',
                        mensagem: `ASO vencendo em ${dias} dias: ${func.nome}`
                    });
                }
            }
        });
        
        // Renderizar alertas
        if (alertas.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">Nenhum alerta no momento</p>';
        } else {
            container.innerHTML = alertas.map(alerta => `
                <div class="alert alert-${alerta.tipo}">
                    <i class="fas fa-${alerta.icone}"></i>
                    ${alerta.mensagem}
                </div>
            `).join('');
        }
    }
};

// ===== GESTÃO DE FUNCIONÁRIOS =====
const Funcionarios = {
    abrirModal(funcionario = null) {
        if (funcionario) {
            // Modo edição
            Sistema.ui.funcionarioEditando = funcionario.id;
            Funcionarios.preencherFormulario(funcionario);
        } else {
            // Modo criação
            Sistema.ui.funcionarioEditando = null;
        }
        
        // Configurar eventos do modal
        document.getElementById('saveFuncionarioBtn').onclick = this.salvar;
        document.getElementById('cancelFuncionarioBtn').onclick = () => UI.fecharModal('funcionarioModal');
        
        UI.abrirModal('funcionarioModal');
    },
    
    preencherFormulario(funcionario) {
        document.getElementById('funcNome').value = funcionario.nome || '';
        document.getElementById('funcMatricula').value = funcionario.matricula || '';
        document.getElementById('funcFuncao').value = funcionario.funcao || '';
        document.getElementById('funcSupervisor').value = funcionario.supervisor || '';
        document.getElementById('funcEquipamento').value = funcionario.equipamento || '';
        document.getElementById('funcEscala').value = funcionario.escala || '';
        document.getElementById('funcContato').value = funcionario.contato || '';
        document.getElementById('funcStatus').value = funcionario.status || 'Ativo';
        document.getElementById('funcAso').value = funcionario.aso || '';
        document.getElementById('funcDataAdmissao').value = funcionario.dataAdmissao || '';
    },
    
    salvar() {
        const form = document.getElementById('funcionarioForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const funcionario = {
            id: Sistema.ui.funcionarioEditando || Date.now(),
            nome: document.getElementById('funcNome').value,
            matricula: document.getElementById('funcMatricula').value,
            funcao: document.getElementById('funcFuncao').value,
            supervisor: document.getElementById('funcSupervisor').value,
            equipamento: document.getElementById('funcEquipamento').value,
            escala: document.getElementById('funcEscala').value,
            contato: document.getElementById('funcContato').value,
            status: document.getElementById('funcStatus').value,
            aso: document.getElementById('funcAso').value,
            dataAdmissao: document.getElementById('funcDataAdmissao').value,
            dataCadastro: new Date().toISOString()
        };
        
        if (Sistema.ui.funcionarioEditando) {
            // Atualizar funcionário existente
            const index = Sistema.dados.funcionarios.findIndex(f => f.id === Sistema.ui.funcionarioEditando);
            if (index !== -1) {
                Sistema.dados.funcionarios[index] = funcionario;
                Notificacoes.sucesso('Funcionário atualizado com sucesso!');
            }
        } else {
            // Criar novo funcionário
            Sistema.dados.funcionarios.push(funcionario);
            Notificacoes.sucesso('Funcionário cadastrado com sucesso!');
        }
        
        SalvarDados.local();
        Funcionarios.renderizarTabela();
        UI.fecharModal('funcionarioModal');
        Dashboard.atualizar();
    },
    
    renderizarTabela() {
        const tbody = document.getElementById('funcionariosTableBody');
        if (!tbody) return;
        
        if (Sistema.dados.funcionarios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">
                        Nenhum funcionário cadastrado
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = Sistema.dados.funcionarios.map(func => `
            <tr>
                <td>${func.nome}</td>
                <td>${func.matricula}</td>
                <td>${func.funcao}</td>
                <td>${func.supervisor ? `Letra ${func.supervisor}` : '-'}</td>
                <td>${func.equipamento || '-'}</td>
                <td>${func.escala || '-'}</td>
                <td>
                    <span class="badge badge-${func.status === 'Ativo' ? 'success' : 
                                                func.status === 'Férias' ? 'warning' : 
                                                func.status === 'Afastado' ? 'info' : 'danger'}">
                        ${func.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="Funcionarios.editar(${func.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="Funcionarios.excluir(${func.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },
    
    editar(id) {
        const funcionario = Sistema.dados.funcionarios.find(f => f.id === id);
        if (funcionario) {
            Funcionarios.abrirModal(funcionario);
        }
    },
    
    excluir(id) {
        if (confirm('Confirma a exclusão deste funcionário?')) {
            Sistema.dados.funcionarios = Sistema.dados.funcionarios.filter(f => f.id !== id);
            SalvarDados.local();
            Funcionarios.renderizarTabela();
            Dashboard.atualizar();
            Notificacoes.sucesso('Funcionário removido com sucesso!');
        }
    }
};

// ===== SISTEMA DE FALTAS =====
const Faltas = {
    abrirModal() {
        // Preencher funcionários no select
        this.carregarFuncionarios();
        
        // Configurar eventos
        document.getElementById('saveFaltaBtn').onclick = this.salvar;
        document.getElementById('cancelFaltaBtn').onclick = () => UI.fecharModal('faltaModal');
        
        UI.abrirModal('faltaModal');
    },
    
    carregarFuncionarios() {
        const selectFuncionario = document.getElementById('faltaFuncionario');
        const selectCobertura = document.getElementById('faltaCobertura');
        
        const funcionariosAtivos = Sistema.dados.funcionarios.filter(f => f.status === 'Ativo');
        
        const options = funcionariosAtivos.map(f => 
            `<option value="${f.id}">${f.nome} - ${f.matricula}</option>`
        ).join('');
        
        selectFuncionario.innerHTML = '<option value="">Selecione</option>' + options;
        selectCobertura.innerHTML = '<option value="">Selecione</option>' + options;
    },
    
    salvar() {
        const form = document.getElementById('faltaForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const funcionarioId = document.getElementById('faltaFuncionario').value;
        const funcionario = Sistema.dados.funcionarios.find(f => f.id == funcionarioId);
        
        const coberturaId = document.getElementById('faltaCobertura').value;
        const cobertura = coberturaId ? Sistema.dados.funcionarios.find(f => f.id == coberturaId) : null;
        
        const falta = {
            id: Date.now(),
            data: document.getElementById('faltaData').value,
            funcionarioId: funcionarioId,
            funcionarioNome: funcionario ? funcionario.nome : '',
            motivo: document.getElementById('faltaMotivo').value,
            coberturaId: coberturaId || null,
            coberturaNome: cobertura ? cobertura.nome : '',
            observacoes: document.getElementById('faltaObservacoes').value,
            dataCadastro: new Date().toISOString()
        };
        
        Sistema.dados.faltas.push(falta);
        SalvarDados.local();
        Faltas.renderizarTabela();
        UI.fecharModal('faltaModal');
        Dashboard.atualizar();
        Notificacoes.sucesso('Falta registrada com sucesso!');
    },
    
    renderizarTabela() {
        const tbody = document.getElementById('faltasTableBody');
        if (!tbody) return;
        
        if (Sistema.dados.faltas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">
                        Nenhuma falta registrada
                    </td>
                </tr>
            `;
            return;
        }
        
        // Ordenar por data (mais recente primeiro)
        const faltasOrdenadas = [...Sistema.dados.faltas].sort((a, b) => new Date(b.data) - new Date(a.data));
        
        tbody.innerHTML = faltasOrdenadas.map(falta => `
            <tr>
                <td>${Utilidades.formatarData(falta.data)}</td>
                <td>${falta.funcionarioNome}</td>
                <td>
                    <span class="badge badge-${falta.motivo === 'Atestado Médico' ? 'info' : 
                                               falta.motivo === 'Falta Injustificada' ? 'danger' : 'warning'}">
                        ${falta.motivo}
                    </span>
                </td>
                <td>${falta.coberturaNome || '-'}</td>
                <td>${falta.observacoes || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="Faltas.excluir(${falta.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },
    
    excluir(id) {
        if (confirm('Confirma a exclusão desta falta?')) {
            Sistema.dados.faltas = Sistema.dados.faltas.filter(f => f.id !== id);
            SalvarDados.local();
            Faltas.renderizarTabela();
            Dashboard.atualizar();
            Notificacoes.sucesso('Falta removida com sucesso!');
        }
    }
};

// ===== SISTEMA DE ATESTADOS =====
const Atestados = {
    abrirModal() {
        this.carregarFuncionarios();
        this.configurarCalculoDias();
        
        document.getElementById('saveAtestadoBtn').onclick = this.salvar;
        document.getElementById('cancelAtestadoBtn').onclick = () => UI.fecharModal('atestadoModal');
        
        UI.abrirModal('atestadoModal');
    },
    
    carregarFuncionarios() {
        const select = document.getElementById('atestadoFuncionario');
        const funcionariosAtivos = Sistema.dados.funcionarios.filter(f => f.status === 'Ativo');
        
        const options = funcionariosAtivos.map(f => 
            `<option value="${f.id}">${f.nome} - ${f.matricula}</option>`
        ).join('');
        
        select.innerHTML = '<option value="">Selecione</option>' + options;
    },
    
    configurarCalculoDias() {
        const inicioInput = document.getElementById('atestadoInicio');
        const fimInput = document.getElementById('atestadoFim');
        const diasInput = document.getElementById('atestadoDias');
        
        function calcularDias() {
            if (inicioInput.value && fimInput.value) {
                const inicio = new Date(inicioInput.value);
                const fim = new Date(fimInput.value);
                const dias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24)) + 1;
                diasInput.value = dias > 0 ? dias : 0;
            }
        }
        
        inicioInput.addEventListener('change', calcularDias);
        fimInput.addEventListener('change', calcularDias);
    },
    
    salvar() {
        const form = document.getElementById('atestadoForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const funcionarioId = document.getElementById('atestadoFuncionario').value;
        const funcionario = Sistema.dados.funcionarios.find(f => f.id == funcionarioId);
        
        const atestado = {
            id: Date.now(),
            funcionarioId: funcionarioId,
            funcionarioNome: funcionario ? funcionario.nome : '',
            cid: document.getElementById('atestadoCid').value,
            dataInicio: document.getElementById('atestadoInicio').value,
            dataFim: document.getElementById('atestadoFim').value,
            dias: parseInt(document.getElementById('atestadoDias').value) || 0,
            status: document.getElementById('atestadoStatus').value,
            observacoes: document.getElementById('atestadoObservacoes').value,
            dataCadastro: new Date().toISOString()
        };
        
        Sistema.dados.atestados.push(atestado);
        SalvarDados.local();
        Atestados.renderizarTabela();
        UI.fecharModal('atestadoModal');
        Notificacoes.sucesso('Atestado registrado com sucesso!');
    },
    
    renderizarTabela() {
        const tbody = document.getElementById('atestadosTableBody');
        if (!tbody) return;
        
        if (Sistema.dados.atestados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">
                        Nenhum atestado registrado
                    </td>
                </tr>
            `;
            return;
        }
        
        const atestadosOrdenados = [...Sistema.dados.atestados].sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio));
        
        tbody.innerHTML = atestadosOrdenados.map(atestado => `
            <tr>
                <td>${Utilidades.formatarData(atestado.dataInicio)}</td>
                <td>${Utilidades.formatarData(atestado.dataFim)}</td>
                <td>${atestado.funcionarioNome}</td>
                <td>${atestado.cid || '-'}</td>
                <td>${atestado.dias}</td>
                <td>
                    <span class="badge badge-${atestado.status === 'Ativo' ? 'success' : 
                                               atestado.status === 'Finalizado' ? 'info' : 'danger'}">
                        ${atestado.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="Atestados.excluir(${atestado.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },
    
    excluir(id) {
        if (confirm('Confirma a exclusão deste atestado?')) {
            Sistema.dados.atestados = Sistema.dados.atestados.filter(a => a.id !== id);
            SalvarDados.local();
            Atestados.renderizarTabela();
            Notificacoes.sucesso('Atestado removido com sucesso!');
        }
    }
};

// ===== SISTEMA DE ESCALAS =====
const Escalas = {
    supervisores: {
        'A': { nome: 'Ozias', ciclo: [1,1,1,1,0,0,0,0] },
        'B': { nome: 'Matoza', ciclo: [0,0,1,1,1,1,0,0] },
        'C': { nome: 'Israel', ciclo: [0,0,0,0,1,1,1,1] },
        'D': { nome: 'Wellison', ciclo: [1,1,0,0,0,0,1,1] }
    },
    
    calcular() {
        const dataInput = document.getElementById('escalaDate');
        if (!dataInput || !dataInput.value) return;
        
        const data = new Date(dataInput.value);
        const resultContainer = document.getElementById('escalasResult');
        
        if (!resultContainer) return;
        
        // Calcular posição no ciclo (baseado em data de referência)
        const referencia = new Date('2025-01-01');
        const diasDiff = Math.floor((data - referencia) / (1000 * 60 * 60 * 24));
        
        const supervisoresEscala = Object.keys(this.supervisores).map(letra => {
            const supervisor = this.supervisores[letra];
            const posicao = diasDiff % 8;
            const trabalhando = supervisor.ciclo[posicao] === 1;
            
            return {
                letra,
                nome: supervisor.nome,
                trabalhando
            };
        });
        
        // Renderizar resultado
        resultContainer.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Escala para ${Utilidades.formatarData(dataInput.value)}</h3>
                </div>
                <div class="card-body">
                    <div class="kpi-grid">
                        ${supervisoresEscala.map(sup => `
                            <div class="kpi-card">
                                <div class="kpi-header">
                                    <span class="kpi-title">Supervisor ${sup.nome}</span>
                                    <div class="kpi-icon ${sup.trabalhando ? 'success' : 'warning'}">
                                        <i class="fas fa-${sup.trabalhando ? 'user-check' : 'user-clock'}"></i>
                                    </div>
                                </div>
                                <div class="kpi-value">Letra ${sup.letra}</div>
                                <span class="badge badge-${sup.trabalhando ? 'success' : 'warning'}">
                                    ${sup.trabalhando ? 'Trabalhando' : 'Folga'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
};

// ===== SISTEMA DE NOTIFICAÇÕES =====
const Notificacoes = {
    container: null,
    
    init() {
        this.container = document.getElementById('notificationContainer');
    },
    
    mostrar(mensagem, tipo = 'info', duracao = 3000) {
        if (!this.container) this.init();
        
        const icones = {
            success: 'check-circle',
            error: 'times-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        const notificacao = document.createElement('div');
        notificacao.className = `notification ${tipo}`;
        notificacao.innerHTML = `
            <i class="fas fa-${icones[tipo]}"></i>
            ${mensagem}
        `;
        
        this.container.appendChild(notificacao);
        
        // Auto-remove
        setTimeout(() => {
            if (notificacao.parentNode) {
                notificacao.remove();
            }
        }, duracao);
        
        // Limitar número de notificações
        const notificacoes = this.container.querySelectorAll('.notification');
        if (notificacoes.length > Sistema.config.maxNotifications) {
            notificacoes[0].remove();
        }
    },
    
    sucesso(mensagem) {
        this.mostrar(mensagem, 'success');
    },
    
    erro(mensagem) {
        this.mostrar(mensagem, 'error', 5000);
    },
    
    aviso(mensagem) {
        this.mostrar(mensagem, 'warning', 4000);
    },
    
    info(mensagem) {
        this.mostrar(mensagem, 'info');
    }
};

// ===== PERSISTÊNCIA DE DADOS =====
const SalvarDados = {
    local() {
        try {
            const dados = {
                ...Sistema.dados,
                versao: '2.0',
                ultimaAtualizacao: new Date().toISOString()
            };
            localStorage.setItem('grupogps_sistema_dados', JSON.stringify(dados));
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados locais:', error);
            return false;
        }
    }
};

const CarregarDados = {
    local() {
        try {
            const dadosSalvos = localStorage.getItem('grupogps_sistema_dados');
            if (dadosSalvos) {
                const dados = JSON.parse(dadosSalvos);
                
                // Migração de versões se necessário
                if (dados.versao === '2.0') {
                    Sistema.dados = {
                        funcionarios: dados.funcionarios || [],
                        faltas: dados.faltas || [],
                        atestados: dados.atestados || [],
                        ferias: dados.ferias || [],
                        treinamentos: dados.treinamentos || [],
                        pontos: dados.pontos || []
                    };
                }
                
                console.log('Dados carregados do localStorage');
                return true;
            }
        } catch (error) {
            console.error('Erro ao carregar dados locais:', error);
        }
        return false;
    }
};

// ===== UTILIDADES =====
const Utilidades = {
    formatarData(data) {
        if (!data) return '-';
        return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
    },
    
    formatarDataHora(data) {
        if (!data) return '-';
        return new Date(data).toLocaleString('pt-BR');
    },
    
    calcularIdade(nascimento) {
        const hoje = new Date();
        const nasc = new Date(nascimento);
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const mes = hoje.getMonth() - nasc.getMonth();
        
        if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
            idade--;
        }
        
        return idade;
    },
    
    validarCPF(cpf) {
        cpf = cpf.replace(/[^\d]/g, '');
        if (cpf.length !== 11) return false;
        
        // Verificar se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        
        // Validar dígitos verificadores
        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let resto = 11 - (soma % 11);
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(9))) return false;
        
        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(cpf.charAt(i)) * (11 - i);
        }
        resto = 11 - (soma % 11);
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    },
    
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
};

// Expor funções globalmente para uso no HTML
window.Sistema = Sistema;
window.UI = UI;
window.Dashboard = Dashboard;
window.Funcionarios = Funcionarios;
window.Faltas = Faltas;
window.Atestados = Atestados;
window.Escalas = Escalas;
window.Notificacoes = Notificacoes;
window.SalvarDados = SalvarDados;
window.CarregarDados = CarregarDados;
window.Utilidades = Utilidades;
