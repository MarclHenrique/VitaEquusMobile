import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { animalService } from "@/services/animalService";
import { propriedadeService, type PropriedadeResumo } from "@/services/propriedadeService";
import {
  exameReprodutivoService,
  type AtualizarExameReprodutivoPayload,
  type CorpoLuteo,
  type CriarExameReprodutivoPayload,
  type EdemaUterino,
  type ExameReprodutivoApi,
  type InsumoResumo,
} from "@/services/exameReprodutivoService";
import { getApiErrorMessage, getAuthToken } from "@/lib/api";
import type { Animal } from "@/types";
import { toast } from "sonner";

const edemaOptions: Array<{ value: EdemaUterino; label: string }> = [
  { value: "AUSENTE", label: "Ausente" },
  { value: "GRAU_1", label: "Grau 1" },
  { value: "GRAU_2", label: "Grau 2" },
  { value: "GRAU_3", label: "Grau 3" },
  { value: "GRAU_4", label: "Grau 4" },
  { value: "GRAU_5", label: "Grau 5" },
];

const corpoLuteoOptions: Array<{ value: CorpoLuteo; label: string }> = [
  { value: "AUSENTE", label: "Ausente" },
  { value: "OVARIO_ESQUERDO", label: "Ovario esquerdo" },
  { value: "OVARIO_DIREITO", label: "Ovario direito" },
  { value: "AMBOS", label: "Ambos" },
];

type FormState = {
  animalId: string;
  propriedadeId: string;
  dataHora: string;
  diametroFolicular: string;
  edemaUterino: EdemaUterino;
  corpoLuteo: CorpoLuteo;
  insumoId: string;
  observacoes: string;
};

const SEM_INSUMO = "none";

