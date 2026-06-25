# Relatorio de Trocas Diario

Dashboard para controle de trocas diarias em estabelecimentos comerciais.

## Stack

- React 18 + TypeScript strict mode
- Vite 5
- Firebase Firestore
- Auth customizada sem Firebase Auth
- Vitest + React Testing Library + MSW
- CSS Modules
- Chart.js + react-chartjs-2
- react-router-dom v6
- html-to-image para exportacao PNG

## Objetivo

O sistema registra o realizado diario por departamento e compara com a meta mensal definida pelo admin.

## Regra de negocio

Meta e limite maximo, nao objetivo a ser superado.

- Realizado maior que meta = ruim
- Realizado menor que meta = bom
- Realizado igual a meta = neutro

Essa regra se aplica a graficos, badges, KPIs e qualquer indicador visual.

## Funcionalidades

- Login com auth customizada
- Dashboard diario com edicao inline
- Historico de lancamentos
- Relatorios por periodo com graficos
- CRUD de departamentos e usuarios
- Exportacao do painel em PNG
- Design responsivo com dark mode

## Inicio rapido

```bash
npm install
cp .env.example .env
npm run dev
```

## Scripts

- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run format`

## Estrutura

```txt
src/
  app/        Providers e rotas
  modules/    Features por dominio
  shared/     Componentes, hooks, services, types, utils e estilos
  test/       Setup e testes
```

## Deploy Firebase

```bash
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only hosting
```
