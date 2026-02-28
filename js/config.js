'use strict';

/**
 * SGE — Configuration
 * Central configuration for the application
 */
window.SGE = window.SGE || {};

SGE.CONFIG = {
  // Supabase is now used instead of Google Apps Script
  // gasUrl: 'https://script.google.com/macros/s/.../exec',

  // Default user identifier
  usuario: 'admin',

  // Available regimes
  regimes: ['24HS-A', '24HS-B', '24HS-C', '24HS-D', 'ADM', '16HS-5X2', '16HS-6X3', 'SEM REGISTRO'],

  // Available functions
  funcoes: ['OP', 'MOT'],

  // Function color map — distinct colors for each function across all views
  funcaoColors: {
    'OP': { bg: '#e6eef9', text: '#2c5ea8', border: '#b0c8e8' },
    'MOT': { bg: '#e8f5ee', text: '#1a7a42', border: '#b5ddc5' },
    'OPERADOR DE EQUIPAMENTOS': { bg: '#e6eef9', text: '#2c5ea8', border: '#b0c8e8' },
    'MOTORISTA DE CAMINHAO': { bg: '#e8f5ee', text: '#1a7a42', border: '#b5ddc5' },
    'SUPERVISOR DE AREA': { bg: '#fdf0e4', text: '#b06318', border: '#ecc9a0' },
    'SUPERVISOR DE OBRA I': { bg: '#f3ecfb', text: '#7b49b0', border: '#d0b8e8' },
    'MOTORISTA': { bg: '#e8f5ee', text: '#1a7a42', border: '#b5ddc5' },
  },

  // Fallback palette for dynamically added functions
  _funcaoFallbackPalette: [
    { bg: '#fce8e8', text: '#c43030', border: '#e8b0b0' },
    { bg: '#fdf5e0', text: '#9a7510', border: '#e8d699' },
    { bg: '#e0f7f7', text: '#0e7c7c', border: '#a6dede' },
    { bg: '#fde8f4', text: '#a83279', border: '#e8b0d4' },
    { bg: '#eef0f4', text: '#5a6676', border: '#c8ced8' },
  ],

  /**
   * Get color style object for a function name
   */
  getFuncaoColor(funcao) {
    if (!funcao) return { bg: '#eef0f4', text: '#5a6676', border: '#c8ced8' };
    const key = funcao.toUpperCase().trim();
    if (this.funcaoColors[key]) return this.funcaoColors[key];
    // Dynamic fallback: hash the name to pick a consistent color
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
    const idx = Math.abs(hash) % this._funcaoFallbackPalette.length;
    return this._funcaoFallbackPalette[idx];
  },

  /**
   * Get inline style string for a function badge
   */
  getFuncaoBadgeStyle(funcao) {
    const c = this.getFuncaoColor(funcao);
    return `background:${c.bg};color:${c.text};border:1px solid ${c.border};`;
  },

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

      // Async sync each config key to Supabase app_config table
      if (window.SGE && SGE.api && typeof SGE.api.syncConfigArray === 'function') {
        Object.entries(dataToSave).forEach(([key, value]) => {
          SGE.api.syncConfigArray(key, value).catch(e => console.warn('Failed to sync config to Supabase', e));
        });
      }
    } catch (e) {
      console.warn('Failed to save custom configs', e);
    }
  }
};

// Auto-load config immediately on script execution
SGE.configManager.load();
