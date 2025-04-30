"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { User } from "@/types/user/User";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, FileUp, FileEdit, Briefcase, Search } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasResume, setHasResume] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (!AuthApi.isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Get current user data from storage
    const userData = AuthApi.getCurrentUser();
    const userId = AuthApi.getCurrentUserId();

    if (userData && userId) {
      // Verify if the URL ID matches the logged-in user's ID
      const urlId = params.id;

      if (urlId !== userId) {
        // If IDs don't match, redirect to the correct dashboard URL
        router.push(`/${userId}/dashboard`);
        return;
      }

      setUser(userData);

      // Check if user has uploaded a resume
      // This is a simplified check - in a real implementation, you would fetch the user data from the API
      // and check if curriculo_processado exists and has data
      setHasResume(
        !!userData.perfil?.titulo ||
          !!(userData.experiencias && userData.experiencias.length > 0)
      );
    } else {
      // If no user data in storage, logout and redirect
      AuthApi.logout();
      router.push("/login");
    }

    setLoading(false);
  }, [router, params]);

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
              <AlertTitle>Status do seu currículo</AlertTitle>
              <AlertDescription>
                {hasResume
                  ? "Seu currículo foi processado e está pronto para matching com vagas."
                  : "Você ainda não fez upload do seu currículo. Faça o upload para começar a encontrar vagas compatíveis."}
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

        {/* Curriculum Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-primary" />
                Upload de Currículo
              </CardTitle>
              <CardDescription>Envie seu currículo em PDF</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Faça upload do seu currículo em PDF e nosso sistema usará IA
                para extrair informações relevantes automaticamente.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => router.push(`/${params.id}/resume/upload`)}
              >
                Fazer Upload
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileEdit className="h-5 w-5 text-primary" />
                Editar Currículo
              </CardTitle>
              <CardDescription>Revise e edite suas informações</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                {hasResume
                  ? "Revise e edite as informações extraídas do seu currículo para melhorar suas chances de matching."
                  : "Após fazer o upload do seu currículo, você poderá revisar e editar as informações extraídas."}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => router.push(`/${params.id}/resume/edit`)}
                disabled={!hasResume}
              >
                Editar Currículo
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Vagas Compatíveis
              </CardTitle>
              <CardDescription>
                Encontre as melhores vagas para seu perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                {hasResume
                  ? "Veja as vagas mais compatíveis com seu perfil, ranqueadas por grau de matching."
                  : "Após cadastrar seu currículo, você poderá ver vagas compatíveis com seu perfil."}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => router.push(`/${params.id}/jobs/matching`)}
                disabled={!hasResume}
              >
                Ver Vagas Compatíveis
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Placeholder content for other features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pesquisar Vagas</CardTitle>
              <CardDescription>
                Busque vagas por título, empresa ou localização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Use filtros avançados para encontrar exatamente o que você está
                procurando no mercado de trabalho.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/${params.id}/jobs/search`)}
              >
                <Search className="h-4 w-4 mr-2" /> Pesquisar Vagas
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
