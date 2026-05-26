import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { create, update, getById, generateId, KEYS } from "@/lib/store";
import type { Veterinario } from "@/types";
import { toast } from "sonner";

export default function FormVeterinario() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [form, setForm] = useState<Omit<Veterinario, 'id'>>({
    nome: '', registro_profissional: '', telefone: '', email: '', base_cidade: ''
  });

  useEffect(() => {
    if (id) {
      const v = getById<Veterinario>(KEYS.veterinarios, id);
      if (v) { const { id: _, ...rest } = v; setForm(rest); }
    }
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && id) { update(KEYS.veterinarios, id, form); toast.success("Veterinário atualizado"); }
    else { create(KEYS.veterinarios, { id: generateId(), ...form }); toast.success("Veterinário cadastrado"); }
    navigate("/veterinarios");
  };

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <MobileLayout title={isEditing ? "Editar Veterinário" : "Cadastro Veterinário"} showBack>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="space-y-2"><Label>Nome</Label><Input value={form.nome} onChange={e => set('nome', e.target.value)} required /></div>
        <div className="space-y-2"><Label>Registro Profissional (CRMV)</Label><Input value={form.registro_profissional} onChange={e => set('registro_profissional', e.target.value)} required /></div>
        <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={e => set('telefone', e.target.value)} /></div>
        <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
        <div className="space-y-2"><Label>Cidade Base</Label><Input value={form.base_cidade} onChange={e => set('base_cidade', e.target.value)} /></div>
        <Button type="submit" className="w-full h-12">{isEditing ? "Salvar" : "Cadastrar"}</Button>
      </form>
    </MobileLayout>
  );
}
