import { createOfflineRepository } from "@/repositories/offlineRepository";
import type { CriarExameReprodutivoPayload, ExameReprodutivoApi } from "@/services/exameReprodutivoService";

export const exameReprodutivoRepository = createOfflineRepository<ExameReprodutivoApi, CriarExameReprodutivoPayload>({
  entity: "examesReprodutivos",
  basePath: "/api/v1/exames-reprodutivos",
});
