import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout, GestacaoIcon } from "@/components/MobileLayout";
import { EmptyState } from "@/components/EmptyState";
import { Plus } from "lucide-react";
import { animalService } from "@/services/animalService";
import { coberturaService, type CoberturaApi } from "@/services/coberturaService";
import {
  gestacaoService,
  type GestacaoApi,
  type ListarGestacoesParams,
  type ResultadoGestacao,
  type StatusGestacao,
} from "@/services/gestacaoService";
import { getApiErrorMessage, getAuthToken } from "@/lib/api";
import type { Animal } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { RecordSyncBadge } from "@/components/RecordSyncBadge";
import { toast } from "sonner";

const TODOS = "all";
const PAGE_SIZE = 10;

const resultadoLabels: Record<ResultadoGestacao, string> = {
  PRENHE: "Prenhe",
  REABSORCAO: "Reabsorção",
  VAZIA: "Vazia",
  ABORTO: "Aborto",
};

const resultadoColors: Record<ResultadoGestacao, string> = {
  PRENHE: "bg-secondary/10 text-secondary",
  VAZIA: "bg-muted text-muted-foreground",
  REABSORCAO: "bg-destructive/10 text-destructive",
  ABORTO: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<StatusGestacao, string> = {
  EM_ANDAMENTO: "Em andamento",
  FINALIZADA: "Finalizada",
};

const statusColors: Record<StatusGestacao, string> = {
  EM_ANDAMENTO: "bg-primary/10 text-primary",
  FINALIZADA: "bg-muted text-muted-foreground",
};

type Filters = {
  coberturaId: string;
  doadoraId: string;
  resultado: string;
  status: string;
  dataInicio: string;
  dataFim: string;
};

const initialFilters: Filters = {
  coberturaId: TODOS,
  doadoraId: TODOS,
  resultado: TODOS,
  status: TODOS,
  dataInicio: "",
  dataFim: "",
};

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
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

function getDoadoraLabel(gestacao: GestacaoApi) {
  return gestacao.doadoraNome ?? gestacao.animalNome ?? `Doadora #${gestacao.doadoraId}`;
}

function getCoberturaLabel(cobertura: CoberturaApi) {
  const doadora = cobertura.doadoraNome ?? `Doadora #${cobertura.doadoraAnimalId}`;
  const data = cobertura.dataHora ? new Date(cobertura.dataHora).toLocaleDateString("pt-BR") : "";
  return `${doadora} - ${cobertura.tipoProcedimento}${data ? ` - ${data}` : ""}`;
}

function isResultado(value: string): value is ResultadoGestacao {
  return ["PRENHE", "REABSORCAO", "VAZIA", "ABORTO"].includes(value);
}

function isStatus(value: string): value is StatusGestacao {
  return ["EM_ANDAMENTO", "FINALIZADA"].includes(value);
}

export default function ListaGestacoes() {
  const navigate = useNavigate();
  const [gestacoes, setGestacoes] = useState<GestacaoApi[]>([]);
  const [coberturas, setCoberturas] = useState<CoberturaApi[]>([]);
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const doadoras = useMemo(
    () => animais.filter((animal) => ["EGUA", "Egua", "RECEPTORA", "Receptora"].includes(animal.categoria)),
    [animais]
  );

  const carregarGestacoes = useCallback(async () => {
    if (!getAuthToken()) {
      toast.error("Faça login para visualizar gestações.");
      navigate("/");
      return;
    }

    setIsLoading(true);

    try {
      const params: ListarGestacoesParams = {
        ...(filters.coberturaId !== TODOS ? { coberturaId: Number(filters.coberturaId) } : {}),
        ...(filters.doadoraId !== TODOS ? { doadoraId: Number(filters.doadoraId) } : {}),
        ...(isResultado(filters.resultado) ? { resultado: filters.resultado } : {}),
        ...(isStatus(filters.status) ? { status: filters.status } : {}),
        ...(filters.dataInicio ? { dataInicio: toBackendDate(filters.dataInicio) } : {}),
        ...(filters.dataFim ? { dataFim: toBackendDate(filters.dataFim) } : {}),
        page,
        size: PAGE_SIZE,
      };

      const response = await gestacaoService.listarGestacoesPage(params);
      const content = Array.isArray(response) ? response : response.content ?? [];
      setGestacoes(content);
      setHasNext(Array.isArray(response) ? content.length === PAGE_SIZE : !(response.last ?? true));
      setTotalPages(Math.max(1, Array.isArray(response) ? page + (content.length === PAGE_SIZE ? 2 : 1) : response.totalPages ?? 1));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      console.error("Erro ao listar gestações:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, navigate, page]);

  useEffect(() => {
    if (!getAuthToken()) return;

    Promise.all([
      coberturaService.listarCoberturas(),
      animalService.listarAnimais(),
    ])
      .then(([coberturasData, animaisData]) => {
        setCoberturas(coberturasData);
        setAnimais(animaisData);
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
        console.error("Erro ao carregar filtros de gestações:", error);
      });
  }, []);

  useEffect(() => {
    carregarGestacoes();
  }, [carregarGestacoes]);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  return (
    <MobileLayout title="Gestações" showBack headerRight={
      <Button size="icon" variant="ghost" onClick={() => navigate("/reproducao/gestacao/novo")}><Plus className="h-5 w-5" /></Button>
    }>
      <div className="p-4 space-y-3">
        <Select value={filters.coberturaId} onValueChange={(value) => setFilter("coberturaId", value)}>
          <SelectTrigger className="bg-card"><SelectValue placeholder="Cobertura" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas as coberturas</SelectItem>
            {coberturas.map((cobertura) => (
              <SelectItem key={cobertura.id} value={String(cobertura.id)}>{getCoberturaLabel(cobertura)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2">
          <Select value={filters.doadoraId} onValueChange={(value) => setFilter("doadoraId", value)}>
            <SelectTrigger className="bg-card"><SelectValue placeholder="Doadora" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas doadoras</SelectItem>
              {doadoras.map((animal) => (
                <SelectItem key={animal.id} value={String(animal.id)}>{animal.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.resultado} onValueChange={(value) => setFilter("resultado", value)}>
            <SelectTrigger className="bg-card"><SelectValue placeholder="Resultado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos resultados</SelectItem>
              {Object.entries(resultadoLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select value={filters.status} onValueChange={(value) => setFilter("status", value)}>
          <SelectTrigger className="bg-card"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os status</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2">
          <Input
            className="bg-card"
            value={filters.dataInicio}
            onChange={(e) => setFilter("dataInicio", e.target.value)}
            placeholder="Início dd/mm/aaaa"
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
              <div key={item} className="h-[104px] rounded-xl border border-border bg-muted animate-pulse" />
            ))}
          </div>
        ) : gestacoes.length === 0 ? (
          <EmptyState icon={GestacaoIcon} title="Nenhuma gestação" description="Ajuste os filtros ou registre uma nova gestação" actionLabel="Nova Gestação" onAction={() => navigate("/reproducao/gestacao/novo")} />
        ) : (
          <>
            <div className="space-y-2">
              {gestacoes.map((gestacao) => (
                <button
                  key={gestacao.id}
                  onClick={() => navigate(`/reproducao/gestacao/${gestacao.id}/checkups`)}
                  className="w-full bg-card rounded-xl border border-border p-4 text-left hover:border-primary/30 active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{getDoadoraLabel(gestacao)}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <RecordSyncBadge status={(gestacao as any).syncStatus} />
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", resultadoColors[gestacao.resultado])}>
                        {resultadoLabels[gestacao.resultado] ?? gestacao.resultado}
                      </span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", statusColors[gestacao.status])}>
                        {statusLabels[gestacao.status] ?? gestacao.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Diagnóstico: {formatDate(gestacao.dataDiagnosticoInicial)}</p>
                  {gestacao.dataPrevisaoParto && (
                    <p className="text-xs text-muted-foreground">Previsão parto: {formatDate(gestacao.dataPrevisaoParto)}</p>
                  )}
                  {gestacao.observacoes && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{gestacao.observacoes}</p>
                  )}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-1">
              <Button type="button" variant="outline" disabled={page === 0 || isLoading} onClick={() => setPage((prev) => Math.max(0, prev - 1))}>
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Pagina {page + 1} de {totalPages}
              </span>
              <Button type="button" variant="outline" disabled={!hasNext || isLoading} onClick={() => setPage((prev) => prev + 1)}>
                Próxima
              </Button>
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
}
