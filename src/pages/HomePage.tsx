import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout, FerraduraIcon, GestacaoIcon } from "@/components/MobileLayout";
import { Heart, Stethoscope, Building2, ClipboardList, Pill } from "lucide-react";
import { getApiErrorMessage, getAuthToken } from "@/lib/api";
import { dashboardService } from "@/services/dashboardService";
import { Button } from "@/components/ui/button";
import { SyncStatusIndicator } from "@/components/SyncStatusIndicator";
import logo from "@/assets/logo.png";

const quickActions = [
  { label: "Novo Exame", icon: ClipboardList, path: "/reproducao/exame/novo", bg: "bg-primary", text: "text-primary-foreground" },
  { label: "Cobertura", icon: Heart, path: "/reproducao/cobertura/novo", bg: "bg-secondary", text: "text-secondary-foreground" },
  { label: "Atendimento", icon: Stethoscope, path: "/clinico/atendimento/novo", bg: "bg-primary", text: "text-primary-foreground" },
  { label: "Medica\u00e7\u00e3o", icon: Pill, path: "/clinico/medicacao/novo", bg: "bg-[hsl(var(--vita-green))]", text: "text-primary" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardService.buscarDashboard,
    enabled: !!getAuthToken(),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const dashboard = dashboardQuery.data;
  const animais = dashboard?.plantelAtivo?.total ?? 0;
  const gestacoes = dashboard?.taxaPrenhez?.prenhes ?? 0;
  const eguas = dashboard?.taxaPrenhez?.totalMatrizes ?? 0;
  const alertasEstoque = dashboard?.alertasEstoque?.total ?? 0;
  const agendaLembretes = dashboard?.agendaLembretes;
  const statusReprodutivoAtual = dashboard?.statusReprodutivoAtual;
  void alertasEstoque;
  void agendaLembretes;
  void statusReprodutivoAtual;

  const isLoading = dashboardQuery.isLoading || dashboardQuery.isFetching;
  const errorMessage = dashboardQuery.error ? getApiErrorMessage(dashboardQuery.error) : "";

  return (
    <MobileLayout>
      <div className="px-4 pt-5 pb-4">
        {/* Header with logo */}
        <div className="flex items-center gap-3 mb-6">
          <img src={logo} alt="VitaEquus" className="w-10 h-10 rounded-xl object-contain" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">VitaEquus</h1>
            <p className="text-xs text-muted-foreground">{"Gest\u00e3o Reprodutiva"}</p>
          </div>
          <SyncStatusIndicator />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Animais", value: animais, icon: FerraduraIcon, bg: "bg-primary", text: "text-primary-foreground" },
            { label: "Gesta\u00e7\u00f5es", value: gestacoes, icon: GestacaoIcon, bg: "bg-secondary", text: "text-secondary-foreground" },
            { label: "\u00c9guas", value: eguas, icon: Heart, bg: "bg-primary", text: "text-primary-foreground" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center shadow-sm`}>
              <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.text}`} />
              <p className={`text-lg font-bold ${s.text}`}>
                {isLoading ? <span className="mx-auto block h-6 w-8 rounded bg-current/25 animate-pulse" /> : s.value}
              </p>
              <p className={`text-[10px] ${s.text} opacity-80`}>{s.label}</p>
            </div>
          ))}
        </div>

        {dashboardQuery.isError && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm font-semibold text-destructive">Nao foi possivel carregar o resumo</p>
            <p className="mt-1 text-xs text-muted-foreground">{errorMessage}</p>
            <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => dashboardQuery.refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Quick Actions */}
        <h2 className="text-sm font-semibold text-foreground mb-3">{"Acesso R\u00e1pido"}</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className="flex items-center gap-3 bg-card rounded-xl border border-border p-4 text-left hover:border-primary/30 transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.bg} ${a.text}`}>
                <a.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-foreground">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Module links */}
        <h2 className="text-sm font-semibold text-foreground mb-3">{"M\u00f3dulos"}</h2>
        <div className="space-y-2">
          {[
            { label: "Propriedades", icon: Building2, path: "/propriedades", iconBg: "bg-primary/15", iconColor: "text-primary" },
            { label: "Prontu\u00e1rio", icon: ClipboardList, path: "/clinico/prontuario", iconBg: "bg-[hsl(var(--vita-green))]/15", iconColor: "text-[hsl(var(--vita-green))]" },
          ].map((m) => (
            <button
              key={m.label}
              onClick={() => navigate(m.path)}
              className="flex items-center gap-3 w-full bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-colors"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.iconBg}`}>
                <m.icon className={`h-5 w-5 ${m.iconColor}`} />
              </div>
              <span className="text-sm font-medium text-foreground flex-1 text-left">{m.label}</span>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><path d="M6 12l4-4-4-4" /></svg>
            </button>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
