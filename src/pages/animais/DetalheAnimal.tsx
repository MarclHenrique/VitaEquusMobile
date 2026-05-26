import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { animalService } from "@/services/animalService";
import { getApiErrorMessage } from "@/lib/api";
import type { Animal, CategoriaAnimal, SexoAnimal, StatusAnimal } from "@/types";
import { Button } from "@/components/ui/button";
import { Edit, ClipboardList, Stethoscope, Heart } from "lucide-react";
import { toast } from "sonner";

const categoriaLabels: Record<CategoriaAnimal, string> = {
  GARANHAO: "Garanhão",
  EGUA: "Égua",
  POTRO: "Potro",
  RECEPTORA: "Receptora",
  Garanhao: "Garanhão",
  Egua: "Égua",
  Potro: "Potro",
  Receptora: "Receptora",
};

const sexoLabels: Record<SexoAnimal, string> = {
  M: "Macho",
  F: "Fêmea",
};

const statusLabels: Record<StatusAnimal, string> = {
  ATIVO: "Ativo",
  VENDIDO: "Vendido",
  OBITO: "Óbito",
  ativo: "Ativo",
  vendido: "Vendido",
  obito: "Óbito",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export default function DetalheAnimal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    animalService
      .buscarAnimal(Number(id))
      .then(setAnimal)
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
        console.error("Erro ao carregar animal:", error);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <MobileLayout title="Animal" showBack>
        <div className="p-4 space-y-4">
          <div className="h-20 rounded-xl border border-border bg-muted animate-pulse" />
          <div className="h-48 rounded-xl border border-border bg-muted animate-pulse" />
        </div>
      </MobileLayout>
    );
  }

  if (!animal) {
    return (
      <MobileLayout title="Animal" showBack>
        <p className="p-4 text-muted-foreground">Animal não encontrado</p>
      </MobileLayout>
    );
  }

  const info = [
    { label: "Identificação", value: animal.identificacao || "Sem identificação" },
    { label: "Categoria", value: categoriaLabels[animal.categoria] },
    { label: "Sexo", value: sexoLabels[animal.sexo] },
    { label: "Raça", value: animal.nomeRaca || "Sem Raça Definida" },
    { label: "Pelagem", value: animal.pelagem || "-" },
    { label: "Nascimento", value: formatDate(animal.dataNascimento) },
    { label: "Propriedade", value: animal.nomePropriedade },
    { label: "Status", value: statusLabels[animal.status] },
  ];

  return (
    <MobileLayout title={animal.nome} showBack headerRight={
      <Button size="icon" variant="ghost" onClick={() => navigate(`/animais/${id}/editar`)}>
        <Edit className="h-5 w-5" />
      </Button>
    }>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary overflow-hidden">
            {animal.urlFoto ? (
              <img src={animal.urlFoto} alt={animal.nome} className="w-full h-full object-cover" />
            ) : (
              animal.nome.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{animal.nome}</h2>
            <p className="text-sm text-muted-foreground">{categoriaLabels[animal.categoria]} • {animal.nomeRaca || "Sem Raça Definida"}</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 grid grid-cols-2 gap-3">
          {info.map((item) => (
            <div key={item.label}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
              <p className="text-sm font-medium text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Exame", icon: ClipboardList, path: `/reproducao/exame/novo?animalId=${id}` },
            { label: "Cobertura", icon: Heart, path: `/reproducao/cobertura/novo?animalId=${id}` },
            { label: "Atendimento", icon: Stethoscope, path: `/clinico/atendimento/novo?animalId=${id}` },
          ].map((action) => (
            <button key={action.label} onClick={() => navigate(action.path)} className="flex flex-col items-center gap-1 bg-card rounded-xl border border-border p-3 hover:border-primary/30 transition-colors">
              <action.icon className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-medium text-foreground">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
