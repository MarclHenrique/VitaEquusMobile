import { createOfflineRepository } from "@/repositories/offlineRepository";
import type { CriarPartoPayload, PartoApi } from "@/services/partoService";

export const partoRepository = createOfflineRepository<PartoApi, CriarPartoPayload>({
  entity: "partos",
  basePath: "/api/v1/partos",
});
