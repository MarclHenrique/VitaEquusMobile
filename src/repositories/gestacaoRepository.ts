import { createOfflineRepository } from "@/repositories/offlineRepository";
import { isLocalReference } from "@/lib/offlineIdentity";
import type { CriarGestacaoPayload, GestacaoApi } from "@/services/gestacaoService";

export const gestacaoRepository = createOfflineRepository<GestacaoApi, CriarGestacaoPayload>({
  entity: "gestacoes",
  basePath: "/api/v1/gestacoes",
  getLocalCreateData: () => ({ status: "EM_ANDAMENTO" }),
  buildUpdatePath: (id) => `/api/v1/gestacoes/${id}/resultado`,
  shouldQueueCreate: (payload) => isLocalReference(payload.coberturaLocalId),
  sanitizePayload: (payload) => ({
    coberturaId: payload.coberturaId,
    dataDiagnosticoInicial: payload.dataDiagnosticoInicial,
    resultado: payload.resultado,
    dataPrevisaoParto: payload.dataPrevisaoParto,
    observacoes: payload.observacoes,
  }),
});
