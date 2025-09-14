/**
 * Sistema de Integração Google Sheets - GrupoGPS
 * Arquivo responsável pela comunicação com Google Apps Script
 * Separado do sistema principal para facilitar manutenção
 */

const Integracao = {
    // Configurações
    config: {
        appsScriptUrl: localStorage.getItem('grupogps_apps_script_url') || '',
        spreadsheetId: localStorage.getItem('grupogps_spreadsheet_id') || '',
        timeout: 30000, // 30 segundos
        retryAttempts: 3,
        syncEnabled: false
    },

    // Estado da sincronização
    estado: {
        sincronizando: false,
        ultimaSync: null,
        errosConsecutivos: 0,
        filaSync: []
    },

    // ===== INICIALIZAÇÃO =====
    inicializar() {
        this.carregarConfiguracoes();
        this.verificarConexao();
        
        // Auto-sync se configurado
        if (this.config.syncEnabled && this.config.appsScriptUrl) {
            this.iniciarAutoSync();
        }

        console.log('🔗 Sistema de integração inicializado');
    },

    carregarConfiguracoes() {
        const configs = {
            appsScriptUrl: localStorage.getItem('grupogps_apps_script_url'),
            spreadsheetId: localStorage.getItem('grupogps_spreadsheet_id'),
            syncEnabled: localStorage.getItem('grupogps_sync_enabled') === 'true',
            syncInterval: parseInt(localStorage.getItem('grupogps_sync_interval')) || 300000
        };

        Object.assign(this.config, configs);
        
        this.estado.ultimaSync = localStorage.getItem('grupogps_ultima_sync');
    },

    salvarConfiguracoes() {
        localStorage.setItem('grupogps_apps_script_url', this.config.appsScriptUrl);
        localStorage.setItem('grupogps_spreadsheet_id', this.config.spreadsheetId);
        localStorage.setItem('grupogps_sync_enabled', this.config.syncEnabled.toString());
        localStorage.setItem('grupogps_sync_interval', this.config.syncInterval.toString());
        
        if (this.estado.ultimaSync) {
            localStorage.setItem('grupogps_ultima_sync', this.estado.ultimaSync);
        }
    },

    // ===== CONFIGURAÇÃO =====
    configurar(appsScriptUrl, spreadsheetId) {
        this.config.appsScriptUrl = appsScriptUrl;
        this.config.spreadsheetId = spreadsheetId;
        
        this.salvarConfiguracoes();
        
        return this.testarConexao();
    },

    async testarConexao() {
        if (!this.config.appsScriptUrl) {
            throw new Error('URL do Apps Script não configurada');
        }

        try {
            UI.mostrarLoading('Testando conexão...');
            
            const response = await this.fazerRequisicao('GET', '', {
                action: 'test'
            });

            if (response.error) {
                throw new Error(response.error);
            }

            this.config.syncEnabled = true;
            this.salvarConfiguracoes();
            
            Notificacoes.sucesso('Conexão estabelecida com sucesso!');
            return true;

        } catch (error) {
            this.config.syncEnabled = false;
            this.salvarConfiguracoes();
            
            console.error('Erro ao testar conexão:', error);
            Notificacoes.erro(`Erro na conexão: ${error.message}`);
            return false;
        } finally {
            UI.ocultarLoading();
        }
    },

    async verificarConexao() {
        if (!this.config.appsScriptUrl) return false;
        
        try {
            const response = await fetch(this.config.appsScriptUrl + '?action=ping', {
                method: 'GET',
                timeout: 5000
            });
            
            return response.ok;
        } catch (error) {
            return false;
        }
    },

    // ===== COMUNICAÇÃO COM APPS SCRIPT =====
    async fazerRequisicao(method, endpoint = '', params = {}, data = null) {
        if (!this.config.appsScriptUrl) {
            throw new Error('Apps Script URL não configurada');
        }

        const url = new URL(this.config.appsScriptUrl);
        
        // Adicionar parâmetros à URL para GET
        if (method === 'GET') {
            Object.keys(params).forEach(key => {
                url.searchParams.append(key, params[key]);
            });
        }

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // Adicionar dados para POST
        if (method === 'POST' && data) {
            options.body = JSON.stringify({
                ...params,
                ...data
            });
        }

        // Implementar timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        options.signal = controller.signal;

        try {
            const response = await fetch(url.toString(), options);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }

            return result;

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Timeout na requisição');
            }
            
            throw error;
        }
    },

    // ===== OPERAÇÕES DE DADOS =====
    async lerDados(tabela) {
        try {
            const response = await this.fazerRequisicao('GET', '', {
                action: 'read',
                tab: tabela
            });

            return response.data || [];

        } catch (error) {
            console.error(`Erro ao ler dados da tabela ${tabela}:`, error);
            throw error;
        }
    },

    async escreverDados(tabela, dados) {
        try {
            if (!Array.isArray(dados) || dados.length === 0) {
                console.log(`Nenhum dado para sincronizar na tabela ${tabela}`);
                return true;
            }

            const response = await this.fazerRequisicao('POST', '', {
                action: 'write',
                tab: tabela
            }, {
                data: dados
            });

            return response.success || false;

        } catch (error) {
            console.error(`Erro ao escrever dados na tabela ${tabela}:`, error);
            throw error;
        }
    },

    async configurarPlanilha() {
        try {
            UI.mostrarLoading('Configurando planilha...');

            const response = await this.fazerRequisicao('GET', '', {
                action: 'setup'
            });

            if (response.success) {
                Notificacoes.sucesso('Planilha configurada com sucesso!');
                return true;
            } else {
                throw new Error(response.message || 'Erro na configuração');
            }

        } catch (error) {
            console.error('Erro ao configurar planilha:', error);
            Notificacoes.erro(`Erro na configuração: ${error.message}`);
            return false;
        } finally {
            UI.ocultarLoading();
        }
    },

    // ===== SINCRONIZAÇÃO =====
    async sincronizar(forcado = false) {
        if (this.estado.sincronizando && !forcado) {
            Notificacoes.aviso('Sincronização já em andamento');
            return false;
        }

        if (!this.config.syncEnabled || !this.config.appsScriptUrl) {
            Notificacoes.aviso('Integração não configurada');
            return false;
        }

        this.estado.sincronizando = true;
        
        try {
            UI.mostrarLoading('Sincronizando dados...');

            // Definir tabelas para sincronizar
            const tabelas = [
                { nome: 'Funcionarios', dados: Sistema.dados.funcionarios },
                { nome: 'Faltas', dados: Sistema.dados.faltas },
                { nome: 'Atestados', dados: Sistema.dados.atestados },
                { nome: 'Ferias', dados: Sistema.dados.ferias },
                { nome: 'Treinamentos', dados: Sistema.dados.treinamentos },
                { nome: 'Pontos', dados: Sistema.dados.pontos }
            ];

            let sucessos = 0;
            let falhas = 0;

            // Sincronizar cada tabela
            for (const tabela of tabelas) {
                try {
                    await this.escreverDados(tabela.nome, tabela.dados);
                    sucessos++;
                    console.log(`✅ Tabela ${tabela.nome} sincronizada`);
                } catch (error) {
                    falhas++;
                    console.error(`❌ Erro na tabela ${tabela.nome}:`, error);
                }
                
                // Pequena pausa entre requisições
                await this.delay(500);
            }

            // Atualizar estado
            this.estado.ultimaSync = new Date().toISOString();
            this.estado.errosConsecutivos = falhas > 0 ? this.estado.errosConsecutivos + 1 : 0;
            this.salvarConfiguracoes();

            // Notificar resultado
            if (falhas === 0) {
                Notificacoes.sucesso(`Dados sincronizados com sucesso! (${sucessos} tabelas)`);
            } else if (sucessos > 0) {
                Notificacoes.aviso(`Sincronização parcial: ${sucessos} sucessos, ${falhas} falhas`);
            } else {
                throw new Error('Falha na sincronização de todas as tabelas');
            }

            return true;

        } catch (error) {
            this.estado.errosConsecutivos++;
            console.error('Erro na sincronização:', error);
            Notificacoes.erro(`Erro na sincronização: ${error.message}`);
            return false;

        } finally {
            this.estado.sincronizando = false;
            UI.ocultarLoading();
        }
    },

    async sincronizarTabela(nomeTabela) {
        if (!Sistema.dados[nomeTabela.toLowerCase()]) {
            throw new Error(`Tabela ${nomeTabela} não encontrada nos dados`);
        }

        const dados = Sistema.dados[nomeTabela.toLowerCase()];
        return await this.escreverDados(nomeTabela, dados);
    },

    // ===== AUTO-SYNC =====
    iniciarAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
        }

        this.autoSyncInterval = setInterval(() => {
            if (this.config.syncEnabled && !this.estado.sincronizando) {
                this.sincronizar();
            }
        }, this.config.syncInterval);

        console.log(`Auto-sync iniciado (${this.config.syncInterval / 1000}s)`);
    },

    pararAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
            this.autoSyncInterval = null;
            console.log('Auto-sync parado');
        }
    },

    // ===== IMPORTAÇÃO DE DADOS =====
    async importarDados() {
        if (!this.config.syncEnabled || !this.config.appsScriptUrl) {
            throw new Error('Integração não configurada');
        }

        try {
            UI.mostrarLoading('Importando dados...');

            const tabelas = ['Funcionarios', 'Faltas', 'Atestados', 'Ferias', 'Treinamentos', 'Pontos'];
            const dadosImportados = {};

            for (const tabela of tabelas) {
                try {
                    const dados = await this.lerDados(tabela);
                    dadosImportados[tabela.toLowerCase()] = dados;
                    console.log(`📥 Importados ${dados.length} registros de ${tabela}`);
                } catch (error) {
                    console.error(`Erro ao importar ${tabela}:`, error);
                    dadosImportados[tabela.toLowerCase()] = [];
                }
                
                await this.delay(500);
            }

            // Confirmar importação
            const confirmacao = confirm(
                'Importar dados irá substituir todos os dados locais. Continuar?'
            );

            if (confirmacao) {
                // Backup dos dados atuais
                const backup = {...Sistema.dados};
                localStorage.setItem('grupogps_backup_' + Date.now(), JSON.stringify(backup));

                // Substituir dados
                Object.assign(Sistema.dados, dadosImportados);
                SalvarDados.local();

                // Atualizar interface
                Dashboard.atualizar();
                if (Sistema.ui.paginaAtual === 'funcionarios') {
                    Funcionarios.renderizarTabela();
                }

                Notificacoes.sucesso('Dados importados com sucesso!');
                return true;
            }

            return false;

        } catch (error) {
            console.error('Erro na importação:', error);
            Notificacoes.erro(`Erro na importação: ${error.message}`);
            return false;
        } finally {
            UI.ocultarLoading();
        }
    },

    // ===== BACKUP E RESTAURAÇÃO =====
    async criarBackup() {
        const backup = {
            dados: {...Sistema.dados},
            timestamp: new Date().toISOString(),
            versao: '2.0'
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grupogps_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Notificacoes.sucesso('Backup criado com sucesso!');
    },

    async restaurarBackup(arquivo) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    
                    if (!backup.dados || !backup.versao) {
                        throw new Error('Arquivo de backup inválido');
                    }

                    // Confirmar restauração
                    const confirmacao = confirm(
                        `Restaurar backup de ${new Date(backup.timestamp).toLocaleString('pt-BR')}?\n` +
                        'Isso substituirá todos os dados atuais.'
                    );

                    if (confirmacao) {
                        // Backup atual antes de restaurar
                        const backupAtual = {...Sistema.dados};
                        localStorage.setItem('grupogps_backup_antes_restauracao', JSON.stringify(backupAtual));

                        // Restaurar dados
                        Sistema.dados = backup.dados;
                        SalvarDados.local();

                        // Atualizar interface
                        Dashboard.atualizar();
                        UI.atualizarPagina(Sistema.ui.paginaAtual);

                        Notificacoes.sucesso('Backup restaurado com sucesso!');
                        resolve(true);
                    } else {
                        resolve(false);
                    }

                } catch (error) {
                    console.error('Erro ao restaurar backup:', error);
                    Notificacoes.erro(`Erro na restauração: ${error.message}`);
                    reject(error);
                }
            };

            reader.onerror = () => {
                Notificacoes.erro('Erro ao ler arquivo');
                reject(new Error('Erro ao ler arquivo'));
            };

            reader.readAsText(arquivo);
        });
    },

    // ===== UTILIDADES =====
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    formatarUltimaSync() {
        if (!this.estado.ultimaSync) {
            return 'Nunca sincronizado';
        }

        const data = new Date(this.estado.ultimaSync);
        const agora = new Date();
        const diffMs = agora - data;
        const diffMinutos = Math.floor(diffMs / (1000 * 60));

        if (diffMinutos < 1) {
            return 'Agora mesmo';
        } else if (diffMinutos < 60) {
            return `${diffMinutos} minuto${diffMinutos > 1 ? 's' : ''} atrás`;
        } else {
            return data.toLocaleString('pt-BR');
        }
    },

    obterStatusConexao() {
        return {
            configurado: !!this.config.appsScriptUrl,
            ativo: this.config.syncEnabled,
            sincronizando: this.estado.sincronizando,
            ultimaSync: this.formatarUltimaSync(),
            erros: this.estado.errosConsecutivos
        };
    }
};

