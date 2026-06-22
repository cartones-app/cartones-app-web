import NextAuth, { customFetch } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import type { JWT } from "next-auth/jwt";

/**
 * Backchannel interno: el server de Next habla con Keycloak server-to-server
 * (discovery, token, userinfo, jwks, refresh). Si esas llamadas usan la URL
 * pública (https://keycloak.eliasg.uk), salen de la VPS hacia Cloudflare y
 * vuelven a entrar (hairpin): ~250ms extra por login/refresh y dependencia del
 * tunnel en el camino crítico. Reescribimos solo el DESTINO del fetch al DNS
 * interno de docker (http://keycloak:8080); NO tocamos issuer/iss/jwks_uri, así
 * que la validación de firma e `iss` se mantiene contra la URL pública.
 *
 * La URL de `authorization` (redirect del browser) NO pasa por customFetch
 * ni por doRefresh, por lo que sigue siendo la pública.
 */
const KC_INTERNAL_ORIGIN = process.env.KC_INTERNAL_ORIGIN ?? "http://keycloak:8080";

function kcPublicOrigin(): string {
  try {
    return new URL(process.env.AUTH_KEYCLOAK_ISSUER ?? "").origin;
  } catch {
    return "";
  }
}

function toInternalUrl(url: string): string {
  const pub = kcPublicOrigin();
  return pub && url.startsWith(pub) ? KC_INTERNAL_ORIGIN + url.slice(pub.length) : url;
}

const backchannelFetch: typeof fetch = (input, init) => {
  if (typeof input === "string") return fetch(toInternalUrl(input), init);
  if (input instanceof URL) return fetch(toInternalUrl(input.toString()), init);
  const req = input as Request;
  const rewritten = toInternalUrl(req.url);
  return rewritten === req.url ? fetch(req, init) : fetch(new Request(rewritten, req), init);
};


/**
 * Auth.js (NextAuth v5) — Keycloak OIDC via Authorization Code + PKCE (BFF).
 *
 * El secret del client vive solo en el server (Next.js Node runtime). El access
 * token de Keycloak se persiste en el JWT de sesión (cookie cifrada) y se inyecta
 * en cada llamada al backend via interceptor de Axios.
 *
 * Refresh: si el access token expiró (o está por expirar dentro del margen)
 * y hay refresh token, intercambia silenciosamente contra el endpoint `token`
 * del realm. Si falla, marca `error=RefreshAccessTokenError` y el interceptor
 * de Axios fuerza un re-login completo.
 *
 * Coalescencia de refresh: el endpoint Keycloak invalida el refresh token al primer
 * uso exitoso (Refresh Token Max Reuse Count = 0 por default). Si N requests
 * concurrentes encuentran el access token vencido, deben compartir UNA sola llamada
 * de refresh — sino N-1 fallan con RT inválido y disparan re-login innecesario.
 * Usamos un `Map<refreshToken, Promise>` para coalescer POR TOKEN, evitando
 * mezclar sesiones de usuarios distintos en el mismo proceso Node.
 *
 * Limitación: la coalescencia es por proceso Node. En deploys multi-instancia
 * (Vercel con varias regiones / workers), procesos distintos pueden refrescar en
 * paralelo. No es un bug per se — el primer RT exitoso "gana", los demás reciben
 * RefreshAccessTokenError y disparan re-login. Aceptable; si llega a ser problema,
 * coordinar via storage compartido (Vercel KV, Redis).
 *
 * Edge-compat: el decode del JWT (extractRoles) usa atob+URI-decoding, sin
 * dependencia de Node `Buffer`. Funciona tanto en runtime Node como Edge
 * (middleware) por si la session se lee en ese contexto.
 */

/** Margen para refrescar antes del expiry — evita que un access token expire
 *  "en vuelo" entre que pasamos por el callback y el backend lo valida. */
const TOKEN_REFRESH_MARGIN_SECONDS = 15;

/**
 * Decodifica el payload de un JWT compact sin verificar firma. Solo lo usamos
 * para extraer claims del access token que viene de Keycloak (ya validado por
 * Keycloak antes de devolverlo a este server-side callback).
 *
 * Defensivo ante tokens malformados — si algo falla devuelve null. Nunca lanza.
 * Compatible con Edge runtime: no usa Node `Buffer`.
 */
