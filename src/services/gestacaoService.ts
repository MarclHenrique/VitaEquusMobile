import { apiRequest, buildQueryString, unwrapPageContent, type PageResponse } from "@/lib/api";

export type ResultadoGestacao = "PRENHE" | "VAZIA" | "REABSORCAO" | "ABORTO";
export type StatusGestacao = "EM_ANDAMENTO" | "FINALIZADA";

export type GestacaoApi = {
  id: number;
  doadoraId: number;
  coberturaId: number;
  dataDiagnosticoInicial: string;
  resultado: ResultadoGestacao;
  status: StatusGestacao;
  dataPrevisaoParto: string | null;
  observacoes: string | null;
  doadoraNome?: string | null;
  animalNome?: string | null;
  coberturaDataHora?: string | null;
};

export type CheckupGestacionalApi = {
  id: number;
  gestacaoId?: number;
  dataHora: string;
  resultado: string;
  observacoes: string | null;
};

export type CriarGestacaoPayload = {
  coberturaId: number;
  dataDiagnosticoInicial: string;
  resultado: ResultadoGestacao;
  dataPrevisaoParto: string | null;
  observacoes: string;
};

export type AtualizarResultadoGestacaoPayload = {
  resultado: ResultadoGestacao;
  dataPrevisaoParto: string | null;
  observacoes?: string;
};

export type CriarCheckupPayload = {
  dataHora: string;
  resultado: string;
  observacoes: string;
};

export type AtualizarCheckupPayload = {
  resultado: string;
  observacoes: string;
};

export type ListarGestacoesParams = {
  doadoraId?: number;
  coberturaId?: number;
  resultado?: ResultadoGestacao;
  status?: StatusGestacao;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  size?: number;
  sort?: string;
};

export type ListarCheckupsParams = {
  gestacaoId?: number;
  resultado?: string;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  size?: number;
  sort?: string;
};

function toQueryString(params?: ListarGestacoesParams) {
  return buildQueryString(params);
}

function jsonRequest<T>(path: string, method: "POST" | "PUT" | "PATCH", payload: unknown) {
  return apiRequest<T>(path, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export const gestacaoService = {
  async listarGestacoes(params?: ListarGestacoesParams) {
    const response = await apiRequest<GestacaoApi[] | PageResponse<GestacaoApi>>(
      `/api/v1/gestacoes${toQueryString(params)}`
    );

    return unwrapPageContent(response);
  },

  listarGestacoesPage(params?: ListarGestacoesParams) {
    return apiRequest<GestacaoApi[] | PageResponse<GestacaoApi>>(
      `/api/v1/gestacoes${toQueryString(params)}`
    );
  },

  buscarGestacao(id: number) {
    return apiRequest<GestacaoApi>(`/api/v1/gestacoes/${id}`);
  },

  criarGestacao(payload: CriarGestacaoPayload) {
    const body: CriarGestacaoPayload = {
      coberturaId: payload.coberturaId,
      dataDiagnosticoInicial: payload.dataDiagnosticoInicial,
      resultado: payload.resultado,
      dataPrevisaoParto: payload.dataPrevisaoParto,
      observacoes: payload.observacoes,
    };

    return jsonRequest<GestacaoApi>("/api/v1/gestacoes", "POST", body);
  },

  atualizarResultadoGestacao(id: number, payload: AtualizarResultadoGestacaoPayload) {
    return jsonRequest<GestacaoApi>(`/api/v1/gestacoes/${id}/resultado`, "PATCH", payload);
  },

  async listarCheckups(gestacaoId: number) {
    const response = await apiRequest<CheckupGestacionalApi[] | PageResponse<CheckupGestacionalApi>>(
      `/api/v1/gestacoes/${gestacaoId}/checkups`
    );

    return unwrapPageContent(response);
  },

  listarCheckupsPage(params?: ListarCheckupsParams) {
    return apiRequest<CheckupGestacionalApi[] | PageResponse<CheckupGestacionalApi>>(
      `/api/v1/checkups-gestacionais${buildQueryString(params)}`
    );
  },

  criarCheckup(gestacaoId: number, payload: CriarCheckupPayload) {
    return jsonRequest<CheckupGestacionalApi>(`/api/v1/gestacoes/${gestacaoId}/checkups`, "POST", payload);
  },

  atualizarCheckup(gestacaoId: number, checkupId: number, payload: AtualizarCheckupPayload) {
    return jsonRequest<CheckupGestacionalApi>(`/api/v1/gestacoes/${gestacaoId}/checkups/${checkupId}`, "PUT", payload);
  },
};
