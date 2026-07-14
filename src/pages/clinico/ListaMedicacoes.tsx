import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { EmptyState } from "@/components/EmptyState";
import { Pill, Plus } from "lucide-react";
import { clinicoService, type AtendimentoClinicoApi, type InsumoResumo, type MedicacaoApi } from "@/services/clinicoService";
import { getApiErrorMessage, getAuthToken } from "@/lib/api";
import { criarInsumoLookup, formatViaAdministracao, getInsumoNome } from "@/lib/medicacaoFormat";
import { Button } from "@/components/ui/button";
import { RecordSyncBadge } from "@/components/RecordSyncBadge";
import { toast } from "sonner";

const PAGE_SIZE = 8;

type MedicacaoListItem = MedicacaoApi & {
  atendimento: AtendimentoClinicoApi;
};

export default function ListaMedicacoes() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MedicacaoListItem[]>([]);
  const [insumos, setInsumos] = useState<InsumoResumo[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const atendimentosPorId = useMemo(
    () => new Map(items.map((item) => [item.atendimento.id, item.atendimento])),
    [items]
  );
  const insumosById = useMemo(() => criarInsumoLookup(insumos), [insumos]);

  const carregarMedicacoes = useCallback(async () => {
    if (!getAuthToken()) {
      toast.error("Faca login para visualizar medicacoes.");
      navigate("/");
      return;
    }

    setIsLoading(true);

    try {
      const [atendimentosPage, insumosData] = await Promise.all([
        clinicoService.listarAtendimentosPage({ page, size: PAGE_SIZE }),
        clinicoService.listarInsumos(),
      ]);
      const atendimentos = atendimentosPage.content;
      const medicacoesPorAtendimento = await Promise.all(
        atendimentos.map(async (atendimento) => {
          const medicacoes = await clinicoService.listarMedicacoes(atendimento.id);
          return medicacoes.map((medicacao) => ({ ...medicacao, atendimento }));
        })
      );

      setItems(medicacoesPorAtendimento.flat());
      setInsumos(insumosData);
      setTotalPages(Math.max(1, atendimentosPage.totalPages ?? 1));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      console.error("Erro ao listar medicacoes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, page]);

  useEffect(() => {
    carregarMedicacoes();
  }, [carregarMedicacoes]);

  return (
    <MobileLayout title="Medicacoes" showBack headerRight={
      <Button size="icon" variant="ghost" onClick={() => navigate("/clinico/medicacao/novo")}><Plus className="h-5 w-5" /></Button>
    }>
      {isLoading ? (
        <div className="p-4 space-y-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-[72px] rounded-xl border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Pill} title="Nenhuma medicacao" description="Registre a primeira medicacao" actionLabel="Nova Medicacao" onAction={() => navigate("/clinico/medicacao/novo")} />
      ) : (
        <div className="p-4 space-y-2">
          {items.map((medicacao) => {
            const atendimento = atendimentosPorId.get(medicacao.atendimento.id) ?? medicacao.atendimento;

            return (
              <button
                key={`${atendimento.id}-${medicacao.id}`}
                onClick={() => navigate(`/clinico/atendimento/${atendimento.id}`)}
                className="w-full bg-card rounded-xl border border-border p-4 text-left"
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {atendimento.animalNome ?? `Animal #${atendimento.animalId}`}
                  </p>
                  <RecordSyncBadge status={(medicacao as { syncStatus?: string | null }).syncStatus} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {getInsumoNome(medicacao, insumosById)} - {medicacao.dose} - {formatViaAdministracao(medicacao.viaAdministracao)}
                </p>
                {medicacao.observacoes && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{medicacao.observacoes}</p>
                )}
              </button>
            );
          })}
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
