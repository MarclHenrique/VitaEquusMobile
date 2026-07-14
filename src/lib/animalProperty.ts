import { animalBelongsToProperty } from "@/lib/offlineIdentity";
import type { Animal } from "@/types";

export const ANIMAL_PROPERTY_MESSAGE = "Selecione um animal pertencente a propriedade escolhida.";

export function filterAnimalsByProperty<T extends Animal>(animais: T[], propriedadeId: string) {
  return propriedadeId
    ? animais.filter((animal) => animalBelongsToProperty(animal as unknown as Record<string, unknown>, propriedadeId))
    : animais;
}

export function hasAnimalInProperty(animais: Animal[], animalId: string, propriedadeId: string) {
  const animal = animais.find((item) => String(item.id) === animalId || String(item.localId ?? "") === animalId);
  return !!animal && animalBelongsToProperty(animal as unknown as Record<string, unknown>, propriedadeId);
}
