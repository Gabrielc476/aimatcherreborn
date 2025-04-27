"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthApi } from "@/lib/api/authApi";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    if (AuthApi.isAuthenticated()) {
      // Get the user ID string
      const userId = AuthApi.getCurrentUserId();

      if (userId) {
        // Redirect to the user's dashboard with their ID
        router.push(`/${userId}/dashboard`);
      } else {
        // If authenticated but no ID available (should be rare)
        router.push("/login");
      }
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
