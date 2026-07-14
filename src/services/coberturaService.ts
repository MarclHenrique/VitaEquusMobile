import { apiRequest, buildQueryString, normalizePageResponse, unwrapPageContent, type PageResponse } from "@/lib/api";
import { coberturaRepository } from "@/repositories/coberturaRepository";

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
  id: number | string;
  doadoraAnimalId: number | string | null;
  doadoraAnimalLocalId?: string | null;
  produtorAnimalId: number | string | null;
  produtorAnimalLocalId?: string | null;
  propriedadeId: number | string | null;
  propriedadeLocalId?: string | null;
  tipoProcedimento: TipoProcedimento;
  tipoSemen: TipoSemen | null;
  dataHora: string;
  observacoes: string | null;
  doadoraNome?: string | null;
  produtorNome?: string | null;
  propriedadeNome?: string | null;
};

export type CriarCoberturaPayload = {
  doadoraAnimalId?: number | null;
  doadoraAnimalLocalId?: string | null;
  produtorAnimalId?: number | null;
  produtorAnimalLocalId?: string | null;
  propriedadeId?: number | null;
  propriedadeLocalId?: string | null;
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
    return coberturaRepository.list(params as Record<string, unknown>);
  },

  async listarCoberturasPage(params?: ListarCoberturasParams) {
    return coberturaRepository.listPage(params as Record<string, unknown>);
  },

  buscarCobertura(id: number) {
    return coberturaRepository.get(id);
  },

  criarCobertura(payload: CriarCoberturaPayload) {
    return coberturaRepository.create(payload);
  },

  atualizarCobertura(id: number, payload: AtualizarCoberturaPayload) {
    return coberturaRepository.update(id, payload);
  },
};
