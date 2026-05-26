import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { animalService } from "@/services/animalService";
import { coberturaService, type CoberturaApi, type TipoProcedimento } from "@/services/coberturaService";
import {
  gestacaoService,
  type CriarGestacaoPayload,
  type ResultadoGestacao,
} from "@/services/gestacaoService";
import { getApiErrorMessage, getAuthToken } from "@/lib/api";
import type { Animal } from "@/types";
import { toast } from "sonner";

const resultadoOptions: Array<{ value: ResultadoGestacao; label: string }> = [
  { value: "PRENHE", label: "Prenhe" },
  { value: "VAZIA", label: "Vazia" },
  { value: "REABSORCAO", label: "Reabsorção" },
  { value: "ABORTO", label: "Aborto" },
];

type FormState = {
  doadoraId: string;
  coberturaId: string;
  dataDiagnosticoInicial: string;
  resultado: ResultadoGestacao;
  dataPrevisaoParto: string;
  observacoes: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function todayBr() {
  const date = new Date();
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

const initialForm: FormState = {
  doadoraId: "",
  coberturaId: "",
  dataDiagnosticoInicial: todayBr(),
  resultado: "PRENHE",
  dataPrevisaoParto: "",
  observacoes: "",
};

function toBackendDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month}-${day}`;
  }

  return trimmed;
}

function formatDate(value?: string | null) {
  if (!value) return "";

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("pt-BR");
}

function getCoberturaDoadoraId(cobertura: CoberturaApi) {
  return cobertura.doadoraAnimalId;
}

function formatTipoProcedimento(value: TipoProcedimento) {
  const labels: Record<TipoProcedimento, string> = {
    MONTA_NATURAL: "Monta Natural",
    IA: "IA",
    TE: "TE",
    ICSI: "ICSI",
  };

  return labels[value] ?? value;
}

function getCoberturaLabel(cobertura: CoberturaApi) {
  const doadora = cobertura.doadoraNome ?? `Doadora #${getCoberturaDoadoraId(cobertura)}`;
  const data = formatDate(cobertura.dataHora);
  return `${doadora} - ${formatTipoProcedimento(cobertura.tipoProcedimento)}${data ? ` - ${data}` : ""}`;
}

export default function FormGestacao() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(initialForm);
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [coberturas, setCoberturas] = useState<CoberturaApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const doadoras = useMemo(
    () => animais.filter((animal) => ["EGUA", "Egua", "RECEPTORA", "Receptora"].includes(animal.categoria)),
    [animais]
  );

  useEffect(() => {
    if (!getAuthToken()) {
      toast.error("Faça login para acessar gestações.");
      navigate("/");
      return;
    }

    setIsLoading(true);

    Promise.all([
      animalService.listarAnimais(),
      coberturaService.listarCoberturas(),
    ])
      .then(([animaisData, coberturasData]) => {
        setAnimais(animaisData);
        setCoberturas(coberturasData);
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
        console.error("Erro ao carregar dados da gestação:", error);
      })
      .finally(() => setIsLoading(false));
  }, [navigate]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setCobertura = (value: string) => {
    const cobertura = coberturas.find((item) => String(item.id) === value);
    setForm((prev) => ({
      ...prev,
      coberturaId: value,
      doadoraId: cobertura ? String(getCoberturaDoadoraId(cobertura)) : prev.doadoraId,
    }));
  };

  const validate = () => {
    if (!form.coberturaId) return "Selecione a cobertura de referência.";
    if (!form.dataDiagnosticoInicial.trim()) return "Informe a data do diagnóstico inicial.";
    if (form.resultado === "PRENHE" && !form.dataPrevisaoParto.trim()) return "Informe a previsão de parto.";

    return "";
  };

  const buildPayload = (): CriarGestacaoPayload => ({
    coberturaId: Number(form.coberturaId),
    dataDiagnosticoInicial: toBackendDate(form.dataDiagnosticoInicial),
    resultado: form.resultado,
    dataPrevisaoParto: form.resultado === "PRENHE" ? toBackendDate(form.dataPrevisaoParto) : null,
    observacoes: form.observacoes.trim(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const message = validate();
    if (message) {
      toast.error(message);
      return;
    }

    setIsSubmitting(true);

    try {
      await gestacaoService.criarGestacao(buildPayload());
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["gestacoes"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["reproducao"] }),
      ]);
      toast.success("Gestação registrada");
      navigate("/reproducao/gestacoes");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      console.error("Erro ao salvar gestação:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout title="Diagnóstico de Gestação" showBack>
      {isLoading ? (
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-16 rounded-xl border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Égua / Doadora</Label>
            <Select value={form.doadoraId} onValueChange={(value) => set("doadoraId", value)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {doadoras.map((animal) => (
                  <SelectItem key={animal.id} value={String(animal.id)}>{animal.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cobertura de Referência</Label>
            <Select value={form.coberturaId} onValueChange={setCobertura}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {coberturas.map((cobertura) => (
                  <SelectItem key={cobertura.id} value={String(cobertura.id)}>{getCoberturaLabel(cobertura)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data do Diagnóstico Inicial</Label>
            <Input
              value={form.dataDiagnosticoInicial}
              onChange={(e) => set("dataDiagnosticoInicial", e.target.value)}
              placeholder="16/05/2026"
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <Label>Resultado</Label>
            <Select value={form.resultado} onValueChange={(value: ResultadoGestacao) => set("resultado", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {resultadoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.resultado === "PRENHE" && (
            <div className="space-y-2">
              <Label>Data Previsão de Parto</Label>
              <Input
                value={form.dataPrevisaoParto}
                onChange={(e) => set("dataPrevisaoParto", e.target.value)}
                placeholder="16/04/2027"
                inputMode="numeric"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Observações Ultrassonográficas</Label>
            <Textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} rows={3} />
          </div>

          <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Registrar Gestação"}
          </Button>
        </form>
      )}
    </MobileLayout>
  );
}
