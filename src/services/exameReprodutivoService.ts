import { apiRequest, buildQueryString, normalizePageResponse, unwrapPageContent, type PageResponse } from "@/lib/api";

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
  id: number;
  animalId: number;
  propriedadeId: number;
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
  animalId: number;
  propriedadeId: number;
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
    const response = await apiRequest<ExameReprodutivoApi[] | PageResponse<ExameReprodutivoApi>>(
      `/api/v1/exames-reprodutivos${toQueryString(params)}`
    );

    return unwrapPageContent(response);
  },

  async listarExamesReprodutivosPage(params?: ListarExamesReprodutivosParams) {
    const response = await apiRequest<ExameReprodutivoApi[] | PageResponse<ExameReprodutivoApi>>(
      `/api/v1/exames-reprodutivos${toQueryString(params)}`
    );

    return normalizePageResponse(response, params?.page ?? 0, params?.size ?? 10);
  },

  buscarExameReprodutivo(id: number) {
    return apiRequest<ExameReprodutivoApi>(`/api/v1/exames-reprodutivos/${id}`);
  },

  criarExameReprodutivo(payload: CriarExameReprodutivoPayload) {
    return jsonRequest<ExameReprodutivoApi>("/api/v1/exames-reprodutivos", "POST", payload);
  },

  atualizarExameReprodutivo(id: number, payload: AtualizarExameReprodutivoPayload) {
    return jsonRequest<ExameReprodutivoApi>(`/api/v1/exames-reprodutivos/${id}`, "PUT", payload);
  },

  async listarInsumos() {
    const response = await apiRequest<InsumoResumo[] | PageResponse<InsumoResumo>>("/api/v1/insumos");

    return unwrapPageContent(response).map((insumo) => ({
      ...insumo,
      id: Number(insumo.id),
    }));
  },
};
