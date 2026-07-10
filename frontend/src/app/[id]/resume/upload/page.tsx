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
    <div className="min-h-screen bg-background text-foreground p-8 lg:p-12 relative overflow-hidden">
      {/* Subtle grid line background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, var(--color-border) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      
      <div className="max-w-xl mx-auto relative z-10 space-y-8">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-muted-foreground hover:text-foreground mb-4"
            onClick={() => router.push(`/${params.id}/dashboard`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1 stroke-[1.5]" /> Voltar ao Dashboard
          </Button>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-primary font-mono uppercase tracking-wider block">
              Currículo PDF
            </span>
            <h1 className="text-3xl font-serif font-bold tracking-wide">
              Upload de Currículo
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Faça upload do seu currículo em formato PDF para que possamos extrair e analisar suas experiências e habilidades via IA.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="border border-border/50 bg-card/10 p-6 rounded-lg space-y-6">
          <ResumeUploadForm
            onSuccess={handleSuccess}
            redirectPath={`/${params.id}/resume/edit`}
          />

          <div className="text-xs text-muted-foreground leading-relaxed font-mono pt-4 border-t border-border/30">
            <p>
              * Após o processamento, você poderá revisar e ajustar todas as informações extraídas antes de calcular sua compatibilidade com as vagas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
