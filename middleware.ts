export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    /*
     * Protege todas las rutas excepto:
     * - /api/auth/* (handlers de NextAuth)
     * - /_next/static y /_next/image (assets)
     * - /favicon.ico, /robots.txt, /sitemap.xml
     * Auth.js redirige automáticamente a /api/auth/signin si no hay sesión.
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
