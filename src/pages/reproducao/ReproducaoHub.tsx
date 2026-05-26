import { useNavigate } from "react-router-dom";
import { MobileLayout, GestacaoIcon } from "@/components/MobileLayout";
import { ClipboardList, Heart, CheckCircle, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const modules = [
  { label: "Exame Reprodutivo", desc: "Monitoramento folicular", icon: ClipboardList, path: "/reproducao/exames", color: "bg-primary/10 text-primary" },
  { label: "Cobertura / Inseminação", desc: "IA, TE, ICSI, Monta Natural", icon: Heart, path: "/reproducao/coberturas", color: "bg-secondary/10 text-secondary" },
  { label: "Gestação", desc: "Diagnóstico e acompanhamento", icon: (props: any) => <GestacaoIcon {...props} className={cn(props.className, "scale-[1.5]")} />, path: "/reproducao/gestacoes", color: "bg-primary/10 text-primary" },
  { label: "Checkup Gestacional", desc: "Acompanhamento periódico", icon: CheckCircle, path: "/reproducao/checkups", color: "bg-secondary/10 text-secondary" },
  { label: "Parto", desc: "Registro de nascimento", icon: Stethoscope, path: "/reproducao/partos", color: "bg-primary/10 text-primary" },
];

export default function ReproducaoHub() {
  const navigate = useNavigate();

  return (
    <MobileLayout title="Reprodução">
      <div className="p-4 space-y-3">
        {modules.map(m => (
          <button key={m.label} onClick={() => navigate(m.path)} className="w-full bg-card rounded-xl border border-border p-4 text-left hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${m.color}`}>
                <m.icon className="h-6 w-6" />
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
