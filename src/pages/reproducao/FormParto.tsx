import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { propriedadeService, type PropriedadeResumo } from "@/services/propriedadeService";
import {
  partoService,
  type AtualizarPartoPayload,
  type CriarPartoPayload,
  type GestacaoResumo,
  type PartoApi,
  type ResultadoParto,
  type TipoParto,
} from "@/services/partoService";
import { getApiErrorMessage, getAuthToken } from "@/lib/api";
import { toast } from "sonner";

const tipoPartoOptions: Array<{ value: TipoParto; label: string }> = [
  { value: "NORMAL", label: "Normal" },
  { value: "DISTOCICO", label: "Distócico" },
  { value: "CESARIANA", label: "Cesariana" },
];

const resultadoPartoOptions: Array<{ value: ResultadoParto; label: string }> = [
  { value: "VIVO", label: "Vivo" },
  { value: "MORTO", label: "Morto" },
];

type FormState = {
  gestacaoId: string;
  propriedadeId: string;
  dataHora: string;
  tipoParto: TipoParto;
  resultadoParto: ResultadoParto;
  intercorrencias: string;
  observacoes: string;
};

const initialForm: FormState = {
  gestacaoId: "",
  propriedadeId: "",
  dataHora: formatDateTimeForInput(new Date().toISOString()),
  tipoParto: "NORMAL",
  resultadoParto: "VIVO",
  intercorrencias: "",
  observacoes: "",
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateTimeForInput(value: string) {
  if (!value) return "";
  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return value;

  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

function toBackendDateTime(value: string) {
  const trimmed = value.trim();
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);

  if (brMatch) {
    const [, day, month, year, hour, minute] = brMatch;
    return `${year}-${month}-${day}T${hour}:${minute}:00`;
  }

  const htmlMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (htmlMatch) return `${trimmed}:00`;

  return trimmed;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("pt-BR");
}

function getGestacaoLabel(gestacao: GestacaoResumo) {
  const nome = gestacao.doadoraNome ?? gestacao.animalNome ?? `Gestação #${gestacao.id}`;
  const data = formatDate(gestacao.dataDiagnosticoInicial ?? gestacao.dataPrevisaoParto);

  return data ? `${nome} - ${data}` : nome;
}

function partoToForm(parto: PartoApi): FormState {
  return {
    gestacaoId: String(parto.gestacaoId),
    propriedadeId: String(parto.propriedadeId),
    dataHora: formatDateTimeForInput(parto.dataHora),
    tipoParto: parto.tipoParto,
    resultadoParto: parto.resultadoParto,
    intercorrencias: parto.intercorrencias ?? "",
    observacoes: parto.observacoes ?? "",
  };
}

export default function FormParto() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const isEditing = !!id;
  const [form, setForm] = useState<FormState>(initialForm);
  const [gestacoes, setGestacoes] = useState<GestacaoResumo[]>([]);
  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gestacoesOrdenadas = useMemo(
    () =>
      gestacoes
        .filter(
          (gestacao) =>
            (gestacao.resultado === "PRENHE" && gestacao.status === "EM_ANDAMENTO") ||
            (isEditing && form.gestacaoId === String(gestacao.id))
        )
        .sort((a, b) => getGestacaoLabel(a).localeCompare(getGestacaoLabel(b))),
    [form.gestacaoId, gestacoes, isEditing]
  );

  useEffect(() => {
    if (!getAuthToken()) {
      toast.error("Faca login para acessar partos.");
      navigate("/");
      return;
    }

    setIsLoading(true);

    Promise.all([
      isEditing
        ? partoService.listarGestacoes()
        : partoService.listarGestacoes({ resultado: "PRENHE", status: "EM_ANDAMENTO" }),
      propriedadeService.listarPropriedadesResumo(),
      isEditing && id ? partoService.buscarParto(Number(id)) : Promise.resolve(null),
    ])
      .then(([gestacoesData, propriedadesData, partoData]) => {
        setGestacoes(gestacoesData);
        setPropriedades(propriedadesData);

        if (partoData) {
          setForm(partoToForm(partoData));
        } else if (propriedadesData.length === 1) {
          setForm((prev) => ({ ...prev, propriedadeId: String(propriedadesData[0].id) }));
        }
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
        console.error("Erro ao carregar parto:", error);
      })
      .finally(() => setIsLoading(false));
  }, [id, isEditing, navigate]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.gestacaoId) return "Selecione uma gestação.";
    if (!form.propriedadeId) return "Selecione uma propriedade.";
    if (!form.dataHora.trim()) return "Informe a data/hora.";

    return "";
  };

  const buildCreatePayload = (): CriarPartoPayload => ({
    gestacaoId: Number(form.gestacaoId),
    propriedadeId: Number(form.propriedadeId),
    dataHora: toBackendDateTime(form.dataHora),
    tipoParto: form.tipoParto,
    resultadoParto: form.resultadoParto,
    intercorrencias: form.intercorrencias.trim(),
    observacoes: form.observacoes.trim() || null,
    potros: [],
  });

  const buildUpdatePayload = (): AtualizarPartoPayload => {
    const { potros, ...payload } = buildCreatePayload();
    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const message = validate();
    if (message) {
      toast.error(message);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && id) {
        await partoService.atualizarParto(Number(id), buildUpdatePayload());
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["gestacoes"] }),
          queryClient.invalidateQueries({ queryKey: ["partos"] }),
        ]);
        toast.success("Parto atualizado");
        navigate(`/reproducao/parto/${id}`);
      } else {
        const parto = await partoService.criarParto(buildCreatePayload());
        await Promise.all([
          partoService.listarGestacoes({ resultado: "PRENHE", status: "EM_ANDAMENTO" }),
          partoService.listarPartos(),
          queryClient.invalidateQueries({ queryKey: ["gestacoes"] }),
          queryClient.invalidateQueries({ queryKey: ["partos"] }),
        ]);
        toast.success("Parto registrado");
        navigate(`/reproducao/parto/${parto.id}`);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      console.error("Erro ao salvar parto:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout title={isEditing ? "Editar Parto" : "Registrar Parto"} showBack>
      {isLoading ? (
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-16 rounded-xl border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Gestação</Label>
            <Select disabled={isEditing} value={form.gestacaoId} onValueChange={(value) => set("gestacaoId", value)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {gestacoesOrdenadas.map((gestacao) => (
                  <SelectItem key={gestacao.id} value={String(gestacao.id)}>{getGestacaoLabel(gestacao)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Propriedade</Label>
            <Select value={form.propriedadeId} onValueChange={(value) => set("propriedadeId", value)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {propriedades.map((propriedade) => (
                  <SelectItem key={propriedade.id} value={String(propriedade.id)}>{propriedade.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data/Hora</Label>
            <Input
              value={form.dataHora}
              onChange={(e) => set("dataHora", e.target.value)}
              placeholder="17/05/2026 13:30"
              inputMode="numeric"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo de Parto</Label>
              <Select value={form.tipoParto} onValueChange={(value: TipoParto) => set("tipoParto", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tipoPartoOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resultado</Label>
              <Select value={form.resultadoParto} onValueChange={(value: ResultadoParto) => set("resultadoParto", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {resultadoPartoOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Intercorrências</Label>
            <Textarea value={form.intercorrencias} onChange={(e) => set("intercorrencias", e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} rows={3} />
          </div>

          <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : isEditing ? "Salvar Alteracoes" : "Registrar Parto"}
          </Button>
        </form>
      )}
    </MobileLayout>
  );
}
