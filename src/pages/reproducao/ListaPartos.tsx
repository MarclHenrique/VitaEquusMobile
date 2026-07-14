import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { EmptyState } from "@/components/EmptyState";
import { Baby, Plus } from "lucide-react";
import { propriedadeService, type PropriedadeResumo } from "@/services/propriedadeService";
import {
  partoService,
  type ListarPartosParams,
  type PartoApi,
  type ResultadoParto,
  type TipoParto,
} from "@/services/partoService";
import { getApiErrorMessage, getAuthToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecordSyncBadge } from "@/components/RecordSyncBadge";
import { toast } from "sonner";

const TODOS = "all";
const PAGE_SIZE = 10;

const tipoPartoLabels: Record<TipoParto, string> = {
  NORMAL: "Normal",
  DISTOCICO: "Distócico",
  CESARIANA: "Cesariana",
};

const resultadoPartoLabels: Record<ResultadoParto, string> = {
  VIVO: "Vivo",
  MORTO: "Morto",
};

type Filters = {
  propriedadeId: string;
  dataInicio: string;
  dataFim: string;
};

type PartoCard = PartoApi & {
  quantidadePotrosCalculada: number;
};

const initialFilters: Filters = {
  propriedadeId: TODOS,
  dataInicio: "",
  dataFim: "",
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toBackendDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return trimmed;

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

export default function ListaPartos() {
  const navigate = useNavigate();
  const [partos, setPartos] = useState<PartoCard[]>([]);
  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([]);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const carregarPartos = useCallback(async () => {
    if (!getAuthToken()) {
      toast.error("Faca login para visualizar partos.");
      navigate("/");
      return;
    }

    setIsLoading(true);

    try {
      const params: ListarPartosParams = {
        ...(filters.propriedadeId !== TODOS ? { propriedadeId: Number(filters.propriedadeId) } : {}),
        ...(filters.dataInicio ? { dataInicio: toBackendDate(filters.dataInicio) } : {}),
        ...(filters.dataFim ? { dataFim: toBackendDate(filters.dataFim) } : {}),
        page,
        size: PAGE_SIZE,
      };

      const data = await partoService.listarPartosPage(params);
      const partosComPotros = data.content.map((parto) => ({
        ...parto,
        quantidadePotrosCalculada: Array.isArray(parto.potros)
          ? parto.potros.length
          : parto.quantidadePotros ?? 0,
      }));

      setPartos(partosComPotros);
      setTotalPages(Math.max(1, data.totalPages ?? 1));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      console.error("Erro ao listar partos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, navigate, page]);

  useEffect(() => {
    if (!getAuthToken()) return;

    propriedadeService.listarPropriedadesResumo()
      .then(setPropriedades)
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
        console.error("Erro ao carregar propriedades de partos:", error);
      });
  }, []);

  useEffect(() => {
    carregarPartos();
  }, [carregarPartos]);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  return (
    <MobileLayout title="Partos" showBack headerRight={
      <Button size="icon" variant="ghost" onClick={() => navigate("/reproducao/parto/novo")}><Plus className="h-5 w-5" /></Button>
    }>
      <div className="p-4 space-y-3">
        <Select value={filters.propriedadeId} onValueChange={(value) => setFilter("propriedadeId", value)}>
          <SelectTrigger className="bg-card"><SelectValue placeholder="Propriedade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas propriedades</SelectItem>
            {propriedades.map((propriedade) => (
              <SelectItem key={propriedade.id} value={String(propriedade.id)}>{propriedade.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2">
          <Input
            className="bg-card"
            value={filters.dataInicio}
            onChange={(e) => setFilter("dataInicio", e.target.value)}
            placeholder="Inicio dd/mm/aaaa"
            inputMode="numeric"
          />
          <Input
            className="bg-card"
            value={filters.dataFim}
            onChange={(e) => setFilter("dataFim", e.target.value)}
            placeholder="Fim dd/mm/aaaa"
            inputMode="numeric"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-[112px] rounded-xl border border-border bg-muted animate-pulse" />
            ))}
          </div>
        ) : partos.length === 0 ? (
          <EmptyState icon={Baby} title="Nenhum parto" description="Registre o primeiro parto" actionLabel="Novo Parto" onAction={() => navigate("/reproducao/parto/novo")} />
        ) : (
          <>
          <div className="space-y-2">
            {partos.map((parto) => (
              <button
                key={parto.id}
                onClick={() => navigate(`/reproducao/parto/${parto.id}`)}
                className="w-full bg-card rounded-xl border border-border p-4 text-left active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {parto.doadoraNome ?? parto.animalNome ?? `Gestação #${parto.gestacaoId}`}
                  </p>
                  <RecordSyncBadge status={(parto as { syncStatus?: string | null }).syncStatus} />
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                    {tipoPartoLabels[parto.tipoParto] ?? parto.tipoParto}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{parto.propriedadeNome ?? `Propriedade #${parto.propriedadeId}`}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {tipoPartoLabels[parto.tipoParto] ?? parto.tipoParto} • {formatDateTime(parto.dataHora)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Resultado: {resultadoPartoLabels[parto.resultadoParto] ?? parto.resultadoParto} • Potros: {parto.quantidadePotrosCalculada}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {parto.intercorrencias?.trim() || "Sem intercorrências."}
                </p>
              </button>
            ))}
          </div>
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
          </>
        )}
      </div>
    </MobileLayout>
  );
}
