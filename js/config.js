'use strict';

/**
 * SGE — Configuration
 * Central configuration for the application
 */
window.SGE = window.SGE || {};

SGE.CONFIG = {
  // Google Apps Script Web App URL
  // Set this to your deployed GAS URL to enable data sync
  gasUrl: 'https://script.google.com/macros/s/AKfycbzdLDQOn0jz2ULaljhqtk21BYdWku3K98GbYh5rinllUVERoHYvM7RNY-ZXKApKPQDb/exec',

  // Default user identifier
  usuario: 'admin',

  // Available regimes
  regimes: ['24HS-A', '24HS-B', '24HS-C', '24HS-D', 'ADM', '16HS-5X2', '16HS-6X3', 'SEM REGISTRO'],

  // Available functions
  funcoes: ['OP', 'MOT'],

  // Available statuses
  statuses: ['ATIVO', 'INATIVO', 'FÉRIAS'],

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
