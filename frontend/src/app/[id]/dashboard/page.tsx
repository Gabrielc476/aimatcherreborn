"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AuthApi } from "@/lib/api/authApi";
import { Button } from "@/components/ui/button";
import { profileAsync } from "@/lib/utils/profiler";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User } from "@/types/user/User";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/dashboard/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RecruiterDashboard } from "@/components/dashboard/RecruiterDashboard";
import { AdBanner } from "@/components/dashboard/AdBanner";
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
      const response = await profileAsync("AuthApi.getUserDetails", () => AuthApi.getUserDetails(userId));

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
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Subtle grid line illustration background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, var(--color-border) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      
      {/* Global Header */}
      <Header userId={params.id as string} activeTab="dashboard" />
      
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-10 relative z-10 animate-fade-in">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-border/40">
          <div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-wide text-foreground">
              Olá, {user?.nomeCompleto || "Candidato"}
            </h2>
            <p className="text-sm text-muted-foreground font-mono mt-2 uppercase tracking-widest">
              Bem-vindo ao seu Workspace
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-10 px-4 text-xs dark:bg-input/30"
          >
            <RefreshCw className={`h-4 w-4 mr-2 stroke-[1.5] ${refreshing ? "animate-spin" : ""}`} />
            Atualizar Dados
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 3-Card Symmetric Workspace Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: PDF Resume */}
          <Card className="bg-card/10 border-border/50 flex flex-col justify-between p-8 md:p-10 min-h-[380px] transition-all duration-300 hover:border-primary/40">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-border/30">
                <span className="text-xs font-bold text-muted-foreground font-mono uppercase tracking-wider">01. Currículo PDF</span>
                <Badge variant={hasResume ? "default" : "destructive"} className="text-xs font-mono px-3 py-0.5 rounded-full">
                  {hasResume ? "ENVIADO" : "PENDENTE"}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {hasResume 
                  ? "Seu currículo foi processado com sucesso. Você pode enviar um novo arquivo para atualizar suas experiências a qualquer momento."
                  : "Você ainda não fez o upload do seu currículo. Envie seu arquivo PDF para calcular a compatibilidade com as vagas."
                }
              </p>
            </div>
            
            <Button
              className="w-full mt-8 flex items-center justify-center gap-2 h-11 text-sm font-semibold"
              onClick={() => router.push(`/${params.id}/resume/upload`)}
            >
              <FileUp className="h-4.5 w-4.5 stroke-[1.5]" />
              {hasResume ? "Enviar Novo PDF" : "Fazer Upload PDF"}
            </Button>
          </Card>

          {/* Card 2: Profile Revision */}
          <Card className="bg-card/10 border-border/50 flex flex-col justify-between p-8 md:p-10 min-h-[380px] transition-all duration-300 hover:border-primary/40">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-border/30">
                <span className="text-xs font-bold text-muted-foreground font-mono uppercase tracking-wider">02. Meu Perfil</span>
                <span className="text-xs font-mono text-primary uppercase tracking-wider font-bold">REVISAR</span>
              </div>
              
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="leading-relaxed">
                  Ajuste as informações profissionais extraídas pelo nosso motor de Inteligência Artificial para refinar o cálculo de match.
                </p>
                {user?.perfil?.titulo && (
                  <div className="pt-3 border-t border-border/30 space-y-1.5 font-mono text-xs">
                    <div className="text-foreground truncate"><span className="text-muted-foreground">CARGO:</span> {user.perfil.titulo}</div>
                    <div><span className="text-muted-foreground">EXP:</span> {user.perfil.anosExperiencia || 0} anos</div>
                  </div>
                )}
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full mt-8 flex items-center justify-center gap-2 h-11 text-sm font-semibold dark:bg-input/30"
              onClick={() => router.push(`/${params.id}/resume/edit`)}
            >
              <FileEdit className="h-4.5 w-4.5 stroke-[1.5]" />
              Revisar Perfil
            </Button>
          </Card>

          {/* Card 3: Explore Jobs */}
          <Card className="bg-card/10 border-border/50 flex flex-col justify-between p-8 md:p-10 min-h-[380px] transition-all duration-300 hover:border-primary/40">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-border/30">
                <span className="text-xs font-bold text-muted-foreground font-mono uppercase tracking-wider">03. Oportunidades</span>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-bold">DISPONÍVEIS</span>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                Acesse o painel integrado de vagas e veja a compatibilidade do seu perfil com cada oportunidade em tempo real.
              </p>
            </div>
            
            <Button
              className="w-full mt-8 flex items-center justify-center gap-2 h-11 text-sm font-semibold"
              onClick={() => router.push(`/${params.id}/jobs`)}
            >
              <Briefcase className="h-4.5 w-4.5 stroke-[1.5]" />
              Explorar Vagas
            </Button>
          </Card>
        </div>

        {/* Ad Banner below the 3 cards */}
        <AdBanner />

      </div>
    </div>
  );
}
