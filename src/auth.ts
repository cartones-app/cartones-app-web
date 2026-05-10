import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import type { JWT } from "@auth/core/jwt";

/**
 * Auth.js (NextAuth v5) — Keycloak OIDC via Authorization Code + PKCE (BFF).
 *
 * El secret del client vive solo en el server (Next.js Node runtime). El access
 * token de Keycloak se persiste en el JWT de sesión (cookie cifrada) y se inyecta
 * en cada llamada al backend via interceptor de Axios.
 *
 * Refresh: si el access token expiró y hay refresh token, intercambia silenciosamente
 * contra el endpoint `token` del realm. Si falla, marca `error=RefreshAccessTokenError`
 * y el interceptor de Axios fuerza un re-login completo.
 *
 * Coalescencia de refresh: el endpoint Keycloak invalida el refresh token al primer
 * uso exitoso (Refresh Token Max Reuse Count = 0 por default). Si N requests
 * concurrentes encuentran el access token vencido, deben compartir UNA sola llamada
 * de refresh — sino N-1 fallan con RT inválido y disparan re-login innecesario.
 * `refreshPromise` (module-scoped) coalesce todos los refreshes simultáneos.
 */

let refreshPromise: Promise<JWT> | null = null;

async function doRefresh(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" };
  }
  try {
    const response = await fetch(
      `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: token.refreshToken,
          client_id: process.env.AUTH_KEYCLOAK_ID ?? "",
          client_secret: process.env.AUTH_KEYCLOAK_SECRET ?? "",
        }),
      },
    );
    const refreshed = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
    };
    if (!response.ok || !refreshed.access_token) {
      throw new Error(refreshed.error ?? `refresh failed: ${response.status}`);
    }
    if (!refreshed.expires_in || refreshed.expires_in <= 0) {
      // Keycloak siempre devuelve expires_in en respuestas válidas. Si no viene,
      // no sabemos cuándo expira el nuevo access token y entraríamos en refresh
      // inmediato en la próxima request. Mejor cortar.
      throw new Error("refresh response missing expires_in");
    }
    return {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + refreshed.expires_in,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

function refreshTokenCoalesced(token: JWT): Promise<JWT> {
  if (!refreshPromise) {
    refreshPromise = doRefresh(token).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      // 1) Primer login: persistir los tokens del provider en el JWT de sesión.
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          idToken: account.id_token,
        };
      }

      // 2) Access token todavía vigente: pasar tal cual.
      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }

      // 3) Expiró: refresh coalesced (1 fetch para N callbacks concurrentes).
      return refreshTokenCoalesced(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
});
