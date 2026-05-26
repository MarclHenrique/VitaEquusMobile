import { apiRequest, buildQueryString, normalizePageResponse, type PageResponse } from "@/lib/api";
import { propriedadeRepository } from "@/repositories/propriedadeRepository";

export type PropriedadeResumo = {
  id: number;
  nome: string;
};

export type PropriedadeApi = {
  id: number | string;
  nome: string;
  tipoPropriedade?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  celular?: string | null;
  email?: string | null;
  ativo?: boolean | null;
};

type ListarPropriedadesParams = {
  nome?: string;
  cidade?: string;
  estado?: string;
  tipoPropriedade?: string;
  ativo?: boolean;
  page?: number;
  size?: number;
  sort?: string;
};

export type PropriedadePageResponse = PageResponse<PropriedadeApi> & {
  content: PropriedadeApi[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

function normalizePropriedadePage(
  response: PropriedadeApi[] | PageResponse<PropriedadeApi>,
  params?: ListarPropriedadesParams
): PropriedadePageResponse {
  const page = normalizePageResponse(response, params?.page ?? 0, params?.size ?? 8);

  return {
    ...page,
    content: page.content ?? [],
    totalElements: page.totalElements ?? page.content.length,
    totalPages: page.totalPages ?? 1,
    number: page.number ?? params?.page ?? 0,
    size: page.size ?? params?.size ?? 8,
  };
}

export const propriedadeService = {
  async listarPropriedades(params?: ListarPropriedadesParams): Promise<PropriedadePageResponse> {
    const response = await propriedadeRepository.listPage(params as Record<string, unknown>);
    return normalizePropriedadePage(response, params);
  },

  listarPropriedadesPage(params?: ListarPropriedadesParams) {
    return this.listarPropriedades(params);
  },

  async listarPropriedadesResumo(params?: ListarPropriedadesParams): Promise<PropriedadeResumo[]> {
    const page = await this.listarPropriedades(params);

    return page.content.map((propriedade) => ({
      id: Number(propriedade.id),
      nome: propriedade.nome,
    }));
  },

  buscarPropriedade(id: number | string) {
    return propriedadeRepository.get(id);
  },

  criarPropriedade(payload: Omit<PropriedadeApi, "id">) {
    return propriedadeRepository.create(payload);
  },

  atualizarPropriedade(id: number | string, payload: Partial<PropriedadeApi>) {
    return propriedadeRepository.update(id, payload);
  },
};
