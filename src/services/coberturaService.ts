import { apiRequest, buildQueryString, normalizePageResponse, unwrapPageContent, type PageResponse } from "@/lib/api";

export type TipoProcedimento =
  | "MONTA_NATURAL"
  | "IA"
  | "TE"
  | "ICSI";

export type TipoSemen =
  | "FRESCO"
  | "RESFRIADO"
  | "CONGELADO";

export type CoberturaApi = {
  id: number;
  doadoraAnimalId: number;
  produtorAnimalId: number;
  propriedadeId: number;
  tipoProcedimento: TipoProcedimento;
  tipoSemen: TipoSemen | null;
  dataHora: string;
  observacoes: string | null;
  doadoraNome?: string | null;
  produtorNome?: string | null;
  propriedadeNome?: string | null;
};

export type CriarCoberturaPayload = {
  doadoraAnimalId: number;
  produtorAnimalId: number;
  propriedadeId: number;
  tipoProcedimento: TipoProcedimento;
  tipoSemen: TipoSemen | null;
  dataHora: string;
  observacoes: string;
};

export type AtualizarCoberturaPayload = {
  tipoProcedimento: TipoProcedimento;
  tipoSemen: TipoSemen | null;
  dataHora: string;
  observacoes: string;
};

export type ListarCoberturasParams = {
  doadoraId?: number;
  produtorId?: number;
  propriedadeId?: number;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  size?: number;
  sort?: string;
};

function toQueryString(params?: ListarCoberturasParams) {
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

export const coberturaService = {
  async listarCoberturas(params?: ListarCoberturasParams) {
    const response = await apiRequest<CoberturaApi[] | PageResponse<CoberturaApi>>(
      `/api/v1/coberturas${toQueryString(params)}`
    );

    return unwrapPageContent(response);
  },

  async listarCoberturasPage(params?: ListarCoberturasParams) {
    const response = await apiRequest<CoberturaApi[] | PageResponse<CoberturaApi>>(
      `/api/v1/coberturas${toQueryString(params)}`
    );

    return normalizePageResponse(response, params?.page ?? 0, params?.size ?? 10);
  },

  buscarCobertura(id: number) {
    return apiRequest<CoberturaApi>(`/api/v1/coberturas/${id}`);
  },

  criarCobertura(payload: CriarCoberturaPayload) {
    return jsonRequest<CoberturaApi>("/api/v1/coberturas", "POST", payload);
  },

  atualizarCobertura(id: number, payload: AtualizarCoberturaPayload) {
    return jsonRequest<CoberturaApi>(`/api/v1/coberturas/${id}`, "PUT", payload);
  },
};
