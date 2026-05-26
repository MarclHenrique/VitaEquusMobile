import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { KEYS, create, update, getCurrentVet, getAll } from "@/lib/store";
import type { Veterinario } from "@/types";
import { Save } from "lucide-react";

export default function MeuPerfil() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentVet = getCurrentVet();
  
  // Obter email do usuário logado
  const userStr = localStorage.getItem(KEYS.user);
  const loggedEmail = userStr ? JSON.parse(userStr).email : "";

  const [formData, setFormData] = useState<Partial<Veterinario>>({
    nome: currentVet?.nome || "",
    registro_profissional: currentVet?.registro_profissional || "",
    telefone: currentVet?.telefone || "",
    email: currentVet?.email || loggedEmail,
    base_cidade: currentVet?.base_cidade || "",
  });

  // Se não estiver logado
  useEffect(() => {
    if (!loggedEmail) {
      navigate("/");
    }
  }, [loggedEmail, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.registro_profissional) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nome e Registro Profissional são obrigatórios",
      });
      return;
    }

    try {
      if (currentVet?.id) {
        update<Veterinario>(KEYS.veterinarios, currentVet.id, formData as Veterinario);
        toast({
          title: "Sucesso",
          description: "Perfil atualizado com sucesso",
        });
      } else {
        create<Veterinario>(KEYS.veterinarios, {
          id: crypto.randomUUID(),
          ...(formData as Veterinario),
        });
        toast({
          title: "Sucesso",
          description: "Perfil criado com sucesso",
        });
      }
      navigate(-1);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados do perfil.",
      });
    }
  };

  return (
    <MobileLayout title="Meu Perfil" showBack>
      <div className="p-4">
        {!currentVet && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded-md">
            <p className="font-bold">Atenção</p>
            <p>Antes de usar o aplicativo, você precisa preencher o seu Perfil de Veterinário.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Dr. João Silva"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registro_profissional">CRMV/Registro Profissional *</Label>
            <Input
              id="registro_profissional"
              value={formData.registro_profissional}
              onChange={(e) => setFormData({ ...formData, registro_profissional: e.target.value })}
              placeholder="CRMV-SP 12345"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone / WhatsApp</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail (usado para login) *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              readOnly
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_cidade">Cidade Base</Label>
            <Input
              id="base_cidade"
              value={formData.base_cidade}
              onChange={(e) => setFormData({ ...formData, base_cidade: e.target.value })}
              placeholder="Ex: São Paulo"
            />
          </div>

          <div className="pt-4 pb-20">
            <Button type="submit" className="w-full h-12 text-base font-semibold">
              <Save className="mr-2 h-5 w-5" />
              {currentVet ? "Salvar Alterações" : "Criar Meu Perfil"}
            </Button>
          </div>
        </form>
      </div>
    </MobileLayout>
  );
}
