import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { EmptyState } from "@/components/EmptyState";
import { UserRound, Plus, Phone } from "lucide-react";
import { getAll, KEYS } from "@/lib/store";
import type { Veterinario } from "@/types";
import { Button } from "@/components/ui/button";

export default function ListaVeterinarios() {
  const navigate = useNavigate();
  const vets = getAll<Veterinario>(KEYS.veterinarios);

  return (
    <MobileLayout title="Veterinários" showBack headerRight={
      <Button size="icon" variant="ghost" onClick={() => navigate("/veterinarios/novo")}>
        <Plus className="h-5 w-5" />
      </Button>
    }>
      {vets.length === 0 ? (
        <EmptyState icon={UserRound} title="Nenhum veterinário" description="Cadastre o primeiro veterinário" actionLabel="Cadastrar" onAction={() => navigate("/veterinarios/novo")} />
      ) : (
        <div className="p-4 space-y-3">
          {vets.map(v => (
            <button key={v.id} onClick={() => navigate(`/veterinarios/${v.id}/editar`)} className="w-full bg-card rounded-xl border border-border p-4 text-left hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <UserRound className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{v.nome}</p>
                  <p className="text-xs text-muted-foreground">{v.registro_profissional}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{v.telefone}</p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </MobileLayout>
  );
}
