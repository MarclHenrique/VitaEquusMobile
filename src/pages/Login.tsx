import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveApiUrl } from "@/lib/api";
import { SESSION_EXPIRED_STORAGE_KEY } from "@/lib/authSession";
import logo from "@/assets/logo.png";

type LoginResponse = {
  token?: string;
  tokenType?: string;
  type?: string;
  nome?: string;
  name?: string;
  veterinarioId?: number | string;
  id?: number | string;
  message?: string;
  error?: string;
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const sessionMessage = localStorage.getItem(SESSION_EXPIRED_STORAGE_KEY);
    if (!sessionMessage) return;

    localStorage.removeItem(SESSION_EXPIRED_STORAGE_KEY);
    setError(sessionMessage);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(resolveApiUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json() as LoginResponse;

      if (!response.ok) {
        throw new Error(data.message || data.error || "Email ou senha invalidos");
      }

      if (!data.token) {
        throw new Error("Token nao recebido do servidor");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("vita_token", data.token);
      localStorage.setItem("vita_token_type", data.tokenType || data.type || "Bearer");
      localStorage.setItem("vita_user", JSON.stringify({
        email,
        nome: data.nome || data.name || email,
        veterinarioId: data.veterinarioId || data.id,
        loggedIn: true,
      }));

      navigate("/home");
    } catch (error: unknown) {
      console.error("Erro no login:", error);
      setError(error instanceof Error ? error.message : "Email ou senha invalidos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-card px-6 max-w-md mx-auto">
      <div className="flex flex-col items-center mb-10">
        <img src={logo} alt="VitaEquus" className="w-48 h-48 object-contain mb-3" />
      </div>

      <form onSubmit={handleLogin} className="w-full space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
