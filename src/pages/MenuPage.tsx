import type { ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout, FerraduraIcon, GestacaoIcon } from "@/components/MobileLayout";
import { cn } from "@/lib/utils";
import { clearAuthSession } from "@/lib/authSession";
import { Building2, UserRound, Heart, Stethoscope, Pill, ClipboardList, CheckCircle, LogOut, type LucideIcon } from "lucide-react";
import logo from "@/assets/logo.png";

type MenuIconProps = {
  className?: string;
};

type MenuItem = {
  label: string;
  icon: LucideIcon | ComponentType<MenuIconProps>;
  path: string;
  hidden?: boolean;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const sections: MenuSection[] = [
  {
    title: "Conta",
    items: [
      { label: "Meu Perfil", icon: UserRound, path: "/perfil", hidden: true },
    ]
  },
  {
    title: "Cadastros",
    items: [
      { label: "Propriedades", icon: Building2, path: "/propriedades" },
      { label: "Animais", icon: FerraduraIcon, path: "/animais" },
    ]
  },
  {
    title: "Reprodução",
    items: [
      { label: "Exames Reprodutivos", icon: ClipboardList, path: "/reproducao/exames" },
      { label: "Coberturas", icon: Heart, path: "/reproducao/coberturas" },
      { label: "Gestações", icon: (props: MenuIconProps) => <GestacaoIcon {...props} className={cn(props.className, "scale-[1.5]")} />, path: "/reproducao/gestacoes" },
      { label: "Checkups", icon: CheckCircle, path: "/reproducao/checkups" },
      { label: "Partos", icon: Stethoscope, path: "/reproducao/partos" },
    ]
  },
  {
    title: "Clínico",
    items: [
      { label: "Prontuário", icon: ClipboardList, path: "/clinico/prontuario" },
      { label: "Medicações", icon: Pill, path: "/clinico/medicacoes" },
    ]
  },
];

export default function MenuPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthSession();
    navigate("/");
  };

  return (
    <MobileLayout title="Menu">
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-3 bg-card rounded-xl border border-border p-4">
          <img src={logo} alt="VitaEquus" className="w-10 h-10 rounded-xl object-contain" />
          <div>
            <p className="text-sm font-semibold text-foreground">VitaEquus</p>
            <p className="text-xs text-muted-foreground">v1.0.0</p>
          </div>
        </div>

        {sections.map(s => {
          const visibleItems = s.items.filter(item => !item.hidden);

          if (!visibleItems.length) {
            return null;
          }

          return (
          <div key={s.title}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{s.title}</p>
            <div className="space-y-1">
              {visibleItems.map(item => (
                <button key={item.label} onClick={() => navigate(item.path)} className="flex items-center gap-3 w-full rounded-xl p-3 hover:bg-muted transition-colors">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-foreground">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          );
        })}

        <button onClick={handleLogout} className="flex items-center gap-3 w-full rounded-xl p-3 text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </MobileLayout>
  );
}
