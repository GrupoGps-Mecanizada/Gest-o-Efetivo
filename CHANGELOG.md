# CHANGELOG — Gestão de Efetivo

## v2.10.0 — 2026-10-22
### Mudou
- **Matriz numa aba só** (pedido do dono, P-115, opção B): uma linha por pessoa com **COLABORADOR, STATUS, REGIME, LETRA e SUPERVISOR**, em ordem alfabética.
- Quem não está trabalhando tem a **linha inteira pintada**: férias em azul (com o dia da volta), atestado em laranja, sobra em cinza, em aviso em vermelho. Desligados e inativos não aparecem.
- Regime e letra saem do regime gravado ("4X4-A" vira 4x4 · A); a turma "16 HORAS" aparece como regime 16 HORAS, sem supervisor.
- A Matriz virou uma **tabela igual à do SST**: cada coluna tem o menu do Excel (**Classificar de A a Z / de Z a A / por Cor**, Remover classificação, Limpar Filtro, Filtrar por Cor, Filtros de Texto, Pesquisar, Selecionar Tudo, OK/Cancelar). Cabeçalho fixo ao rolar, contagem "X de Y pessoas" e botão "Limpar filtros".
- Clique seleciona a linha (Ctrl e Shift somam); dois cliques abrem o colaborador.
- O Exportar Excel e o Imprimir saem como a tabela está (filtrada e classificada), com as cores. Cores próprias no tema escuro.
- A planilha Univer (12 MB) não é mais baixada: a Matriz abre na hora.
### Saiu
- As abas RELAÇÃO, GERAL, uma por supervisor (placas), TURNO 16HRS, FÉRIAS, SOBRA e ATESTADO.
- A barra da planilha Univer (desfazer, fórmulas, zoom).
- Nas Ferramentas da Matriz, a seção **Vagas** (Adicionar/Remover vaga), que só servia para as abas de placas.

## v2.9.1 — 2026-10-16
### Mudou
- O botão **Movimentar** (v2.9.0) foi **retirado** a pedido do dono: mexer nas pessoas volta a ser como na v2.8.0.
- Fica: quem **não é editor** só consulta (os botões de editar somem), mesmo sendo Gestor ou Administrador. É a mesma regra que o banco já aplica (P-035, etapa 2).

## v2.8.0 — 2026-10-15
### Mudou
- **Login novo da Central** (`SGE.acesso.entrar` do sge-core) no lugar do `sso_client.js`. O sistema só abre com a sessão real de quem entrou; sem ela, vai para o login da Central. Erro de rede não deixa entrar ("Não consegui conferir").
- O banco passa a ser lido e gravado **com a sessão da pessoa** (uma conexão só, a mesma do login). Antes, quem tinha só o "crachá" antigo lia como anônimo. É o passo que permite fechar a leitura sem login das tabelas gps_mec.
- O nível vem da régua única: Administrador → ADM, Gestor → GESTAO, os outros → VISAO.
### Saiu
- Login local (com "Criar uma conta"), o botão DEV e o `sge-session-ping.js` (o radar da Central agora vem do sge-core).

## v2.7.0 — 2026-10-14
### Novo
- Tela **Turnos** (menu Efetivo › Turnos):
  - **Quem está de turno agora**: a letra do 4x4 (de dia, das 06:40 às 18:40, ou de noite, das 18:40 às 06:40) e o supervisor dela, se o ADM está em expediente (07:00 às 16:48) e qual turno do 16 horas está trabalhando (06:40 às 14:40 e 14:40 às 22:40). Atualiza a cada minuto.
  - **Quem estava de turno em**: escolha data e hora para saber a letra e o supervisor daquele momento. A noite que passa da meia-noite conta para o dia em que começou.
  - **Escala dos supervisores**: mostra se cada um está de dia, de noite, de folga ou em expediente ADM. Supervisor sem regime definido fica em destaque.
  - **Calendário das letras** do mês (letra do dia em cima e da noite embaixo), com os feriados marcados.
  - **Feriados**: lista e cadastro (quem tem perfil de gestão). ADM e 16 horas não trabalham em feriado. O 4x4 segue a escala.
  - **Histórico dos supervisores**: toda troca de letra, regime, nome ou ativo fica gravada com quem mudou e quando.
