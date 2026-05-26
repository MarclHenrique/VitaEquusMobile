import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { EmptyState } from "@/components/EmptyState";
import { Baby, Pencil, Plus } from "lucide-react";
import {
  partoService,
  type CondicaoNeonato,
  type PartoApi,
  type PotroApi,
  type ResultadoParto,
  type ResultadoPotro,
  type SexoPotro,
  type TipoParto,
} from "@/services/partoService";
import { getApiErrorMessage, getAuthToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const tipoPartoLabels: Record<TipoParto, string> = {
  NORMAL: "Normal",
  DISTOCICO: "Distócico",
  CESARIANA: "Cesariana",
};

const resultadoPartoLabels: Record<ResultadoParto, string> = {
  VIVO: "Vivo",
  MORTO: "Morto",
};

const sexoLabels: Record<SexoPotro, string> = {
  M: "Macho",
  F: "Fêmea",
};

const resultadoPotroLabels: Record<ResultadoPotro, string> = {
  VIVO: "Vivo",
  MORTO: "Morto",
  NATIMORTO: "Natimorto",
};

const condicaoLabels: Record<CondicaoNeonato, string> = {
  NORMAL: "Normal",
  FRACO: "Fraco",
  EM_OBSERVACAO: "Em observação",
  CRITICO: "Crítico",
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

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "-"}</p>
    </div>
  );
}

export default function DetalheParto() {
  const navigate = useNavigate();
  const { id } = useParams();
  const partoId = Number(id);
  const [parto, setParto] = useState<PartoApi | null>(null);
  const [potros, setPotros] = useState<PotroApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const carregarDetalhe = useCallback(async () => {
    if (!getAuthToken()) {
      toast.error("Faca login para visualizar partos.");
      navigate("/");
      return;
    }

    if (!Number.isFinite(partoId)) {
      toast.error("Parto invalido.");
      navigate("/reproducao/partos");
      return;
    }

    setIsLoading(true);

    try {
      const [partoData, potrosData] = await Promise.all([
        partoService.buscarParto(partoId),
        partoService.listarPotrosDoParto(partoId),
      ]);
      setParto(partoData);
      setPotros(potrosData);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      console.error("Erro ao carregar detalhe do parto:", error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, partoId]);

  useEffect(() => {
    carregarDetalhe();
  }, [carregarDetalhe]);

  return (
    <MobileLayout title="Detalhe do Parto" showBack headerRight={
      <Button size="icon" variant="ghost" onClick={() => navigate(`/reproducao/parto/${partoId}/editar`)}>
        <Pencil className="h-5 w-5" />
      </Button>
    }>
      {isLoading ? (
        <div className="p-4 space-y-4">
          <div className="h-40 rounded-xl border border-border bg-muted animate-pulse" />
          {[1, 2].map((item) => (
            <div key={item} className="h-28 rounded-xl border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : parto ? (
        <div className="p-4 space-y-4">
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground truncate">
                {parto.propriedadeNome ?? `Propriedade #${parto.propriedadeId}`}
              </p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                {resultadoPartoLabels[parto.resultadoParto] ?? parto.resultadoParto}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DetailRow label="Data/Hora" value={formatDateTime(parto.dataHora)} />
              <DetailRow label="Tipo" value={tipoPartoLabels[parto.tipoParto] ?? parto.tipoParto} />
              <DetailRow label="Gestação" value={`#${parto.gestacaoId}`} />
              <DetailRow label="Potros" value={potros.length} />
            </div>
            <DetailRow label="Intercorrências" value={parto.intercorrencias} />
            <DetailRow label="Observações" value={parto.observacoes} />
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Potros</h2>
            <Button size="sm" onClick={() => navigate(`/reproducao/parto/${partoId}/potro/novo`)}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar Potro
            </Button>
          </div>

          {potros.length === 0 ? (
            <EmptyState icon={Baby} title="Nenhum potro" description="O parto pode ser complementado depois" actionLabel="Adicionar Potro" onAction={() => navigate(`/reproducao/parto/${partoId}/potro/novo`)} />
          ) : (
            <div className="space-y-2">
              {potros.map((potro) => (
                <div key={potro.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {potro.nome || potro.identificacao || `Potro #${potro.id}`}
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium shrink-0">
                      {resultadoPotroLabels[potro.resultado] ?? potro.resultado}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sexoLabels[potro.sexo] ?? potro.sexo} - {condicaoLabels[potro.condicaoNeonato] ?? potro.condicaoNeonato}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Peso: {potro.pesoNascimento ?? "-"} kg - Pelagem: {potro.pelagemInicial || "-"}
                  </p>
                  {potro.observacoes && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{potro.observacoes}</p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => navigate(`/reproducao/parto/${partoId}/potro/${potro.id}`)}
                  >
                    Editar Potro
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <EmptyState icon={Baby} title="Parto nao encontrado" description="Volte para a listagem e tente novamente" />
      )}
    </MobileLayout>
  );
}
