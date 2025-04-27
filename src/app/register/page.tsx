"use client";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthApi } from "@/lib/api/authApi";

export default function RegisterPage() {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Criar Nova Conta
        </h1>
        <p className="text-center text-muted-foreground">
          Registre-se para acessar o sistema de matching de currículos
        </p>
      </div>

      <RegisterForm redirectPath="/login" />

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          Ao se registrar, você concorda com nossos
          <a href="/termos" className="text-primary hover:underline ml-1">
            Termos de Serviço
          </a>{" "}
          e
          <a href="/privacidade" className="text-primary hover:underline ml-1">
            Política de Privacidade
          </a>
          .
        </p>
      </div>
    </div>
  );
}
