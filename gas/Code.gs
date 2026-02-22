/**
 * SGE — Google Apps Script Backend
 * Self-configuring backend that auto-creates and validates the Sheets structure
 * on every request. No manual setup needed.
 *
 * DEPLOY:
 * 1. Create a Google Sheet (blank)
 * 2. Extensions > Apps Script > paste this code
 * 3. Deploy > New deployment > Web app (Anyone, Execute as Me)
 * 4. Copy URL → paste in js/config.js (gasUrl)
 *
 * The script will automatically create all tabs and columns on first request.
 */

// ===================== SCHEMA DEFINITION =====================
// Single source of truth for the database structure.
// Change this and redeploy — the sheets update automatically.

const SCHEMA = {
  Colaboradores: {
    headers: ['ID', 'Nome', 'Função', 'Regime', 'Supervisor', 'Equipamento', 'Status', 'Telefone', 'Mat. Usiminas', 'Mat. GPS', 'Última Edição', 'Editado Por'],
    colWidths: [100, 280, 80, 120, 160, 180, 100, 140, 130, 130, 140, 140],
    validation: {
      2: { values: ['OP', 'MOT'] },                    // Função
      3: { values: ['24HS-A', '24HS-B', '24HS-C', '24HS-D', 'ADM', '16HS-5X2', '16HS-6X3', 'SEM REGISTRO'] }, // Regime
      6: { values: ['ATIVO', 'INATIVO', 'FÉRIAS'] }    // Status
    }
  },
  Supervisores: {
    headers: ['ID', 'Nome', 'Regime Padrão', 'Ativo'],
    colWidths: [100, 200, 140, 80],
    validation: {
      2: { values: ['24HS-A', '24HS-B', '24HS-C', '24HS-D', 'ADM', '16HS-5X2', '16HS-6X3', 'SEM REGISTRO'] },
      3: { values: ['TRUE', 'FALSE'] }
    }
  },
  'Movimentações': {
    headers: ['Colaborador ID', 'Colaborador Nome', 'Sup. Origem', 'Sup. Destino', 'Regime Origem', 'Regime Destino', 'Motivo', 'Observação', 'Data', 'Usuário'],
    colWidths: [120, 250, 150, 150, 120, 120, 160, 200, 160, 100],
    validation: {}
  },
  Equipamentos: {
    headers: ['ID', 'Sigla', 'Número', 'Nome Completo', 'Escala', 'Ativo'],
    colWidths: [100, 80, 80, 250, 100, 80],
    validation: {
      1: { values: ['AP', 'AV', 'ASP', 'HV', 'BK', 'MT', 'CJ'] },
      4: { values: ['24HS', '16H', 'ADM'] },
      5: { values: ['TRUE', 'FALSE'] }
    }
  },
  Usuarios: {
    headers: ['ID', 'Usuário', 'Senha', 'Perfil', 'Ativo'],
    colWidths: [100, 150, 150, 150, 80],
    validation: {
      3: { values: ['ADM', 'GESTAO', 'VISAO'] },
      4: { values: ['TRUE', 'FALSE'] }
    }
  }
};

// ===================== EQUIPMENT ABBREVIATION MAP =====================
const EQUIP_MAP = {
  'ALTA PRESSÃO': 'AP', 'ALTA PRESSAO': 'AP',
  'AUTO VÁCUO': 'AV', 'AUTO VACUO': 'AV',
  'ASPIRADOR INDUSTRIAL': 'ASP', 'ASPIRADOR': 'ASP',
  'HIPER VÁCUO': 'HV', 'HIPER VACUO': 'HV', 'HIPEP VACUO': 'HV',
  'CAMINHÃO BROOK': 'BK', 'CAMINHAO BROOK': 'BK', 'BROOK': 'BK', 'BK': 'BK',
  'MOTO BOMBA': 'MT', 'COQUERIA': 'MT', 'MT': 'MT',
  'CONJUGADO': 'CJ', 'CJ': 'CJ',
  'AP': 'AP', 'AV': 'AV', 'ASP': 'ASP', 'HV': 'HV'
};

