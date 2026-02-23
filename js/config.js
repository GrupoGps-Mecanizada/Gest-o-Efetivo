'use strict';

/**
 * SGE — Configuration
 * Central configuration for the application
 */
window.SGE = window.SGE || {};

SGE.CONFIG = {
  // Google Apps Script Web App URL
  // Set this to your deployed GAS URL to enable data sync
  gasUrl: 'https://script.google.com/macros/s/AKfycby72PHCQfvkX6hqbmsfcAHEMNmlOzteFEE9hRObQOclMyZlQ4F6ArCzjvLMDq0_lISy/exec',

  // Default user identifier
  usuario: 'admin',

  // Available regimes
  regimes: ['24HS-A', '24HS-B', '24HS-C', '24HS-D', 'ADM', '16HS-5X2', '16HS-6X3', 'SEM REGISTRO'],

  // Available functions
  funcoes: ['OP', 'MOT'],

  // Available statuses
  statuses: ['ATIVO', 'INATIVO', 'FÉRIAS', 'AFASTADO', 'DESLIGADO', 'EM AVISO', 'EM CONTRATAÇÃO'],

  // Movement reasons
  motivos: [
    'Transferência',
    'Férias',
    'Retorno de Férias',
    'Cobertura',
    'Remanejamento Operacional',
    'Pedido do Colaborador',
    'Determinação da Gestão',
    'Outro'
  ],

  // Toast duration in ms
  toastDuration: 3200,

  // Equipment type definitions
  equipTipos: {
    AP: { nome: 'Alta Pressão', cor: '#2e9e5a' },
    AV: { nome: 'Auto Vácuo', cor: '#4a7fd7' },
    ASP: { nome: 'Aspirador Industrial', cor: '#e0872a' },
    HV: { nome: 'Hiper Vácuo', cor: '#8b5ec9' },
    BK: { nome: 'Caminhão Brook', cor: '#c99a1a' },
    MT: { nome: 'Moto Bomba (Coqueria)', cor: '#d64545' },
    CJ: { nome: 'Conjugado', cor: '#1a9eb8' }
  },

  // Regime → Turno mapping
  turnoMap: {
    '24HS-A': 'A',
    '24HS-B': 'B',
    '24HS-C': 'C',
    '24HS-D': 'D',
    'ADM': 'ADM',
    '16HS-5X2': '16H',
    '16HS-6X3': '16H',
    'SEM REGISTRO': 'S/R'
  },

  // Fixed visual sort order for Kanban columns (Supervisores / Groups)
  ordemKanban: [
    'JUNIOR PEREIRA',
    'SEBASTIÃO',
    'ASPIRADOR',
    'OZIAS',
    'MATUSALEM',
    'ISRAEL',
    'WELLISON',
    '16 HORAS',
    'SEM REGISTRO'
  ]
};

/**
 * Manage custom dynamic configurations
 */
SGE.configManager = {
  /**
   * Load any saved configurations from localStorage and merge into SGE.CONFIG
   */
  load() {
    try {
      const saved = localStorage.getItem('SGE_CUSTOM_CONFIG');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.regimes) SGE.CONFIG.regimes = parsed.regimes;
        if (parsed.funcoes) SGE.CONFIG.funcoes = parsed.funcoes;
        if (parsed.equipTipos) SGE.CONFIG.equipTipos = parsed.equipTipos;
        if (parsed.turnoMap) SGE.CONFIG.turnoMap = parsed.turnoMap;
        if (parsed.ordemKanban) SGE.CONFIG.ordemKanban = parsed.ordemKanban;
        if (parsed.statuses) SGE.CONFIG.statuses = parsed.statuses;
        if (parsed.motivos) SGE.CONFIG.motivos = parsed.motivos;
      }
    } catch (e) {
      console.warn('Failed to load custom configs', e);
    }
  },

  /**
   * Save current SGE.CONFIG to localStorage
   */
  save() {
    try {
      const dataToSave = {
        regimes: SGE.CONFIG.regimes,
        funcoes: SGE.CONFIG.funcoes,
        equipTipos: SGE.CONFIG.equipTipos,
        turnoMap: SGE.CONFIG.turnoMap,
        ordemKanban: SGE.CONFIG.ordemKanban,
        statuses: SGE.CONFIG.statuses,
        motivos: SGE.CONFIG.motivos
      };
      localStorage.setItem('SGE_CUSTOM_CONFIG', JSON.stringify(dataToSave));

      // Async sync to the database behind the scenes
      if (window.SGE && SGE.api && typeof SGE.api.callGAS === 'function') {
        SGE.api.callGAS('salvar_configuracoes', { config: dataToSave }).catch(e => console.warn('Failed to sync configs to DB', e));
      }
    } catch (e) {
      console.warn('Failed to save custom configs', e);
    }
  }
};

// Auto-load config immediately on script execution
SGE.configManager.load();