function decodeJwtPayloadUnsafe(jwt: string | undefined): Record<string, unknown> | null {
  if (!jwt) return null;
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;
  try {
    // base64url -> base64
    const b64 = parts[1].replaceAll("-", "+").replaceAll("_", "/");
    // Decode con soporte UTF-8 (atob solo maneja latin1; el truco percent-encoded
    // mapea bytes 0-255 a una secuencia URL-encoded que decodeURIComponent interpreta
    // correctamente como UTF-8).
    const raw = atob(b64);
    const json = decodeURIComponent(
      [...raw]
        .map((c) => "%" + ("00" + (c.codePointAt(0) ?? 0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Extrae los roles del realm en un JWT de Keycloak.
 * Keycloak los expone en `realm_access.roles: string[]`.
 */
function extractRoles(jwt: string | undefined): string[] {
  const payload = decodeJwtPayloadUnsafe(jwt);
  if (!payload) return [];
  const realmAccess = payload["realm_access"];
  if (!realmAccess || typeof realmAccess !== "object") return [];
  const roles = (realmAccess as { roles?: unknown }).roles;
  if (!Array.isArray(roles)) return [];
  return roles.filter((r): r is string => typeof r === "string");
}

async function doRefresh(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" };
  }
  try {
    const response = await fetch(
      toInternalUrl(`${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`),
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
      // Si Keycloak no rota el RT en esta llamada, mantenemos el anterior.
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + refreshed.expires_in,
      // Los roles pueden cambiar entre refreshes (admin removido en runtime).
      // Releemos del access token nuevo en lugar de heredar los viejos.
      roles: extractRoles(refreshed.access_token),
      error: undefined,
    };
  } catch (error) {
    // Visibilidad en logs server-side; el cliente solo ve `error` en la session.
    console.error("[auth] Refresh access token failed:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

/**
 * Coalescencia + cache TTL por refresh token.
 *
 * Problema: la cookie JWT cifrada de Auth.js se actualiza al final de cada
 * request. Si N requests llegan en serie justo cuando el access token expira,
 * la primera refresca (RT1 -> RT2, RT1 queda invalidado en KC) y actualiza su
 * cookie. Pero las siguientes pueden haber leido la cookie ANTES de que la
 * primera la actualizara — llegan con RT1 ya consumido y reciben `invalid_grant`.
 *
 * El Map de promesas en curso solo cubre el caso concurrente puro (todas dentro
 * del mismo tick). Para el caso secuencial-con-lag de cookies, cacheamos el
 * RESULTADO por unos segundos: cualquier request que llegue con el viejo RT
 * dentro del TTL recibe el JWT ya refrescado sin volver a pegarle a Keycloak.
 */
const REFRESH_RESULT_TTL_MS = 30_000;
type RefreshEntry = { promise: Promise<JWT>; resolvedAt?: number; result?: JWT };
const refreshCache = new Map<string, RefreshEntry>();

function refreshTokenCoalesced(token: JWT): Promise<JWT> {
  const key = token.refreshToken;
  if (!key) {
    // Sin refresh token no podemos coalescer; doRefresh igual va a fallar con
    // RefreshAccessTokenError, lo devolvemos directo.
    return doRefresh(token);
  }
  const existing = refreshCache.get(key);
  if (existing) {
    // Caso 1: refresh todavia en curso -> compartir la promise.
    // Caso 2: refresh ya termino exitoso y estamos dentro del TTL -> devolver
    //         el JWT cacheado en lugar de pegarle a KC con un RT muerto.
    if (existing.result !== undefined) return Promise.resolve(existing.result);
    return existing.promise;
  }

  const entry: RefreshEntry = {
    promise: doRefresh(token).then((result) => {
      // Solo cacheamos resultados exitosos. Si fallo, no queremos servir el
      // error a requests subsiguientes — que reintenten con KC.
      if (!result.error) {
        entry.result = result;
        entry.resolvedAt = Date.now();
        setTimeout(() => refreshCache.delete(key), REFRESH_RESULT_TTL_MS);
      } else {
        refreshCache.delete(key);
      }
      return result;
    }),
  };
  refreshCache.set(key, entry);
  return entry.promise;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER,
      // Reescribe el backchannel (discovery/token/userinfo/jwks) al host interno
      // docker, evitando el hairpin por Cloudflare. issuer/iss/jwks_uri siguen
      // públicos => validación de firma e `iss` intacta.
      [customFetch]: backchannelFetch,
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
          roles: extractRoles(account.access_token),
        };
      }

      // 2) Access token todavía vigente (con margen de seguridad): pasar tal cual.
      const nowSec = Math.floor(Date.now() / 1000);
      if (token.expiresAt && nowSec < token.expiresAt - TOKEN_REFRESH_MARGIN_SECONDS) {
        return token;
      }

      // 3) Expiró (o está por expirar): refresh coalesced.
      return refreshTokenCoalesced(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      session.roles = token.roles ?? [];
      return session;
    },
    // No usamos el callback `authorized` (suele ignorarse en v5 beta cuando
    // hay redirects); la protección vive en `middleware.ts` con el patrón
    // explícito `auth((req) => ...)` que SÍ respeta el NextResponse que se
    // retorna. Ver `lib/auth-middleware.evaluarAcceso`.
  },
});
