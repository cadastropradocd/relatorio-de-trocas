# 📊 Relatório de Trocas Diário

Dashboard moderno para gerenciamento de trocas/metas por setor em supermercados ou estabelecimentos comerciais.

**Tecnologias:** React 18 + TypeScript Estrito + Vite + Supabase + Chart.js

## ✨ Funcionalidades

- KPIs animados (Total Realizado, Meta Total, Diferença)
- Gráfico de barras interativo (Realizado vs Meta)
- Tabela editável com ordenação por coluna
- Autenticação de usuários
- Persistência na nuvem com Supabase
- Exportação como PNG
- Multi-usuário
- Design responsivo dark mode

## 🚀 Início Rápido

### 1. Configure o Supabase

1. Crie projeto em https://supabase.com/
2. Crie as tabelas (veja SQL no README estendido)
3. Ative RLS (Row Level Security)
4. Obtenha URL e Anon Key

### 2. Configure o Projeto

```bash
# Navegue para o diretório
cd PROJETO-TROCAS-REACT

# Copie variáveis de ambiente
cp .env.example .env

# Edite .env com suas credenciais
VITE_SUPABASE_URL=sua-url
VITE_SUPABASE_ANON_KEY=sua-key

# Instale dependências
npm install

# Execute
npm run dev
```

Acesse: http://localhost:5173

## 📂 Setores Padrão

- AÇOUGUE: R$ 3.000,00
- BAZAR/ELETRO/FLORES: R$ 5.000,00
- PETSHOP: R$ 2.000,00
- BEBIDAS: R$ 7.000,00
- FLC: R$ 18.000,00
- HIGIENE: R$ 3.500,00
- PADARIA: R$ 4.000,00
- LIMPEZA: R$ 3.500,00
- MERCEARIA: R$ 47.000,00

## 📝 SQL para Supabase

```sql
-- Tabela usuarios
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela trocas
CREATE TABLE trocas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data DATE NOT NULL,
  setores JSONB NOT NULL,
  total_realizado NUMERIC(12, 2) NOT NULL,
  total_meta NUMERIC(12, 2) NOT NULL,
  total_diferenca NUMERIC(12, 2) NOT NULL,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trocas_data ON trocas(data);
CREATE INDEX idx_trocas_usuario_id ON trocas(usuario_id);
```

## 🎯 Scripts

- `npm run dev` - Desenvolvimento
- `npm run build` - Produção
- `npm run typecheck` - Verificar tipos
- `npm run lint` - Lint

---

**Status:** ✅ Pronto para uso!
