import { apiRequest } from "@/lib/api";
import type { Raca } from "@/types";

type PageResponse<T> = {
  content: T[];
};

function unwrapContent<T>(response: T[] | PageResponse<T>) {
  return Array.isArray(response) ? response : response.content ?? [];
}

export const racaService = {
  async listarRacas() {
    const response = await apiRequest<Raca[] | PageResponse<Raca>>("/api/v1/racas");
    return unwrapContent(response);
  },
};