- Cálculo da escala em `js/escala.js` (4x4: 2 dias + 2 noites + 4 folgas, ordem A → D → B → C, referência 13/10/2026 = A de dia), com 10 testes (`node --test tests/escala.test.js`).
- Banco: `sql/2026-10-14_escala_e_turnos.sql` (escala e feriados na tabela de configurações, tabela `efetivo_gps_mec_supervisores_historico` com gatilho, 16 HORAS passa a 16HS-5X2). Para desfazer: `sql/voltar/2026-10-14_escala_e_turnos_voltar.sql`. Antes de rodar o SQL, a tela usa a escala padrão do código e avisa que o histórico ainda não existe.

## v2.6.0 — 2026-10-09
### Mudou
- A barra de cima agora é a **Barra Universal do SGE** (sge-core): mesmos menus (Início, Efetivo, Configurações), busca que leva à Pesquisa, tema, foto e Sair. Dentro do Portal SGE aparece **uma barra só** (antes eram duas) e o logo SGE troca de sistema.
- O visual do sge-core passa a vir do endereço certo (`/sge-core-/v1/`; o antigo dava erro 404).
- Sem o sge-core (ex.: falha ao baixar), a barra antiga continua funcionando.

## v2.5.2 — 2026-10-08
### Mudou
- Quem tem supervisor mas **não tem placa** aparece na **aba do supervisor**, numa linha sem placa no fim, como na planilha (antes caía em SOBRA). A aba **SOBRA** agora é só de quem está **sem supervisor**.
- Mover: a opção "Sem equipamento" explica que a pessoa fica na aba do supervisor; para mandar para a SOBRA, escolha SEM SUPERVISOR.

## v2.5.1 — 2026-10-08
### Corrigido
- Veículo com duas equipes (AV 02, AP 07 e AV 07) aparece em linhas separadas **"EQUIP 1"** e **"EQUIP 2"**, como na planilha. No banco são vagas próprias (equipamento "AV 02 - EQUIP 1" etc.); o nome mostra só o 1º traço como espaço ("AV 02 - EQUIP 1"). Script do banco: equipes-1-e-2-2026-10-08.local.sql (fora do GitHub, tem nomes).

## v2.5.0 — 2026-10-08
### Novo
- **Vagas** (tabela nova gps_mec.efetivo_gps_mec_vagas, só com login): cada linha da aba de um supervisor é uma vaga (supervisor + equipamento) e aparece mesmo vazia. Carga inicial com os 56 pares em uso hoje. SQL em sql/2026-10-08_vagas_por_supervisor.sql.
- Ferramentas da Matriz › **Adicionar vaga** e **Remover vaga vazia** (já vem o supervisor da aba aberta).
- **Mover** pergunta o **equipamento (vaga) de destino**: vagas do supervisor primeiro, depois os outros equipamentos ou "sem equipamento (sobra)". Dá para trocar só de equipamento dentro do mesmo supervisor. A pessoa cai na coluna certa pela função (motorista ou operador). O equipamento escolhido vira vaga do supervisor.

### Mudou
- **Cadastro é do SST**: no Efetivo só se muda supervisor, equipamento, regime e status. Nome, função, CR, categoria, telefone e matrículas ficam só para leitura; saem Novo colaborador, Matrículas pendentes e Excluir. Edição em massa só de regime, supervisor e status.

### Corrigido
- Editar alguém em equipamento sem número (MT, CJ) apagava o equipamento.

## v2.4.2 — 2026-10-08
### Corrigido
- Aba **TURNO 16HRS** agora reúne quem está no cadastro "16 HORAS" (como na planilha), e não mais pelo regime, que nem sempre está preenchido.
- **Encarregados** contam como Supervisores no resumo (antes podiam cair em SOBRA).

## v2.4.1 — 2026-10-08
### Mudou
- A Matriz sempre abre na aba **GERAL** (ao entrar no sistema e ao voltar de outra tela). Quando os dados se atualizam sozinhos, a aba que você está vendo não muda.
- Saiu o botão flutuante de ajuda (chamados do SGE Central), que ficava por cima dos botões do rodapé.

## v2.4.0 — 2026-10-08
### Mudou
- **Painel do colaborador igual ao do SST**: gaveta à direita com abas (Cadastro · Alocação · Férias · Movimentações · Alterações) e os dados em tabelas rótulo | valor. Largura ajustável (arrastar a borda ou botão expandir), Esc fecha, ações Excluir · Mover · Editar no rodapé.
- Barra de cima sem os botões **Exportar**, **Ecossistema** e **Filtros**. Os filtros continuam nas Ferramentas da Matriz.

### Saiu
- Telas de exportação antiga e do Ecossistema (export.js, hub.js) e a biblioteca SheetJS, que só elas usavam.

## v2.3.0 — 2026-10-08
### Corrigido
- **Nitidez da planilha**: com o Windows ampliado (125%, 150%) a área de desenho caía numa fração de pixel e o navegador borrava. Agora cada desenho é alinhado ao pixel exato da tela (também ao mudar o zoom).

