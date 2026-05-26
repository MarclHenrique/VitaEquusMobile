import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  partoService,
  type CondicaoNeonato,
  type PotroApi,
  type ResultadoPotro,
  type SalvarPotroPayload,
  type SexoPotro,
} from "@/services/partoService";
import { getApiErrorMessage, getAuthToken } from "@/lib/api";
import { toast } from "sonner";

const sexoOptions: Array<{ value: SexoPotro; label: string }> = [
  { value: "M", label: "Macho" },
  { value: "F", label: "Fêmea" },
];

const resultadoOptions: Array<{ value: ResultadoPotro; label: string }> = [
  { value: "VIVO", label: "Vivo" },
  { value: "MORTO", label: "Morto" },
  { value: "NATIMORTO", label: "Natimorto" },
];

const condicaoOptions: Array<{ value: CondicaoNeonato; label: string }> = [
  { value: "NORMAL", label: "Normal" },
  { value: "FRACO", label: "Fraco" },
  { value: "EM_OBSERVACAO", label: "Em observação" },
  { value: "CRITICO", label: "Crítico" },
];

type FormState = {
  nome: string;
  identificacao: string;
  sexo: SexoPotro;
  pelagemInicial: string;
  pesoNascimento: string;
  resultado: ResultadoPotro;
  condicaoNeonato: CondicaoNeonato;
  observacoes: string;
};

const initialForm: FormState = {
  nome: "",
  identificacao: "",
  sexo: "M",
  pelagemInicial: "",
  pesoNascimento: "",
  resultado: "VIVO",
  condicaoNeonato: "NORMAL",
  observacoes: "",
};

function potroToForm(potro: PotroApi): FormState {
  return {
    nome: potro.nome ?? "",
    identificacao: potro.identificacao ?? "",
    sexo: potro.sexo,
    pelagemInicial: potro.pelagemInicial ?? "",
    pesoNascimento: potro.pesoNascimento != null ? String(potro.pesoNascimento) : "",
    resultado: potro.resultado,
    condicaoNeonato: potro.condicaoNeonato,
    observacoes: potro.observacoes ?? "",
  };
}

export default function FormPotro() {
  const navigate = useNavigate();
  const { partoId, potroId } = useParams();
  const isEditing = !!potroId;
  const partoIdNumber = Number(partoId);
  const potroIdNumber = Number(potroId);
  const [form, setForm] = useState<FormState>(initialForm);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = useMemo(() => (isEditing ? "Editar Potro" : "Adicionar Potro"), [isEditing]);

  useEffect(() => {
    if (!getAuthToken()) {
      toast.error("Faca login para acessar potros.");
      navigate("/");
      return;
    }

    if (!Number.isFinite(partoIdNumber)) {
      toast.error("Parto invalido.");
      navigate("/reproducao/partos");
      return;
    }

    if (!isEditing) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    partoService.listarPotrosDoParto(partoIdNumber)
      .then((potros) => {
        const potro = potros.find((item) => item.id === potroIdNumber);

        if (!potro) {
          toast.error("Potro nao encontrado.");
          navigate(`/reproducao/parto/${partoIdNumber}`);
          return;
        }

        setForm(potroToForm(potro));
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
        console.error("Erro ao carregar potro:", error);
      })
      .finally(() => setIsLoading(false));
  }, [isEditing, navigate, partoIdNumber, potroIdNumber]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!Number.isFinite(partoIdNumber)) return "Parto invalido.";

    const peso = form.pesoNascimento ? Number(form.pesoNascimento) : null;
    if (peso != null && (!Number.isFinite(peso) || peso <= 0)) return "Informe um peso positivo.";

    return "";
  };

  const buildPayload = (): SalvarPotroPayload => ({
    nome: form.nome.trim(),
    identificacao: form.identificacao.trim(),
    sexo: form.sexo,
    pelagemInicial: form.pelagemInicial.trim(),
    pesoNascimento: form.pesoNascimento ? Number(form.pesoNascimento) : null,
    resultado: form.resultado,
    condicaoNeonato: form.condicaoNeonato,
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
      if (isEditing) {
        await partoService.atualizarPotro(partoIdNumber, potroIdNumber, buildPayload());
        toast.success("Potro atualizado");
      } else {
        await partoService.adicionarPotro(partoIdNumber, buildPayload());
        toast.success("Potro registrado");
      }

      navigate(`/reproducao/parto/${partoIdNumber}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      console.error("Erro ao salvar potro:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout title={title} showBack>
      {isLoading ? (
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-16 rounded-xl border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Potro Estrela 2026" />
          </div>

          <div className="space-y-2">
            <Label>Identificação</Label>
            <Input value={form.identificacao} onChange={(e) => set("identificacao", e.target.value)} placeholder="POT-001" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Sexo</Label>
              <Select value={form.sexo} onValueChange={(value: SexoPotro) => set("sexo", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sexoOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resultado</Label>
              <Select value={form.resultado} onValueChange={(value: ResultadoPotro) => set("resultado", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {resultadoOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Pelagem Inicial</Label>
              <Input value={form.pelagemInicial} onChange={(e) => set("pelagemInicial", e.target.value)} placeholder="Castanha" />
            </div>
            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={form.pesoNascimento}
                onChange={(e) => set("pesoNascimento", e.target.value)}
                placeholder="45.5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Condição do Neonato</Label>
            <Select value={form.condicaoNeonato} onValueChange={(value: CondicaoNeonato) => set("condicaoNeonato", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {condicaoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} rows={3} />
          </div>

          <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : isEditing ? "Salvar Alteracoes" : "Registrar Potro"}
          </Button>
        </form>
      )}
    </MobileLayout>
  );
}
