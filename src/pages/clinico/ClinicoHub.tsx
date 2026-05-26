import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { Stethoscope, Pill, ClipboardList } from "lucide-react";

const modules = [
  { label: "Prontuário", desc: "Histórico de atendimentos", icon: ClipboardList, path: "/clinico/prontuario" },
  { label: "Atendimento Clínico", desc: "Novo atendimento", icon: Stethoscope, path: "/clinico/atendimento/novo" },
  { label: "Medicações", desc: "Controle de aplicações", icon: Pill, path: "/clinico/medicacoes" },
];

export default function ClinicoHub() {
  const navigate = useNavigate();

  return (
    <MobileLayout title="Clínico">
      <div className="p-4 space-y-3">
        {modules.map(m => (
          <button key={m.label} onClick={() => navigate(m.path)} className="w-full bg-card rounded-xl border border-border p-4 text-left hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <m.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </MobileLayout>
  );
}
