import { useEffect, useState } from "react";
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
  clinicoService,
  type AtendimentoClinicoApi,
  type AtendimentoPayload,
  type InsumoResumo,
  type MedicacaoApi,
  type TipoAtendimento,
} from "@/services/clinicoService";
import { getApiErrorMessage, getAuthToken } from "@/lib/api";
import { criarInsumoLookup, formatViaAdministracao, getInsumoNome } from "@/lib/medicacaoFormat";
import type { Animal } from "@/types";
import { toast } from "sonner";

const tipoOptions: Array<{ value: TipoAtendimento; label: string }> = [
  { value: "CLINICO_GERAL", label: "Clinico geral" },
  { value: "VACINACAO", label: "Vacinacao" },
  { value: "VERMIFUGACAO", label: "Vermifugacao" },
  { value: "EXAME_LABORATORIO", label: "Exame laboratorial" },
];

type FormState = {
  animalId: string;
  propriedadeId: string;
  dataHora: string;
  tipoAtendimento: TipoAtendimento;
  queixaPrincipal: string;
  diagnosticoPresuntivo: string;
  conduta: string;
};

const initialForm: FormState = {
  animalId: "",
  propriedadeId: "",
  dataHora: formatDateTimeForInput(new Date().toISOString()),
  tipoAtendimento: "CLINICO_GERAL",
  queixaPrincipal: "",
  diagnosticoPresuntivo: "",
  conduta: "",
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

function atendimentoToForm(atendimento: AtendimentoClinicoApi): FormState {
  return {
    animalId: String(atendimento.animalId),
    propriedadeId: String(atendimento.propriedadeId),
    dataHora: formatDateTimeForInput(atendimento.dataHora),
    tipoAtendimento: atendimento.tipoAtendimento,
    queixaPrincipal: atendimento.queixaPrincipal ?? "",
    diagnosticoPresuntivo: atendimento.diagnosticoPresuntivo ?? "",
    conduta: atendimento.conduta ?? "",
  };
}

export default function FormAtendimento() {
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
  const [medicacoes, setMedicacoes] = useState<MedicacaoApi[]>([]);
  const [insumos, setInsumos] = useState<InsumoResumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      toast.error("Faca login para acessar atendimentos.");
      navigate("/");
      return;
    }

    setIsLoading(true);

    Promise.all([
      animalService.listarAnimais(),
      propriedadeService.listarPropriedadesResumo(),
      isEditing && id ? clinicoService.buscarAtendimento(Number(id)) : Promise.resolve(null),
      isEditing && id ? clinicoService.listarMedicacoes(Number(id)) : Promise.resolve([]),
      isEditing ? clinicoService.listarInsumos() : Promise.resolve([]),
    ])
      .then(([animaisData, propriedadesData, atendimentoData, medicacoesData, insumosData]) => {
        setAnimais(animaisData);
        setPropriedades(propriedadesData);
        setMedicacoes(medicacoesData);
        setInsumos(insumosData);

        if (atendimentoData) {
          setForm(atendimentoToForm(atendimentoData));
        } else if (propriedadesData.length === 1) {
          setForm((prev) => ({ ...prev, propriedadeId: String(propriedadesData[0].id) }));
        }
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
        console.error("Erro ao carregar atendimento:", error);
      })
      .finally(() => setIsLoading(false));
  }, [id, isEditing, navigate]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };
  const insumosById = criarInsumoLookup(insumos);

  const validate = () => {
    if (!form.animalId) return "Selecione um animal.";
    if (!form.propriedadeId) return "Selecione uma propriedade.";
    if (!form.tipoAtendimento) return "Selecione o tipo de atendimento.";
    if (!form.queixaPrincipal.trim()) return "Informe a queixa principal.";
    if (!form.diagnosticoPresuntivo.trim()) return "Informe o diagnostico presuntivo.";
    if (!form.conduta.trim()) return "Informe a conduta.";

    return "";
  };

  const buildPayload = (): AtendimentoPayload => ({
    animalId: Number(form.animalId),
    propriedadeId: Number(form.propriedadeId),
    dataHora: toBackendDateTime(form.dataHora),
    tipoAtendimento: form.tipoAtendimento,
    queixaPrincipal: form.queixaPrincipal.trim(),
    diagnosticoPresuntivo: form.diagnosticoPresuntivo.trim(),
    conduta: form.conduta.trim(),
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
      const payload = buildPayload();

      if (isEditing && id) {
        await clinicoService.atualizarAtendimento(Number(id), payload);
        toast.success("Atendimento atualizado");
      } else {
        await clinicoService.criarAtendimento(payload);
        toast.success("Atendimento registrado");
      }

      navigate("/clinico/prontuario");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      console.error("Erro ao salvar atendimento:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout title={isEditing ? "Detalhes do Atendimento" : "Novo Atendimento"} showBack>
      {isLoading ? (
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-16 rounded-xl border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Animal</Label>
            <Select value={form.animalId} onValueChange={(value) => set("animalId", value)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {animais.map((animal) => (
                  <SelectItem key={animal.id} value={String(animal.id)}>
                    {animal.nome} {animal.identificacao ? `(${animal.identificacao})` : ""}
                  </SelectItem>
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
              placeholder="15/05/2026 18:20"
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={form.tipoAtendimento} onValueChange={(value: TipoAtendimento) => set("tipoAtendimento", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {tipoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Queixa Principal *</Label>
            <Textarea required value={form.queixaPrincipal} onChange={(e) => set("queixaPrincipal", e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Diagnostico Presuntivo *</Label>
            <Textarea required value={form.diagnosticoPresuntivo} onChange={(e) => set("diagnosticoPresuntivo", e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Conduta *</Label>
            <Textarea required value={form.conduta} onChange={(e) => set("conduta", e.target.value)} rows={2} />
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label>Medicacoes aplicadas</Label>
              {medicacoes.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-xl border border-border bg-card p-3">
                  Nenhuma medicacao registrada.
                </p>
              ) : (
                <div className="space-y-2">
                  {medicacoes.map((medicacao) => (
                    <div key={medicacao.id} className="rounded-xl border border-border bg-card p-3">
                      <p className="text-sm font-medium text-foreground">{getInsumoNome(medicacao, insumosById)}</p>
                      <p className="text-xs text-muted-foreground">
                        {medicacao.dose} - {formatViaAdministracao(medicacao.viaAdministracao)}
                      </p>
                      {medicacao.observacoes && (
                        <p className="text-xs text-muted-foreground mt-1">{medicacao.observacoes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : isEditing ? "Salvar Alteracoes" : "Registrar Atendimento"}
          </Button>
        </form>
      )}
    </MobileLayout>
  );
}
