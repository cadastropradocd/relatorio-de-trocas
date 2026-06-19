import type React from 'react';

export type StatusType = 'positivo' | 'negativo' | 'neutro';
export type UserRole = 'admin' | 'user';
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Departamento {
  id: string;
  nome: string;
  meta_mensal: number;
  ativo: boolean;
  ordem: number;
  criado_em: string;
  atualizado_em: string;
}

export interface Setor {
  id: string;
  categoria: string;
  realizado: number;
  meta: number;
  diferenca: number;
  percentual: number;
  status: StatusType;
  criado_em?: string;
  atualizado_em?: string;
}

export interface TrocasData {
  id: string;
  data: string;
  setores: Setor[];
  total_realizado: number;
  total_meta: number;
  total_diferenca: number;
  usuario_id: string;
  criado_em: string;
  atualizado_em: string;
}

export interface KPIData {
  label: string;
  value: number;
  formattedValue: string;
  subValue?: string;
  status?: StatusType;
  icon?: React.ReactNode;
  tooltip?: string;
}

export interface TableColumn {
  key: string;
  header: string;
  sortable: boolean;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

export interface SortConfig {
  key: string | null;
  direction: 'ascending' | 'descending' | null;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  criado_em: string;
}

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}
