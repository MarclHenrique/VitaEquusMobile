import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { EmptyState } from "@/components/EmptyState";
import { Heart, Plus } from "lucide-react";
import { animalService } from "@/services/animalService";
import { propriedadeService, type PropriedadeResumo } from "@/services/propriedadeService";
import {
  coberturaService,
  type CoberturaApi,
  type ListarCoberturasParams,
  type TipoProcedimento,
  type TipoSemen,
} from "@/services/coberturaService";
import { getApiErrorMessage, getAuthToken } from "@/lib/api";
import type { Animal } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecordSyncBadge } from "@/components/RecordSyncBadge";
import { toast } from "sonner";

const TODOS = "all";
const PAGE_SIZE = 10;

const procedimentoLabels: Record<TipoProcedimento, string> = {
  MONTA_NATURAL: "Monta Natural",
  IA: "IA",
  TE: "TE",
  ICSI: "ICSI",
};

const semenLabels: Record<TipoSemen, string> = {
  FRESCO: "Fresco",
  RESFRIADO: "Resfriado",
  CONGELADO: "Congelado",
};

type Filters = {
  doadoraId: string;
  produtorId: string;
  propriedadeId: string;
  dataInicio: string;
  dataFim: string;
};

const initialFilters: Filters = {
  doadoraId: TODOS,
  produtorId: TODOS,
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

function isDoadora(animal: Animal) {
  const categoria = animal.categoria.toUpperCase();
  return categoria === "EGUA" || categoria === "RECEPTORA";
}

function isProdutor(animal: Animal) {
  return animal.categoria.toUpperCase() === "GARANHAO";
}

export default function ListaCoberturas() {
  const navigate = useNavigate();
  const [coberturas, setCoberturas] = useState<CoberturaApi[]>([]);
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([]);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const doadoras = useMemo(() => animais.filter(isDoadora), [animais]);
  const produtores = useMemo(() => animais.filter(isProdutor), [animais]);

  const carregarCoberturas = useCallback(async () => {
    if (!getAuthToken()) {
      toast.error("Faca login para visualizar coberturas.");
      navigate("/");
      return;
    }

    setIsLoading(true);

    try {
      const params: ListarCoberturasParams = {
        ...(filters.doadoraId !== TODOS ? { doadoraId: Number(filters.doadoraId) } : {}),
        ...(filters.produtorId !== TODOS ? { produtorId: Number(filters.produtorId) } : {}),
        ...(filters.propriedadeId !== TODOS ? { propriedadeId: Number(filters.propriedadeId) } : {}),
        ...(filters.dataInicio ? { dataInicio: toBackendDate(filters.dataInicio) } : {}),
        ...(filters.dataFim ? { dataFim: toBackendDate(filters.dataFim) } : {}),
        page,
        size: PAGE_SIZE,
      };

      const data = await coberturaService.listarCoberturasPage(params);
      setCoberturas(data.content);
      setTotalPages(Math.max(1, data.totalPages ?? 1));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      console.error("Erro ao listar coberturas:", error);
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
        console.error("Erro ao carregar filtros de coberturas:", error);
      });
  }, []);

  useEffect(() => {
    carregarCoberturas();
  }, [carregarCoberturas]);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  return (
    <MobileLayout title="Coberturas" showBack headerRight={
      <Button size="icon" variant="ghost" onClick={() => navigate("/reproducao/cobertura/novo")}><Plus className="h-5 w-5" /></Button>
    }>
      <div className="p-4 space-y-3">
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

          <Select value={filters.produtorId} onValueChange={(value) => setFilter("produtorId", value)}>
            <SelectTrigger className="bg-card"><SelectValue placeholder="Produtor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos produtores</SelectItem>
              {produtores.map((animal) => (
                <SelectItem key={animal.id} value={String(animal.id)}>{animal.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
              <div key={item} className="h-[96px] rounded-xl border border-border bg-muted animate-pulse" />
            ))}
          </div>
        ) : coberturas.length === 0 ? (
          <EmptyState icon={Heart} title="Nenhuma cobertura" description="Registre a primeira cobertura" actionLabel="Nova Cobertura" onAction={() => navigate("/reproducao/cobertura/novo")} />
        ) : (
          <>
          <div className="space-y-2">
            {coberturas.map((cobertura) => (
              <button
                key={cobertura.id}
                onClick={() => navigate(`/reproducao/cobertura/${cobertura.id}`)}
                className="w-full bg-card rounded-xl border border-border p-4 text-left active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {(cobertura.doadoraNome ?? `Doadora #${cobertura.doadoraAnimalId}`)} x {(cobertura.produtorNome ?? `Produtor #${cobertura.produtorAnimalId}`)}
                  </p>
                  <RecordSyncBadge status={(cobertura as any).syncStatus} />
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium shrink-0">
                    {procedimentoLabels[cobertura.tipoProcedimento] ?? cobertura.tipoProcedimento}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {cobertura.propriedadeNome ?? `Propriedade #${cobertura.propriedadeId}`} - {formatDate(cobertura.dataHora)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Semen: {cobertura.tipoSemen ? semenLabels[cobertura.tipoSemen] : "Nao se aplica"}
                </p>
                {cobertura.observacoes && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cobertura.observacoes}</p>
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
