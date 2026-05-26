import { createOfflineRepository, listLocal, queueCreate, saveRemoteList, isOnline } from "@/repositories/offlineRepository";
import { apiRequest, normalizePageResponse, unwrapPageContent, type PageResponse } from "@/lib/api";
import type { MedicacaoApi, MedicacaoPayload } from "@/services/clinicoService";

export const medicacaoRepository = {
  async listByAtendimento(atendimentoId: number) {
    if (isOnline()) {
      try {
        const response = await apiRequest<MedicacaoApi[] | PageResponse<MedicacaoApi>>(
          `/api/v1/atendimentos/${atendimentoId}/medicacoes`
        );
        const content = unwrapPageContent(response).map((item) => ({ ...item, atendimentoId }));
        await saveRemoteList("medicacoesAplicadas", content);
        return content;
      } catch {
        return listLocal<MedicacaoApi>("medicacoesAplicadas", { atendimentoId });
      }
    }

    return listLocal<MedicacaoApi>("medicacoesAplicadas", { atendimentoId });
  },

  async create(atendimentoId: number, payload: MedicacaoPayload) {
    const endpoint = `/api/v1/atendimentos/${atendimentoId}/medicacoes`;
    const body = { ...payload, atendimentoId };

    if (isOnline() && atendimentoId > 0) {
      try {
        const response = await apiRequest<MedicacaoApi>(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await saveRemoteList("medicacoesAplicadas", [{ ...response, atendimentoId }]);
        return response;
      } catch {
        return queueCreate<MedicacaoApi>("medicacoesAplicadas", endpoint, body, { atendimentoId });
      }
    }

    return queueCreate<MedicacaoApi>("medicacoesAplicadas", endpoint, body, { atendimentoId });
  },

  async listPage(params?: Record<string, unknown>) {
    const content = await listLocal<MedicacaoApi>("medicacoesAplicadas", params);
    return normalizePageResponse(content, Number(params?.page ?? 0), Number(params?.size ?? 10));
  },
};

export const rawMedicacaoRepository = createOfflineRepository<MedicacaoApi, MedicacaoPayload>({
  entity: "medicacoesAplicadas",
  basePath: "/api/v1/medicacoes",
});
