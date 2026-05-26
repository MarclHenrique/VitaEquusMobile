import { createOfflineRepository } from "@/repositories/offlineRepository";
import type { AtendimentoClinicoApi, AtendimentoPayload } from "@/services/clinicoService";

export const atendimentoRepository = createOfflineRepository<AtendimentoClinicoApi, AtendimentoPayload>({
  entity: "atendimentos",
  basePath: "/api/v1/atendimentos",
});
