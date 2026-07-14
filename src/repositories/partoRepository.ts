import { createOfflineRepository } from "@/repositories/offlineRepository";
import { isLocalReference } from "@/lib/offlineIdentity";
import type { CriarPartoPayload, PartoApi } from "@/services/partoService";

export const partoRepository = createOfflineRepository<PartoApi, CriarPartoPayload>({
  entity: "partos",
  basePath: "/api/v1/partos",
  shouldQueueCreate: (payload) => isLocalReference(payload.gestacaoLocalId) || isLocalReference(payload.propriedadeLocalId),
  sanitizePayload: (payload) => ({
    gestacaoId: payload.gestacaoId,
    propriedadeId: payload.propriedadeId,
    dataHora: payload.dataHora,
    tipoParto: payload.tipoParto,
    resultadoParto: payload.resultadoParto,
    intercorrencias: payload.intercorrencias,
    observacoes: payload.observacoes,
    potros: payload.potros,
  }),
});