const EQUIP_SPECIALS = ['NÃO INFORMADA', 'SEM VAGA ATRIBUÍDA', 'FÉRIAS'];

// ===================== AUTO-SETUP ENGINE =====================
// Runs on EVERY request to ensure the database is always correct.

let _structureVerified = false;

function ensureStructure() {
  if (_structureVerified) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(SCHEMA).forEach(tabName => {
    const def = SCHEMA[tabName];
    let sheet = ss.getSheetByName(tabName);

    if (!sheet) {
      // Create the tab from scratch
      sheet = ss.insertSheet(tabName);
      setupSheetFromSchema(sheet, def);
      Logger.log(`✅ Created tab: ${tabName}`);
    } else {
      // Validate and repair existing tab
      repairSheet(sheet, def);
    }

    // Auto-normalize if Equipamentos is completely new/empty
    if (tabName === 'Equipamentos' && sheet.getLastRow() <= 1) {
      try { normalizeEquipamentos(); } catch (e) { Logger.log(e); }
    }

    // Auto-create default admin if Usuarios is completely new
    if (tabName === 'Usuarios' && sheet.getLastRow() <= 1) {
      sheet.appendRow(['USR001', 'admin', '123', 'ADM', 'TRUE']);
      Logger.log('✅ Default admin user created.');
    }
  });

  // Auto-sync supervisors from collaborator data
  syncSupervisoresFromColaboradores(ss);

  // Enforce base equipment list
  syncEquipamentosMaster();

  // Remove the default "Sheet1" if it's empty and our tabs exist
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Página1') || ss.getSheetByName('Planilha1');
  if (defaultSheet) {
    try {
      const data = defaultSheet.getDataRange().getValues();
      if (data.length <= 1 && data[0].join('').trim() === '') {
        if (ss.getSheets().length > 1) ss.deleteSheet(defaultSheet);
      }
    } catch (e) { /* ignore */ }
  }

  _structureVerified = true;
}

/**
 * Auto-populate Supervisores tab from unique supervisor names in Colaboradores.
 * Only ADDS missing supervisors — never removes or overwrites existing ones.
 */
function syncSupervisoresFromColaboradores(ss) {
  const colSheet = ss.getSheetByName('Colaboradores');
  const supSheet = ss.getSheetByName('Supervisores');
  if (!colSheet || !supSheet) return;

  const colData = colSheet.getDataRange().getValues();
  if (colData.length <= 1) return;

  const colHeaders = colData[0];
  const supIdx = colHeaders.indexOf('Supervisor');
  const regIdx = colHeaders.indexOf('Regime');
  if (supIdx < 0) return;

  // Collect unique supervisors from collaborators with their most common regime
  const supMap = {};
  for (let i = 1; i < colData.length; i++) {
    const supName = String(colData[i][supIdx]).trim();
    if (!supName) continue;

    if (!supMap[supName]) {
      supMap[supName] = {};
    }
    const regime = String(colData[i][regIdx] || '').trim();
    if (regime) {
      supMap[supName][regime] = (supMap[supName][regime] || 0) + 1;
    }
  }

  // Get existing supervisors
  const supData = supSheet.getDataRange().getValues();
  const supHeaders = supData[0] || [];
  const supNameIdx = supHeaders.indexOf('Nome');
  const existingNames = new Set();
  for (let i = 1; i < supData.length; i++) {
    existingNames.add(String(supData[i][supNameIdx] || '').trim());
  }

  // Add missing supervisors
  let idCounter = supData.length;
  Object.keys(supMap).forEach(supName => {
    if (existingNames.has(supName)) return;

    // Pick the most common regime as default
    const regimes = supMap[supName];
    let defaultRegime = 'ADM';
    let maxCount = 0;
    Object.keys(regimes).forEach(r => {
      if (regimes[r] > maxCount) {
        maxCount = regimes[r];
        defaultRegime = r;
      }
    });

    supSheet.appendRow([`SUP${String(idCounter).padStart(3, '0')}`, supName, defaultRegime, 'TRUE']);
    idCounter++;
    Logger.log(`✅ Auto-added supervisor: ${supName} (${defaultRegime})`);
  });
}

