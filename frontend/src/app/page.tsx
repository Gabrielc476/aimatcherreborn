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
        router.replace(`/${userId}/dashboard`);
      } else {
        // If authenticated but no ID available (should be rare)
        router.replace("/login");
      }
    } else {
      router.replace("/login");
    }
  }, [router]);

  return null;
}
