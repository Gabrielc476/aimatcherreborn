"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthApi } from "@/lib/api/authApi";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    if (AuthApi.isAuthenticated()) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router]);

  // Simple loading state while redirect happens
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">Redirecionando...</p>
    </div>
  );
}
