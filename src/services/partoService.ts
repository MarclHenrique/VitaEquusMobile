import { apiRequest, buildQueryString, normalizePageResponse, unwrapPageContent, type PageResponse } from "@/lib/api";
import type { ResultadoGestacao, StatusGestacao } from "@/services/gestacaoService";
import { gestacaoRepository } from "@/repositories/gestacaoRepository";
import { partoRepository } from "@/repositories/partoRepository";

export type TipoParto = "NORMAL" | "DISTOCICO" | "CESARIANA";
export type ResultadoParto = "VIVO" | "MORTO";
export type SexoPotro = "M" | "F";
export type ResultadoPotro = "VIVO" | "MORTO" | "NATIMORTO";
export type CondicaoNeonato = "NORMAL" | "FRACO" | "EM_OBSERVACAO" | "CRITICO";

export type PartoApi = {
  id: number;
  gestacaoId: number;
  propriedadeId: number;
  dataHora: string;
  tipoParto: TipoParto;
  resultadoParto: ResultadoParto;
  intercorrencias: string | null;
  observacoes: string | null;
  propriedadeNome?: string | null;
  doadoraNome?: string | null;
  animalNome?: string | null;
  quantidadePotros?: number | null;
  potros?: PotroApi[] | null;
};

export type PotroApi = {
  id: number;
  nome: string | null;
  identificacao: string | null;
  sexo: SexoPotro;
  pelagemInicial: string | null;
  pesoNascimento: number | null;
  resultado: ResultadoPotro;
  condicaoNeonato: CondicaoNeonato;
  observacoes: string | null;
};

export type GestacaoResumo = {
  id: number;
  doadoraAnimalId?: number | null;
  doadoraId?: number | null;
  doadoraNome?: string | null;
  animalNome?: string | null;
  dataDiagnosticoInicial?: string | null;
  dataPrevisaoParto?: string | null;
  resultado?: ResultadoGestacao | null;
  status?: StatusGestacao | null;
};

export type CriarPartoPayload = {
  gestacaoId: number;
  propriedadeId: number;
  dataHora: string;
  tipoParto: TipoParto;
  resultadoParto: ResultadoParto;
  intercorrencias: string;
  observacoes: string | null;
  potros: [];
};

export type AtualizarPartoPayload = Omit<CriarPartoPayload, "potros"> & {
  potros?: [];
};

export type SalvarPotroPayload = {
  nome: string;
  identificacao: string;
  sexo: SexoPotro;
  pelagemInicial: string;
  pesoNascimento: number | null;
  resultado: ResultadoPotro;
  condicaoNeonato: CondicaoNeonato;
  observacoes: string;
};

export type ListarPartosParams = {
  gestacaoId?: number;
  propriedadeId?: number;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export type ListarGestacoesPartoParams = {
  resultado?: ResultadoGestacao;
  status?: StatusGestacao;
};

function toQueryString(params?: ListarPartosParams) {
  return buildQueryString(params);
}

function toGestacoesQueryString(params?: ListarGestacoesPartoParams) {
  const query = new URLSearchParams();

  if (params?.resultado) query.set("resultado", params.resultado);
  if (params?.status) query.set("status", params.status);

  const value = query.toString();
  return value ? `?${value}` : "";
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

export const partoService = {
  async listarPartos(params?: ListarPartosParams) {
    return partoRepository.list(params as Record<string, unknown>);
  },

  async listarPartosPage(params?: ListarPartosParams) {
    return partoRepository.listPage(params as Record<string, unknown>);
  },

  buscarParto(id: number) {
    return partoRepository.get(id);
  },

  criarParto(payload: CriarPartoPayload) {
    return partoRepository.create(payload);
  },

  atualizarParto(id: number, payload: AtualizarPartoPayload) {
    return partoRepository.update(id, payload);
  },

  async listarPotrosDoParto(id: number) {
    const response = await apiRequest<PotroApi[] | PageResponse<PotroApi>>(`/api/v1/partos/${id}/potros`);

    return unwrapPageContent(response);
  },

  adicionarPotro(partoId: number, payload: SalvarPotroPayload) {
    return jsonRequest<PotroApi>(`/api/v1/partos/${partoId}/potros`, "POST", payload);
  },

  atualizarPotro(partoId: number, potroId: number, payload: SalvarPotroPayload) {
    return jsonRequest<PotroApi>(`/api/v1/partos/${partoId}/potros/${potroId}`, "PUT", payload);
  },

  async listarGestacoes(params?: ListarGestacoesPartoParams) {
    const response = await gestacaoRepository.list(params as Record<string, unknown>);
    return response.map((gestacao) => ({
      ...gestacao,
      id: Number(gestacao.id),
    }));
  },
};
