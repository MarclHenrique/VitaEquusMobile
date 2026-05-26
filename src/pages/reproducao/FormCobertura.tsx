import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { animalService } from "@/services/animalService";
import { propriedadeService, type PropriedadeResumo } from "@/services/propriedadeService";
import {
  coberturaService,
  type AtualizarCoberturaPayload,
  type CoberturaApi,
  type CriarCoberturaPayload,
  type TipoProcedimento,
  type TipoSemen,
} from "@/services/coberturaService";
import { getApiErrorMessage, getAuthToken } from "@/lib/api";
import type { Animal } from "@/types";
import { toast } from "sonner";

const SEM_SEMEN = "none";

const procedimentoOptions: Array<{ value: TipoProcedimento; label: string }> = [
  { value: "MONTA_NATURAL", label: "Monta Natural" },
  { value: "IA", label: "IA" },
  { value: "TE", label: "TE" },
  { value: "ICSI", label: "ICSI" },
];

const semenOptions: Array<{ value: TipoSemen; label: string }> = [
  { value: "FRESCO", label: "Fresco" },
  { value: "RESFRIADO", label: "Resfriado" },
  { value: "CONGELADO", label: "Congelado" },
];

type FormState = {
  doadoraAnimalId: string;
  produtorAnimalId: string;
  propriedadeId: string;
  tipoProcedimento: TipoProcedimento;
  tipoSemen: TipoSemen | typeof SEM_SEMEN;
  dataHora: string;
  observacoes: string;
};

