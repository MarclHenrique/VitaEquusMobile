export interface Propriedade {
  id: string;
  nome: string;
  tipo_propriedade: 'HARAS' | 'CENTRO_DE_REPRODUCAO' | 'FAZENDA' | 'Haras' | 'Centro_de_Reproducao' | 'Fazenda';
  endereco: string;
  cidade: string;
  estado: string;
  telefone: string;
  email: string;
}

export interface Proprietario {
  id: string;
  nome: string;
  tipo_documento: 'CPF' | 'CNPJ';
  nrdocumento: string;
  telefone: string;
  email: string;
}

export type CategoriaAnimal =
  | "GARANHAO"
  | "EGUA"
  | "POTRO"
  | "RECEPTORA"
  | "Garanhao"
  | "Egua"
  | "Potro"
  | "Receptora";
export type SexoAnimal = "M" | "F";
export type StatusAnimal = "ATIVO" | "VENDIDO" | "OBITO" | "ativo" | "vendido" | "obito";

export interface Animal {
  id: number | string;
  identificacao: string | null;
  nome: string;
  categoria: CategoriaAnimal;
  sexo: SexoAnimal;
  dataNascimento: string | null;
  racaId: number | null;
  nomeRaca: string | null;
  pelagem: string | null;
  propriedadeId: number | string;
  propriedadeLocalId?: string | null;
  nomePropriedade: string;
  status: StatusAnimal;
  biografia: string | null;
  urlFoto: string | null;
  syncStatus?: "SYNCED" | "PENDING" | "ERROR" | string | null;
  localId?: string | null;
  serverId?: number | string | null;
}

export interface AnimalRequest {
  identificacao: string;
  nome: string;
  categoria: CategoriaAnimal;
  sexo: SexoAnimal;
  dataNascimento: string | null;
  racaId: number | null;
  pelagem: string;
  propriedadeId?: number | null;
  propriedadeLocalId?: string | null;
  proprietarioId: number | null;
  cuidadorPropriedadeId: number | null;
  status: StatusAnimal;
  biografia: string;
}

export interface Raca {
  id: number;
  nome: string;
}

export interface Veterinario {
  id: string;
  nome: string;
  registro_profissional: string;
  telefone: string;
  email: string;
  base_cidade: string;
}

export interface ExameReprodutivo {
  id: string;
  animalId: string;
  veterinarioId: string;
  propriedadeId: string;
  data_hora: string;
  diametro_folicular: number;
  edema_uterino: string;
  corpo_luteo: string;
  observacoes: string;
}

export interface Cobertura {
  id: string;
  doadoraId: string;
  produtorId: string;
  veterinarioId: string;
  propriedadeId: string;
  tipo_procedimento: 'Monta Natural' | 'IA' | 'TE' | 'ICSI';
  tipo_semen: 'fresco' | 'resfriado' | 'congelado';
  data_hora: string;
  observacoes: string;
}

export interface Gestacao {
  id: string;
  doadoraId: string;
  coberturaId: string;
  veterinarioId: string;
  data_diagnostico_inicial: string;
  resultado: 'prenhe' | 'vazia' | 'reabsorção' | 'aborto';
  status: 'EM_ANDAMENTO' | 'FINALIZADA';
  data_previsao_parto: string;
  observacoes: string;
}

export interface CheckupGestacional {
  id: string;
  gestacaoId: string;
  veterinarioId: string;
  data_hora: string;
  resultado: string;
  observacoes: string;
}

export interface Parto {
  id: string;
  gestacaoId: string;
  doadoraId: string;
  veterinarioId: string;
  propriedadeId: string;
  data_hora: string;
  tipo_parto: 'normal' | 'distócico' | 'cesariana';
  intercorrencias: string;
  resultado: 'vivo' | 'morto' | 'natimorto';
}

export interface PotroNascido {
  id: string;
  partoId: string;
  sexo: 'Macho' | 'Fêmea';
  peso_nascimento: number;
  observacoes: string;
}

export interface AtendimentoClinico {
  id: string;
  animalId: string;
  veterinarioId: string;
  propriedadeId: string;
  data_hora: string;
  tipo_atendimento: 'clínico geral' | 'vacinação' | 'vermifugação' | 'exame laboratório';
  queixa_principal: string;
  diagnostico_presuntivo: string;
  conduta: string;
}

export interface MedicacaoAplicada {
  id: string;
  atendimentoId: string;
  insumoId: string;
  dose: string;
  via_administracao: string;
  observacoes: string;
}

export interface Insumo {
  id: string;
  nome_comercial: string;
  tipo: 'medicamento' | 'hormônio' | 'vacina' | 'vermífugo';
  principio_ativo: string;
  fornecedorId: string;
}
