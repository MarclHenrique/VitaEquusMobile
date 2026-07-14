import { apiRequest, buildQueryString, normalizePageResponse, unwrapPageContent, type PageResponse } from "@/lib/api";
import { exameReprodutivoRepository } from "@/repositories/exameReprodutivoRepository";
import { insumoRepository } from "@/repositories/insumoRepository";

export type EdemaUterino =
  | "AUSENTE"
  | "GRAU_1"
  | "GRAU_2"
  | "GRAU_3"
  | "GRAU_4"
  | "GRAU_5";

export type CorpoLuteo =
  | "AUSENTE"
  | "OVARIO_ESQUERDO"
  | "OVARIO_DIREITO"
  | "AMBOS";

export type ExameReprodutivoApi = {
  id: number | string;
  animalId: number | string | null;
  animalLocalId?: string | null;
  propriedadeId: number | string | null;
  propriedadeLocalId?: string | null;
  dataHora: string;
  diametroFolicular: number;
  edemaUterino: EdemaUterino;
  corpoLuteo: CorpoLuteo;
  insumoId: number | null;
  observacoes: string | null;
  animalNome?: string | null;
  propriedadeNome?: string | null;
  insumoNome?: string | null;
};

export type CriarExameReprodutivoPayload = {
  animalId?: number | null;
  animalLocalId?: string | null;
  propriedadeId?: number | null;
  propriedadeLocalId?: string | null;
  dataHora: string;
  diametroFolicular: number;
  edemaUterino: EdemaUterino;
  corpoLuteo: CorpoLuteo;
  insumoId: number | null;
  observacoes: string;
};

export type AtualizarExameReprodutivoPayload = {
  diametroFolicular: number;
  edemaUterino: EdemaUterino;
  corpoLuteo: CorpoLuteo;
  insumoId: number | null;
  observacoes: string;
};

export type ListarExamesReprodutivosParams = {
  animalId?: number;
  propriedadeId?: number;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export type InsumoResumo = {
  id: number;
  nome: string;
  nomeComercial?: string | null;
  nome_comercial?: string | null;
  tipo?: string | null;
};

function toQueryString(params?: ListarExamesReprodutivosParams) {
  return buildQueryString(params);
}

function jsonRequest<T>(path: string, method: "POST" | "PUT", payload: unknown) {
  return apiRequest<T>(path, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export const exameReprodutivoService = {
  async listarExamesReprodutivos(params?: ListarExamesReprodutivosParams) {
    return exameReprodutivoRepository.list(params as Record<string, unknown>);
  },

  async listarExamesReprodutivosPage(params?: ListarExamesReprodutivosParams) {
    return exameReprodutivoRepository.listPage(params as Record<string, unknown>);
  },

  buscarExameReprodutivo(id: number) {
    return exameReprodutivoRepository.get(id);
  },

  criarExameReprodutivo(payload: CriarExameReprodutivoPayload) {
    return exameReprodutivoRepository.create(payload);
  },

  atualizarExameReprodutivo(id: number, payload: AtualizarExameReprodutivoPayload) {
    return exameReprodutivoRepository.update(id, payload);
  },

  async listarInsumos() {
    const response = await insumoRepository.list();
    return response.map((insumo) => ({
      ...insumo,
      id: Number(insumo.id),
    }));
  },
};
