import { apiRequest, buildQueryString, normalizePageResponse, unwrapPageContent, type PageResponse } from "@/lib/api";
import type { CheckupGestacionalApi, CriarCheckupPayload, ListarCheckupsParams } from "@/services/gestacaoService";
import { isOnline, listLocal, queueCreate, queueUpdate, saveRemoteList } from "@/repositories/offlineRepository";

export const checkupRepository = {
  async listByGestacao(gestacaoId: number) {
    if (isOnline()) {
      try {
        const response = await apiRequest<CheckupGestacionalApi[] | PageResponse<CheckupGestacionalApi>>(
          `/api/v1/gestacoes/${gestacaoId}/checkups`
        );
        const content = unwrapPageContent(response).map((item) => ({ ...item, gestacaoId }));
        await saveRemoteList("checkupsGestacionais", content);
        return content;
      } catch {
        return listLocal<CheckupGestacionalApi>("checkupsGestacionais", { gestacaoId });
      }
    }

    return listLocal<CheckupGestacionalApi>("checkupsGestacionais", { gestacaoId });
  },

  async listPage(params?: ListarCheckupsParams) {
    if (isOnline()) {
      try {
        const response = await apiRequest<CheckupGestacionalApi[] | PageResponse<CheckupGestacionalApi>>(
          `/api/v1/checkups-gestacionais${buildQueryString(params)}`
        );
        const content = unwrapPageContent(response);
        await saveRemoteList("checkupsGestacionais", content);
        return normalizePageResponse(response, params?.page ?? 0, params?.size ?? 10);
      } catch {
        // fall through to IndexedDB
      }
    }

    const content = await listLocal<CheckupGestacionalApi>("checkupsGestacionais", params);
    return normalizePageResponse(content, params?.page ?? 0, params?.size ?? 10);
  },

  async create(gestacaoId: number, payload: CriarCheckupPayload) {
    if (isOnline() && gestacaoId > 0) {
      try {
        const response = await apiRequest<CheckupGestacionalApi>(`/api/v1/gestacoes/${gestacaoId}/checkups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await saveRemoteList("checkupsGestacionais", [{ ...response, gestacaoId }]);
        return response;
      } catch {
        // queue below
      }
    }

    return queueCreate<CheckupGestacionalApi>(
      "checkupsGestacionais",
      `/api/v1/gestacoes/${gestacaoId}/checkups`,
      { ...payload, gestacaoId },
      { gestacaoId }
    );
  },

  async update(gestacaoId: number, checkupId: number, payload: Record<string, unknown>) {
    if (isOnline() && gestacaoId > 0 && checkupId > 0) {
      try {
        const response = await apiRequest<CheckupGestacionalApi>(`/api/v1/gestacoes/${gestacaoId}/checkups/${checkupId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await saveRemoteList("checkupsGestacionais", [{ ...response, gestacaoId }]);
        return response;
      } catch {
        // queue below
      }
    }

    return queueUpdate<CheckupGestacionalApi>(
      "checkupsGestacionais",
      checkupId,
      `/api/v1/gestacoes/${gestacaoId}/checkups/${checkupId}`,
      payload
    );
  },
};
