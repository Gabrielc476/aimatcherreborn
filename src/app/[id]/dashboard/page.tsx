"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthApi } from "@/lib/api/authApi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User } from "../../../types/user/User";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (!AuthApi.isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Get current user data from storage
    const userData = AuthApi.getCurrentUser();
    if (userData) {
      setUser(userData);
    } else {
      // If no user data in storage, logout and redirect
      AuthApi.logout();
      router.push("/login");
    }

    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    AuthApi.logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </div>

        {/* Welcome card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              Bem-vindo ao Sistema de Matching de Currículos
            </CardTitle>
            <CardDescription>
              Você está conectado como {user?.nome_completo || "Usuário"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Login bem-sucedido!</AlertTitle>
              <AlertDescription>
                Esta é uma página de placeholder para o dashboard. Em uma
                implementação completa, você veria aqui suas vagas compatíveis,
                status de candidaturas e recomendações.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Seu último acesso foi em:{" "}
              {user?.ultimo_acesso
                ? new Date(user.ultimo_acesso).toLocaleString()
                : "N/A"}
            </p>
          </CardFooter>
        </Card>

        {/* Placeholder content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>Recurso {i}</CardTitle>
                <CardDescription>
                  Demonstração de funcionalidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  Este é um card de placeholder que representaria uma
                  funcionalidade real no dashboard completo do sistema.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Ação {i}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
