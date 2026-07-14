import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAuthToken } from "@/lib/api";
import { enumMappers } from "@/lib/enumMappers";
import { propriedadeService } from "@/services/propriedadeService";
import type { Propriedade } from "@/types";
import { toast } from "sonner";

type PropriedadeApi = {
  id: number | string;
  nome: string;
  tipoPropriedade: Propriedade["tipo_propriedade"];
  endereco?: string;
  cidade?: string;
  estado?: string;
  celular?: string;
  email?: string;
};

const tipoPropriedadeOptions: Array<{ value: Propriedade["tipo_propriedade"]; label: string }> = [
  { value: "HARAS", label: "Haras" },
  { value: "CENTRO_DE_REPRODUCAO", label: "Centro de Reproducao" },
  { value: "FAZENDA", label: "Fazenda" },
];

export default function FormPropriedade() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<Omit<Propriedade, "id">>({
    nome: "",
    tipo_propriedade: "HARAS",
    endereco: "",
    cidade: "",
    estado: "",
    telefone: "",
    email: "",
  });

  useEffect(() => {
    if (!id) return;

    if (!getAuthToken()) {
      toast.error("Faca login para editar a propriedade.");
      navigate("/");
      return;
    }

    propriedadeService.buscarPropriedade(id)
      .then((propriedade) => {
        setForm({
          nome: propriedade.nome,
          tipo_propriedade: enumMappers.tipoPropriedade(propriedade.tipoPropriedade ?? "HARAS") as Propriedade["tipo_propriedade"],
          endereco: propriedade.endereco ?? "",
          cidade: propriedade.cidade ?? "",
          estado: propriedade.estado ?? "",
          telefone: propriedade.celular ?? "",
          email: propriedade.email ?? "",
        });
      })
      .catch((error) => {
        toast.error("Nao foi possivel carregar a propriedade.");
        console.error("Erro ao carregar propriedade:", error);
      });
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!getAuthToken()) {
      toast.error("Faca login com um veterinario antes de salvar a propriedade.");
      navigate("/");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        nome: form.nome,
        tipoPropriedade: form.tipo_propriedade,
        endereco: form.endereco,
        cidade: form.cidade,
        estado: form.estado,
        celular: form.telefone,
        email: form.email,
      };

      if (isEditing && id) {
        await propriedadeService.atualizarPropriedade(id, payload);
      } else {
        await propriedadeService.criarPropriedade(payload);
      }

      toast.success(isEditing ? "Propriedade atualizada" : "Propriedade cadastrada");
      navigate("/propriedades");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro de conexao ao tentar salvar a propriedade.";

      toast.error(message);
      console.error("Erro ao salvar propriedade:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <MobileLayout title={isEditing ? "Editar Propriedade" : "Nova Propriedade"} showBack>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} required placeholder="Nome da propriedade" />
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={form.tipo_propriedade} onValueChange={(value) => set("tipo_propriedade", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tipoPropriedadeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Endereco</Label>
          <Input value={form.endereco} onChange={(e) => set("endereco", e.target.value)} placeholder="Endereco" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input value={form.cidade} onChange={(e) => set("cidade", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Input value={form.estado} onChange={(e) => set("estado", e.target.value.toUpperCase())} required maxLength={2} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="contato@exemplo.com" />
          </div>
        </div>
        <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : isEditing ? "Salvar Alteracoes" : "Cadastrar"}
        </Button>
      </form>
    </MobileLayout>
  );
}
