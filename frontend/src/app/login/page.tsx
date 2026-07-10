"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthApi } from "@/lib/api/authApi";

export default function LoginPage() {
  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    if (AuthApi.isAuthenticated()) {
      const userId = AuthApi.getCurrentUserId();

      if (userId) {
        // Redirect to the user's dashboard with their ID
        router.push(`/${userId}/dashboard`);
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background text-foreground">
      {/* Left Column - Hero/Editorial Panel */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 bg-card border-r border-border relative overflow-hidden">
        {/* Subtle grid line illustration background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, var(--color-border) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold tracking-wider text-sm font-mono mb-12">
            AIMATCHER
          </div>
          
          <div className="space-y-4 max-w-sm mt-12">
            <h1 className="text-4xl font-bold font-serif tracking-wide leading-tight">
              Encontre a vaga ideal com inteligência.
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              O AIMatcher analisa seu perfil profissional, compara com requisitos reais de mercado e indica o nível exato de compatibilidade de cada oportunidade.
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground/50 font-mono">
          © 2026 AIMatcher. Todos os direitos reservados.
        </div>
      </div>

      {/* Right Column - Form Container */}
      <div className="col-span-1 lg:col-span-7 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold font-serif tracking-wide text-primary">
              AIMATCHER
            </h1>
            <p className="text-muted-foreground text-xs mt-1">
              Encontre as melhores vagas para o seu perfil
            </p>
          </div>
          
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