const initialForm: FormState = {
  doadoraAnimalId: "",
  produtorAnimalId: "",
  propriedadeId: "",
  tipoProcedimento: "IA",
  tipoSemen: "FRESCO",
  dataHora: formatDateTimeForInput(new Date().toISOString()),
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

function isDoadora(animal: Animal) {
  const categoria = animal.categoria.toUpperCase();
  return categoria === "EGUA" || categoria === "RECEPTORA";
}

function isProdutor(animal: Animal) {
  return animal.categoria.toUpperCase() === "GARANHAO";
}

function coberturaToForm(cobertura: CoberturaApi): FormState {
  return {
    doadoraAnimalId: String(cobertura.doadoraAnimalId),
    produtorAnimalId: String(cobertura.produtorAnimalId),
    propriedadeId: String(cobertura.propriedadeId),
    tipoProcedimento: cobertura.tipoProcedimento,
    tipoSemen: cobertura.tipoSemen ?? SEM_SEMEN,
    dataHora: formatDateTimeForInput(cobertura.dataHora),
    observacoes: cobertura.observacoes ?? "",
  };
}

export default function FormCobertura() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [form, setForm] = useState<FormState>(initialForm);
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const doadoras = useMemo(() => animais.filter(isDoadora), [animais]);
  const produtores = useMemo(() => animais.filter(isProdutor), [animais]);
  const semenDisabled = form.tipoProcedimento === "MONTA_NATURAL";

  useEffect(() => {
    if (!getAuthToken()) {
      toast.error("Faca login para acessar coberturas.");
      navigate("/");
      return;
    }

    setIsLoading(true);

    Promise.all([
      animalService.listarAnimais(),
      propriedadeService.listarPropriedadesResumo(),
      isEditing && id ? coberturaService.buscarCobertura(Number(id)) : Promise.resolve(null),
    ])
      .then(([animaisData, propriedadesData, coberturaData]) => {
        setAnimais(animaisData);
        setPropriedades(propriedadesData);

        if (coberturaData) {
          setForm(coberturaToForm(coberturaData));
        } else if (propriedadesData.length === 1) {
          setForm((prev) => ({ ...prev, propriedadeId: String(propriedadesData[0].id) }));
        }
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
        console.error("Erro ao carregar cobertura:", error);
      })
      .finally(() => setIsLoading(false));
  }, [id, isEditing, navigate]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      if (key === "tipoProcedimento" && value === "MONTA_NATURAL") {
        return { ...prev, [key]: value, tipoSemen: SEM_SEMEN };
      }

      if (key === "tipoProcedimento" && prev.tipoSemen === SEM_SEMEN) {
        return { ...prev, [key]: value, tipoSemen: "FRESCO" };
      }

      return { ...prev, [key]: value };
    });
  };

  const validate = () => {
    if (!form.doadoraAnimalId) return "Selecione a doadora.";
    if (!form.produtorAnimalId) return "Selecione o produtor.";
    if (!form.propriedadeId) return "Selecione uma propriedade.";
    if (!form.tipoProcedimento) return "Selecione o procedimento.";
    if (!form.dataHora.trim()) return "Informe a data/hora.";
    if (form.tipoProcedimento !== "MONTA_NATURAL" && form.tipoSemen === SEM_SEMEN) {
      return "Selecione o tipo de semen.";
    }

    return "";
  };

  const getTipoSemenPayload = () => (
    form.tipoProcedimento === "MONTA_NATURAL" || form.tipoSemen === SEM_SEMEN
      ? null
      : form.tipoSemen
  );

  const buildCreatePayload = (): CriarCoberturaPayload => ({
    doadoraAnimalId: Number(form.doadoraAnimalId),
    produtorAnimalId: Number(form.produtorAnimalId),
    propriedadeId: Number(form.propriedadeId),
    tipoProcedimento: form.tipoProcedimento,
    tipoSemen: getTipoSemenPayload(),
    dataHora: toBackendDateTime(form.dataHora),
    observacoes: form.observacoes.trim(),
  });

  const buildUpdatePayload = (): AtualizarCoberturaPayload => ({
    tipoProcedimento: form.tipoProcedimento,
    tipoSemen: getTipoSemenPayload(),
    dataHora: toBackendDateTime(form.dataHora),
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
      if (isEditing && id) {
        await coberturaService.atualizarCobertura(Number(id), buildUpdatePayload());
        toast.success("Cobertura atualizada");
      } else {
        await coberturaService.criarCobertura(buildCreatePayload());
        toast.success("Cobertura registrada");
      }

      navigate("/reproducao/coberturas");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      console.error("Erro ao salvar cobertura:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout title={isEditing ? "Editar Cobertura" : "Nova Cobertura / Inseminacao"} showBack>
      {isLoading ? (
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-16 rounded-xl border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Doadora (Egua)</Label>
            <Select disabled={isEditing} value={form.doadoraAnimalId} onValueChange={(value) => set("doadoraAnimalId", value)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {doadoras.map((animal) => (
                  <SelectItem key={animal.id} value={String(animal.id)}>
                    {animal.nome} {animal.identificacao ? `(${animal.identificacao})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Produtor (Garanhao)</Label>
            <Select disabled={isEditing} value={form.produtorAnimalId} onValueChange={(value) => set("produtorAnimalId", value)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {produtores.map((animal) => (
                  <SelectItem key={animal.id} value={String(animal.id)}>
                    {animal.nome} {animal.identificacao ? `(${animal.identificacao})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Propriedade</Label>
            <Select disabled={isEditing} value={form.propriedadeId} onValueChange={(value) => set("propriedadeId", value)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {propriedades.map((propriedade) => (
                  <SelectItem key={propriedade.id} value={String(propriedade.id)}>{propriedade.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Procedimento</Label>
              <Select value={form.tipoProcedimento} onValueChange={(value: TipoProcedimento) => set("tipoProcedimento", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {procedimentoOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo Semen</Label>
              <Select
                disabled={semenDisabled}
                value={form.tipoSemen}
                onValueChange={(value: TipoSemen | typeof SEM_SEMEN) => set("tipoSemen", value)}
              >
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {form.tipoProcedimento === "MONTA_NATURAL" && (
                    <SelectItem value={SEM_SEMEN}>Nao se aplica</SelectItem>
                  )}
                  {semenOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data/Hora</Label>
            <Input
              value={form.dataHora}
              onChange={(e) => set("dataHora", e.target.value)}
              placeholder="16/05/2026 02:30"
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} rows={3} />
          </div>

          <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : isEditing ? "Salvar Alteracoes" : "Registrar Cobertura"}
          </Button>
        </form>
      )}
    </MobileLayout>
  );
}
