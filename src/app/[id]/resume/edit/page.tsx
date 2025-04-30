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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/${params.id}/dashboard`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Dashboard
          </Button>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Atualizar dados do usuário"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Atualizar Dados
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Editar Currículo</h1>
          <p className="text-muted-foreground">
            Revise e edite as informações extraídas do seu currículo. Quanto
            mais completos forem seus dados, melhores serão as recomendações de
            vagas.
          </p>
        </div>

        <ResumeEditForm
          userId={params.id as string}
          onSuccess={handleSuccess}
          key={refreshing ? "refreshed" : "normal"} // Force re-render of form on refresh
        />
      </div>
    </div>
  );
}
