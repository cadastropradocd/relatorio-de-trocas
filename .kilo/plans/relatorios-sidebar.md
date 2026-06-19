# Plano: Tela de Relatorios + Sidebar Colapsavel + Remover Card de Desempenho

## Resumo

1. Remover o card "DESEMPENHO POR SETOR" (grafico de barras) da tela de Dashboard
2. Criar uma Sidebar colapsavel a esquerda com navegacao (Dashboard, Relatorios, Historico, Sair)
3. Criar tela de Relatorios com grafico historico e comparacao de periodos com datas customizadas
4. Mover botoes de acao (Zerar, Sair) do Header para a Sidebar

## Arquivos a modificar

| Arquivo | Acao |
|---------|------|
| src/components/Sidebar/Sidebar.tsx | **Novo** Sidebar colapsavel |
| src/components/Sidebar/Sidebar.css | **Novo** Estilos da sidebar |
| src/components/Sidebar/index.ts | **Novo** Barrel export |
| src/pages/Reports/Reports.tsx | **Novo** Tela de relatorios |
| src/pages/Reports/Reports.css | **Novo** Estilos da tela de relatorios |
| src/pages/Reports/index.ts | **Novo** Barrel export |
| src/pages/Dashboard/Dashboard.tsx | Remover section chart-section (linhas 222-229) + import BarChart |
| src/components/Header/Header.tsx | Simplificar — remover botoes Sair e Zerar (agora na sidebar) |
| src/App.tsx | Adicionar rota /relatorios, incluir Sidebar no layout |
| src/pages/index.ts | Adicionar export do Reports |

## Detalhes de implementacao

### 1. Sidebar (src/components/Sidebar/)

Sidebar colapsavel a esquerda com:
- Versao expandida: icone + texto do link
- Versao recolhida: apenas icone
- Toggle para expandir/recolher
- Itens: Dashboard (icone home), Relatorios (icone chart), Historico (icone clock), Sair (icone logout)
- Active state baseado na rota atual
- Largura: 240px expandida / 64px recolhida

### 2. Remover DESEMPENHO POR SETOR do Dashboard

Remover as linhas 222-229 de Dashboard.tsx (chart-section com BarChart).
Remover import do BarChart e CSS relacionado (.chart-section).

### 3. Header simplificado

Remover do Header:
- Botao X Zerar → move para Sidebar
- Botao Sair → move para Sidebar

O Header fica so com: titulo, badge de data, e botao Salvar imagem.

### 4. Tela de Relatorios (src/pages/Reports/)

Layout:
- Filtros no topo: dois date inputs (data inicial e data final) + botao Gerar relatorio
- KPIs do periodo: total realizado, total meta, diferenca do periodo selecionado
- Grafico de barras: realizado vs meta por dia no periodo selecionado
- Tabela comparativa: dados diarios do periodo (data, realizado, meta, diferenca, status)

### 5. Rota e Layout (App.tsx)

Layout com Sidebar fixa a esquerda + conteudo a direita:
- /login → Sem sidebar
- /dashboard/:date → Sidebar + Dashboard
- /relatorios → Sidebar + Reports
- /history → Sidebar + History
