import { useState } from "react";
import { useLogin } from "../../lib/hooks/useLogin";
import { LoginRequest } from "@/types/auth/LoginRequest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginFormProps {
  onSuccess?: () => void;
  redirectPath?: string;
}

export function LoginForm({
  onSuccess,
  redirectPath = "/dashboard",
}: LoginFormProps) {
  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    senha: "",
  });

  const { login, isLoading, error } = useLogin();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await login(formData);

    if (success) {
      if (onSuccess) {
        onSuccess();
      } else if (redirectPath) {
        // Use window.location for navigation instead of router
        window.location.href = redirectPath;
      }
    }
  };
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Entre com suas credenciais para acessar sua conta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="senha">Senha</Label>
              <a
                href="/esqueci-senha"
                className="text-sm text-primary hover:underline"
              >
                Esqueceu a senha?
              </a>
            </div>
            <Input
              id="senha"
              name="senha"
              type="password"
              placeholder="********"
              value={formData.senha}
              onChange={handleChange}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <a href="/registrar" className="text-primary hover:underline">
            Registre-se
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}

export default LoginForm;
