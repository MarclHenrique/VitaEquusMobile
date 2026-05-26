import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  clinicoService,
  type AtendimentoClinicoApi,
  type InsumoResumo,
  type MedicacaoPayload,
  type ViaAdministracao,
} from "@/services/clinicoService";
import { getApiErrorMessage, getAuthToken } from "@/lib/api";
import { getInsumoResumoNome } from "@/lib/medicacaoFormat";
import { toast } from "sonner";

const viaOptions: Array<{ value: ViaAdministracao; label: string }> = [
  { value: "INTRAMUSCULAR", label: "IM - Intramuscular" },
  { value: "INTRAVENOSA", label: "IV - Intravenosa" },
  { value: "ORAL", label: "VO - Oral" },
  { value: "SUBCUTANEA", label: "SC - Subcutanea" },
];

type FormState = {
  atendimentoId: string;
  insumoId: string;
  dose: string;
  viaAdministracao: ViaAdministracao | "";
  observacoes: string;
};

const initialForm: FormState = {
  atendimentoId: "",
  insumoId: "",
  dose: "",
  viaAdministracao: "",
  observacoes: "",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("pt-BR");
}

function getInsumoNome(insumo: InsumoResumo) {
  return getInsumoResumoNome(insumo) || "Insumo nao informado";
}

export default function FormMedicacao() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialForm);
  const [atendimentos, setAtendimentos] = useState<AtendimentoClinicoApi[]>([]);
  const [insumos, setInsumos] = useState<InsumoResumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const insumosOrdenados = useMemo(
    () => [...insumos].sort((a, b) => getInsumoNome(a).localeCompare(getInsumoNome(b))),
    [insumos]
  );

  useEffect(() => {
    if (!getAuthToken()) {
      toast.error("Faca login para registrar medicacoes.");
      navigate("/");
      return;
    }

    setIsLoading(true);

    Promise.all([clinicoService.listarAtendimentos(), clinicoService.listarInsumos()])
      .then(([atendimentosData, insumosData]) => {
        setAtendimentos(atendimentosData);
        setInsumos(insumosData);
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
        console.error("Erro ao carregar formulario de medicacao:", error);
      })
      .finally(() => setIsLoading(false));
  }, [navigate]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.atendimentoId) return "Selecione um atendimento.";
    if (!form.insumoId) return "Selecione um medicamento/insumo.";
    if (!form.dose.trim()) return "Informe a dose.";
    if (!form.viaAdministracao) return "Selecione a via de administracao.";

    return "";
  };

  const buildPayload = (): MedicacaoPayload => ({
    insumoId: Number(form.insumoId),
    dose: form.dose.trim(),
    viaAdministracao: form.viaAdministracao as ViaAdministracao,
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
      await clinicoService.registrarMedicacao(Number(form.atendimentoId), buildPayload());
      toast.success("Medicacao registrada");
      setForm(initialForm);
      navigate("/clinico/medicacoes");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      console.error("Erro ao registrar medicacao:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout title="Aplicacao de Medicacao" showBack>
      {isLoading ? (
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-16 rounded-xl border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Atendimento</Label>
            <Select value={form.atendimentoId} onValueChange={(value) => set("atendimentoId", value)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {atendimentos.map((atendimento) => (
                  <SelectItem key={atendimento.id} value={String(atendimento.id)}>
                    {(atendimento.animalNome ?? `Animal #${atendimento.animalId}`)} - {formatDate(atendimento.dataHora)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Medicamento / Insumo</Label>
            <Select value={form.insumoId} onValueChange={(value) => set("insumoId", value)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {insumosOrdenados.map((insumo) => (
                  <SelectItem key={insumo.id} value={String(insumo.id)}>
                    {getInsumoNome(insumo)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Dose</Label>
              <Input value={form.dose} onChange={(e) => set("dose", e.target.value)} placeholder="Ex: 10ml" />
            </div>
            <div className="space-y-2">
              <Label>Via</Label>
              <Select value={form.viaAdministracao} onValueChange={(value: ViaAdministracao) => set("viaAdministracao", value)}>
                <SelectTrigger><SelectValue placeholder="Via" /></SelectTrigger>
                <SelectContent>
                  {viaOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} rows={3} />
          </div>

          <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
            {isSubmitting ? "Registrando..." : "Registrar Medicacao"}
          </Button>
        </form>
      )}
    </MobileLayout>
  );
}
