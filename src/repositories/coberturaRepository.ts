import { createOfflineRepository } from "@/repositories/offlineRepository";
import type { CoberturaApi, CriarCoberturaPayload } from "@/services/coberturaService";

export const coberturaRepository = createOfflineRepository<CoberturaApi, CriarCoberturaPayload>({
  entity: "coberturas",
  basePath: "/api/v1/coberturas",
});
