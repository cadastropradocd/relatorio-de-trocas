# Plano: Tela de Gerenciamento de Usuarios (Admin)

## Resumo

Criar tela de gerenciamento de usuarios com CRUD completo, acessivel apenas por admins.

## Funcionalidades

1. **Listar usuarios** — tabela com todos os usuarios do Firestore
2. **Criar usuario** — modal/form com email, senha, nome, role (admin/user)
3. **Editar usuario** — modal/form para alterar nome, email, role
4. **Excluir usuario** — confirmacao antes de deletar
5. **Protecao de rota** — sidebar link so aparece para admin, rota redireciona nao-admins

## Arquivos a modificar

| Arquivo | Acao |
|---------|------|
| src/services/userService.ts | **Novo** — CRUD de usuarios no Firestore |
| src/pages/Users/Users.tsx | **Novo** — Tela de gerenciamento |
| src/pages/Users/Users.css | **Novo** — Estilos |
| src/pages/Users/index.ts | **Novo** — Barrel export |
| src/components/Sidebar/Sidebar.tsx | Adicionar link "Usuarios" (so para admin) |
| src/App.tsx | Adicionar rota /usuarios |
| src/pages/index.ts | Adicionar export Users |

## Detalhes

### 1. userService.ts

Operacoes Firestore na collection `usuarios`:
- `getAllUsers()` — lista todos os usuarios
- `createUser(email, password, name, role)` — cria auth user + doc Firestore
- `updateUser(userId, data)` — atualiza doc Firestore
- deleteUser(userId)` — remove doc Firestore

### 2. Tela Users

Layout:
- Header com titulo "GERENCIAMENTO DE USUARIOS" e botao "Novo Usuario"
- Tabela com colunas: Nome, Email, Role, Criado em, Acoes (editar/excluir)
- Modal para criar/editar usuario
- Modal de confirmacao para excluir

### 3. Sidebar

Adicionar link "Usuarios" (icone de pessoa) entre "Historico" e "Zerar", so visivel se `user?.role === 'admin'`.

### 4. Protecao

- Sidebar: renderizar link condicionalmente
- App.tsx: rota `/usuarios` sem protecao server-side (nao e possivel sem Cloud Functions), mas redirecionamento no componente

### 5. Firestore Rules (manual)

Atualizar regras no Firebase Console para que admins possam gerenciar usuarios.
