import { apiRequest } from "@/lib/api";

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
  buscarDashboard() {
    return apiRequest<DashboardResponse>("/api/v1/dashboard");
  },
};
