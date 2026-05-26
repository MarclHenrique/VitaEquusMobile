import { apiRequest } from "@/lib/api";
import { localDb } from "@/lib/db/localDb";

type DashboardMetric = {
  total?: number | null;
};

type DashboardTaxaPrenhez = {
  prenhes?: number | null;
  totalMatrizes?: number | null;
};

export type DashboardResponse = {
  plantelAtivo?: DashboardMetric | null;
  taxaPrenhez?: DashboardTaxaPrenhez | null;
  alertasEstoque?: DashboardMetric | null;
  agendaLembretes?: unknown;
  statusReprodutivoAtual?: unknown;
};

export const dashboardService = {
  async buscarDashboard() {
    if (typeof navigator === "undefined" || navigator.onLine) {
      try {
        return await apiRequest<DashboardResponse>("/api/v1/dashboard");
      } catch {
        // fallback para resumo local
      }
    }

    const [animais, gestacoes, pendencias] = await Promise.all([
      localDb.animais.count(),
      localDb.gestacoes.filter((gestacao) => gestacao.resultado === "PRENHE").count(),
      localDb.syncQueue.where("status").anyOf(["PENDING", "ERROR"]).count(),
    ]);

    return {
      plantelAtivo: { total: animais },
      taxaPrenhez: { prenhes: gestacoes, totalMatrizes: animais },
      alertasEstoque: { total: pendencias },
    };
  },
};