### Novo
- Abas da Matriz na cor azul da planilha original (#0070C0), também no Excel exportado.

### Saiu
- **Treinamentos e Advertências** (menu Segurança, telas, abas Capacitação e Disciplinar do Painel, opções do Exportar e vínculo de treinamento em massa): já são controlados em outro sistema. Ao excluir um colaborador, os registros antigos dele nessas tabelas continuam sendo apagados do banco.

## v2.2.0 — 2026-10-08
### Novo
- Aba **RELAÇÃO DE EFETIVOS MECANIZADA** (primeira aba, como na planilha): título "EFETIVO MECANIZADA", contagem por função (motorista, operador, coordenador, técnico de segurança, mecânico, planejador, almoxarife, feristas, estagiário, sobra, supervisores) com o total, e a tabela SUPERVISORES · MOTORISTA · OPERADOR.
- Aba própria **TURNO 16HRS 7H AS 15H** para quem trabalha no regime 16HS (sai da aba do supervisor).

### Mudou
- Funções de apoio (coordenador, técnico de segurança, mecânico, planejador, almoxarife, estagiário, supervisor) não entram mais em SOBRA: aparecem na GERAL com a função e são contadas no resumo.
- No resumo, ATESTADO e OUTRAS FUNÇÕES só aparecem quando há alguém (assim o total fecha com o quadro).

## v2.1.0 — 2026-10-08
**Matriz no formato da planilha "EFETIVOS MECANIZADA".**

### Mudou
- A Matriz agora tem abas, como a planilha:
  - **GERAL**: Nome Colaborador · Supervisor / Status · Equipamento (mesma ordem da fórmula da planilha).
  - **Uma aba por supervisor**: título "EQUIPE …" e uma linha por equipamento: PLACA · MOTORISTA · OPERADOR 1 · OPERADOR 2.
  - **FÉRIAS** (com o mês), **SOBRA** (ativo sem supervisor ou sem equipamento) e **ATESTADO** (afastados).
- Mesmo visual da planilha: título e cabeçalho azul-escuros, fonte Century Gothic, bordas da tabela.
- Exportar Excel gera todas as abas nesse formato (com título mesclado e cabeçalho congelado).
- Dois cliques em qualquer nome (em qualquer aba) abrem o colaborador.

### Saiu
- Colunas Avisos, Treinamentos e Advertências; opções "Só pendências", "Cores" e "Colunas" (o formato agora é fixo).
- Desligados e inativos não aparecem na Matriz.

### Segurança
- `.gitignore` novo: planilhas (.xlsx/.xls/.csv) e .env nunca vão para o GitHub.

## v2.0.0 — 2026-10-08
**Mudança grande: Matriz modelo Excel e layout do SST.**

### Novo
- **Matriz** (Efetivo › Matriz): a mesma planilha estilo Excel da Matriz do SST (Univer 1.0.3, código aberto).
  Filtro no cabeçalho, Ctrl+F, cores, Excel e Imprimir "como está na tela", Resetar, tela cheia.
  É só para ver e pesquisar: dois cliques na linha abrem o colaborador; em Treinamentos ou Advertências, a lista dele.
- Botão **Ferramentas** no canto da planilha: buscar, filtros, só pendências, cores (todas/pendências),
  colunas (ordem e o que aparece, salvo por login neste navegador), exportar, imprimir e ações na seleção
  (abrir, mover, editar, edição em massa, treinamento em massa).
- Coluna **Avisos**: sem ID, sem supervisor, sem alocação, treinamento vencido ou a vencer.
- **Layout do SST** em todo o sistema: barra superior escura com menu por assunto
  (Início · Efetivo · Segurança · Configurações), submenus explicados, menu lateral no celular.
  Cores e fonte do sge-core (`css/tema-sst.css`).

### Saiu
- Telas **Kanban**, **Tabela**, **Grupo** e **Alocações** (a Matriz substitui). Links antigos (#kanban, #tabela…) abrem a Matriz.
- Abas de baixo da barra (Gestão/Segurança): viraram os submenus da barra.

### Técnico
- Pacote da planilha em `vendor/univer/` (gerado com `scripts/univer-entrada.js`, ver o arquivo).
  Baixa só quando o navegador fica ocioso ou quando a Matriz abre.
- Excel da Matriz com ExcelJS 4.4.0 (jsDelivr), carregado só ao exportar.
- `js/equip.js` ficou só com as funções de apoio (código do equipamento e turno).