function setupSheetFromSchema(sheet, def) {
  // Set headers
  sheet.appendRow(def.headers);

  // Style header row
  const headerRange = sheet.getRange(1, 1, 1, def.headers.length);
  headerRange
    .setFontWeight('bold')
    .setBackground('#e8ebf0')
    .setFontColor('#2d3748')
    .setFontFamily('Inter, Arial, sans-serif')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setBorder(false, false, true, false, false, false, '#c5cbda', SpreadsheetApp.BorderStyle.SOLID);

  sheet.setFrozenRows(1);

  // Set column widths
  def.colWidths.forEach((w, i) => {
    sheet.setColumnWidth(i + 1, w);
  });

  // Set data validation
  applyValidation(sheet, def);

  // Auto-filter
  if (sheet.getLastRow() >= 1) {
    sheet.getRange(1, 1, 1, def.headers.length).createFilter();
  }
}

function repairSheet(sheet, def) {
  const data = sheet.getDataRange().getValues();
  const existingHeaders = data[0] || [];

  let needsUpdate = false;

  // Check if headers match
  if (existingHeaders.length !== def.headers.length) {
    needsUpdate = true;
  } else {
    for (let i = 0; i < def.headers.length; i++) {
      if (String(existingHeaders[i]).trim() !== def.headers[i]) {
        needsUpdate = true;
        break;
      }
    }
  }

  if (needsUpdate) {
    // Add missing columns or fix headers
    const headerRange = sheet.getRange(1, 1, 1, def.headers.length);
    headerRange.setValues([def.headers]);

    // Re-apply formatting
    headerRange
      .setFontWeight('bold')
      .setBackground('#e8ebf0')
      .setFontColor('#2d3748')
      .setFontFamily('Inter, Arial, sans-serif')
      .setFontSize(10)
      .setHorizontalAlignment('center');

    sheet.setFrozenRows(1);

    Logger.log(`🔧 Repaired headers for: ${sheet.getName()}`);
  }

  // Always re-apply column widths (cheap operation)
  def.colWidths.forEach((w, i) => {
    sheet.setColumnWidth(i + 1, w);
  });

  // Re-apply validation
  applyValidation(sheet, def);

  // Ensure filter exists
  if (!sheet.getFilter() && sheet.getLastRow() >= 1) {
    try {
      sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), def.headers.length).createFilter();
    } catch (e) { /* filter already exists */ }
  }
}

function applyValidation(sheet, def) {
  if (!def.validation) return;

  const lastRow = Math.max(sheet.getLastRow(), 100);

  Object.keys(def.validation).forEach(colIdx => {
    const col = parseInt(colIdx);
    const rule = def.validation[colIdx];

    if (rule.values) {
      const validation = SpreadsheetApp.newDataValidation()
        .requireValueInList(rule.values, true)
        .setAllowInvalid(true)  // Allow custom values too
        .build();

      sheet.getRange(2, col + 1, lastRow, 1).setDataValidation(validation);
    }
  });
}

// ===================== WEB APP ENTRY POINTS =====================

