import { createOfflineRepository } from "@/repositories/offlineRepository";
import { isLocalReference } from "@/lib/offlineIdentity";
import { enumMappers } from "@/lib/enumMappers";
import type { AtendimentoClinicoApi, AtendimentoPayload } from "@/services/clinicoService";

export const atendimentoRepository = createOfflineRepository<AtendimentoClinicoApi, AtendimentoPayload>({
  entity: "atendimentos",
  basePath: "/api/v1/atendimentos",
  shouldQueueCreate: (payload) => isLocalReference(payload.animalLocalId) || isLocalReference(payload.propriedadeLocalId),
  sanitizePayload: (payload) => ({
    animalId: payload.animalId,
    propriedadeId: payload.propriedadeId,
    dataHora: payload.dataHora,
    tipoAtendimento: enumMappers.tipoAtendimento(payload.tipoAtendimento),
    queixaPrincipal: payload.queixaPrincipal,
    diagnosticoPresuntivo: payload.diagnosticoPresuntivo,
    conduta: payload.conduta,
  }),
});
