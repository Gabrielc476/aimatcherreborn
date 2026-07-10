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
import { RecruiterDashboard } from "@/components/dashboard/RecruiterDashboard";
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

  if (user?.role === "RECRUTADOR") {
    return <RecruiterDashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8 lg:p-12 relative overflow-hidden">
      {/* Subtle grid line illustration background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, var(--color-border) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border/50 mb-10">
          <div>
            <h1 className="text-4xl font-bold font-serif tracking-wide">Dashboard</h1>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-1">
              Painel do Candidato
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-9 px-3 dark:bg-input/30"
              title="Atualizar dados do usuário"
            >
              <RefreshCw
                className={`h-4 w-4 stroke-[1.5] ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="ml-2">Atualizar</span>
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-3 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 dark:bg-input/30" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column (2/3 width - 8 cols) - Information and Stats */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Status do Currículo */}
            <div className="bg-card/25 border border-border/40 p-5 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className={`h-5 w-5 mt-0.5 stroke-[1.5] ${hasResume ? "text-emerald-400" : "text-amber-400"}`} />
                <div className="space-y-1">
                  <h3 className="font-serif tracking-wide text-lg">Status do seu currículo</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {hasResume
                      ? "Seu currículo foi processado com sucesso e está pronto para ser comparado com vagas do mercado."
                      : "Você ainda não carregou o seu currículo. Faça o upload do seu arquivo PDF para começarmos a calcular a sua compatibilidade com as vagas."}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Info in Swiss Grid format */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-muted-foreground font-mono uppercase tracking-widest">
                Informações de Perfil
              </h2>
              
              {user && (
                <div className="border border-border/50 rounded-lg overflow-hidden divide-y divide-border/40 bg-card/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/40">
                    <div className="p-4">
                      <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-wider block mb-1">E-mail de Contato</span>
                      <span className="text-sm font-medium">{user.email}</span>
                    </div>
                    <div className="p-4">
                      <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-wider block mb-1">Telefone</span>
                      <span className="text-sm font-medium">{user.telefone || "Não informado"}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/40">
                    <div className="p-4">
                      <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-wider block mb-1">Cargo / Especialidade</span>
                      <span className="text-sm font-medium font-serif">{user.perfil?.titulo || "Não definido"}</span>
                    </div>
                    <div className="p-4">
                      <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-wider block mb-1">Experiência Comprovada</span>
                      <span className="text-sm font-medium">{user.perfil?.anosExperiencia !== undefined && user.perfil.anosExperiencia > 0 ? `${user.perfil.anosExperiencia} anos` : "Não informada"}</span>
                    </div>
                  </div>

                  {(user.experiencias && user.experiencias.length > 0) || (user.formacoes && user.formacoes.length > 0) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/40">
                      <div className="p-4">
                        <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-wider block mb-1">Última Experiência</span>
                        <span className="text-sm font-medium">
                          {user.experiencias && user.experiencias.length > 0
                            ? `${user.experiencias[0].cargo} na ${user.experiencias[0].empresa}`
                            : "Nenhuma cadastrada"}
                        </span>
                      </div>
                      <div className="p-4">
                        <span className="text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-wider block mb-1">Formação Acadêmica</span>
                        <span className="text-sm font-medium">
                          {user.formacoes && user.formacoes.length > 0
                            ? `${user.formacoes[0].grau} em ${user.formacoes[0].curso}`
                            : "Nenhuma cadastrada"}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* General Metadata footer */}
            <div className="pt-4 text-xs text-muted-foreground/50 font-mono">
              Último acesso: {user?.ultimoAcesso ? new Date(user.ultimoAcesso).toLocaleString("pt-BR") : "N/A"}
            </div>

          </div>

          {/* Right Column (1/3 width - 4 cols) - Quick Actions List */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-xs font-bold text-muted-foreground font-mono uppercase tracking-widest">
              Ações Rápidas
            </h2>
            
            <div className="flex flex-col border border-border/50 divide-y divide-border/40 rounded-lg overflow-hidden bg-card/10">
              
              {/* Action 1: Upload */}
              <div 
                onClick={() => router.push(`/${params.id}/resume/upload`)}
                className="p-5 hover:bg-card/40 transition-all duration-200 cursor-pointer group flex items-start gap-4"
              >
                <FileUp className="h-5 w-5 text-primary stroke-[1.5] mt-0.5 group-hover:scale-105 transition-transform" />
                <div>
                  <h3 className="font-serif font-bold text-base group-hover:text-primary transition-colors flex items-center gap-1.5">
                    Upload de Currículo
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Envie um novo arquivo PDF para atualizar suas informações profissionais via IA.
                  </p>
                </div>
              </div>

              {/* Action 2: Editar */}
              <div 
                onClick={() => router.push(`/${params.id}/resume/edit`)}
                className="p-5 hover:bg-card/40 transition-all duration-200 cursor-pointer group flex items-start gap-4"
              >
                <FileEdit className="h-5 w-5 text-primary stroke-[1.5] mt-0.5 group-hover:scale-105 transition-transform" />
                <div>
                  <h3 className="font-serif font-bold text-base group-hover:text-primary transition-colors">
                    Revisar Perfil
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Ajuste manualmente seus dados extraídos para calibrar a precisão do matching.
                  </p>
                </div>
              </div>

              {/* Action 3: Ver Vagas */}
              <div 
                onClick={() => router.push(`/${params.id}/jobs`)}
                className="p-5 hover:bg-card/40 transition-all duration-200 cursor-pointer group flex items-start gap-4"
              >
                <Briefcase className="h-5 w-5 text-primary stroke-[1.5] mt-0.5 group-hover:scale-105 transition-transform" />
                <div>
                  <h3 className="font-serif font-bold text-base group-hover:text-primary transition-colors">
                    Explorar Vagas
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Acesse o painel integrado de vagas e analise sua compatibilidade com vagas ativas.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
