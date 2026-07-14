import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { EmptyState } from "@/components/EmptyState";
import { ClipboardList, Plus } from "lucide-react";
import { animalService } from "@/services/animalService";
import { propriedadeService, type PropriedadeResumo } from "@/services/propriedadeService";
import {
  exameReprodutivoService,
  type CorpoLuteo,
  type EdemaUterino,
  type ExameReprodutivoApi,
  type ListarExamesReprodutivosParams,
} from "@/services/exameReprodutivoService";
import { getApiErrorMessage, getAuthToken } from "@/lib/api";
import type { Animal } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecordSyncBadge } from "@/components/RecordSyncBadge";
import { toast } from "sonner";

const TODOS = "all";
const PAGE_SIZE = 10;

const edemaLabels: Record<EdemaUterino, string> = {
  AUSENTE: "Ausente",
  GRAU_1: "Grau 1",
  GRAU_2: "Grau 2",
  GRAU_3: "Grau 3",
  GRAU_4: "Grau 4",
  GRAU_5: "Grau 5",
};

const corpoLuteoLabels: Record<CorpoLuteo, string> = {
  AUSENTE: "Ausente",
  OVARIO_ESQUERDO: "Ovario esquerdo",
  OVARIO_DIREITO: "Ovario direito",
  AMBOS: "Ambos",
};

type Filters = {
  animalId: string;
  propriedadeId: string;
  dataInicio: string;
  dataFim: string;
};

const initialFilters: Filters = {
  animalId: TODOS,
  propriedadeId: TODOS,
  dataInicio: "",
  dataFim: "",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("pt-BR");
}

function toBackendDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return trimmed;

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function isEguaOuReceptora(animal: Animal) {
  const categoria = animal.categoria.toUpperCase();
  return categoria === "EGUA" || categoria === "RECEPTORA";
}

export default function ListaExames() {
  const navigate = useNavigate();
  const [exames, setExames] = useState<ExameReprodutivoApi[]>([]);
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([]);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const animaisElegiveis = useMemo(() => animais.filter(isEguaOuReceptora), [animais]);

  const carregarExames = useCallback(async () => {
    if (!getAuthToken()) {
      toast.error("Faca login para visualizar exames reprodutivos.");
      navigate("/");
      return;
    }

    setIsLoading(true);

    try {
      const params: ListarExamesReprodutivosParams = {
        ...(filters.animalId !== TODOS ? { animalId: Number(filters.animalId) } : {}),
        ...(filters.propriedadeId !== TODOS ? { propriedadeId: Number(filters.propriedadeId) } : {}),
        ...(filters.dataInicio ? { dataInicio: toBackendDate(filters.dataInicio) } : {}),
        ...(filters.dataFim ? { dataFim: toBackendDate(filters.dataFim) } : {}),
        page,
        size: PAGE_SIZE,
      };

      const data = await exameReprodutivoService.listarExamesReprodutivosPage(params);
      setExames(data.content);
      setTotalPages(Math.max(1, data.totalPages ?? 1));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      console.error("Erro ao listar exames reprodutivos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, navigate, page]);

  useEffect(() => {
    if (!getAuthToken()) return;

    Promise.all([animalService.listarAnimais(), propriedadeService.listarPropriedadesResumo()])
      .then(([animaisData, propriedadesData]) => {
        setAnimais(animaisData);
        setPropriedades(propriedadesData);
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
        console.error("Erro ao carregar filtros de exames:", error);
      });
  }, []);

  useEffect(() => {
    carregarExames();
  }, [carregarExames]);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  return (
    <MobileLayout title="Exames Reprodutivos" showBack headerRight={
      <Button size="icon" variant="ghost" onClick={() => navigate("/reproducao/exame/novo")}><Plus className="h-5 w-5" /></Button>
    }>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Select value={filters.animalId} onValueChange={(value) => setFilter("animalId", value)}>
            <SelectTrigger className="bg-card"><SelectValue placeholder="Animal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos animais</SelectItem>
              {animaisElegiveis.map((animal) => (
                <SelectItem key={animal.id} value={String(animal.id)}>{animal.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.propriedadeId} onValueChange={(value) => setFilter("propriedadeId", value)}>
            <SelectTrigger className="bg-card"><SelectValue placeholder="Propriedade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas propriedades</SelectItem>
              {propriedades.map((propriedade) => (
                <SelectItem key={propriedade.id} value={String(propriedade.id)}>{propriedade.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
              <div key={item} className="h-[96px] rounded-xl border border-border bg-muted animate-pulse" />
            ))}
          </div>
        ) : exames.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Nenhum exame" description="Registre o primeiro exame" actionLabel="Novo Exame" onAction={() => navigate("/reproducao/exame/novo")} />
        ) : (
          <>
          <div className="space-y-2">
            {exames.map((exame) => (
              <button
                key={exame.id}
                onClick={() => navigate(`/reproducao/exame/${exame.id}`)}
                className="w-full bg-card rounded-xl border border-border p-4 text-left active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {exame.animalNome ?? `Animal #${exame.animalId}`}
                  </p>
                  <RecordSyncBadge status={(exame as { syncStatus?: string | null }).syncStatus} />
                  <p className="text-[10px] text-muted-foreground shrink-0">{formatDate(exame.dataHora)}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {exame.propriedadeNome ?? `Propriedade #${exame.propriedadeId}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Foliculo: {exame.diametroFolicular}mm - Edema: {edemaLabels[exame.edemaUterino] ?? exame.edemaUterino}
                </p>
                <p className="text-xs text-muted-foreground">
                  Corpo luteo: {corpoLuteoLabels[exame.corpoLuteo] ?? exame.corpoLuteo}
                </p>
                {exame.observacoes && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{exame.observacoes}</p>
                )}
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
