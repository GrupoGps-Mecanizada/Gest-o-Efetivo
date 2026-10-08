# CHANGELOG — Gestão de Efetivo

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
