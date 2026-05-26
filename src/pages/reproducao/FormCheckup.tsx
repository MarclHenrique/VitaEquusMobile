import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  gestacaoService,
  type AtualizarCheckupPayload,
  type CriarCheckupPayload,
  type GestacaoApi,
} from "@/services/gestacaoService";
import { getApiErrorMessage, getAuthToken } from "@/lib/api";
import { toast } from "sonner";

type FormState = {
  gestacaoId: string;
  dataHora: string;
  resultado: string;
  observacoes: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function nowBrDateTime() {
  const date = new Date();
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTimeForInput(value: string) {
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  return value;
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

function getGestacaoLabel(gestacao: GestacaoApi) {
  const nome = gestacao.doadoraNome ?? gestacao.animalNome ?? `Gestação #${gestacao.id}`;
  const data = formatDate(gestacao.dataDiagnosticoInicial ?? gestacao.dataPrevisaoParto);

  return data ? `${nome} - ${data}` : nome;
}

export default function FormCheckup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { gestacaoId, checkupId } = useParams();
  const isEditing = !!checkupId;
  const [gestacoes, setGestacoes] = useState<GestacaoApi[]>([]);
  const [form, setForm] = useState<FormState>({
    gestacaoId: gestacaoId || "",
    dataHora: nowBrDateTime(),
    resultado: "",
    observacoes: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const returnTo = useMemo(() => new URLSearchParams(location.search).get("returnTo"), [location.search]);

  const gestacoesOrdenadas = useMemo(
    () => {
      const selecionada = Number(form.gestacaoId);
      return gestacoes
        .filter(
          (gestacao) =>
            (gestacao.resultado === "PRENHE" && gestacao.status === "EM_ANDAMENTO") ||
            gestacao.id === selecionada
        )
        .sort((a, b) => getGestacaoLabel(a).localeCompare(getGestacaoLabel(b)));
    },
    [form.gestacaoId, gestacoes]
  );

  const backToList = (gestacao: string) => returnTo || `/reproducao/gestacao/${gestacao}/checkups`;

  useEffect(() => {
    if (!getAuthToken()) {
      toast.error("Faça login para acessar check-ups.");
      navigate("/");
      return;
    }

    setIsLoading(true);

    const gestacaoIdNumber = Number(gestacaoId);

    Promise.all([
      gestacaoService.listarGestacoes(gestacaoId ? undefined : { resultado: "PRENHE", status: "EM_ANDAMENTO" }),
      isEditing && Number.isFinite(gestacaoIdNumber)
        ? gestacaoService.listarCheckups(gestacaoIdNumber)
        : Promise.resolve([]),
    ])
      .then(([gestacoesData, checkupsData]) => {
        setGestacoes(gestacoesData);

        if (isEditing) {
          const checkup = checkupsData.find((item) => String(item.id) === checkupId);
          if (!checkup || !gestacaoId) {
            toast.error("Check-up não encontrado.");
            navigate(returnTo || "/reproducao/checkups");
            return;
          }

          setForm({
            gestacaoId,
            dataHora: formatDateTimeForInput(checkup.dataHora),
            resultado: checkup.resultado ?? "",
            observacoes: checkup.observacoes ?? "",
          });
        } else if (!gestacaoId) {
          const gestacoesAtivas = gestacoesData.filter(
            (gestacao) => gestacao.resultado === "PRENHE" && gestacao.status === "EM_ANDAMENTO"
          );
          if (gestacoesAtivas.length === 1) {
            setForm((prev) => ({ ...prev, gestacaoId: String(gestacoesAtivas[0].id) }));
          }
        }
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
        console.error("Erro ao carregar check-up:", error);
      })
      .finally(() => setIsLoading(false));
  }, [checkupId, gestacaoId, isEditing, navigate, returnTo]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.gestacaoId) return "Selecione a gestação em andamento.";
    if (!isEditing && !form.dataHora.trim()) return "Informe a data e hora.";
    if (!form.resultado.trim()) return "Informe o resultado ou evolução.";

    return "";
  };

  const buildCreatePayload = (): CriarCheckupPayload => ({
    dataHora: toBackendDateTime(form.dataHora),
    resultado: form.resultado.trim(),
    observacoes: form.observacoes.trim(),
  });

  const buildUpdatePayload = (): AtualizarCheckupPayload => ({
    resultado: form.resultado.trim(),
    observacoes: form.observacoes.trim(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const message = validate();
    if (message) {
      toast.error(message);
      return;
    }

    const gestacaoIdNumber = Number(form.gestacaoId);
    setIsSubmitting(true);

    try {
      if (isEditing && checkupId) {
        await gestacaoService.atualizarCheckup(gestacaoIdNumber, Number(checkupId), buildUpdatePayload());
        toast.success("Check-up atualizado");
      } else {
        await gestacaoService.criarCheckup(gestacaoIdNumber, buildCreatePayload());
        toast.success("Check-up registrado");
      }

      navigate(backToList(String(gestacaoIdNumber)));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      console.error("Erro ao salvar check-up:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout title={isEditing ? "Editar Check-up" : "Novo Check-up Gestacional"} showBack>
      {isLoading ? (
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-16 rounded-xl border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Gestação em Andamento</Label>
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
            <Label>Data e Hora</Label>
            <Input
              disabled={isEditing}
              value={form.dataHora}
              onChange={(e) => set("dataHora", e.target.value)}
              placeholder="16/06/2026 09:00"
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <Label>Resultado / Evolução</Label>
            <Input value={form.resultado} onChange={(e) => set("resultado", e.target.value)} placeholder="Avaliação normal" />
          </div>

          <div className="space-y-2">
            <Label>Observações Ultrassonográficas</Label>
            <Textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} rows={3} />
          </div>

          <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : isEditing ? "Salvar Alterações" : "Registrar Check-up"}
          </Button>
        </form>
      )}
    </MobileLayout>
  );
}