function doPost(e) {
  try {
    ensureStructure();  // Auto-setup on every request

    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const params = body.params || {};

    let result;

    switch (action) {
      case 'listar_colaboradores':
        result = listarColaboradores();
        break;
      case 'listar_supervisores':
        result = listarSupervisores();
        break;
      case 'listar_movimentacoes':
        result = listarMovimentacoes();
        break;
      case 'mover_colaborador':
        result = moverColaborador(params);
        break;
      case 'criar_colaborador':
        result = criarColaborador(params);
        break;
      case 'editar_colaborador':
        result = editarColaborador(params);
        break;
      case 'atualizar_id':
        result = atualizarId(params);
        break;
      default:
        return jsonResponse({ success: false, error: `Ação desconhecida: ${action}` });
    }

    return jsonResponse({ success: true, data: result });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function doGet(e) {
  try {
    ensureStructure();  // Auto-setup on every request

    const action = (e && e.parameter && e.parameter.action) || 'listar_colaboradores';
    const params = e && e.parameter && e.parameter.params
      ? JSON.parse(e.parameter.params)
      : {};

    let result;

    switch (action) {
      case 'listar_colaboradores':
        result = listarColaboradores();
        break;
      case 'listar_supervisores':
        result = listarSupervisores();
        break;
      case 'listar_movimentacoes':
        result = listarMovimentacoes();
        break;
      case 'mover_colaborador':
        result = moverColaborador(params);
        break;
      case 'criar_colaborador':
        result = criarColaborador(params);
        break;
      case 'editar_colaborador':
        result = editarColaborador(params);
        break;
      case 'atualizar_id':
        result = atualizarId(params);
        break;
      case 'limpar_supervisores':
        result = limparSupervisores();
        break;
      case 'normalizar_equipamentos':
        result = normalizeEquipamentos();
        break;
      case 'listar_equipamentos':
        result = listarEquipamentos();
        break;
      case 'criar_equipamento':
        result = criarEquipamento(params);
        break;
      case 'editar_equipamento':
        result = editarEquipamento(params);
        break;
      case 'excluir_equipamento':
        result = excluirEquipamento(params);
        break;
      case 'status':
        result = { ok: true, tabs: Object.keys(SCHEMA), timestamp: new Date().toISOString() };
        break;
      case 'login':
        result = login(params);
        break;
      case 'listar_usuarios':
        result = listarUsuarios();
        break;
      case 'criar_usuario':
        result = criarUsuario(params);
        break;
      case 'editar_usuario':
        result = editarUsuario(params);
        break;
      case 'excluir_usuario':
        result = excluirUsuario(params);
        break;
      default:
        return jsonResponse({ success: false, error: `Ação desconhecida: ${action}` });
    }

    return jsonResponse({ success: true, data: result });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ===================== HELPERS =====================

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    // Safety net — should not happen after ensureStructure()
    sheet = ss.insertSheet(name);
    if (SCHEMA[name]) setupSheetFromSchema(sheet, SCHEMA[name]);
  }
  return sheet;
}

function sheetToObjects(sheet, keyMap) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    keyMap.forEach(({ col, key, transform }) => {
      const idx = headers.indexOf(col);
      if (idx >= 0) {
        obj[key] = transform ? transform(row[idx]) : row[idx];
      }
    });
    return obj;
  }).filter(obj => obj.id || obj.colaborador_id); // Skip empty rows
}

function findRowByColumn(sheet, colIndex, value) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]).trim() === String(value).trim()) {
      return i + 1; // 1-indexed row number
    }
  }
  return -1;
}

// ===================== COLABORADORES =====================

function listarColaboradores() {
  const sheet = getSheet('Colaboradores');
  return sheetToObjects(sheet, [
    { col: 'ID', key: 'id' },
    { col: 'Nome', key: 'nome' },
    { col: 'Função', key: 'funcao' },
    { col: 'Regime', key: 'regime' },
    { col: 'Supervisor', key: 'supervisor' },
    { col: 'Equipamento', key: 'equipamento' },
    { col: 'Status', key: 'status' },
    { col: 'Telefone', key: 'telefone' },
    { col: 'Mat. Usiminas', key: 'matricula_usiminas' },
    { col: 'Mat. GPS', key: 'matricula_gps' },
    { col: 'Última Edição', key: 'ultima_edicao' },
    { col: 'Editado Por', key: 'editado_por' },
  ]);
}

function criarColaborador(params) {
  const sheet = getSheet('Colaboradores');
  sheet.appendRow([
    params.id || '',
    params.nome || '',
    params.funcao || '',
    params.regime || '',
    params.supervisor || '',
    params.equipamento || 'SEM EQUIPAMENTO',
    params.status || 'ATIVO',
    params.telefone || '',
    params.matricula_usiminas || '',
    params.matricula_gps || '',
    new Date().toISOString(),
    params._user || 'admin'
  ]);
  return { created: true, id: params.id };
}

function editarColaborador(params) {
  const sheet = getSheet('Colaboradores');
  const row = findRowByColumn(sheet, 0, params.id);
  if (row < 0) throw new Error(`Colaborador ${params.id} não encontrado`);

  const range = sheet.getRange(row, 1, 1, 12);
  range.setValues([[
    params.id,
    params.nome || '',
    params.funcao || '',
    params.regime || '',
    params.supervisor || '',
    params.equipamento || '',
    params.status || '',
    params.telefone || '',
    params.matricula_usiminas || '',
    params.matricula_gps || '',
    new Date().toISOString(),
    params._user || 'admin'
  ]]);

  return { updated: true, id: params.id };
}

