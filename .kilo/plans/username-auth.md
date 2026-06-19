# Plano: Login por Usuario + Senha (sem email visivel)

## Problema

Firebase Auth requer email para criar/authenticar usuarios. O usuario quer apenas usuario + senha.

## Solucao

Usar um email interno fake `{username}@trocas.app` para o Firebase Auth, escondendo o email do usuario.
O campo `username` sera armazenado no Firestore e exibido na UI.

## Estrutura Firestore (atualizada)

```
usuarios/{uid}
  ├── username: string (NOVO - identificador visivel)
  ├── email: string (interno: username@trocas.app)
  ├── name: string
  ├── role: 'admin' | 'user'
  └── criado_em: timestamp
```

## Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| src/types/trocas.ts | Adicionar `username` na interface User |
| src/services/authService.ts | `signIn(username, password)` gera email fake internamente; `signUp(username, password, name)` igual |
| src/services/userService.ts | `CreateUserData.username` em vez de `email`; tabela mostra username |
| src/pages/Login/Login.tsx | Campo "Usuario" em vez de "Email" |
| src/pages/Users/Users.tsx | Form e tabela usam username em vez de email |
| src/context/AuthContext.tsx | Atualizar assinaturas de signIn/signUp |

## Fluxo

1. **Login**: usuario digita `joao` + senha → authService gera `joao@trocas.app` → Firebase Auth
2. **Cadastro**: admin cria usuario `maria` com senha → email interno `maria@trocas.app` → Firestore salva `username: maria`
3. **Tabela**: coluna mostra `username` em vez de `email`
