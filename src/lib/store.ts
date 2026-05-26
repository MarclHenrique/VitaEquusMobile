import type { Veterinario } from '@/types';

// Simple localStorage-based store for demo purposes
function getStore<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function setStore<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getAll<T>(key: string): T[] {
  return getStore<T>(key);
}

export function getById<T extends { id: string }>(key: string, id: string): T | undefined {
  return getStore<T>(key).find(item => item.id === id);
}

export function create<T extends { id: string }>(key: string, item: T): T {
  const items = getStore<T>(key);
  items.push(item);
  setStore(key, items);
  return item;
}

export function update<T extends { id: string }>(key: string, id: string, data: Partial<Omit<T, 'id'>>): T | undefined {
  const items = getStore<T>(key);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return undefined;
  items[index] = { ...items[index], ...data };
  setStore(key, items);
  return items[index];
}

export function remove<T extends { id: string }>(key: string, id: string): boolean {
  const items = getStore<T>(key);
  const filtered = items.filter(item => item.id !== id);
  setStore(key, filtered);
  return filtered.length < items.length;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getCurrentVet(): Veterinario | undefined {
  const userStr = localStorage.getItem(KEYS.user);
  if (!userStr) return undefined;
  try {
    const user = JSON.parse(userStr);
    const vets = getAll<Veterinario>(KEYS.veterinarios);
    return vets.find(v => v.email === user.email);
  } catch {
    return undefined;
  }
}

// Store keys
export const KEYS = {
  propriedades: 'vita_propriedades',
  animais: 'vita_animais',
  veterinarios: 'vita_veterinarios',
  exames: 'vita_exames',
  coberturas: 'vita_coberturas',
  gestacoes: 'vita_gestacoes',
  checkups: 'vita_checkups',
  partos: 'vita_partos',
  potros: 'vita_potros',
  atendimentos: 'vita_atendimentos',
  medicacoes: 'vita_medicacoes',
  insumos: 'vita_insumos',
  user: 'vita_user',
} as const;

// Seed some demo data
export function seedDemoData() {
  if (localStorage.getItem('vita_seeded')) return;

  const props = [
    { id: '1', nome: 'Haras Bela Vista', tipo_propriedade: 'Haras' as const, endereco: 'Rod. BR-040 Km 12', cidade: 'Brasília', estado: 'DF', telefone: '(61) 99999-0001', email: 'contato@harasbelavista.com.br' },
    { id: '2', nome: 'Fazenda São Jorge', tipo_propriedade: 'Fazenda' as const, endereco: 'Estrada Municipal s/n', cidade: 'Uberaba', estado: 'MG', telefone: '(34) 99999-0002', email: 'contato@fazendasaojorge.com.br' },
  ];
  setStore(KEYS.propriedades, props);

  const vets = [
    { id: '1', nome: 'Dr. Carlos Mendes', registro_profissional: 'CRMV-MG 12345', telefone: '(34) 99988-0001', email: 'carlos@vet.com', base_cidade: 'Uberaba' },
  ];
  setStore(KEYS.veterinarios, vets);

  const animais = [
    { id: '1', identificacao: 'EQ-001', nome: 'Estrela', categoria: 'Égua' as const, sexo: 'Fêmea' as const, data_nascimento: '2018-03-15', raca: 'Mangalarga Marchador', pelagem: 'Tordilha', propriedadeId: '1', proprietarioId: '', status: 'ativo' as const },
    { id: '2', identificacao: 'EQ-002', nome: 'Trovão', categoria: 'Garanhão' as const, sexo: 'Macho' as const, data_nascimento: '2016-07-20', raca: 'Quarto de Milha', pelagem: 'Alazão', propriedadeId: '1', proprietarioId: '', status: 'ativo' as const },
    { id: '3', identificacao: 'EQ-003', nome: 'Luna', categoria: 'Receptora' as const, sexo: 'Fêmea' as const, data_nascimento: '2019-01-10', raca: 'Sem Raça Definida', pelagem: 'Castanha', propriedadeId: '2', proprietarioId: '', status: 'ativo' as const },
  ];
  setStore(KEYS.animais, animais);

  localStorage.setItem('vita_seeded', 'true');
}
