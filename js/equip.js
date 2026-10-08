'use strict';

/**
 * SGE — Equipamentos (funções de apoio)
 * Lê o código do equipamento e o turno do regime. A antiga tela de Alocações saiu (a Matriz substitui).
 */
window.SGE = window.SGE || {};

SGE.equip = {
  /**
   * Parse equipment code into { sigla, numero }
   */
  parseEquip(equipStr) {
    if (!equipStr) return null;
    const val = String(equipStr).trim().toUpperCase();
    const match = val.match(/^([A-Z]{2,3})(?:-(.*))?$/);
    if (!match) return null;

    let num = match[2] || '';
    if (/^\d$/.test(num)) num = '0' + num; // Auto-pad "8" to "08"

    return { sigla: match[1], numero: num };
  },

  /**
   * Get turno label from regime
   */
  getTurno(regime) {
    if (!regime) return 'S/R';
    const r = String(regime).toUpperCase().trim();

    // Try intelligent extraction first (works for "4x4-A", "24HS A", "A", etc)
    if (r === 'A' || r.endsWith('-A') || r.endsWith(' A') || r === '4X4-A') return 'A';
    if (r === 'B' || r.endsWith('-B') || r.endsWith(' B') || r === '4X4-B') return 'B';
    if (r === 'C' || r.endsWith('-C') || r.endsWith(' C') || r === '4X4-C') return 'C';
    if (r === 'D' || r.endsWith('-D') || r.endsWith(' D') || r === '4X4-D') return 'D';
    if (r.includes('ADM')) return 'ADM';
    if (r.includes('16H') || r.includes('16 H')) return '16H';

    // Strict fallback map matching
    return SGE.CONFIG.turnoMap[regime] || 'S/R';
  }
};
