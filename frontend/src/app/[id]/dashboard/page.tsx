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
import {
  Shield,
  FileUp,
  FileEdit,
  Briefcase,
  Search,
  RefreshCw,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasResume, setHasResume] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserData = async (userId: string) => {
    setRefreshing(true);
    try {
      // Fetch fresh user data from the server
      const response = await AuthApi.getUserDetails(userId);

      if (response.status === 200 && response.data) {
        // Update the user state with fresh data
        setUser(response.data);

        // Update localStorage with fresh data to keep it in sync
        localStorage.setItem(AuthApi.USER_KEY, JSON.stringify(response.data));

        // Check if user has a resume based on server data
        setHasResume(
          !!response.data?.perfil?.titulo ||
            !!(
              response.data?.experiencias &&
              response.data?.experiencias.length > 0
            ) ||
            !!response.data?.curriculoExtraido
        );
        setError(null);
      } else {
        setError(response.erro || "Erro ao carregar dados do usuário");

        // Fall back to localStorage data
        const localUserData = AuthApi.getCurrentUser();
        if (localUserData) {
          setUser(localUserData);
          setHasResume(
            !!localUserData?.perfil?.titulo ||
              !!(
                localUserData?.experiencias &&
                localUserData?.experiencias.length > 0
              )
          );
        }
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Erro ao atualizar dados do usuário. Tente novamente.");

      // Fall back to localStorage data
      const localUserData = AuthApi.getCurrentUser();
      if (localUserData) {
        setUser(localUserData);
        setHasResume(
          !!localUserData?.perfil?.titulo ||
            !!(
              localUserData?.experiencias &&
              localUserData?.experiencias.length > 0
            )
        );
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    if (!AuthApi.isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Get current user ID from storage
    const userId = AuthApi.getCurrentUserId();

    if (userId) {
      // Verify if the URL ID matches the logged-in user's ID
      const urlId = params.id as string;

      if (urlId !== userId) {
        // If IDs don't match, redirect to the correct dashboard URL
        router.push(`/${userId}/dashboard`);
        return;
      }

      // Initialize with local storage data first (for faster UI rendering)
      const localUserData = AuthApi.getCurrentUser();
      if (localUserData) {
        setUser(localUserData);
        setHasResume(
          !!localUserData?.perfil?.titulo ||
            !!(
              localUserData?.experiencias &&
              localUserData?.experiencias.length > 0
            )
        );
      }

      // Then fetch fresh data from the server
      fetchUserData(userId);
    } else {
      // If no user ID in storage, logout and redirect
      AuthApi.logout();
      router.push("/login");
    }
  }, [router, params]);

  const handleRefresh = () => {
    const userId = AuthApi.getCurrentUserId();
    if (userId) {
      fetchUserData(userId);
    }
  };

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
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Atualizar dados do usuário"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="ml-2">Atualizar</span>
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* User info card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              Bem-vindo ao Sistema de Matching de Currículos
            </CardTitle>
            <CardDescription>
              Você está conectado como {user?.nomeCompleto || "Usuário"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Status do seu currículo</AlertTitle>
                <AlertDescription>
                  {hasResume
                    ? "Seu currículo foi processado e está pronto para matching com vagas."
                    : "Você ainda não fez upload do seu currículo. Faça o upload para começar a encontrar vagas compatíveis."}
                </AlertDescription>
              </Alert>

              {/* User info summary */}
              {user && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Email:
                    </h3>
                    <p>{user.email}</p>
                  </div>
                  {user.telefone && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Telefone:
                      </h3>
                      <p>{user.telefone}</p>
                    </div>
                  )}
                  {user.perfil?.titulo && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Cargo:
                      </h3>
                      <p>{user.perfil.titulo}</p>
                    </div>
                  )}
                  {user.perfil?.anosExperiencia !== undefined && user.perfil.anosExperiencia > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Experiência:
                      </h3>
                      <p>{user.perfil.anosExperiencia} anos</p>
                    </div>
                  )}
                  {user.experiencias && user.experiencias.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Última empresa:
                      </h3>
                      <p>
                        {user.experiencias[0].empresa} -{" "}
                        {user.experiencias[0].cargo}
                      </p>
                    </div>
                  )}
                  {user.formacoes && user.formacoes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Formação:
                      </h3>
                      <p>
                        {user.formacoes[0].grau} em {user.formacoes[0].curso}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Seu último acesso foi em:{" "}
            {user?.ultimoAcesso
              ? new Date(user.ultimoAcesso).toLocaleString()
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
            <CardFooter className="flex flex-col gap-2">
              <Button
                className="w-full"
                onClick={() => router.push(`/${params.id}/resume/edit`)}
                disabled={!hasResume}
              >
                Editar Currículo
              </Button>

              {/* Direct access button as a fallback */}
              {!hasResume && (
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => router.push(`/${params.id}/resume/edit`)}
                >
                  Acessar Editor Diretamente
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Vagas Disponíveis
              </CardTitle>
              <CardDescription>
                Explore oportunidades de trabalho disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                {hasResume
                  ? "Encontre as melhores oportunidades para sua carreira e cadastre-se para vagas que correspondam ao seu perfil profissional."
                  : "Explore as vagas disponíveis e comece sua jornada de busca por oportunidades."}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => router.push(`/${params.id}/jobs`)}
              >
                Ver Vagas
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
                onClick={() => router.push(`/${params.id}/jobs`)}
              >
                <Search className="h-4 w-4 mr-2" /> Explorar Vagas
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
