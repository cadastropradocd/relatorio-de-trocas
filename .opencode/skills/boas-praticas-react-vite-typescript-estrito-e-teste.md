# SKILL — React + Vite + TypeScript Strict + Firebase Firestore

## Objetivo

Esta skill define padrões obrigatórios para desenvolvimento profissional utilizando:

* React
* Vite
* TypeScript Strict
* Firebase
* Firestore
* Firebase Authentication
* Firebase Storage
* Cloud Functions
* Vitest
* React Testing Library
* Playwright

O objetivo é produzir código:

* escalável
* previsível
* testável
* seguro
* performático
* facilmente mantido

---

# PRINCÍPIOS FUNDAMENTAIS

## Sempre priorizar

1. Type Safety
2. Segurança
3. Legibilidade
4. Testabilidade
5. Performance
6. Escalabilidade

Nunca sacrificar os itens acima por conveniência.

---

# TYPESCRIPT

## Configuração obrigatória

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "useUnknownInCatchVariables": true
  }
}
```

---

## Proibido

```ts
any
```

Exceto quando impossível evitar integração externa.

Nesse caso:

```ts
unknown
```

deve ser preferido.

---

## Sempre tipar

Props

```ts
interface UserCardProps {
  user: User;
}
```

Retornos

```ts
function calculateTotal(): number {}
```

Hooks

```ts
function useAuth(): AuthContext {}
```

Eventos

```ts
const onClick = (
  event: React.MouseEvent<HTMLButtonElement>
) => {}
```

---

## Nunca usar

```ts
as any
```

---

## Preferir

```ts
satisfies
```

quando possível.

Exemplo:

```ts
const routes = {
  home: "/",
  users: "/users"
} satisfies Record<string, string>;
```

---

# ESTRUTURA DE PASTAS

```txt
src/

  app/
    router/
    providers/

  modules/

    users/

      components/
      pages/
      hooks/
      services/
      repositories/
      types/
      schemas/
      tests/

  shared/

    components/
    hooks/
    services/
    utils/
    constants/
    types/

  firebase/

  test/
```

---

# ARQUITETURA

Separar claramente:

## UI

Componentes React.

## Hooks

Lógica de interface.

## Services

Casos de uso.

## Repositories

Acesso ao Firestore.

---

Exemplo:

```txt
Page
 ↓
Hook
 ↓
Service
 ↓
Repository
 ↓
Firestore
```

---

# FIREBASE

## Nunca acessar Firestore diretamente na UI

Errado:

```ts
const snapshot = await getDocs(...)
```

dentro do componente.

---

Correto:

```ts
UserRepository
```

↓

```ts
UserService
```

↓

```ts
useUsers()
```

↓

```tsx
UsersPage
```

---

# FIRESTORE

## Modelagem

Sempre modelar para leitura.

Não modelar como banco relacional.

---

## Evitar

```txt
users
  posts
    comments
