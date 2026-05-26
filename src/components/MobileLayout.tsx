import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Heart, Stethoscope, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { SyncStatusIndicator } from "@/components/SyncStatusIndicator";


// Componente que usa CSS Mask para podermos colorir a imagem SVG externa
export const FerraduraIcon = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    className={cn("inline-block bg-currentColor", className)}
    style={{
      maskImage: `url(/ferradura.svg)`,
      maskSize: "contain",
      maskRepeat: "no-repeat",
      maskPosition: "center",
      WebkitMaskImage: `url(/ferradura.svg)`,
      WebkitMaskSize: "contain",
      WebkitMaskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      backgroundColor: "currentColor"
    }}
    {...props}
  />
);

export const GestacaoIcon = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    className={cn("inline-block bg-currentColor scale-[1.5]", className)}
    style={{
      maskImage: `url(/gestacao.svg)`,
      maskSize: "contain",
      maskRepeat: "no-repeat",
      maskPosition: "center",
      WebkitMaskImage: `url(/gestacao.svg)`,
      WebkitMaskSize: "contain",
      WebkitMaskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      backgroundColor: "currentColor"
    }}
    {...props}
  />
);

const tabs = [
  { path: "/animais", label: "Animais", icon: FerraduraIcon },
  { path: "/reproducao", label: "Reprodução", icon: Heart },
  { path: "/home", label: "Início", icon: Home },
  { path: "/clinico", label: "Clínico", icon: Stethoscope },
  { path: "/menu", label: "Menu", icon: Menu },
];

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  hideNav?: boolean;
  headerRight?: ReactNode;
}

export function MobileLayout({ children, title, showBack, hideNav, headerRight }: MobileLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine which tab is active (fallback to index 2 / Home if none match exactly, though usually one does)
  const activeIndex = tabs.findIndex(tab => location.pathname.startsWith(tab.path));
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 2;
  // Calculate the X position of the active circle (each tab is 20% width = 10% center)
  const maskPositionX = `${(safeActiveIndex * 20) + 10}%`;

  return (
    <div className="flex flex-col min-h-screen w-full max-w-md mx-auto bg-background overflow-x-hidden">
      {/* Header */}
      {title && (
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-card border-b border-border backdrop-blur-sm">
          {showBack && (
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}
          <h1 className="text-lg font-semibold text-foreground flex-1 truncate">{title}</h1>
          <SyncStatusIndicator />
          {headerRight}
        </header>
      )}

      {/* Content */}
      <main className={cn("flex-1 overflow-y-auto overflow-x-hidden max-w-full", !hideNav && "pb-20")}>
        {children}
      </main>

      {/* Bottom Tab Bar - Dynamic Curved Cutout */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 w-full z-40" style={{ filter: "drop-shadow(0px -4px 10px rgba(0,0,0,0.05))" }}>
          <div className="relative h-[68px] w-full max-w-md mx-auto">
            {/* Background with Cutout */}
            <div 
              className="absolute inset-0 bg-card border-t border-border rounded-t-[24px]"
              style={{
                maskImage: `radial-gradient(circle at ${maskPositionX} 0px, transparent 38px, black 39px)`,
                maskComposite: "exclude",
                WebkitMaskImage: `radial-gradient(circle at ${maskPositionX} 0px, transparent 38px, black 39px)`,
                WebkitMaskComposite: "destination-out",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            />

            <div className="flex justify-between items-center h-full w-full relative z-10">
              {tabs.map((tab, idx) => {
                const isActive = activeIndex === idx;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.path}
                    onClick={() => navigate(tab.path)}
                    className="relative flex-1 flex flex-col items-center justify-end h-full outline-none pb-2"
                  >
                    <div className="absolute top-0 left-0 w-full h-[68px] flex items-center justify-center pointer-events-none">
                      <motion.div
                        animate={isActive ? { y: -30 } : { y: -4 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center transition-all duration-300",
                            isActive 
                              ? "w-16 h-16 rounded-full shadow-lg border-4 border-background bg-primary text-primary-foreground" 
                              : "w-10 h-10 bg-transparent text-muted-foreground"
                          )}
                        >
                          <Icon className={cn("transition-colors pointer-events-auto", isActive ? "h-7 w-7" : "h-6 w-6")} />
                        </div>
                      </motion.div>
                    </div>
                    
                    <span 
                      translate="no"
                      className={cn(
                        "text-[10px] font-medium transition-all duration-300",
                        isActive ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0 text-muted-foreground"
                      )}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
