import { createOfflineRepository } from "@/repositories/offlineRepository";
import type { Animal, AnimalRequest } from "@/types";

export const animalRepository = createOfflineRepository<Animal, AnimalRequest>({
  entity: "animais",
  basePath: "/api/v1/animais",
});
