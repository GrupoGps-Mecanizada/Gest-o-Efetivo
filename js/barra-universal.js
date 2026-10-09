/**
 * Barra Universal do SGE (sge-core) no lugar da barra própria: uma barra só, igual em todos os sistemas.
 * Mesmos menus da barra antiga (Início, Efetivo, Configurações) e a busca vai para a Pesquisa.
 * Sem o sge-core (ex.: sem internet para baixar), a barra antiga continua.
 */
(function () {
    'use strict';
    if (!window.SGE || !SGE.barra || !SGE.navigation) return;

    const app = document.getElementById('app');
    if (!app) return;
    document.documentElement.classList.add('com-barra-universal');

    const ir = (tela) => SGE.navigation.switchView(tela);
    const dentroDoPortal = !!SGE.barra._acharPortal();

    const barra = SGE.barra.montar({
        sistema: 'gestao_efetivo_mec',
        nome: 'Gestão de Efetivo',
        area: 'Mecanizada',
        inicio: '#viz',
        alvo: app, // dentro da coluna do sistema, no lugar da barra antiga (sem rolagem a mais)
        secoes: [
            { rotulo: 'Início', icone: 'home', href: '#viz', texto: 'Visão geral do efetivo' },
            {
                rotulo: 'Efetivo', icone: 'users', texto: 'Consultar e organizar o quadro de pessoas', itens: [
                    { rotulo: 'Matriz', texto: 'Planilha do efetivo, igual ao Excel', href: '#matriz', icone: 'clipboard', grupo: 'Quadro' },
                    { rotulo: 'Pesquisa', texto: 'Achar alguém por nome, ID ou supervisor', href: '#search', icone: 'search', grupo: 'Quadro' },
                    { rotulo: 'Férias', texto: 'Quem está e quem vai sair de férias', href: '#ferias', icone: 'calendar', grupo: 'Acompanhamento' },
                    { rotulo: 'Histórico', texto: 'Movimentações entre supervisores', href: '#history', icone: 'clock', grupo: 'Acompanhamento' },
                ],
            },
            { rotulo: 'Configurações', icone: 'settings', href: '#settings', texto: 'Regras do sistema, cadastros e dados' },
        ],
        atual: () => '#' + ((SGE.state && SGE.state.activeView) || 'viz'),
        aoNavegar: (href) => ir(href.slice(1)),
        // Ctrl+K e a lupa: abrem a Pesquisa de colaboradores
        aoBuscar: () => {
            ir('search');
            setTimeout(() => { const campo = document.getElementById('search-input'); if (campo) campo.focus(); }, 30);
        },
        // Dentro do portal, Sair sai do portal inteiro (a barra cuida disso); fora dele, o logout do sistema.
        aoSair: dentroDoPortal ? undefined : () => SGE.auth.logout(),
    });

    // Tela trocada por outro caminho (botões da própria página): a barra acompanha.
    const trocarTela = SGE.navigation.switchView.bind(SGE.navigation);
    SGE.navigation.switchView = function () {
        const r = trocarTela.apply(null, arguments);
        barra.atualizar();
        return r;
    };

    // Tema da barra = tema do sistema.
    window.addEventListener('sge:tema', (ev) => {
        const escuro = ev.detail && ev.detail.tema === 'escuro';
        const atual = document.documentElement.getAttribute('data-theme') === 'dark';
        if (escuro !== atual && SGE.darkMode) SGE.darkMode.toggle();
    });
})();
