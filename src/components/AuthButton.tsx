"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="opacity-50" />
      </Button>
    );
  }

  if (!session) {
    return (
      <Button variant="outline" size="sm" onClick={() => signIn("keycloak")}>
        <LogIn />
        Iniciar sesión
      </Button>
    );
  }

  const name = session.user?.name ?? session.user?.email ?? "Usuario";

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:inline">
        {name}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <LogOut />
        Salir
      </Button>
    </div>
  );
}
