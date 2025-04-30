"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AuthApi } from "@/lib/api/authApi";
import { ResumeEditForm } from "@/components/resume/ResumeEditForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ResumeEditPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);

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
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push(`/${params.id}/dashboard`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Dashboard
        </Button>

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
        />
      </div>
    </div>
  );
}
