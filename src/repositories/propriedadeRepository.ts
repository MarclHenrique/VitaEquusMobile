import { createOfflineRepository } from "@/repositories/offlineRepository";
import { enumMappers } from "@/lib/enumMappers";
import type { PropriedadeApi } from "@/services/propriedadeService";

export const propriedadeRepository = createOfflineRepository<PropriedadeApi>({
  entity: "propriedades",
  basePath: "/api/v1/propriedades",
  createPath: "/api/v1/propriedades/v2",
  sanitizePayload: (payload) => ({
    nome: payload.nome,
    tipoPropriedade: enumMappers.tipoPropriedade(payload.tipoPropriedade),
    endereco: payload.endereco,
    cidade: payload.cidade,
    estado: payload.estado,
    celular: payload.celular,
    email: payload.email,
  }),
});