const initialForm: FormState = {
  animalId: "",
  propriedadeId: "",
  dataHora: formatDateTimeForInput(new Date().toISOString()),
  diametroFolicular: "",
  edemaUterino: "AUSENTE",
  corpoLuteo: "AUSENTE",
  insumoId: SEM_INSUMO,
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

function getInsumoNome(insumo: InsumoResumo) {
  return insumo.nomeComercial || insumo.nome_comercial || insumo.nome || `Insumo #${insumo.id}`;
}

function isEguaOuReceptora(animal: Animal) {
  const categoria = animal.categoria.toUpperCase();
  return categoria === "EGUA" || categoria === "RECEPTORA";
}

function exameToForm(exame: ExameReprodutivoApi): FormState {
  return {
    animalId: String(exame.animalId),
    propriedadeId: String(exame.propriedadeId),
    dataHora: formatDateTimeForInput(exame.dataHora),
    diametroFolicular: String(exame.diametroFolicular ?? ""),
    edemaUterino: exame.edemaUterino,
    corpoLuteo: exame.corpoLuteo,
    insumoId: exame.insumoId ? String(exame.insumoId) : SEM_INSUMO,
    observacoes: exame.observacoes ?? "",
  };
}

export default function FormExame() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [params] = useSearchParams();
  const isEditing = !!id;
  const [form, setForm] = useState<FormState>({
    ...initialForm,
    animalId: params.get("animalId") ?? "",
  });
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([]);
  const [insumos, setInsumos] = useState<InsumoResumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const animaisElegiveis = useMemo(() => animais.filter(isEguaOuReceptora), [animais]);
  const insumosOrdenados = useMemo(
    () => [...insumos].sort((a, b) => getInsumoNome(a).localeCompare(getInsumoNome(b))),
    [insumos]
  );

  useEffect(() => {
    if (!getAuthToken()) {
      toast.error("Faca login para acessar exames reprodutivos.");
      navigate("/");
      return;
    }

    setIsLoading(true);

    Promise.all([
      animalService.listarAnimais(),
      propriedadeService.listarPropriedadesResumo(),
      exameReprodutivoService.listarInsumos(),
      isEditing && id ? exameReprodutivoService.buscarExameReprodutivo(Number(id)) : Promise.resolve(null),
    ])
      .then(([animaisData, propriedadesData, insumosData, exameData]) => {
        setAnimais(animaisData);
        setPropriedades(propriedadesData);
        setInsumos(insumosData);

        if (exameData) {
          setForm(exameToForm(exameData));
        } else if (propriedadesData.length === 1) {
          setForm((prev) => ({ ...prev, propriedadeId: String(propriedadesData[0].id) }));
        }
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
        console.error("Erro ao carregar exame reprodutivo:", error);
      })
      .finally(() => setIsLoading(false));
  }, [id, isEditing, navigate]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const diametro = Number(form.diametroFolicular);

    if (!form.animalId) return "Selecione uma egua/receptora.";
    if (!form.propriedadeId) return "Selecione uma propriedade.";
    if (!form.dataHora.trim()) return "Informe a data/hora.";
    if (!Number.isFinite(diametro) || diametro <= 0) return "Informe um diametro folicular positivo.";

    return "";
  };

  const buildCreatePayload = (): CriarExameReprodutivoPayload => ({
    animalId: Number(form.animalId),
    propriedadeId: Number(form.propriedadeId),
    dataHora: toBackendDateTime(form.dataHora),
    diametroFolicular: Number(form.diametroFolicular),
    edemaUterino: form.edemaUterino,
    corpoLuteo: form.corpoLuteo,
    insumoId: form.insumoId === SEM_INSUMO ? null : Number(form.insumoId),
    observacoes: form.observacoes.trim(),
  });

  const buildUpdatePayload = (): AtualizarExameReprodutivoPayload => ({
    diametroFolicular: Number(form.diametroFolicular),
    edemaUterino: form.edemaUterino,
    corpoLuteo: form.corpoLuteo,
    insumoId: form.insumoId === SEM_INSUMO ? null : Number(form.insumoId),
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
        await exameReprodutivoService.atualizarExameReprodutivo(Number(id), buildUpdatePayload());
        toast.success("Exame atualizado");
      } else {
        await exameReprodutivoService.criarExameReprodutivo(buildCreatePayload());
        toast.success("Exame registrado");
      }

      navigate("/reproducao/exames");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      console.error("Erro ao salvar exame reprodutivo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout title={isEditing ? "Editar Exame Reprodutivo" : "Novo Exame Reprodutivo"} showBack>
      {isLoading ? (
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-16 rounded-xl border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Egua / Receptora</Label>
            <Select disabled={isEditing} value={form.animalId} onValueChange={(value) => set("animalId", value)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {animaisElegiveis.map((animal) => (
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

          <div className="space-y-2">
            <Label>Data/Hora</Label>
            <Input
              disabled={isEditing}
              value={form.dataHora}
              onChange={(e) => set("dataHora", e.target.value)}
              placeholder="16/05/2026 02:16"
              inputMode="numeric"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Diametro Folicular (mm)</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={form.diametroFolicular}
                onChange={(e) => set("diametroFolicular", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Edema Uterino</Label>
              <Select value={form.edemaUterino} onValueChange={(value: EdemaUterino) => set("edemaUterino", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {edemaOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Corpo Luteo</Label>
            <Select value={form.corpoLuteo} onValueChange={(value: CorpoLuteo) => set("corpoLuteo", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {corpoLuteoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Insumo</Label>
            <Select value={form.insumoId} onValueChange={(value) => set("insumoId", value)}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_INSUMO}>Sem insumo</SelectItem>
                {insumosOrdenados.map((insumo) => (
                  <SelectItem key={insumo.id} value={String(insumo.id)}>{getInsumoNome(insumo)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} rows={3} />
          </div>

          <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : isEditing ? "Salvar Alteracoes" : "Registrar Exame"}
          </Button>
        </form>
      )}
    </MobileLayout>
  );
}