```

profundamente aninhado.

---

Preferir:

```txt
users
posts
comments
```

coleções independentes.

---

# DOCUMENTOS

Manter documentos pequenos.

Ideal:

```txt
1KB–20KB
```

Evitar:

```txt
>100KB
```

---

# IDs

Preferir IDs automáticos.

```ts
addDoc()
```

ou UUID.

Nunca IDs previsíveis.

---

# SCHEMAS

Usar Zod.

```ts
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email()
});
```

Validar:

* Firestore
* API
* Forms
* Functions

---

# SECURITY RULES

Toda coleção deve possuir regras explícitas.

Nunca:

```txt
allow read, write: if true;
```

---

Exemplo:

```txt
match /users/{userId} {
  allow read, write:
    if request.auth.uid == userId;
}
```

---

# REPOSITORIES

Responsabilidade única:

CRUD.

Exemplo:

```ts
class UserRepository {
  create()
  update()
  delete()
  findById()
}
```

Sem lógica de negócio.

---

# SERVICES

Responsáveis por:

* validações
* regras
* autorização
* transformações

---

# COMPONENTES

Preferir componentes pequenos.

Meta:

```txt
< 200 linhas
```

Máximo aceitável:

```txt
300 linhas
```

---

# CUSTOM HOOKS

Mover lógica complexa para hooks.

Exemplo:

```ts
useAuth()
useUsers()
useUserProfile()
```

---

# REACT

## Evitar

```tsx
useEffect(() => {
  fetch()
}, [])
```

para gerenciamento de dados complexos.

---

Preferir abstração:

```ts
useUsers()
```

---

# ESTADO

## Local

```ts
useState
```

---

## Compartilhado

```ts
Context
```

somente quando necessário.

---

## Servidor

Dados Firebase nunca devem ser duplicados sem necessidade.

---

# PERFORMANCE

## Sempre

memoização somente quando existir gargalo comprovado.

Não usar:

```tsx
useMemo
useCallback
```

preventivamente.

---

# ERROS

Criar classe específica.

```ts
class AppError extends Error {
  code: string;
}
```

---

Nunca:

```ts
throw "Erro";
```

---

# LOGGING

Centralizar logs.

```ts
logger.info()
logger.error()
```

---

Nunca:

```ts
console.log()
```

em produção.

---

# TESTES

Cobertura mínima:

```txt
80%
```

Objetivo:

```txt
90%+
```

---

# STACK DE TESTES

Unitários

* Vitest

Componentes

* React Testing Library

Integração

* Firebase Emulator Suite

Rules

* @firebase/rules-unit-testing

E2E

* Playwright

Esta combinação é amplamente recomendada para aplicações React/Firebase modernas.

---

# PIRÂMIDE DE TESTES

70%

Unitários

20%

Integração

10%

E2E

---

# TESTES UNITÁRIOS

Testar:

* utils
* hooks
* services
* validações

Exemplo:

```ts
describe("calculateDiscount", () => {
  it("should apply discount")
})
```

---

# TESTES DE COMPONENTES

Validar comportamento.

Nunca implementação.

Ruim:

```ts
expect(state).toBe(...)
```

Bom:

```ts
expect(screen.getByText(...))
```

---

# TESTES DE HOOKS

```ts
renderHook()
```

Validar:

* loading
* success
* error

---

# FIRESTORE RULES TESTING

Obrigatório.

Utilizar:

```ts
@firebase/rules-unit-testing
```

e

```txt
Firebase Emulator Suite
```

para validar permissões de leitura e escrita.

---

Exemplo:

```ts
assertSucceeds(...)
assertFails(...)
```

---

Validar:

* usuário autenticado
* usuário não autenticado
* acesso indevido
* acesso permitido

---

# TESTES DE INTEGRAÇÃO

Executar contra:

```txt
Firestore Emulator
Auth Emulator
Storage Emulator
```

Nunca contra produção.

---

# TESTES E2E

Playwright.

Fluxos críticos:

* login
* cadastro
* CRUD principal
* pagamentos
* logout

---

# ACESSIBILIDADE

Sempre:

```tsx
<label>
<button>
<nav>
<header>
<main>
```

semânticos.

---

Testar:

```ts
getByRole()
```

sempre que possível.

---

# CI/CD

Toda PR deve executar:

```txt
lint
typecheck
unit tests
integration tests
build
```

Falhou?

Não faz merge.

---

# ESLINT

Erros devem bloquear build.

---

# PRETTIER

Formatação automática obrigatória.

---

# DEPENDÊNCIAS

Antes de instalar:

Avaliar:

* manutenção
* popularidade
* segurança
* necessidade real

---

# SEGURANÇA

Nunca armazenar:

* secrets
* tokens administrativos
* service accounts

no frontend.

---

Nunca confiar no frontend.

Toda autorização pertence:

* Firestore Rules
* Cloud Functions

---

# CLOUD FUNCTIONS

Responsáveis por:

* operações privilegiadas
* integrações externas
* lógica crítica

Nunca expor segredos ao cliente.

---

# CÓDIGO LIMPO

Toda função deve:

* possuir nome claro
* ter uma responsabilidade
* ser facilmente testável

Meta:

```txt
< 30 linhas
```

---

# DEFINIÇÃO DE QUALIDADE

Código só é considerado pronto quando:

✓ TypeScript sem erros

✓ ESLint sem erros

✓ Build sem erros

✓ Testes passando

✓ Regras do Firestore testadas

✓ Cobertura adequada

✓ Sem duplicação

✓ Sem any desnecessário

✓ Sem console.log

✓ Sem acesso direto ao Firestore na UI

✓ Segurança validada

✓ Componentes pequenos

✓ Código revisável e previsível
