import { apiRequest, buildQueryString, normalizePageResponse, unwrapPageContent, type PageResponse } from "@/lib/api";
import type { Animal, AnimalRequest, CategoriaAnimal, StatusAnimal } from "@/types";

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
    const response = await apiRequest<Animal[] | PageResponse<Animal>>(
      `/api/v1/animais${buildQueryString(normalizeParams(params))}`
    );

    return unwrapPageContent(response);
  },

  async listarAnimaisPage(params?: ListarAnimaisParams) {
    const response = await apiRequest<Animal[] | PageResponse<Animal>>(
      `/api/v1/animais${buildQueryString(normalizeParams(params))}`
    );

    return normalizePageResponse(response, params?.page ?? 0, params?.size ?? 10);
  },

  criarAnimal(payload: AnimalRequest) {
    return apiRequest<Animal>("/api/v1/animais", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizePayload(payload)),
    });
  },

  atualizarAnimal(id: number, payload: AnimalRequest) {
    return apiRequest<Animal>(`/api/v1/animais/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizePayload(payload)),
    });
  },

  buscarAnimal(id: number) {
    return apiRequest<Animal>(`/api/v1/animais/${id}`);
  },
};
