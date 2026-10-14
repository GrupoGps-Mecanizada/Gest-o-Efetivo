'use strict';

/**
 * SGE — Escala de turnos (cálculo puro, sem tela)
 * 4x4: 2 dias + 2 noites + 4 folgas, ciclo de 8 dias a partir de uma data de referência.
 * ADM e 16 horas: dias da semana fixos, sem trabalho em feriado.
 * Regra oficial: cofre › 7 - Setores › Regimes, turnos e supervisores.md
 */
(function (raiz) {
    const SGE = raiz.SGE = raiz.SGE || {};

    const PADRAO = {
        ciclo_4x4: {
            referencia: '2026-10-13',
            ordem_dia: ['A', 'D', 'B', 'C'],
            dias_por_bloco: 2,
            dia: { inicio: '06:40', fim: '18:40' },
            noite: { inicio: '18:40', fim: '06:40' }
        },
        adm: { dias_semana: [1, 2, 3, 4, 5], inicio: '07:00', fim: '16:48', trabalha_feriado: false },
        '16h': {
            dias_semana: [1, 2, 3, 4, 5],
            turnos: [
                { nome: '1º turno', inicio: '06:40', fim: '14:40' },
                { nome: '2º turno', inicio: '14:40', fim: '22:40' }
            ],
            trabalha_feriado: false
        }
    };

    const UM_DIA = 86400000;

    function minutos(hhmm) {
        const [h, m] = String(hhmm).split(':').map(Number);
        return h * 60 + (m || 0);
    }

    function dataISO(d) {
        const p = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    }

    // dias inteiros entre duas datas 'AAAA-MM-DD' (sem fuso: conta pelo calendário)
    function diasEntre(deISO, ateISO) {
        const [a1, m1, d1] = deISO.split('-').map(Number);
        const [a2, m2, d2] = ateISO.split('-').map(Number);
        return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / UM_DIA);
    }

    function modulo(n, m) {
        return ((n % m) + m) % m;
    }

    function diaAnterior(iso) {
        const [a, m, d] = iso.split('-').map(Number);
        return dataISO(new Date(a, m - 1, d - 1));
    }

    function diaDaSemana(iso) {
        const [a, m, d] = iso.split('-').map(Number);
        return new Date(a, m - 1, d).getDay();
    }

    SGE.escala = {
        PADRAO,
        dataISO,

        config() {
            const cfg = SGE.CONFIG && SGE.CONFIG.escala;
            return cfg && cfg.ciclo_4x4 ? cfg : PADRAO;
        },

        feriados() {
            const lista = SGE.CONFIG && SGE.CONFIG.feriados;
            return Array.isArray(lista) ? lista : [];
        },

        feriadoDe(iso, feriados = this.feriados()) {
            return feriados.find(f => f.data === iso) || null;
        },

        /** Letra de dia, de noite e de folga num dia do calendário ('AAAA-MM-DD'). */
        letrasDoDia(iso, cfg = this.config()) {
            const c = cfg.ciclo_4x4;
            const ordem = c.ordem_dia;
            const porBloco = c.dias_por_bloco || 2;
            const n = diasEntre(c.referencia, iso);
            const bloco = modulo(Math.floor(n / porBloco), ordem.length);
            const dia = ordem[bloco];
            const noite = ordem[modulo(bloco - 1, ordem.length)];
            return {
                dia,
                noite,
                folga: ordem.filter(l => l !== dia && l !== noite),
                vezDaLetra: modulo(n, porBloco) + 1 // 1º ou 2º dia/noite seguido
            };
        },

        /** Situação da letra num dia: 'dia', 'noite' ou 'folga'. */
        situacaoDaLetra(letra, iso, cfg = this.config()) {
            const l = this.letrasDoDia(iso, cfg);
            if (l.dia === letra) return 'dia';
            if (l.noite === letra) return 'noite';
            return 'folga';
        },

        /**
         * Quem está de turno num momento (Date). A noite que passa da meia-noite
         * pertence ao dia em que começou.
         */
        turnoEm(momento, cfg = this.config(), feriados = this.feriados()) {
            const hoje = dataISO(momento);
            const agora = momento.getHours() * 60 + momento.getMinutes();
            const c = cfg.ciclo_4x4;

            let periodo, diaDoTurno;
            if (agora >= minutos(c.dia.inicio) && agora < minutos(c.dia.fim)) {
                periodo = 'dia'; diaDoTurno = hoje;
            } else if (agora >= minutos(c.noite.inicio)) {
                periodo = 'noite'; diaDoTurno = hoje;
            } else {
                periodo = 'noite'; diaDoTurno = diaAnterior(hoje);
            }
            const letras = this.letrasDoDia(diaDoTurno, cfg);
            const quatroPorQuatro = {
                periodo,
                diaDoTurno,
                letra: periodo === 'dia' ? letras.dia : letras.noite,
                vezDaLetra: letras.vezDaLetra,
                inicio: c[periodo].inicio,
                fim: c[periodo].fim
            };

            const feriado = this.feriadoDe(hoje, feriados);
            const semana = momento.getDay();
            const diaUtil = r => r.dias_semana.includes(semana) && (r.trabalha_feriado || !feriado);

            const adm = cfg.adm;
            const admTrabalhando = diaUtil(adm) && agora >= minutos(adm.inicio) && agora < minutos(adm.fim);

            const dezesseis = cfg['16h'];
            const turno16 = diaUtil(dezesseis)
                ? dezesseis.turnos.find(t => agora >= minutos(t.inicio) && agora < minutos(t.fim)) || null
                : null;

            return {
                quatroPorQuatro,
                adm: { trabalhando: admTrabalhando, inicio: adm.inicio, fim: adm.fim },
                dezesseis: { turno: turno16 },
                feriado
            };
        },

        /** Grupo da escala pelo regime gravado: { tipo: '4x4'|'ADM'|'16H'|null, letra }. */
        grupoDoRegime(regime) {
            const r = String(regime || '').toUpperCase().replace(/\s+/g, '');
            const m = r.match(/^(?:4X4-?|24HS-?)([ABCD])$/);
            if (m) return { tipo: '4x4', letra: m[1] };
            if (r.startsWith('ADM')) return { tipo: 'ADM', letra: null };
            if (r.startsWith('16H')) return { tipo: '16H', letra: null };
            return { tipo: null, letra: null };
        },

        /** Dias de um mês (mes de 1 a 12) com as letras e se é feriado/fim de semana. */
        mes(ano, mes, cfg = this.config(), feriados = this.feriados()) {
            const total = new Date(ano, mes, 0).getDate();
            const dias = [];
            for (let d = 1; d <= total; d++) {
                const iso = dataISO(new Date(ano, mes - 1, d));
                dias.push({
                    iso,
                    numero: d,
                    semana: diaDaSemana(iso),
                    feriado: this.feriadoDe(iso, feriados),
                    ...this.letrasDoDia(iso, cfg)
                });
            }
            return dias;
        }
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = SGE.escala;
})(typeof window !== 'undefined' ? window : globalThis);