function atualizarId(params) {
  const sheet = getSheet('Colaboradores');
  const row = findRowByColumn(sheet, 0, params.temp_id);
  if (row < 0) throw new Error(`Colaborador com ID temporário ${params.temp_id} não encontrado`);

  sheet.getRange(row, 1).setValue(params.novo_id);

  // Also update movements that reference the old ID
  const movSheet = getSheet('Movimentações');
  const movData = movSheet.getDataRange().getValues();
  for (let i = 1; i < movData.length; i++) {
    if (String(movData[i][0]).trim() === String(params.temp_id).trim()) {
      movSheet.getRange(i + 1, 1).setValue(params.novo_id);
    }
  }

  return { updated: true, old_id: params.temp_id, new_id: params.novo_id };
}

// ===================== SUPERVISORES =====================

function listarSupervisores() {
  const sheet = getSheet('Supervisores');
  return sheetToObjects(sheet, [
    { col: 'ID', key: 'id' },
    { col: 'Nome', key: 'nome' },
    { col: 'Regime Padrão', key: 'regime_padrao' },
    { col: 'Ativo', key: 'ativo', transform: (v) => v === true || v === 'TRUE' || v === 'true' || v === 'SIM' },
  ]);
}

/**
 * Reset Supervisores tab: clear all data and rebuild from Colaboradores.
 * Fixes duplicate entries caused by name mismatches.
 */
function limparSupervisores() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const supSheet = ss.getSheetByName('Supervisores');
  if (!supSheet) throw new Error('Aba Supervisores não encontrada');

  // Clear all data rows (keep header)
  if (supSheet.getLastRow() > 1) {
    supSheet.deleteRows(2, supSheet.getLastRow() - 1);
  }

  // Force rebuild from collaborators
  syncSupervisoresFromColaboradores(ss);

  // Return the new supervisor list
  return listarSupervisores();
}

// ===================== MOVIMENTAÇÕES =====================

function listarMovimentacoes() {
  const sheet = getSheet('Movimentações');
  return sheetToObjects(sheet, [
    { col: 'Colaborador ID', key: 'colaborador_id' },
    { col: 'Colaborador Nome', key: 'colaborador_nome' },
    { col: 'Sup. Origem', key: 'supervisor_origem' },
    { col: 'Sup. Destino', key: 'supervisor_destino' },
    { col: 'Regime Origem', key: 'regime_origem' },
    { col: 'Regime Destino', key: 'regime_destino' },
    { col: 'Motivo', key: 'motivo' },
    { col: 'Observação', key: 'observacao' },
    { col: 'Data', key: 'created_at', transform: (v) => v instanceof Date ? v.toISOString() : String(v) },
    { col: 'Usuário', key: 'usuario' },
  ]);
}

function moverColaborador(params) {
  // 1. Register the movement
  const movSheet = getSheet('Movimentações');
  movSheet.appendRow([
    params.colaborador_id || '',
    params.colaborador_nome || '',
    params.supervisor_origem || '',
    params.supervisor_destino || '',
    params.regime_origem || '',
    params.motivo || '',
    params.observacao || '',
    params.created_at || new Date().toISOString(),
    params._user || 'admin'
  ]);

  // 2. Update the collaborator's supervisor and regime in the main sheet
  const colSheet = getSheet('Colaboradores');
  const row = findRowByColumn(colSheet, 0, params.colaborador_id);
  if (row >= 0) {
    colSheet.getRange(row, 4).setValue(params.regime_destino);   // Column D = Regime
    colSheet.getRange(row, 5).setValue(params.supervisor_destino); // Column E = Supervisor
    colSheet.getRange(row, 11).setValue(new Date().toISOString()); // Column K = Última Edição
    colSheet.getRange(row, 12).setValue(params._user || 'admin');  // Column L = Editado Por
  }

  return { moved: true, colaborador_id: params.colaborador_id };
}

