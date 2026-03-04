'use strict';

/**
 * SGE — Advanced Export Logic
 * Centralized utility for exporting full datasets (Colaboradores, Histórico, Férias, etc.)
 */
window.SGE = window.SGE || {};

SGE.export = {
    openModal() {
        SGE.modal.openDynamic({
            title: 'Exportar Dados do Sistema',
            subtitle: 'Escolha a base de dados e o formato para gerar o arquivo completo.',
            fields: [
                {
                    id: 'base_dados',
                    label: 'Base de Dados',
                    type: 'select',
                    options: [
                        { value: 'colaboradores', label: 'Efetivo (Completo)' },
                        { value: 'advertencias', label: 'Advertências & Suspensões' },
                        { value: 'ferias', label: 'Programação de Férias' },
                        { value: 'treinamentos', label: 'Treinamentos Realizados' },
                        { value: 'historico', label: 'Histórico de Movimentações' }
                    ]
                },
                {
                    id: 'formato',
                    label: 'Formato do Arquivo',
                    type: 'select',
                    options: [
                        { value: 'xlsx', label: 'Planilha Excel (.xlsx) [Recomendado]' },
                        { value: 'csv', label: 'Arquivo CSV (.csv)' }
                    ]
                }
            ],
            okText: 'Gerar Exportação',
            onConfirm: async (vals) => {
                SGE.export.generateExport(vals.base_dados, vals.formato);
            }
        });
    },

    generateExport(base, format) {
        let title = '';
        let data = [];

        // Aggregate right dataset and prepare columns uniformly
        if (base === 'colaboradores') {
            title = 'SGE_Efetivo_Completo';
            data = (SGE.state.colaboradores || []).map(c => ({
                ID: c.matricula_gps || '',
                CR: c.cr || '',
                Nome: c.nome,
                Categoria: c.categoria || '',
                Funcao: c.funcao,
                Regime: c.regime,
                Supervisor: c.supervisor || '',
                Status: c.status,
                Equipamento: c.equipamento || ''
            }));
        } else if (base === 'advertencias') {
            title = 'SGE_Advertencias';
            const colMap = {};
            (SGE.state.colaboradores || []).forEach(c => colMap[c.id] = c);

            data = (SGE.state.advertencias || []).map(a => {
                const c = colMap[a.employee_id] || {};
                return {
                    ID: c.matricula_gps || '',
                    Colaborador: c.nome || 'Desconhecido',
                    Tipo: a.tipo,
                    Motivo: a.motivo,
                    Aplicador: a.usuario_nome,
                    Dias_Suspensao: a.suspensao_dias || 0,
                    Data_Registro: a.data_registro ? SGE.helpers.formatDate(a.data_registro).split(',')[0] : ''
                };
            });
        } else if (base === 'ferias') {
            title = 'SGE_Ferias';
            const colMap = {};
            (SGE.state.colaboradores || []).forEach(c => colMap[c.id] = c);

            data = (SGE.state.ferias || []).map(f => {
                const c = colMap[f.employee_id] || {};
                return {
                    ID: c.matricula_gps || '',
                    Colaborador: c.nome || 'Desconhecido',
                    Status: f.status,
                    Inicio: f.data_inicio ? SGE.helpers.formatDate(f.data_inicio).split(',')[0] : '',
                    Retorno: f.data_retorno ? SGE.helpers.formatDate(f.data_retorno).split(',')[0] : '',
                    Dias: Math.ceil((new Date(f.data_retorno) - new Date(f.data_inicio)) / (1000 * 60 * 60 * 24)) || 0
                };
            });
        } else if (base === 'treinamentos') {
            title = 'SGE_Treinamentos';
            data = (SGE.state.colaboradorTreinamentos || []).map(t => ({
                ID: t.employee_matricula || '',
                Colaborador: t.employee_name || '',
                Treinamento: t.treinamento_nome || '',
                Data_Conclusao: t.data_conclusao ? SGE.helpers.formatDate(t.data_conclusao).split(',')[0] : '',
                Validade: t.validade ? SGE.helpers.formatDate(t.validade).split(',')[0] : '',
                Status: t.revogado ? 'Revogado' : (!t.validade ? 'Sem Validade' : (new Date(t.validade + 'T00:00:00') < new Date() ? 'Vencido' : 'Válido'))
            }));
        } else if (base === 'historico') {
            title = 'SGE_Historico_Movimentacoes';
            data = (SGE.state.movimentacoes || []).map(m => ({
                ID: m.employee_matricula || '',
                Colaborador: m.employee_name || '',
                Campo_Alterado: m.campo_alterado,
                De: m.valor_antigo,
                Para: m.valor_novo,
                Data: m.created_at ? SGE.helpers.formatDate(m.created_at) : '',
                Responsavel: m.usuario_nome || 'Sistema'
            }));
        }

        if (data.length === 0) {
            SGE.helpers.toast('Não há dados disponíveis para esta base.', 'warning');
            return;
        }

        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `${title}_${dateStr}.${format}`;

        if (format === 'xlsx') {
            try {
                if (!window.XLSX) throw new Error("Biblioteca XLSX não carregada");
                const ws = window.XLSX.utils.json_to_sheet(data);
                const wb = window.XLSX.utils.book_new();
                window.XLSX.utils.book_append_sheet(wb, ws, base.toUpperCase());
                window.XLSX.writeFile(wb, filename);
                SGE.helpers.toast(`Planilha gerada com sucesso!`, 'success');
            } catch (err) {
                console.error('Erro na exportação XLSX:', err);
                SGE.helpers.toast('Erro ao gerar Excel. Tentando CSV fallback...', 'error');
                this.fallbackCSV(data, filename.replace('.xlsx', '.csv'));
            }
        } else {
            this.fallbackCSV(data, filename);
        }
    },

    fallbackCSV(data, filename) {
        let contentStr = '';
        let mimeType = 'text/csv;charset=utf-8;';
        const separator = ',';
        const headers = Object.keys(data[0]).join(separator);
        const rows = data.map(obj =>
            Object.values(obj).map(v => {
                let val = String(v || '').replace(/"/g, '""');
                if (val.includes(separator) || val.includes('\n') || val.includes('"')) val = `"${val}"`;
                return val;
            }).join(separator)
        ).join('\n');

        // Prefix BOM for excel UTF-8 compatibility
        contentStr = '\ufeff' + headers + '\n' + rows;

        const blob = new Blob([contentStr], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        SGE.helpers.toast(`Arquivo CSV gerado com sucesso!`, 'success');
    }
};
