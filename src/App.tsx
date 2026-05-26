import { useEffect, useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import logo from "@/assets/logo.png";
import { getAuthToken } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { warmInitialOfflineCache } from "@/services/initialCacheService";

// Pages
import Login from "./pages/Login";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import NotFound from "./pages/NotFound";

// Propriedades
import ListaPropriedades from "./pages/propriedades/ListaPropriedades";
import FormPropriedade from "./pages/propriedades/FormPropriedade";

// Animais
import ListaAnimais from "./pages/animais/ListaAnimais";
import FormAnimal from "./pages/animais/FormAnimal";
import DetalheAnimal from "./pages/animais/DetalheAnimal";

// Veterinários
import MeuPerfil from "./pages/veterinarios/MeuPerfil";

// Reprodução
import ReproducaoHub from "./pages/reproducao/ReproducaoHub";
import ListaExames from "./pages/reproducao/ListaExames";
import FormExame from "./pages/reproducao/FormExame";
import ListaCoberturas from "./pages/reproducao/ListaCoberturas";
import FormCobertura from "./pages/reproducao/FormCobertura";
import ListaGestacoes from "./pages/reproducao/ListaGestacoes";
import FormGestacao from "./pages/reproducao/FormGestacao";
import ListaCheckups from "./pages/reproducao/ListaCheckups";
import FormCheckup from "./pages/reproducao/FormCheckup";
import ListaPartos from "./pages/reproducao/ListaPartos";
import FormParto from "./pages/reproducao/FormParto";
import DetalheParto from "./pages/reproducao/DetalheParto";
import FormPotro from "./pages/reproducao/FormPotro";

// Clínico
import ClinicoHub from "./pages/clinico/ClinicoHub";
import FormAtendimento from "./pages/clinico/FormAtendimento";
import Prontuario from "./pages/clinico/Prontuario";
import FormMedicacao from "./pages/clinico/FormMedicacao";
import ListaMedicacoes from "./pages/clinico/ListaMedicacoes";

function AppBootstrapLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <img src={logo} alt="VitaEquus" className="w-32 h-32 object-contain" />
      <div className="mt-8 h-1 w-16 overflow-hidden rounded-full bg-primary/25">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
      </div>
    </div>
  );
}

function AuthEntry() {
  return getAuthToken() ? <Navigate to="/home" replace /> : <Login />;
}

const App = () => {
  const [showSplash, setShowSplash] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const hideSplash = useCallback(() => setShowSplash(false), []);

  useEffect(() => {
    setIsSessionLoading(false);
    void warmInitialOfflineCache();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatePresence>
            {showSplash && <SplashScreen onFinish={hideSplash} />}
          </AnimatePresence>

          {isSessionLoading ? (
            <AppBootstrapLoading />
          ) : !showSplash && (
            <Routes>
              <Route path="/" element={<AuthEntry />} />
              <Route path="/login" element={<AuthEntry />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/perfil" element={<MeuPerfil />} />

              {/* Propriedades */}
              <Route path="/propriedades" element={<ListaPropriedades />} />
              <Route path="/propriedades/novo" element={<FormPropriedade />} />
              <Route path="/propriedades/:id" element={<FormPropriedade />} />

              {/* Animais */}
              <Route path="/animais" element={<ListaAnimais />} />
              <Route path="/animais/novo" element={<FormAnimal />} />
              <Route path="/animais/:id" element={<DetalheAnimal />} />
              <Route path="/animais/:id/editar" element={<FormAnimal />} />

              {/* Reprodução */}
              <Route path="/reproducao" element={<ReproducaoHub />} />
              <Route path="/reproducao/exames" element={<ListaExames />} />
              <Route path="/reproducao/exame/novo" element={<FormExame />} />
              <Route path="/reproducao/exame/:id" element={<FormExame />} />
              <Route path="/reproducao/coberturas" element={<ListaCoberturas />} />
              <Route path="/reproducao/cobertura/novo" element={<FormCobertura />} />
              <Route path="/reproducao/cobertura/:id" element={<FormCobertura />} />
              <Route path="/reproducao/gestacoes" element={<ListaGestacoes />} />
              <Route path="/reproducao/gestacao/novo" element={<FormGestacao />} />
              <Route path="/reproducao/gestacao/:gestacaoId/checkups" element={<ListaCheckups />} />
              <Route path="/reproducao/gestacao/:gestacaoId/checkup/novo" element={<FormCheckup />} />
              <Route path="/reproducao/gestacao/:gestacaoId/checkup/:checkupId" element={<FormCheckup />} />
              <Route path="/reproducao/checkups" element={<ListaCheckups />} />
              <Route path="/reproducao/checkup/novo" element={<FormCheckup />} />
              <Route path="/reproducao/partos" element={<ListaPartos />} />
              <Route path="/reproducao/parto/novo" element={<FormParto />} />
              <Route path="/reproducao/parto/:id" element={<DetalheParto />} />
              <Route path="/reproducao/parto/:id/editar" element={<FormParto />} />
              <Route path="/reproducao/parto/:partoId/potro/novo" element={<FormPotro />} />
              <Route path="/reproducao/parto/:partoId/potro/:potroId" element={<FormPotro />} />

              {/* Clínico */}
              <Route path="/clinico" element={<ClinicoHub />} />
              <Route path="/clinico/atendimento/novo" element={<FormAtendimento />} />
              <Route path="/clinico/atendimento/:id" element={<FormAtendimento />} />
              <Route path="/clinico/prontuario" element={<Prontuario />} />
              <Route path="/clinico/medicacao/novo" element={<FormMedicacao />} />
              <Route path="/clinico/medicacoes" element={<ListaMedicacoes />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
