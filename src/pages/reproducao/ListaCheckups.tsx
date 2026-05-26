import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { EmptyState } from "@/components/EmptyState";
import { CheckCircle, Plus } from "lucide-react";
import {
  gestacaoService,
  type CheckupGestacionalApi,
  type GestacaoApi,
} from "@/services/gestacaoService";
import { getApiErrorMessage, getAuthToken, normalizePageResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecordSyncBadge } from "@/components/RecordSyncBadge";
import { toast } from "sonner";

const TODOS = "all";
const PAGE_SIZE = 10;

type CheckupComGestacao = CheckupGestacionalApi & {
  gestacaoId: number;
  gestacaoLabel: string;
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

function getGestacaoLabel(gestacao: GestacaoApi) {
  return gestacao.doadoraNome ?? gestacao.animalNome ?? `Gestação #${gestacao.id}`;
}

function isDateInRange(value: string, dataInicio: string, dataFim: string) {
  const date = value.slice(0, 10);
  const inicio = toBackendDate(dataInicio);
  const fim = toBackendDate(dataFim);

  if (inicio && date < inicio) return false;
  if (fim && date > fim) return false;
  return true;
}

export default function ListaCheckups() {
  const navigate = useNavigate();
  const location = useLocation();
  const { gestacaoId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [gestacoes, setGestacoes] = useState<GestacaoApi[]>([]);
  const [currentGestacaoTitle, setCurrentGestacaoTitle] = useState("");
  const [checkups, setCheckups] = useState<CheckupComGestacao[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const gestacaoIdNumber = useMemo(() => {
    const value = Number(gestacaoId);
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [gestacaoId]);

  const selectedGestacao = gestacaoIdNumber ? String(gestacaoIdNumber) : searchParams.get("gestacaoId") || TODOS;
  const dataInicio = searchParams.get("dataInicio") || "";
  const dataFim = searchParams.get("dataFim") || "";
  const filtroGestacaoId = selectedGestacao !== TODOS ? Number(selectedGestacao) : null;
  const formSearch = useMemo(() => {
    const params = new URLSearchParams(location.search);
    params.set("returnTo", `${location.pathname}${location.search}`);
    const value = params.toString();
    return value ? `?${value}` : "";
  }, [location.pathname, location.search]);

  const novoCheckupPath = filtroGestacaoId
    ? `/reproducao/gestacao/${filtroGestacaoId}/checkup/novo${formSearch}`
    : `/reproducao/checkup/novo${formSearch}`;

  const carregarCheckups = useCallback(async () => {
    if (!getAuthToken()) {
      toast.error("Faça login para visualizar check-ups.");
      navigate("/");
      return;
    }

    setIsLoading(true);

    try {
      const gestacoesData = filtroGestacaoId
        ? [await gestacaoService.buscarGestacao(filtroGestacaoId)]
        : gestacoes;
      setCurrentGestacaoTitle(filtroGestacaoId && gestacoesData[0] ? getGestacaoLabel(gestacoesData[0]) : "");
      const gestacaoLabelById = new Map(gestacoesData.map((gestacao) => [gestacao.id, getGestacaoLabel(gestacao)]));

      const response = await gestacaoService.listarCheckupsPage({
        ...(filtroGestacaoId ? { gestacaoId: filtroGestacaoId } : {}),
        ...(dataInicio ? { dataInicio: toBackendDate(dataInicio) } : {}),
        ...(dataFim ? { dataFim: toBackendDate(dataFim) } : {}),
        page,
        size: PAGE_SIZE,
      });
      const normalized = normalizePageResponse(response, page, PAGE_SIZE);

      setCheckups(
        normalized.content
          .filter((checkup) => isDateInRange(checkup.dataHora, dataInicio, dataFim))
          .map((checkup) => {
            const id = checkup.gestacaoId ?? filtroGestacaoId ?? 0;

            return {
              ...checkup,
              gestacaoId: id,
              gestacaoLabel: gestacaoLabelById.get(id) ?? `Gestacao #${id}`,
            };
          })
      );
      setTotalPages(Math.max(1, normalized.totalPages ?? 1));
    } catch (error) {
      console.error("Erro ao listar check-ups:", error);
      toast.error("Nao foi possivel carregar os check-ups. Veja o console para o erro da API.");
    } finally {
      setIsLoading(false);
    }
  }, [dataFim, dataInicio, filtroGestacaoId, gestacoes, navigate, page]);

  useEffect(() => {
    carregarCheckups();
  }, [carregarCheckups]);

  useEffect(() => {
    if (!getAuthToken()) return;

    gestacaoService.listarGestacoes({ page: 0, size: 20 })
      .then((data) => {
        setGestacoes(data);
        if (filtroGestacaoId) {
          const selected = data.find((gestacao) => gestacao.id === filtroGestacaoId);
          setCurrentGestacaoTitle(selected ? getGestacaoLabel(selected) : "");
        }
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
        console.error("Erro ao carregar filtro de gestações:", error);
      });
  }, [filtroGestacaoId]);

  const setFilter = (key: "gestacaoId" | "dataInicio" | "dataFim", value: string) => {
    const next = new URLSearchParams(searchParams);

    if (!value || value === TODOS) {
      next.delete(key);
    } else {
      next.set(key, value);
    }

    setSearchParams(next);
    setPage(0);
  };

  const title = gestacaoIdNumber && currentGestacaoTitle ? currentGestacaoTitle : "Check-ups Gestacionais";

  return (
    <MobileLayout title={title} showBack headerRight={
      <Button size="icon" variant="ghost" onClick={() => navigate(novoCheckupPath)}><Plus className="h-5 w-5" /></Button>
    }>
      <div className="p-4 space-y-3">
        {!gestacaoIdNumber && (
          <Select value={selectedGestacao} onValueChange={(value) => setFilter("gestacaoId", value)}>
            <SelectTrigger className="bg-card"><SelectValue placeholder="Gestação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas as gestações</SelectItem>
              {gestacoes.map((gestacao) => (
                <SelectItem key={gestacao.id} value={String(gestacao.id)}>{getGestacaoLabel(gestacao)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Input
            className="bg-card"
            value={dataInicio}
            onChange={(e) => setFilter("dataInicio", e.target.value)}
            placeholder="Início dd/mm/aaaa"
            inputMode="numeric"
          />
          <Input
            className="bg-card"
            value={dataFim}
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
        ) : checkups.length === 0 ? (
          <EmptyState icon={CheckCircle} title="Nenhum check-up" description="Ajuste os filtros ou registre o primeiro check-up" actionLabel="Novo Check-up" onAction={() => navigate(novoCheckupPath)} />
        ) : (
          <>
          <div className="space-y-2">
            {checkups.map((checkup) => (
              <button
                key={`${checkup.gestacaoId}-${checkup.id}`}
                type="button"
                onClick={() => navigate(`/reproducao/gestacao/${checkup.gestacaoId}/checkup/${checkup.id}${formSearch}`)}
                className="w-full bg-card rounded-xl border border-border p-4 text-left hover:border-primary/30 active:scale-[0.98] transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{checkup.resultado || "Check-up"}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDateTime(checkup.dataHora)}</p>
                  </div>
                  <RecordSyncBadge status={(checkup as any).syncStatus} />
                </div>
                {!gestacaoIdNumber && (
                  <p className="text-xs text-muted-foreground">{checkup.gestacaoLabel}</p>
                )}
                {checkup.observacoes && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{checkup.observacoes}</p>
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
