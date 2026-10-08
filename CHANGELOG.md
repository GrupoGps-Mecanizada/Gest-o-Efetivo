# CHANGELOG — Gestão de Efetivo

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
