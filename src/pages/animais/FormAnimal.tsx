import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { animalService } from "@/services/animalService";
import { racaService } from "@/services/racaService";
import { propriedadeService, type PropriedadeResumo } from "@/services/propriedadeService";
import { getApiErrorMessage, getAuthToken } from "@/lib/api";
import type { Animal, AnimalRequest, CategoriaAnimal, Raca, SexoAnimal, StatusAnimal } from "@/types";
import { toast } from "sonner";
import { isLocalReference } from "@/lib/offlineIdentity";

const categorias: Array<{ value: CategoriaAnimal; label: string }> = [
  { value: "GARANHAO", label: "Garanhão" },
  { value: "EGUA", label: "Égua" },
  { value: "POTRO", label: "Potro" },
  { value: "RECEPTORA", label: "Receptora" },
];

const sexos: Array<{ value: SexoAnimal; label: string }> = [
  { value: "M", label: "Macho" },
  { value: "F", label: "Fêmea" },
];

const statusOptions: Array<{ value: StatusAnimal; label: string }> = [
  { value: "ativo", label: "Ativo" },
  { value: "vendido", label: "Vendido" },
  { value: "obito", label: "Óbito" },
];

type FormState = {
  nome: string;
  identificacao: string;
  categoria: CategoriaAnimal;
  sexo: SexoAnimal;
  dataNascimento: string;
  racaId: string;
  pelagem: string;
  paiId: string;
  maeId: string;
  propriedadeId: string;
  status: StatusAnimal;
  biografia: string;
};

const initialForm: FormState = {
  nome: "",
  identificacao: "",
  categoria: "EGUA",
  sexo: "F",
  dataNascimento: "",
  racaId: "none",
  pelagem: "",
  paiId: "none",
  maeId: "none",
  propriedadeId: "",
  status: "ativo",
  biografia: "",
};

function formatDateForInput(value: string | null) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function toBackendDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return trimmed;

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function getSuggestedSexo(categoria: CategoriaAnimal, currentSexo: SexoAnimal) {
  if (categoria === "GARANHAO" || categoria === "Garanhao") return "M";
  if (categoria === "EGUA" || categoria === "Egua" || categoria === "RECEPTORA" || categoria === "Receptora") return "F";
  return currentSexo;
}

function animalToForm(animal: Animal): FormState {
  return {
    nome: animal.nome,
    identificacao: animal.identificacao ?? "",
    categoria: animal.categoria,
    sexo: animal.sexo,
    dataNascimento: formatDateForInput(animal.dataNascimento),
    racaId: animal.racaId ? String(animal.racaId) : "none",
    pelagem: animal.pelagem ?? "",
    paiId: "none",
    maeId: "none",
    propriedadeId: String(animal.propriedadeId),
    status: animal.status,
    biografia: animal.biografia ?? "",
  };
}

export default function FormAnimal() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [form, setForm] = useState<FormState>(initialForm);
  const [racas, setRacas] = useState<Raca[]>([]);
  const [propriedades, setPropriedades] = useState<PropriedadeResumo[]>([]);
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const machos = useMemo(
    () => animais.filter((animal) => animal.sexo === "M" && String(animal.id) !== id),
    [animais, id]
  );
  const femeas = useMemo(
    () => animais.filter((animal) => animal.sexo === "F" && String(animal.id) !== id),
    [animais, id]
  );

  useEffect(() => {
    if (!getAuthToken()) {
      toast.error("Faça login para salvar animais.");
      navigate("/");
      return;
    }

    Promise.all([
      racaService.listarRacas(),
      propriedadeService.listarPropriedadesResumo(),
      animalService.listarAnimais(),
      isEditing && id ? animalService.buscarAnimal(id) : Promise.resolve(null),
    ])
      .then(([racasData, propriedadesData, animaisData, animalData]) => {
        setRacas(racasData);
        setPropriedades(propriedadesData);
        setAnimais(animaisData);

        if (animalData) {
          setForm(animalToForm(animalData));
        } else if (propriedadesData.length === 1) {
          setForm((prev) => ({ ...prev, propriedadeId: String(propriedadesData[0].id) }));
        }
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
        console.error("Erro ao carregar cadastro de animal:", error);
      })
      .finally(() => setIsLoading(false));
  }, [id, isEditing, navigate]);

  const set = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCategoriaChange = (value: CategoriaAnimal) => {
    setForm((prev) => ({
      ...prev,
      categoria: value,
      sexo: getSuggestedSexo(value, prev.sexo),
    }));
  };

  const buildPayload = (): AnimalRequest => ({
    identificacao: form.identificacao.trim(),
    nome: form.nome.trim(),
    categoria: form.categoria,
    sexo: form.sexo,
    dataNascimento: toBackendDate(form.dataNascimento),
    racaId: form.racaId === "none" ? null : Number(form.racaId),
    pelagem: form.pelagem.trim(),
    propriedadeId: isLocalReference(form.propriedadeId) ? null : Number(form.propriedadeId),
    propriedadeLocalId: isLocalReference(form.propriedadeId) ? form.propriedadeId : null,
    proprietarioId: null,
    cuidadorPropriedadeId: null,
    status: form.status,
    biografia: form.biografia.trim(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.propriedadeId) {
      toast.error("Selecione uma propriedade.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = buildPayload();

      if (isEditing && id) {
        await animalService.atualizarAnimal(id, payload);
        toast.success("Animal atualizado");
      } else {
        await animalService.criarAnimal(payload);
        toast.success("Animal cadastrado");
      }

      navigate("/animais");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      console.error("Erro ao salvar animal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout title={isEditing ? "Editar Animal" : "Cadastro de Animal"} showBack>
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
            <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Identificação</Label>
            <Input value={form.identificacao} onChange={(e) => set("identificacao", e.target.value)} placeholder="Ex: EQ-001" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(value: CategoriaAnimal) => handleCategoriaChange(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.value} value={categoria.value}>{categoria.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sexo</Label>
              <Select value={form.sexo} onValueChange={(value: SexoAnimal) => set("sexo", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sexos.map((sexo) => (
                    <SelectItem key={sexo.value} value={sexo.value}>{sexo.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data de Nascimento</Label>
            <Input value={form.dataNascimento} onChange={(e) => set("dataNascimento", e.target.value)} placeholder="dd/mm/aaaa" inputMode="numeric" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Raça</Label>
              <Select value={form.racaId} onValueChange={(value) => set("racaId", value)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem Raça Definida</SelectItem>
                  {racas.map((raca) => (
                    <SelectItem key={raca.id} value={String(raca.id)}>{raca.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pelagem</Label>
              <Input value={form.pelagem} onChange={(e) => set("pelagem", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Pai</Label>
              <Select value={form.paiId} onValueChange={(value) => set("paiId", value)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Desconhecido</SelectItem>
                  {machos.map((animal) => (
                    <SelectItem key={animal.id} value={String(animal.id)}>{animal.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mãe</Label>
              <Select value={form.maeId} onValueChange={(value) => set("maeId", value)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Desconhecida</SelectItem>
                  {femeas.map((animal) => (
                    <SelectItem key={animal.id} value={String(animal.id)}>{animal.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Propriedade</Label>
            <Select value={form.propriedadeId} onValueChange={(value) => set("propriedadeId", value)} required>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {propriedades.map((propriedade) => (
                  <SelectItem key={propriedade.id} value={String(propriedade.id)}>{propriedade.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(value: StatusAnimal) => set("status", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : isEditing ? "Salvar" : "Cadastrar"}
          </Button>
        </form>
      )}
    </MobileLayout>
  );
}
