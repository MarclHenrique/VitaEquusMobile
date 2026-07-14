import { useNavigate } from "react-router-dom";
import { MobileLayout, GestacaoIcon } from "@/components/MobileLayout";
import { CheckCircle, ClipboardList, Heart, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const GestacaoModuleIcon = ({ className }: { className?: string }) => (
  <GestacaoIcon className={cn(className, "scale-[1.5]")} />
);

const modules = [
  { label: "Exame Reprodutivo", desc: "Monitoramento folicular", icon: ClipboardList, path: "/reproducao/exames", color: "bg-primary/10 text-primary" },
  { label: "Cobertura / Inseminacao", desc: "IA, TE, ICSI, Monta Natural", icon: Heart, path: "/reproducao/coberturas", color: "bg-secondary/10 text-secondary" },
  { label: "Gestacao", desc: "Diagnostico e acompanhamento", icon: GestacaoModuleIcon, path: "/reproducao/gestacoes", color: "bg-primary/10 text-primary" },
  { label: "Checkup Gestacional", desc: "Acompanhamento periodico", icon: CheckCircle, path: "/reproducao/checkups", color: "bg-secondary/10 text-secondary" },
  { label: "Parto", desc: "Registro de nascimento", icon: Stethoscope, path: "/reproducao/partos", color: "bg-primary/10 text-primary" },
];

export default function ReproducaoHub() {
  const navigate = useNavigate();

  return (
    <MobileLayout title="Reproducao">
      <div className="p-4 space-y-3">
        {modules.map((module) => (
          <button key={module.label} onClick={() => navigate(module.path)} className="w-full bg-card rounded-xl border border-border p-4 text-left hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${module.color}`}>
                <module.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{module.label}</p>
                <p className="text-xs text-muted-foreground">{module.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </MobileLayout>
  );
}
