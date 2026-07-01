"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AuthApi } from "@/lib/api/authApi";
import { ResumeUploadForm } from "@/components/resume/ResumeUploadForm";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft } from "lucide-react";

export default function ResumeUploadPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        router.push(`/${userId}/resume/upload`);
        return;
      }
    } else {
      // If no user data in storage, logout and redirect
      AuthApi.logout();
      router.push("/login");
    }

    setLoading(false);
  }, [router, params]);

  // Handle form success
  const handleSuccess = () => {
    const userId = params.id;
    // Redirect to edit page after successful upload
    router.push(`/${userId}/resume/edit`);
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
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push(`/${params.id}/dashboard`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Dashboard
        </Button>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="w-full max-w-md mx-auto mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            Upload de Currículo
          </h1>
          <p className="text-center text-muted-foreground">
            Faça upload do seu currículo para que possamos analisar e encontrar
            as melhores vagas para você
          </p>
        </div>

        <div className="w-full max-w-md mx-auto">
          <ResumeUploadForm
            onSuccess={handleSuccess}
            redirectPath={`/${params.id}/resume/edit`}
          />

          <div className="mt-6 text-center text-sm text-muted-foreground max-w-md">
            <p>
              Após o upload, nosso sistema usará IA para extrair informações do
              seu currículo. Você poderá revisar e editar essas informações na
              próxima etapa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
