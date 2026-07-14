import { createOfflineRepository } from "@/repositories/offlineRepository";
import { isLocalReference } from "@/lib/offlineIdentity";
import { enumMappers } from "@/lib/enumMappers";
import type { CriarExameReprodutivoPayload, ExameReprodutivoApi } from "@/services/exameReprodutivoService";

export const exameReprodutivoRepository = createOfflineRepository<ExameReprodutivoApi, CriarExameReprodutivoPayload>({
  entity: "examesReprodutivos",
  basePath: "/api/v1/exames-reprodutivos",
  shouldQueueCreate: (payload) => isLocalReference(payload.animalLocalId) || isLocalReference(payload.propriedadeLocalId),
  sanitizePayload: (payload) => ({
    animalId: payload.animalId,
    propriedadeId: payload.propriedadeId,
    dataHora: payload.dataHora,
    diametroFolicular: payload.diametroFolicular,
    edemaUterino: enumMappers.edemaUterino(payload.edemaUterino),
    corpoLuteo: enumMappers.corpoLuteo(payload.corpoLuteo),
    insumoId: payload.insumoId,
    observacoes: payload.observacoes,
  }),
});