// ===== EXTENSÕES DA UI PARA INTEGRAÇÃO =====
const UIIntegracao = {
    mostrarConfiguracao() {
        UI.navegarPara('configuracoes');
        this.renderizarPainelIntegracao();
    },

    renderizarPainelIntegracao() {
        const container = document.getElementById('integracaoContainer');
        if (!container) return;

        const status = Integracao.obterStatusConexao();
        
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-plug"></i>
                        Integração Google Sheets
                    </h3>
                </div>
                <div class="card-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">URL do Apps Script</label>
                            <input type="url" id="appsScriptUrl" class="form-input" 
                                   value="${Integracao.config.appsScriptUrl}" 
                                   placeholder="https://script.google.com/...">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">ID da Planilha</label>
                            <input type="text" id="spreadsheetId" class="form-input" 
                                   value="${Integracao.config.spreadsheetId}" 
                                   placeholder="ID da sua planilha">
                        </div>
                    </div>
                    
                    <div class="status-info mb-3">
                        <h4>Status da Integração</h4>
                        <div class="kpi-grid">
                            <div class="kpi-card">
                                <div class="kpi-header">
                                    <span class="kpi-title">Status</span>
                                    <div class="kpi-icon ${status.ativo ? 'success' : 'warning'}">
                                        <i class="fas fa-${status.ativo ? 'check-circle' : 'exclamation-triangle'}"></i>
                                    </div>
                                </div>
                                <div class="kpi-value">${status.ativo ? 'Ativo' : 'Inativo'}</div>
                            </div>
                            
                            <div class="kpi-card">
                                <div class="kpi-header">
                                    <span class="kpi-title">Última Sync</span>
                                    <div class="kpi-icon info">
                                        <i class="fas fa-clock"></i>
                                    </div>
                                </div>
                                <div class="kpi-value" style="font-size: 1rem;">${status.ultimaSync}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <button class="btn btn-primary" onclick="UIIntegracao.salvarConfiguracao()">
                            <i class="fas fa-save"></i> Salvar Configuração
                        </button>
                        
                        <button class="btn btn-success" onclick="UIIntegracao.testarConexao()">
                            <i class="fas fa-check"></i> Testar Conexão
                        </button>
                        
                        <button class="btn btn-warning" onclick="UIIntegracao.configurarPlanilha()">
                            <i class="fas fa-cogs"></i> Configurar Planilha
                        </button>
                        
                        <button class="btn btn-info" onclick="UIIntegracao.sincronizar()">
                            <i class="fas fa-sync"></i> Sincronizar Agora
                        </button>
                    </div>
                    
                    <div class="form-row mt-3">
                        <button class="btn btn-secondary" onclick="UIIntegracao.criarBackup()">
                            <i class="fas fa-download"></i> Criar Backup
                        </button>
                        
                        <button class="btn btn-secondary" onclick="document.getElementById('backupFile').click()">
                            <i class="fas fa-upload"></i> Restaurar Backup
                        </button>
                        <input type="file" id="backupFile" accept=".json" style="display: none;" 
                               onchange="UIIntegracao.restaurarBackup(this.files[0])">
                        
                        <button class="btn btn-info" onclick="UIIntegracao.importarDados()">
                            <i class="fas fa-cloud-download-alt"></i> Importar do Sheets
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    salvarConfiguracao() {
        const url = document.getElementById('appsScriptUrl').value;
        const id = document.getElementById('spreadsheetId').value;
        
        if (!url) {
            Notificacoes.aviso('Informe a URL do Apps Script');
            return;
        }
        
        Integracao.configurar(url, id);
        this.renderizarPainelIntegracao();
    },

    async testarConexao() {
        await Integracao.testarConexao();
        this.renderizarPainelIntegracao();
    },

    async configurarPlanilha() {
        await Integracao.configurarPlanilha();
    },

    async sincronizar() {
        await Integracao.sincronizar(true);
        this.renderizarPainelIntegracao();
    },

    async importarDados() {
        await Integracao.importarDados();
    },

    async criarBackup() {
        await Integracao.criarBackup();
    },

    async restaurarBackup(arquivo) {
        if (arquivo) {
            await Integracao.restaurarBackup(arquivo);
        }
    }
};

// ===== EXTENSÕES DA UI PRINCIPAL =====
UI.mostrarLoading = function(mensagem = 'Carregando...') {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.querySelector('p').textContent = mensagem;
        overlay.classList.add('show');
    }
};

UI.ocultarLoading = function() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
};

// Inicializar integração quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para garantir que o sistema principal foi carregado
    setTimeout(() => {
        Integracao.inicializar();
    }, 1000);
});

// Expor globalmente
window.Integracao = Integracao;
window.UIIntegracao = UIIntegracao;
