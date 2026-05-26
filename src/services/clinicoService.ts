import { apiRequest, buildQueryString, normalizePageResponse, unwrapPageContent, type PageResponse } from "@/lib/api";

export type TipoAtendimento =
  | "CLINICO_GERAL"
  | "VACINACAO"
  | "VERMIFUGACAO"
  | "EXAME_LABORATORIO";

export type ViaAdministracao =
  | "INTRAMUSCULAR"
  | "INTRAVENOSA"
  | "ORAL"
  | "SUBCUTANEA";

export type AtendimentoClinicoApi = {
  id: number;
  animalId: number;
  propriedadeId: number;
  dataHora: string;
  tipoAtendimento: TipoAtendimento;
  queixaPrincipal: string;
  diagnosticoPresuntivo: string;
  conduta: string;
  animalNome?: string | null;
  propriedadeNome?: string | null;
};

export type AtendimentoPayload = {
  animalId: number;
  propriedadeId: number;
  dataHora: string;
  tipoAtendimento: TipoAtendimento;
  queixaPrincipal: string;
  diagnosticoPresuntivo: string;
  conduta: string;
};

export type MedicacaoApi = {
  id: number;
  atendimentoId?: number;
  insumoId: number;
  dose: string;
  viaAdministracao: ViaAdministracao;
  observacoes: string;
  insumoNome?: string | null;
  insumoNomeComercial?: string | null;
  nomeComercial?: string | null;
};

export type MedicacaoPayload = {
  insumoId: number;
  dose: string;
  viaAdministracao: ViaAdministracao;
  observacoes: string;
};

export type InsumoResumo = {
  id: number;
  nome: string;
  nomeComercial?: string | null;
  nome_comercial?: string | null;
  tipo?: string | null;
};

type ListarAtendimentosParams = {
  animalId?: number;
  propriedadeId?: number;
  tipoAtendimento?: TipoAtendimento;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  size?: number;
  sort?: string;
};

function toQueryString(params?: ListarAtendimentosParams) {
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

export const clinicoService = {
  async listarAtendimentos(params?: ListarAtendimentosParams) {
    const response = await apiRequest<AtendimentoClinicoApi[] | PageResponse<AtendimentoClinicoApi>>(
      `/api/v1/atendimentos${toQueryString(params)}`
    );

    return unwrapPageContent(response);
  },

  listarAtendimentosPage(params?: ListarAtendimentosParams) {
    return apiRequest<AtendimentoClinicoApi[] | PageResponse<AtendimentoClinicoApi>>(
      `/api/v1/atendimentos${toQueryString(params)}`
    ).then((response) => normalizePageResponse(response, params?.page ?? 0, params?.size ?? 10));
  },

  buscarAtendimento(id: number) {
    return apiRequest<AtendimentoClinicoApi>(`/api/v1/atendimentos/${id}`);
  },

  criarAtendimento(payload: AtendimentoPayload) {
    return jsonRequest<AtendimentoClinicoApi>("/api/v1/atendimentos", "POST", payload);
  },

  atualizarAtendimento(id: number, payload: AtendimentoPayload) {
    return jsonRequest<AtendimentoClinicoApi>(`/api/v1/atendimentos/${id}`, "PUT", payload);
  },

  async listarMedicacoes(atendimentoId: number) {
    const response = await apiRequest<MedicacaoApi[] | PageResponse<MedicacaoApi>>(
      `/api/v1/atendimentos/${atendimentoId}/medicacoes`
    );

    return unwrapPageContent(response);
  },

  registrarMedicacao(atendimentoId: number, payload: MedicacaoPayload) {
    return jsonRequest<MedicacaoApi>(
      `/api/v1/atendimentos/${atendimentoId}/medicacoes`,
      "POST",
      payload
    );
  },

  removerMedicacao(atendimentoId: number, medicacaoId: number) {
    return apiRequest<void>(`/api/v1/atendimentos/${atendimentoId}/medicacoes/${medicacaoId}`, {
      method: "DELETE",
    });
  },

  async listarInsumos() {
    const response = await apiRequest<InsumoResumo[] | PageResponse<InsumoResumo>>("/api/v1/insumos");

    return unwrapPageContent(response).map((insumo) => ({
      ...insumo,
      id: Number(insumo.id),
    }));
  },
};
