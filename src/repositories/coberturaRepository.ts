import { createOfflineRepository } from "@/repositories/offlineRepository";
import { isLocalReference } from "@/lib/offlineIdentity";
import { enumMappers } from "@/lib/enumMappers";
import type { CoberturaApi, CriarCoberturaPayload } from "@/services/coberturaService";

export const coberturaRepository = createOfflineRepository<CoberturaApi, CriarCoberturaPayload>({
  entity: "coberturas",
  basePath: "/api/v1/coberturas",
  shouldQueueCreate: (payload) =>
    isLocalReference(payload.doadoraAnimalLocalId) ||
    isLocalReference(payload.produtorAnimalLocalId) ||
    isLocalReference(payload.propriedadeLocalId),
  sanitizePayload: (payload) => ({
    doadoraAnimalId: payload.doadoraAnimalId,
    produtorAnimalId: payload.produtorAnimalId,
    propriedadeId: payload.propriedadeId,
    tipoProcedimento: enumMappers.tipoProcedimento(payload.tipoProcedimento),
    tipoSemen: enumMappers.tipoSemen(payload.tipoSemen),
    dataHora: payload.dataHora,
    observacoes: payload.observacoes,
  }),
});
