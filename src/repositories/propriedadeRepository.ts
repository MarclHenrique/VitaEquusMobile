import { createOfflineRepository } from "@/repositories/offlineRepository";
import type { PropriedadeApi } from "@/services/propriedadeService";

export const propriedadeRepository = createOfflineRepository<PropriedadeApi>({
  entity: "propriedades",
  basePath: "/api/v1/propriedades",
  createPath: "/api/v1/propriedades/v2",
});
