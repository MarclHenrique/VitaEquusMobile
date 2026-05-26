import { createOfflineRepository } from "@/repositories/offlineRepository";
import type { InsumoResumo } from "@/services/clinicoService";

export const insumoRepository = createOfflineRepository<InsumoResumo>({
  entity: "insumos",
  basePath: "/api/v1/insumos",
});
