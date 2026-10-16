// Testes da lógica do Movimentar (dados falsos). Rodar: node --test tests/movimentar.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
// objetos que vêm de dentro do vm têm outro "protótipo": compara pelo conteúdo
const igual = (a, b, msg) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), b, msg);

function carregar() {
  const ctx = { console, document: {}, window: {} };
  ctx.window = ctx;
  ctx.SGE = {
    helpers: { escapeHtml: (s) => String(s) },
    state: {
      supervisores: [{ id: 'sA', nome: 'SUP A', ativo: true }, { id: 'sB', nome: 'SUP B', ativo: true }],
      equipamentos: [{ id: 'e1', sigla: 'AP', numero: '12' }, { id: 'e2', sigla: 'AV', numero: '02' }],
      vagas: [{ supervisor_id: 'sA', equipment_id: 'e1' }, { supervisor_id: 'sB', equipment_id: 'e2' }],
      colaboradores: [
        { id: 'p1', nome: 'JOÃO TESTE', funcao: 'MOTORISTA', status: 'ATIVO', supervisor_id: 'sA', equipment_id: 'e1', matricula_gps: '111' },
        { id: 'p2', nome: 'MARIA TESTE', funcao: 'MOTORISTA', status: 'ATIVO', supervisor_id: 'sB', equipment_id: 'e2', matricula_gps: '222' },
        { id: 'p3', nome: 'JOSÉ SOBRA', funcao: 'OPERADOR', status: 'ATIVO', supervisor_id: null, equipment_id: null },
        { id: 'p4', nome: 'ANA FÉRIAS', funcao: 'OPERADOR', status: 'FÉRIAS', supervisor_id: 'sA', equipment_id: null, data_volta: '2026-11-03' },
        { id: 'p5', nome: 'PEDRO SAIU', funcao: 'OPERADOR', status: 'DESLIGADO', supervisor_id: null, equipment_id: null },
      ],
    },
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'movimentar.js'), 'utf8'), ctx);
  const L = ctx.SGE.movimentar._logica;
  const p = (id) => ctx.SGE.state.colaboradores.find((c) => c.id === id);
  return { L, p };
}

test('situação de cada pessoa', () => {
  const { L, p } = carregar();
  igual(['p1', 'p3', 'p4', 'p5'].map((id) => L.situacao(p(id))), ['trabalhando', 'sobra', 'ferias', 'desligado']);
  assert.strictEqual(L.situacao({ status: 'AFASTADO', supervisor_id: 'sA' }), 'atestado');
});

test('onde a pessoa está, em português', () => {
  const { L, p } = carregar();
  assert.strictEqual(L.lugar(p('p1')), 'na AP 12, equipe SUP A');
  assert.strictEqual(L.lugar(p('p3')), 'na Sobra');
  assert.strictEqual(L.lugar(p('p4')), 'de férias');
});

test('busca por nome sem acento e por matrícula; desligados vão para o fim', () => {
  const { L } = carregar();
  igual(L.buscar('jose').map((c) => c.id), ['p3']);
  igual(L.buscar('222').map((c) => c.id), ['p2']);
  igual(L.buscar('teste').map((c) => c.id), ['p1', 'p2']);
  igual(L.buscar('   '), []);
});

test('férias: sai do equipamento, fica na equipe, com data de volta', () => {
  const { L, p } = carregar();
  const r = L.plano(p('p1'), { tipo: 'ferias', dataVolta: '2026-11-03' });
  igual(r.mudancas, [{ colaborador_id: 'p1', status: 'FÉRIAS', supervisor_id: 'sA', equipment_id: null, data_volta: '2026-11-03' }]);
  assert.strictEqual(r.frase, 'JOÃO TESTE sai da AP 12, equipe SUP A e vai para férias até 03/11.');
  igual(r.antes, [{ colaborador_id: 'p1', status: 'ATIVO', supervisor_id: 'sA', equipment_id: 'e1', data_volta: null }]);
});

test('vaga de motorista ocupada: trocar de lugar grava as duas pessoas juntas', () => {
  const { L, p } = carregar();
  assert.ok(L.cheia('sB', 'e2', true, 'p1'));
  const r = L.plano(p('p1'), { tipo: 'equipamento', supId: 'sB', eqId: 'e2' }, { pessoa: p('p2'), acao: 'trocar' });
  assert.strictEqual(r.mudancas.length, 2);
  igual(r.mudancas[1], { colaborador_id: 'p2', status: 'ATIVO', supervisor_id: 'sA', equipment_id: 'e1', data_volta: null });
  assert.match(r.frase, /MARIA TESTE vai para o lugar de JOÃO TESTE: AP 12, equipe SUP A\./);
  assert.strictEqual(r.antes.length, 2, 'o Desfazer volta as duas');
});

test('vaga ocupada: mandar quem estava para a Sobra ou deixar como está', () => {
  const { L, p } = carregar();
  const s = L.plano(p('p1'), { tipo: 'equipamento', supId: 'sB', eqId: 'e2' }, { pessoa: p('p2'), acao: 'sobra' });
  igual(s.mudancas[1], { colaborador_id: 'p2', status: 'ATIVO', supervisor_id: null, equipment_id: null, data_volta: null });
  const m = L.plano(p('p1'), { tipo: 'equipamento', supId: 'sB', eqId: 'e2' }, { pessoa: p('p2'), acao: 'manter' });
  assert.strictEqual(m.mudancas.length, 1);
  assert.match(m.frase, /continua na vaga/);
});

test('quem está na Sobra não "troca de lugar": quem estava na vaga vai para a Sobra', () => {
  const { L, p } = carregar();
  const r = L.plano(p('p3'), { tipo: 'equipamento', supId: 'sB', eqId: 'e2' }, { pessoa: p('p2'), acao: 'trocar' });
  igual(r.mudancas[1].supervisor_id, null);
});

test('operador: a vaga só fica cheia com 2', () => {
  const { L } = carregar();
  assert.ok(!L.cheia('sA', 'e1', false, 'x'), 'nenhum operador na AP 12');
});

test('voltar ao trabalho tira a data de volta', () => {
  const { L, p } = carregar();
  const r = L.plano(p('p4'), { tipo: 'voltar', supId: 'sA', eqId: 'e1' });
  igual(r.mudancas[0], { colaborador_id: 'p4', status: 'ATIVO', supervisor_id: 'sA', equipment_id: 'e1', data_volta: null });
  assert.strictEqual(r.frase, 'ANA FÉRIAS volta ao trabalho (estava de férias) e vai para a AP 12, equipe SUP A.');
});

test('sobra e desligado', () => {
  const { L, p } = carregar();
  const s = L.plano(p('p2'), { tipo: 'sobra' });
  igual(s.mudancas[0], { colaborador_id: 'p2', status: 'ATIVO', supervisor_id: null, equipment_id: null, data_volta: null });
  const d = L.plano(p('p2'), { tipo: 'desligado' });
  assert.strictEqual(d.mudancas[0].status, 'DESLIGADO');
  assert.match(d.frase, /histórico fica guardado/);
});

test('motivo já vem marcado conforme o destino', () => {
  const { L } = carregar();
  igual(['ferias', 'atestado', 'equipamento', 'sobra', 'voltar', 'desligado'].map(L.motivoSugerido),
    ['Férias', 'Atestado', 'Remanejamento', 'Remanejamento', 'Volta ao trabalho', 'Desligamento']);
});
