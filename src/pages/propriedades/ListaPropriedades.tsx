import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/MobileLayout";
import { EmptyState } from "@/components/EmptyState";
import { Building2, Plus, MapPin } from "lucide-react";
import { getApiErrorMessage, getAuthToken } from "@/lib/api";
import { propriedadeService, type PropriedadeApi } from "@/services/propriedadeService";
import type { Propriedade } from "@/types";
import { Button } from "@/components/ui/button";
import { RecordSyncBadge } from "@/components/RecordSyncBadge";
import { toast } from "sonner";

const PAGE_SIZE = 8;
const DEFAULT_SORT = "nome,asc";

function toPropriedade(api: PropriedadeApi): Propriedade {
  return {
    id: String(api.id),
    nome: api.nome,
    tipo_propriedade: (api.tipoPropriedade ?? "HARAS") as Propriedade["tipo_propriedade"],
    endereco: api.endereco ?? "",
    cidade: api.cidade ?? "",
    estado: api.estado ?? "",
    telefone: api.celular ?? "",
    email: api.email ?? "",
  };
}

function labelTipoPropriedade(tipo: Propriedade["tipo_propriedade"]) {
  const labels: Record<string, string> = {
    HARAS: "Haras",
    CENTRO_DE_REPRODUCAO: "Centro de Reproducao",
    FAZENDA: "Fazenda",
    Haras: "Haras",
    Centro_de_Reproducao: "Centro de Reproducao",
    Fazenda: "Fazenda",
  };

  return labels[tipo] ?? tipo;
}

export default function ListaPropriedades() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!getAuthToken()) {
      toast.error("Faca login para visualizar suas propriedades.");
      navigate("/");
    }
  }, [navigate]);

  const propriedadesQuery = useQuery({
    queryKey: ["propriedades", { page, size: PAGE_SIZE, sort: DEFAULT_SORT }],
    queryFn: () => propriedadeService.listarPropriedadesPage({ page, size: PAGE_SIZE, sort: DEFAULT_SORT }),
    enabled: !!getAuthToken(),
  });

  const propriedadesApi = propriedadesQuery.data?.content ?? [];
  const propriedades = propriedadesApi.map(toPropriedade);
  const totalPages = Math.max(1, propriedadesQuery.data?.totalPages ?? 1);
  const currentPage = propriedadesQuery.data?.number ?? page;
  const isLoading = propriedadesQuery.isLoading || propriedadesQuery.isFetching;
  const errorMessage = propriedadesQuery.error ? getApiErrorMessage(propriedadesQuery.error) : "";

  useEffect(() => {
    if (!propriedadesQuery.error) return;

    toast.error(getApiErrorMessage(propriedadesQuery.error));
    console.error("Erro ao listar propriedades:", propriedadesQuery.error);
  }, [propriedadesQuery.error]);

  return (
    <MobileLayout title="Propriedades" showBack headerRight={
      <Button size="icon" variant="ghost" onClick={() => navigate("/propriedades/novo")}>
        <Plus className="h-5 w-5" />
      </Button>
    }>
      {isLoading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 rounded-xl border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : propriedadesQuery.isError ? (
        <div className="p-4">
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm font-semibold text-destructive">Nao foi possivel carregar as propriedades</p>
            <p className="mt-1 text-xs text-muted-foreground">{errorMessage}</p>
            <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => propriedadesQuery.refetch()}>
              Tentar novamente
            </Button>
          </div>
        </div>
      ) : propriedades.length === 0 ? (
        <EmptyState icon={Building2} title="Nenhuma propriedade" description="Cadastre sua primeira propriedade" actionLabel="Cadastrar" onAction={() => navigate("/propriedades/novo")} />
      ) : (
        <div className="p-4 space-y-3">
          {propriedades.map(p => (
            <button key={p.id} onClick={() => navigate(`/propriedades/${p.id}`)} className="w-full bg-card rounded-xl border border-border p-4 text-left hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{p.nome}</p>
                    <RecordSyncBadge status={(propriedadesApi.find((item) => String(item.id) === p.id) as any)?.syncStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground">{labelTipoPropriedade(p.tipo_propriedade)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground truncate">{p.cidade} - {p.estado}</p>
                  </div>
                </div>
              </div>
            </button>
          ))}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-1">
            <Button type="button" variant="outline" disabled={page === 0} onClick={() => setPage((prev) => Math.max(0, prev - 1))}>
              Anterior
            </Button>
            <span className="text-center text-xs text-muted-foreground">
              Pagina {currentPage + 1} de {totalPages}
            </span>
            <Button type="button" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((prev) => prev + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