// ===================== EQUIPAMENTOS =====================

/**
 * Normalize a raw equipment name to standard abbreviation format.
 * e.g. "ASPIRADOR 5" → "ASP-05", "AP 01" → "AP-01", "COQUERIA" → "MT"
 */
function normalizeOneEquip(raw) {
  if (!raw) return raw;
  const val = String(raw).trim().toUpperCase();

  // Skip special values
  for (const special of EQUIP_SPECIALS) {
    if (val.includes(special)) return val;
  }

  // Already normalized? (matches XX-00 pattern)
  if (/^[A-Z]{2,3}-\d{2}$/.test(val)) return val;

  // Try direct match first (e.g. "COQUERIA" → "MT", "CONJUGADO" → "CJ")
  if (EQUIP_MAP[val]) return EQUIP_MAP[val];

  // Try to extract prefix + number
  // Patterns: "AP 01", "ASPIRADOR 5", "HV01", "AV 2 ALY5322", "BROOK 03", "HV 3", "ASPIRADOR TELHADO"
  let bestPrefix = '';
  let bestSigla = '';
  const keys = Object.keys(EQUIP_MAP).sort((a, b) => b.length - a.length); // longest first

  for (const key of keys) {
    if (val.startsWith(key)) {
      bestPrefix = key;
      bestSigla = EQUIP_MAP[key];
      break;
    }
  }

  if (!bestSigla) return val; // No match, keep original

  const remainder = val.substring(bestPrefix.length).trim();

  if (!remainder) return bestSigla; // Just the prefix, no number (e.g. "COQUERIA")

  // Handle "TELHADO" suffix
  if (remainder === 'TELHADO') return bestSigla + '-TH';

  // Extract leading number
  const numMatch = remainder.match(/^(\d+)/);
  if (numMatch) {
    const num = numMatch[1].padStart(2, '0');
    return bestSigla + '-' + num;
  }

  // Handle cases like "SPOT"
  if (remainder === 'SPOT') return bestSigla + '-SP';

  return bestSigla; // Fallback
}

/**
 * Normalize ALL equipment names in the Colaboradores sheet.
 * Updates the Equipamento column in-place.
 */
function normalizeEquipamentos() {
  const sheet = getSheet('Colaboradores');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const equipCol = headers.indexOf('Equipamento');

  if (equipCol < 0) throw new Error('Coluna Equipamento não encontrada');

  let updated = 0;
  for (let i = 1; i < data.length; i++) {
    const raw = String(data[i][equipCol] || '').trim();
    const normalized = normalizeOneEquip(raw);

    if (normalized !== raw) {
      sheet.getRange(i + 1, equipCol + 1).setValue(normalized);
      updated++;
    }
  }

  // Also auto-populate the Equipamentos master table
  syncEquipamentosMaster();

  return { updated: updated, total: data.length - 1 };
}

/**
 * Auto-populate the Equipamentos master table from collaborator data.
 */
