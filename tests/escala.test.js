'use strict';
// Rodar: node --test tests/escala.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const escala = require('../js/escala.js');

const cfg = escala.PADRAO;
const feriados = [{ data: '2026-10-12', nome: 'Nossa Senhora Aparecida' }];

test('ciclo informado pelo dono em 14/10/2026', () => {
    assert.deepEqual(escala.letrasDoDia('2026-10-13', cfg), { dia: 'A', noite: 'C', folga: ['D', 'B'], vezDaLetra: 1 });
    assert.deepEqual(escala.letrasDoDia('2026-10-14', cfg), { dia: 'A', noite: 'C', folga: ['D', 'B'], vezDaLetra: 2 });
    assert.equal(escala.letrasDoDia('2026-10-15', cfg).dia, 'D');
    assert.equal(escala.letrasDoDia('2026-10-15', cfg).noite, 'A');
    assert.equal(escala.letrasDoDia('2026-10-17', cfg).dia, 'B');
    assert.equal(escala.letrasDoDia('2026-10-17', cfg).noite, 'D');
    assert.equal(escala.letrasDoDia('2026-10-19', cfg).dia, 'C');
    assert.equal(escala.letrasDoDia('2026-10-19', cfg).noite, 'B');
});

test('cada letra faz 2 dias, 2 noites e 4 folgas a cada 8 dias', () => {
    for (const letra of ['A', 'B', 'C', 'D']) {
        const seq = [];
        for (let d = 13; d <= 20; d++) seq.push(escala.situacaoDaLetra(letra, `2026-10-${d}`, cfg));
        assert.equal(seq.filter(s => s === 'dia').length, 2, letra);
        assert.equal(seq.filter(s => s === 'noite').length, 2, letra);
        assert.equal(seq.filter(s => s === 'folga').length, 4, letra);
    }
});

test('B está no 2º dia de folga em 14/10 (folgou desde 13/10)', () => {
    assert.equal(escala.situacaoDaLetra('B', '2026-10-12', cfg), 'noite');
    assert.equal(escala.situacaoDaLetra('B', '2026-10-13', cfg), 'folga');
    assert.equal(escala.situacaoDaLetra('B', '2026-10-14', cfg), 'folga');
});

test('datas antes da referência e virada de mês/ano', () => {
    assert.equal(escala.letrasDoDia('2026-10-05', cfg).dia, 'A'); // 8 dias antes
    assert.equal(escala.letrasDoDia('2026-10-21', cfg).dia, 'A'); // 8 dias depois
    assert.equal(escala.letrasDoDia('2026-10-11', cfg).dia, 'C');
    assert.equal(escala.letrasDoDia('2026-11-01', cfg).dia, escala.letrasDoDia('2026-10-24', cfg).dia);
    assert.equal(escala.letrasDoDia('2027-01-01', cfg).dia, escala.letrasDoDia('2026-12-24', cfg).dia);
});

test('turno do 4x4 pela hora (06:40 e 18:40)', () => {
    let t = escala.turnoEm(new Date(2026, 9, 14, 10, 0), cfg, feriados);
    assert.equal(t.quatroPorQuatro.letra, 'A');
    assert.equal(t.quatroPorQuatro.periodo, 'dia');

    t = escala.turnoEm(new Date(2026, 9, 14, 18, 40), cfg, feriados);
    assert.equal(t.quatroPorQuatro.letra, 'C');
    assert.equal(t.quatroPorQuatro.periodo, 'noite');

    // madrugada de 15/10 ainda é a noite de 14/10 (Israel, C)
    t = escala.turnoEm(new Date(2026, 9, 15, 3, 0), cfg, feriados);
    assert.equal(t.quatroPorQuatro.letra, 'C');
    assert.equal(t.quatroPorQuatro.diaDoTurno, '2026-10-14');

    t = escala.turnoEm(new Date(2026, 9, 15, 6, 39), cfg, feriados);
    assert.equal(t.quatroPorQuatro.letra, 'C');
    t = escala.turnoEm(new Date(2026, 9, 15, 6, 40), cfg, feriados);
    assert.equal(t.quatroPorQuatro.letra, 'D');
});

test('ADM: seg a sex, 07:00 às 16:48, sem feriado', () => {
    assert.equal(escala.turnoEm(new Date(2026, 9, 14, 7, 0), cfg, feriados).adm.trabalhando, true);
    assert.equal(escala.turnoEm(new Date(2026, 9, 14, 16, 48), cfg, feriados).adm.trabalhando, false);
    assert.equal(escala.turnoEm(new Date(2026, 9, 17, 10, 0), cfg, feriados).adm.trabalhando, false); // sábado
    assert.equal(escala.turnoEm(new Date(2026, 9, 12, 10, 0), cfg, feriados).adm.trabalhando, false); // feriado
});

test('16 horas: dois turnos seg a sex', () => {
    assert.equal(escala.turnoEm(new Date(2026, 9, 14, 6, 40), cfg, feriados).dezesseis.turno.nome, '1º turno');
    assert.equal(escala.turnoEm(new Date(2026, 9, 14, 14, 40), cfg, feriados).dezesseis.turno.nome, '2º turno');
    assert.equal(escala.turnoEm(new Date(2026, 9, 14, 22, 40), cfg, feriados).dezesseis.turno, null);
    assert.equal(escala.turnoEm(new Date(2026, 9, 18, 10, 0), cfg, feriados).dezesseis.turno, null); // domingo
});

test('4x4 trabalha no feriado', () => {
    const t = escala.turnoEm(new Date(2026, 9, 12, 10, 0), cfg, feriados);
    assert.ok(t.feriado);
    assert.ok(t.quatroPorQuatro.letra);
});

test('grupo pelo regime gravado', () => {
    assert.deepEqual(escala.grupoDoRegime('4X4 - A'), { tipo: '4x4', letra: 'A' });
    assert.deepEqual(escala.grupoDoRegime('24HS-D'), { tipo: '4x4', letra: 'D' });
    assert.deepEqual(escala.grupoDoRegime('ADM'), { tipo: 'ADM', letra: null });
    assert.deepEqual(escala.grupoDoRegime('16HS-5X2'), { tipo: '16H', letra: null });
    assert.deepEqual(escala.grupoDoRegime('Misto'), { tipo: null, letra: null });
});

test('mês de outubro/2026 tem 31 dias e marca o feriado', () => {
    const dias = escala.mes(2026, 10, cfg, feriados);
    assert.equal(dias.length, 31);
    assert.equal(dias[11].feriado.nome, 'Nossa Senhora Aparecida');
    assert.equal(dias[13].numero, 14);
    assert.equal(dias[13].dia, 'A');
});
