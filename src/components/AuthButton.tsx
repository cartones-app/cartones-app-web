"use client";

import { signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, ShieldCheck, User } from "lucide-react";
import { useUserPermissions } from "@/lib/auth-utils";

export function AuthButton() {
  const { autenticado, loading, esAdmin, displayName } = useUserPermissions();

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled aria-label="Cargando perfil">
        <User className="opacity-50" />
      </Button>
    );
  }

  if (!autenticado) {
    return (
      <Button variant="outline" size="sm" onClick={() => signIn("keycloak")}>
        <LogIn />
        Iniciar sesión
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {esAdmin && (
        <span
          className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-primary/10 text-primary border border-primary/20"
          title="Tenés rol admin en Keycloak"
        >
          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
          admin
        </span>
      )}
      <span className="text-sm text-muted-foreground hidden sm:inline">
        {displayName ?? "Usuario"}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/" })}
        aria-label="Cerrar sesión"
      >
        <LogOut />
        <span className="hidden sm:inline">Salir</span>
      </Button>
    </div>
  );
}