function syncEquipamentosMaster() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const colSheet = ss.getSheetByName('Colaboradores');
  const eqSheet = ss.getSheetByName('Equipamentos');
  if (!colSheet || !eqSheet) return;

  const colData = colSheet.getDataRange().getValues();
  const colHeaders = colData[0];
  const equipCol = colHeaders.indexOf('Equipamento');
  if (equipCol < 0) return;

  // Base predefined equipment list as requested
  const baseEquipments = [
    'AP-01', 'AP-02', 'AP-03', 'AP-04', 'AP-05', 'AP-06', 'AP-07', 'AP-08', 'AP-09', 'AP-10', 'AP-11', 'AP-12',
    'AV-01', 'AV-02', 'AV-03', 'AV-04', 'AV-05', 'AV-06', 'AV-07', 'AV-08',
    'BK-01', 'BK-02', 'BK-03', 'BK-04',
    'HV-01', 'HV-02', 'HV-03',
    'ASP-01', 'ASP-02', 'ASP-03', 'ASP-04', 'ASP-05', 'ASP-06', 'ASP-07', 'ASP-08', 'ASP-09', 'ASP-10', 'ASP-SP',
    'MT', 'CJ'
  ];

  // Collect unique equipment from collaborators
  const equipSet = new Set(baseEquipments);
  for (let i = 1; i < colData.length; i++) {
    const val = String(colData[i][equipCol] || '').trim();
    if (!val) continue;
    // Skip specials
    let isSpecial = false;
    for (const sp of EQUIP_SPECIALS) {
      if (val.includes(sp)) { isSpecial = true; break; }
    }
    if (isSpecial || val === 'SEM VAGA ATRIBUÍDA' || val === 'NÃO INFORMADA') continue;
    equipSet.add(val);
  }

  // Get existing equipment
  const eqData = eqSheet.getDataRange().getValues();
  const eqHeaders = eqData[0] || [];
  const siglaIdx = eqHeaders.indexOf('Sigla');
  const numIdx = eqHeaders.indexOf('Número');
  const existingKeys = new Set();
  for (let i = 1; i < eqData.length; i++) {
    existingKeys.add(String(eqData[i][siglaIdx] || '') + '-' + String(eqData[i][numIdx] || ''));
  }

  // Add missing equipment
  let idCounter = eqData.length;
  equipSet.forEach(eq => {
    // Parse sigla and number from normalized format (e.g. "AP-01")
    const match = eq.match(/^([A-Z]{2,3})(?:-(.+))?$/);
    if (!match) return;

    const sigla = match[1];
    const numero = match[2] || '';
    const key = sigla + '-' + numero;

    if (existingKeys.has(key)) return;

    // Build full name
    const nomeMap = { AP: 'ALTA PRESSÃO', AV: 'AUTO VÁCUO', ASP: 'ASPIRADOR INDUSTRIAL', HV: 'HIPER VÁCUO', BK: 'CAMINHÃO BROOK', MT: 'MOTO BOMBA', CJ: 'CONJUGADO' };
    const nomeCompleto = nomeMap[sigla] ? (nomeMap[sigla] + (numero ? ' - ' + numero : '')) : eq;

    eqSheet.appendRow([`EQ${String(idCounter).padStart(3, '0')}`, sigla, numero, nomeCompleto, 'TRUE']);
    idCounter++;
  });
}

function listarEquipamentos() {
  const sheet = getSheet('Equipamentos');
  return sheetToObjects(sheet, [
    { col: 'ID', key: 'id' },
    { col: 'Sigla', key: 'sigla' },
    { col: 'Número', key: 'numero' },
    { col: 'Nome Completo', key: 'nome_completo' },
    { col: 'Escala', key: 'escala' },
    { col: 'Ativo', key: 'ativo', transform: (v) => v === true || v === 'TRUE' || v === 'true' },
  ]);
}

function criarEquipamento(params) {
  const sheet = getSheet('Equipamentos');
  const lastRow = sheet.getLastRow();
  const newId = `EQ${String(lastRow).padStart(3, '0')}`;

  sheet.appendRow([
    newId,
    params.sigla || '',
    params.numero || '',
    params.nome_completo || '',
    params.escala || '24HS',
    params.ativo !== undefined ? String(params.ativo).toUpperCase() : 'TRUE'
  ]);

  return { created: true, id: newId };
}

function editarEquipamento(params) {
  const sheet = getSheet('Equipamentos');
  const row = findRowByColumn(sheet, 0, params.id);
  if (row < 0) throw new Error(`Equipamento ${params.id} não encontrado`);

  sheet.getRange(row, 2).setValue(params.sigla || '');
  sheet.getRange(row, 3).setValue(params.numero || '');
  sheet.getRange(row, 4).setValue(params.nome_completo || '');
  if (params.escala !== undefined) {
    sheet.getRange(row, 5).setValue(params.escala);
  }
  if (params.ativo !== undefined) {
    sheet.getRange(row, 6).setValue(String(params.ativo).toUpperCase());
  }

  return { updated: true, id: params.id };
}

function excluirEquipamento(params) {
  const sheet = getSheet('Equipamentos');
  const row = findRowByColumn(sheet, 0, params.id);
  if (row < 0) throw new Error(`Equipamento ${params.id} não encontrado`);

  sheet.deleteRow(row);
  return { deleted: true, id: params.id };
}

