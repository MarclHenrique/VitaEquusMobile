import { apiRequest, buildQueryString, unwrapPageContent, type PageResponse } from "@/lib/api";
import { checkupRepository } from "@/repositories/checkupRepository";
import { gestacaoRepository } from "@/repositories/gestacaoRepository";

export type ResultadoGestacao = "PRENHE" | "VAZIA" | "REABSORCAO" | "ABORTO";
export type StatusGestacao = "EM_ANDAMENTO" | "FINALIZADA";

export type GestacaoApi = {
  id: number | string;
  doadoraId: number | string | null;
  coberturaId: number | string | null;
  coberturaLocalId?: string | null;
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
  id: number | string;
  gestacaoId?: number | string | null;
  gestacaoLocalId?: string | null;
  dataHora: string;
  resultado: string;
  observacoes: string | null;
};

export type CriarGestacaoPayload = {
  coberturaId?: number | null;
  coberturaLocalId?: string | null;
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
    return gestacaoRepository.list(params as Record<string, unknown>);
  },

  listarGestacoesPage(params?: ListarGestacoesParams) {
    return gestacaoRepository.listPage(params as Record<string, unknown>);
  },

  buscarGestacao(id: number) {
    return gestacaoRepository.get(id);
  },

  criarGestacao(payload: CriarGestacaoPayload) {
    const body: CriarGestacaoPayload = {
      coberturaId: payload.coberturaId,
      coberturaLocalId: payload.coberturaLocalId,
      dataDiagnosticoInicial: payload.dataDiagnosticoInicial,
      resultado: payload.resultado,
      dataPrevisaoParto: payload.dataPrevisaoParto,
      observacoes: payload.observacoes,
    };

    return gestacaoRepository.create(body);
  },

  atualizarResultadoGestacao(id: number, payload: AtualizarResultadoGestacaoPayload) {
    return gestacaoRepository.update(id, payload, "PATCH");
  },

  async listarCheckups(gestacaoId: number | string) {
    return checkupRepository.listByGestacao(gestacaoId);
  },

  listarCheckupsPage(params?: ListarCheckupsParams) {
    return checkupRepository.listPage(params);
  },

  criarCheckup(gestacaoId: number | string, payload: CriarCheckupPayload) {
    return checkupRepository.create(gestacaoId, payload);
  },

  atualizarCheckup(gestacaoId: number, checkupId: number, payload: AtualizarCheckupPayload) {
    return checkupRepository.update(gestacaoId, checkupId, payload);
  },
};
