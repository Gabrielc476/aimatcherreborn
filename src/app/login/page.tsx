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
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Sistema de Matching de Currículos
        </h1>
        <p className="text-center text-muted-foreground">
          Encontre as melhores vagas para o seu perfil
        </p>
      </div>

      <LoginForm redirectPath="/dashboard" />
    </div>
  );
}
