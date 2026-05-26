import { createOfflineRepository } from "@/repositories/offlineRepository";
import type { CriarGestacaoPayload, GestacaoApi } from "@/services/gestacaoService";

export const gestacaoRepository = createOfflineRepository<GestacaoApi, CriarGestacaoPayload>({
  entity: "gestacoes",
  basePath: "/api/v1/gestacoes",
  getLocalCreateData: () => ({ status: "EM_ANDAMENTO" }),
  buildUpdatePath: (id) => `/api/v1/gestacoes/${id}/resultado`,
});
