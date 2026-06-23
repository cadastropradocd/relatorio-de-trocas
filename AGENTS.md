# Relatório de Trocas Diário

## Stack Obrigatória

- React 18 + TypeScript strict mode
- Vite 5
- Firebase (Firestore NoSQL) - auth customizado, sem Firebase Auth
- Vitest + React Testing Library + MSW
- CSS Modules puro (sem Tailwind, sem styled-components)
- Chart.js + react-chartjs-2
- react-router-dom v6
- html-to-image (export PNG)

## Objetivo

Dashboard para controle de **trocas diárias** em estabelecimentos comerciais.
O time comercial lança diariamente o **realizado** de cada departamento/setor.
O sistema compara contra a **meta mensal** definida pelo admin.

## Regra de Negócio Fundamental

Meta é o **limite máximo** (não é objetivo a ser superado).

- Realizado **> Meta** = RUIM (vermelho) — estourou o limite
- Realizado **< Meta** = BOM (verde) — dentro do limite
- Realizado **= Meta** = NEUTRO (amarelo) — no limite

Isso se aplica a:
- Cores das barras no gráfico
- Badges de percentual na tabela
- Cards de KPI (Diferença, Atingimento)
- Toda e qualquer indicação visual de status

## Arquitetura

```
src/
  app/           → Providers (Auth, Toast) e Router
  modules/       → Features independentes
    auth/        → Login, ProtectedRoute, authService
    dashboard/   → Lançamento diário (página principal)
    history/     → Histórico de dias anteriores
    reports/     → Relatórios por período com gráficos
    users/       → CRUD de usuários (admin)
    departamentos/ → CRUD de departamentos/metas (admin)
  shared/
    components/  → Componentes reutilizáveis
    hooks/       → Custom hooks compartilhados
    services/    → Firebase init, serviços
    types/       → Interfaces e tipos globais
    utils/       → Funções puras (formatters, setores, logger)
    styles/      → Design system (variáveis CSS, classes base)
  test/          → Setup, mocks, testes unitários
```

## Convenções de Código

- **Componentes**: React.FC com arrow functions, export nomeado
- **Arquivos**: PascalCase para componentes, camelCase para utils/hooks/services
- **CSS**: Modules (`.css`) junto com o componente, classes BEM-like
- **Hooks**: Prefixo `use`, retornam objeto tipado
- **Utils**: Funções puras, sem efeitos colaterais, sem classes
- **Serviços**: Funções assíncronas que chamam Firestore
- **Tipos**: Centralizados em `shared/types/`, interfaces com prefixo opcional
- **Cores**: Usar `status-positivo` (verde/bom) e `status-negativo` (vermelho/ruim) do design system

## Auth Customizado

- Uso interno do time — **sem Firebase Auth**
- Hash SHA-256 (sem salt) armazenado no Firestore
- Sessão em localStorage com expiração de 24h
- Roles: `admin` | `user`
- Admin gerencia departamentos, metas e usuários
- User só lança valores no dashboard

## Padrões de UI/UX

- Dark mode fixo
- Grid de KPIs no topo (4 colunas)
- Tabela com edição inline (Enter salva)
- DataTable compartilhado com sort, readonly mode
- Gráfico BarChart com cores condicionais
- Loading skeletons (SkeletonKPI, SkeletonTable)
- Empty states com CTA claro
- Feedback visual com Toast (success/error)
- Responsivo (mobile: sidebar vira drawer)
