"use client";

import { useRouter } from "next/navigation";
import { AuthApi } from "@/lib/api/authApi";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Briefcase, User } from "lucide-react";
import { useEffect, useState } from "react";
import { User as UserType } from "@/types/user/User";

interface HeaderProps {
  userId: string;
  activeTab?: "dashboard" | "jobs";
}

export function Header({ userId, activeTab }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    const userJson = localStorage.getItem(AuthApi.USER_KEY);
    if (userJson) {
      try {
        setUser(JSON.parse(userJson));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLogout = () => {
    AuthApi.logout();
    router.push("/login");
  };

  const isRecruiter = user?.role === "RECRUTADOR";

  return (
    <header className="border-b border-border/40 bg-card/10 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo */}
        <div 
          onClick={() => router.push(isRecruiter ? `/${userId}/dashboard` : `/${userId}/dashboard`)}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <span className="text-primary font-bold tracking-widest text-sm font-mono group-hover:opacity-85 transition-opacity">
            AIMATCHER
          </span>
        </div>

        {/* Center: Navigation Links */}
        <nav className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${userId}/dashboard`)}
            className={`h-9 px-3 text-xs font-mono tracking-wider transition-colors ${
              activeTab === "dashboard"
                ? "text-primary bg-primary/5 font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5 mr-1.5 stroke-[1.5]" />
            DASHBOARD
          </Button>

          {!isRecruiter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${userId}/jobs`)}
              className={`h-9 px-3 text-xs font-mono tracking-wider transition-colors ${
                activeTab === "jobs"
                  ? "text-primary bg-primary/5 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5 mr-1.5 stroke-[1.5]" />
              VAGAS
            </Button>
          )}
        </nav>

        {/* Right Side: Profile Info and Logout */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-serif font-bold text-foreground leading-none">
                {user.nomeCompleto}
              </span>
              <span className="text-[9px] font-mono text-muted-foreground leading-none mt-1 uppercase tracking-wider">
                {isRecruiter ? "Recrutador" : "Candidato"}
              </span>
            </div>
          )}

          <div className="h-8 w-[1px] bg-border/40 hidden sm:block" />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sair do sistema"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4 stroke-[1.5]" />
          </Button>
        </div>

      </div>
    </header>
  );
}
