# Relatório de Trocas Diário

Dashboard profissional para gerenciamento de lançamentos diários por departamento em estabelecimentos comerciais.

## Stack

- React 18 + TypeScript (strict mode)
- Vite 5
- Firebase (Auth + Firestore)
- Vitest + React Testing Library
- Design system dark mode

## Funcionalidades

- Dashboard com edição inline e salvamento manual
- Histórico de lançamentos com resumo
- Relatórios com gráficos por período
- Gerenciamento de departamentos e metas (admin)
- Gerenciamento de usuários (admin)
- Autenticação com Firebase Auth
- Firestore com regras de segurança e ownership
- Exportação como PNG
- Design responsivo

## Início Rápido

```bash
# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Firebase

# Execute
npm run dev
```

Acesse: http://localhost:5173

## Scripts

- `npm run dev` - Desenvolvimento
- `npm run build` - Produção
- `npm run test` - Testes
- `npm run typecheck` - Verificar tipos
- `npm run lint` - Lint
- `npm run format` - Formatar código

## Arquitetura

```
src/
  app/           → Providers e rotas
  modules/       → Feature modules (auth, dashboard, history, reports, users, departamentos)
  shared/        → Componentes, hooks, services, types, utils compartilhados
  test/          → Setup e mocks de teste
```

## Deploy Firebase

```bash
# Deploy rules e indexes
firebase deploy --only firestore:rules,firestore:indexes

# Deploy hosting
firebase deploy --only hosting
```
