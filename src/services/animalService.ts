import { apiRequest, buildQueryString, normalizePageResponse, unwrapPageContent, type PageResponse } from "@/lib/api";
import type { Animal, AnimalRequest, CategoriaAnimal, StatusAnimal } from "@/types";
import { animalRepository } from "@/repositories/animalRepository";

type ListarAnimaisParams = {
  categoria?: CategoriaAnimal;
  status?: StatusAnimal;
  idPropriedade?: number;
  page?: number;
  size?: number;
  sort?: string;
};

const categoriaBackend: Record<CategoriaAnimal, "GARANHAO" | "EGUA" | "POTRO" | "RECEPTORA"> = {
  GARANHAO: "GARANHAO",
  EGUA: "EGUA",
  POTRO: "POTRO",
  RECEPTORA: "RECEPTORA",
  Garanhao: "GARANHAO",
  Egua: "EGUA",
  Potro: "POTRO",
  Receptora: "RECEPTORA",
};

const statusBackend: Record<StatusAnimal, "ATIVO" | "VENDIDO" | "OBITO"> = {
  ATIVO: "ATIVO",
  VENDIDO: "VENDIDO",
  OBITO: "OBITO",
  ativo: "ATIVO",
  vendido: "VENDIDO",
  obito: "OBITO",
};

function normalizeParams(params?: ListarAnimaisParams) {
  if (!params) return undefined;

  return {
    ...params,
    categoria: params.categoria ? categoriaBackend[params.categoria] : undefined,
    status: params.status ? statusBackend[params.status] : undefined,
  };
}

function normalizePayload(payload: AnimalRequest): AnimalRequest {
  return {
    ...payload,
    categoria: categoriaBackend[payload.categoria],
    status: statusBackend[payload.status],
  };
}

export const animalService = {
  async listarAnimais(params?: ListarAnimaisParams) {
    return animalRepository.list(normalizeParams(params) as Record<string, unknown>);
  },

  async listarAnimaisPage(params?: ListarAnimaisParams) {
    return animalRepository.listPage(normalizeParams(params) as Record<string, unknown>);
  },

  criarAnimal(payload: AnimalRequest) {
    return animalRepository.create(normalizePayload(payload));
  },

  atualizarAnimal(id: number, payload: AnimalRequest) {
    return animalRepository.update(id, normalizePayload(payload));
  },

  buscarAnimal(id: number) {
    return animalRepository.get(id);
  },
};
