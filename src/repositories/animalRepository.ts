import { createOfflineRepository } from "@/repositories/offlineRepository";
import { isLocalReference } from "@/lib/offlineIdentity";
import { enumMappers } from "@/lib/enumMappers";
import type { Animal, AnimalRequest } from "@/types";

export const animalRepository = createOfflineRepository<Animal, AnimalRequest>({
  entity: "animais",
  basePath: "/api/v1/animais",
  shouldQueueCreate: (payload) => isLocalReference(payload.propriedadeLocalId) || payload.propriedadeId == null,
  sanitizePayload: (payload) => ({
    identificacao: payload.identificacao,
    nome: payload.nome,
    categoria: enumMappers.categoria(payload.categoria),
    sexo: payload.sexo,
    dataNascimento: payload.dataNascimento,
    racaId: payload.racaId,
    pelagem: payload.pelagem,
    propriedadeId: payload.propriedadeId,
    proprietarioId: payload.proprietarioId,
    cuidadorPropriedadeId: payload.cuidadorPropriedadeId,
    status: payload.status,
    biografia: payload.biografia,
  }),
});
