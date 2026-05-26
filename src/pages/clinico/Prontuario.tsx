import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { EmptyState } from "@/components/EmptyState";
import { ClipboardList, Plus, ChevronRight } from "lucide-react";
import { clinicoService, type AtendimentoClinicoApi, type TipoAtendimento } from "@/services/clinicoService";
import { getApiErrorMessage, getAuthToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { RecordSyncBadge } from "@/components/RecordSyncBadge";
import { toast } from "sonner";

const PAGE_SIZE = 10;

const tipoLabels: Record<TipoAtendimento, string> = {
  CLINICO_GERAL: "Clinico geral",
  VACINACAO: "Vacinacao",
  VERMIFUGACAO: "Vermifugacao",
  EXAME_LABORATORIO: "Exame laboratorial",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("pt-BR");
}

export default function Prontuario() {
  const navigate = useNavigate();
  const [atendimentos, setAtendimentos] = useState<AtendimentoClinicoApi[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const carregarAtendimentos = useCallback(async () => {
    if (!getAuthToken()) {
      toast.error("Faca login para visualizar o prontuario.");
      navigate("/");
      return;
    }

    setIsLoading(true);

    try {
      const data = await clinicoService.listarAtendimentosPage({ page, size: PAGE_SIZE });
      setAtendimentos(data.content);
      setTotalPages(Math.max(1, data.totalPages ?? 1));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      console.error("Erro ao listar atendimentos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, page]);

  useEffect(() => {
    carregarAtendimentos();
  }, [carregarAtendimentos]);

  return (
    <MobileLayout title="Prontuario" showBack headerRight={
      <Button size="icon" variant="ghost" onClick={() => navigate("/clinico/atendimento/novo")}><Plus className="h-5 w-5" /></Button>
    }>
      {isLoading ? (
        <div className="p-4 space-y-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-[92px] rounded-xl border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : atendimentos.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhum atendimento" description="Registre o primeiro atendimento" actionLabel="Novo Atendimento" onAction={() => navigate("/clinico/atendimento/novo")} />
      ) : (
        <div className="p-4 space-y-2">
          {atendimentos.map((atendimento) => (
            <button
              key={atendimento.id}
              onClick={() => navigate(`/clinico/atendimento/${atendimento.id}`)}
              className="w-full bg-card rounded-xl border border-border p-4 text-left cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-1 pr-6 gap-2">
                <p className="text-sm font-semibold text-foreground truncate">
                  {atendimento.animalNome ?? `Animal #${atendimento.animalId}`}
                </p>
                <RecordSyncBadge status={(atendimento as any).syncStatus} />
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                  {tipoLabels[atendimento.tipoAtendimento] ?? atendimento.tipoAtendimento}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {atendimento.propriedadeNome ?? `Propriedade #${atendimento.propriedadeId}`} - {formatDate(atendimento.dataHora)}
              </p>
              {atendimento.queixaPrincipal && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 pr-6">{atendimento.queixaPrincipal}</p>
              )}

              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-hover:text-primary transition-colors">
                <ChevronRight className="h-5 w-5" />
              </div>
            </button>
          ))}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-1">
            <Button type="button" variant="outline" disabled={page === 0} onClick={() => setPage((prev) => Math.max(0, prev - 1))}>
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Pagina {page + 1} de {totalPages}
            </span>
            <Button type="button" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((prev) => prev + 1)}>
              Proxima
            </Button>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
