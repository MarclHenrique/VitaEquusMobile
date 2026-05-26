import { apiRequest, buildQueryString, normalizePageResponse, unwrapPageContent, type PageResponse } from "@/lib/api";
import { atendimentoRepository } from "@/repositories/atendimentoRepository";
import { insumoRepository } from "@/repositories/insumoRepository";
import { medicacaoRepository } from "@/repositories/medicacaoRepository";

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
    return atendimentoRepository.list(params as Record<string, unknown>);
  },

  listarAtendimentosPage(params?: ListarAtendimentosParams) {
    return atendimentoRepository.listPage(params as Record<string, unknown>);
  },

  buscarAtendimento(id: number) {
    return atendimentoRepository.get(id);
  },

  criarAtendimento(payload: AtendimentoPayload) {
    return atendimentoRepository.create(payload);
  },

  atualizarAtendimento(id: number, payload: AtendimentoPayload) {
    return atendimentoRepository.update(id, payload);
  },

  async listarMedicacoes(atendimentoId: number) {
    return medicacaoRepository.listByAtendimento(atendimentoId);
  },

  registrarMedicacao(atendimentoId: number, payload: MedicacaoPayload) {
    return medicacaoRepository.create(atendimentoId, payload);
  },

  removerMedicacao(atendimentoId: number, medicacaoId: number) {
    return apiRequest<void>(`/api/v1/atendimentos/${atendimentoId}/medicacoes/${medicacaoId}`, {
      method: "DELETE",
    });
  },

  async listarInsumos() {
    const response = await insumoRepository.list();
    return response.map((insumo) => ({
      ...insumo,
      id: Number(insumo.id),
    }));
  },
};