// ===================== MANUAL TRIGGER =====================

/**
 * Run manually to force structure rebuild.
 * Also runs automatically on every API request.
 */
function setupSheets() {
  _structureVerified = false;
  ensureStructure();
  Logger.log('✅ All sheets initialized and validated');
}

// ===================== AUTH & USUÁRIOS (RBAC) =====================

function login(params) {
  const { usuario, senha } = params;
  if (!usuario || !senha) throw new Error('Usuário e senha são obrigatórios.');

  const sheet = getSheet('Usuarios');
  const data = sheetToObjects(sheet, [
    { col: 'ID', key: 'id' },
    { col: 'Usuário', key: 'usuario' },
    { col: 'Senha', key: 'senha' },
    { col: 'Perfil', key: 'perfil' },
    { col: 'Ativo', key: 'ativo', transform: (v) => v === true || v === 'TRUE' || v === 'true' }
  ]);

  const user = data.find(u => String(u.usuario).toLowerCase() === String(usuario).toLowerCase() && String(u.senha) === String(senha));

  if (!user) throw new Error('Usuário ou senha inválidos.');
  if (!user.ativo) throw new Error('Usuário inativo.');

  return {
    id: user.id,
    usuario: user.usuario,
    perfil: user.perfil,
    token: Utilities.base64Encode(user.id + ':' + user.perfil + ':' + new Date().getTime()) // Simple pseudo-token
  };
}

function listarUsuarios() {
  const sheet = getSheet('Usuarios');
  return sheetToObjects(sheet, [
    { col: 'ID', key: 'id' },
    { col: 'Usuário', key: 'usuario' },
    { col: 'Senha', key: 'senha' },
    { col: 'Perfil', key: 'perfil' },
    { col: 'Ativo', key: 'ativo', transform: (v) => v === true || v === 'TRUE' || v === 'true' }
  ]);
}

function criarUsuario(params) {
  const { usuario, senha, perfil, ativo } = params;
  if (!usuario || !senha || !perfil) throw new Error('Usuário, senha e perfil são obrigatórios.');

  const sheet = getSheet('Usuarios');
  const id = `USR${String(sheet.getLastRow()).padStart(3, '0')}`;
  
  sheet.appendRow([id, usuario, senha, perfil, ativo !== false ? 'TRUE' : 'FALSE']);
  return { success: true, id };
}

function editarUsuario(params) {
  const { id, usuario, senha, perfil, ativo } = params;
  if (!id) throw new Error('ID do usuário é obrigatório.');

  const sheet = getSheet('Usuarios');
  const headers = sheet.getDataRange().getValues()[0];
  const rowIndex = findRowByColumn(sheet, headers.indexOf('ID'), id);
  if (rowIndex < 0) throw new Error('Usuário não encontrado.');

  const realRow = rowIndex + 1;
  const colUser = headers.indexOf('Usuário') + 1;
  const colSenha = headers.indexOf('Senha') + 1;
  const colPerfil = headers.indexOf('Perfil') + 1;
  const colAtivo = headers.indexOf('Ativo') + 1;

  if (usuario !== undefined) sheet.getRange(realRow, colUser).setValue(usuario);
  if (senha !== undefined) sheet.getRange(realRow, colSenha).setValue(senha);
  if (perfil !== undefined) sheet.getRange(realRow, colPerfil).setValue(perfil);
  if (ativo !== undefined) sheet.getRange(realRow, colAtivo).setValue(ativo ? 'TRUE' : 'FALSE');

  return { success: true };
}

function excluirUsuario(params) {
  const { id } = params;
  if (!id) throw new Error('ID do usuário é obrigatório.');
  
  // Prevent deleting the very first admin
  if (id === 'USR001') throw new Error('Não é possível excluir o administrador padrão.');

  const sheet = getSheet('Usuarios');
  const headers = sheet.getDataRange().getValues()[0];
  const rowIndex = findRowByColumn(sheet, headers.indexOf('ID'), id);
  if (rowIndex < 0) throw new Error('Usuário não encontrado.');

  sheet.deleteRow(rowIndex + 1);
  return { success: true };
}
