// Declaración para side-effect imports de CSS (ej: `import "./globals.css"`).
// Next.js los maneja a nivel bundler, pero TypeScript necesita esta declaración
// para no marcar el import como error (TS2882) en editores que respetan tsc.
declare module "*.css";
