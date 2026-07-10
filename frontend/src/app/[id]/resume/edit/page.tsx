"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AuthApi } from "@/lib/api/authApi";
import { ResumeEditForm } from "@/components/resume/ResumeEditForm";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function ResumeEditPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (!AuthApi.isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Get current user data from storage
    const userId = AuthApi.getCurrentUserId();

    if (userId) {
      // Verify if the URL ID matches the logged-in user's ID
      const urlId = params.id;

      if (urlId !== userId) {
        // If IDs don't match, redirect to the correct URL
        router.push(`/${userId}/resume/edit`);
        return;
      }

      // Ensure we have the latest user data
      const fetchUserData = async () => {
        try {
          const response = await AuthApi.getUserDetails(userId);
          if (response.status === 200 && response.data) {
            // Update local storage with the latest data
            localStorage.setItem(
              AuthApi.USER_KEY,
              JSON.stringify(response.data)
            );
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError(
            "Não foi possível atualizar os dados do usuário. Algumas informações podem estar desatualizadas."
          );
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    } else {
      // If no user data in storage, logout and redirect
      AuthApi.logout();
      router.push("/login");
    }
  }, [router, params]);

  // Handle data refresh
  const handleRefresh = async () => {
    const userId = AuthApi.getCurrentUserId();
    if (!userId) return;

    setRefreshing(true);
    try {
      const response = await AuthApi.getUserDetails(userId);
      if (response.status === 200 && response.data) {
        // Update local storage with the latest data
        localStorage.setItem(AuthApi.USER_KEY, JSON.stringify(response.data));
        setError(null);
        // Force a reload of the page to refresh the form with the new data
        window.location.reload();
      } else {
        setError(
          "Não foi possível atualizar os dados do usuário. Tente novamente."
        );
      }
    } catch (err) {
      console.error("Error refreshing user data:", err);
      setError("Erro ao atualizar dados do usuário. Tente novamente.");
    } finally {
      setRefreshing(false);
    }
  };

  // Handle form success
  const handleSuccess = () => {
    const userId = params.id;
    // Redirect to dashboard after successful edit
    router.push(`/${userId}/dashboard`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8 lg:p-12 relative overflow-hidden">
      {/* Subtle grid line background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, var(--color-border) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      
      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border/50">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 text-muted-foreground hover:text-foreground mb-1"
              onClick={() => router.push(`/${params.id}/dashboard`)}
            >
              <ArrowLeft className="h-4 w-4 mr-1 stroke-[1.5]" /> Voltar ao Dashboard
            </Button>
            <h1 className="text-3xl font-serif font-bold tracking-wide">Revisar Perfil</h1>
          </div>
          
          <div className="flex gap-2">
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
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-card/10 border border-border/50 p-6 rounded-lg">
          <ResumeEditForm
            userId={params.id as string}
            onSuccess={handleSuccess}
            key={refreshing ? "refreshed" : "normal"} // Force re-render of form on refresh
          />
        </div>

      </div>
    </div>
  );
}
